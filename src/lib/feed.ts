import { useCallback, useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { supabase } from "./supabase";
import { currentUid, getCards, report } from "./sync";
import { fullName, getProfile } from "../profile";
import { logActivity } from "../progress";
import { t } from "../i18n";

/* ==========================================================================
   Publicaciones de la comunidad y de los grupos.
   · Con Supabase: se leen de la tabla posts y se actualizan en TIEMPO REAL
     (si otra persona publica, da me gusta o responde, aparece sola).
   · Modo local: publicaciones de ejemplo y lo que escribas en esta sesión.
   ========================================================================== */

export type Reply = { id: number; name: string; avatar: string; text: string; at: number; mine: boolean; sample?: boolean };
export type FeedPost = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  text: string;
  tag: string;
  image?: string;
  file?: string;
  likes: number;
  liked: boolean;
  replies: Reply[];
  replyCount: number;
  at: number; // fecha en milisegundos
  label?: string; // texto fijo en lugar de la fecha (ej. "Fijado")
  mine: boolean;
  sample?: boolean; // de ejemplo: se traduce
  pinned?: boolean;
};

type Row = Record<string, unknown>;

export function useFeed(group: string | null, samples: FeedPost[]) {
  const [posts, setPosts] = useState<FeedPost[]>(supabase ? [] : samples);
  const [loading, setLoading] = useState(!!supabase);
  const timer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    if (!supabase) return;
    let q = supabase
      .from("posts")
      .select("id,user_id,text,tag,created_at,post_likes(user_id),post_replies(id,user_id,text,created_at)")
      .order("created_at", { ascending: false })
      .limit(60);
    q = group ? q.eq("group_id", group) : q.is("group_id", null);
    const { data, error } = await q;
    if (error) {
      report(error);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Row[];
    const me = currentUid();
    const ids = rows.flatMap((r) => [r.user_id as string, ...((r.post_replies as Row[]) ?? []).map((x) => x.user_id as string)]);
    const card = await getCards(ids);
    setPosts(
      rows.map((r) => {
        const likes = (r.post_likes as Row[]) ?? [];
        const reps = ((r.post_replies as Row[]) ?? [])
          .map((x) => ({ id: x.id as number, ...pick(card(x.user_id as string)), text: x.text as string, at: Date.parse(x.created_at as string), mine: x.user_id === me }))
          .sort((a, b) => a.at - b.at);
        const author = card(r.user_id as string);
        return {
          id: r.id as number,
          ...pick(author),
          role: "Estudiante",
          text: r.text as string,
          tag: r.tag as string,
          likes: likes.length,
          liked: likes.some((l) => l.user_id === me),
          replies: reps,
          replyCount: reps.length,
          at: Date.parse(r.created_at as string),
          mine: r.user_id === me,
        };
      }),
    );
    setLoading(false);
  }, [group]);

  // Carga inicial + tiempo real
  useEffect(() => {
    if (!supabase) return;
    load();
    const later = () => {
      clearTimeout(timer.current);
      timer.current = window.setTimeout(load, 250);
    };
    const ch = supabase
      .channel(`feed-${group ?? "general"}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, later)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, later)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_replies" }, later)
      .subscribe();
    return () => {
      clearTimeout(timer.current);
      supabase!.removeChannel(ch);
    };
  }, [group, load]);

  /* ------------------------------ acciones ------------------------------ */
  const me = () => {
    const p = getProfile();
    return { name: fullName(p) || t("Estudiante"), avatar: p.avatar };
  };

  const publish = async (text: string, tag = "Pregunta") => {
    logActivity({ t: "post" });
    if (!supabase) {
      setPosts((ps) => [{ id: Date.now(), ...me(), role: "Estudiante", text, tag, likes: 0, liked: false, replies: [], replyCount: 0, at: Date.now(), mine: true }, ...ps]);
      return true;
    }
    const { error } = await supabase.from("posts").insert({ user_id: currentUid(), group_id: group, text, tag });
    if (report(error)) return false;
    await load();
    return true;
  };

  const toggleLike = async (id: number) => {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    // respuesta inmediata en pantalla
    setPosts((ps) => ps.map((x) => (x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)));
    if (!supabase) return;
    const row = { post_id: id, user_id: currentUid() };
    const { error } = p.liked ? await supabase.from("post_likes").delete().match(row) : await supabase.from("post_likes").insert(row);
    if (report(error)) load();
  };

  const reply = async (id: number, text: string) => {
    if (!supabase) {
      setPosts((ps) =>
        ps.map((x) => (x.id === id ? { ...x, replies: [...x.replies, { id: Date.now(), ...me(), text, at: Date.now(), mine: true }], replyCount: x.replyCount + 1 } : x)),
      );
      return true;
    }
    const { error } = await supabase.from("post_replies").insert({ post_id: id, user_id: currentUid(), text });
    if (report(error)) return false;
    await load();
    return true;
  };

  const remove = async (id: number) => {
    setPosts((ps) => ps.filter((x) => x.id !== id));
    if (supabase && report((await supabase.from("posts").delete().eq("id", id)).error)) load();
    sileo.info({ title: t("Publicación eliminada") });
  };

  return { posts, loading, publish, toggleLike, reply, remove };
}

const pick = (c: { name: string; avatar: string }) => ({ name: c.name, avatar: c.avatar });

/* ==========================================================================
   Hilos simples:
     · "comments" → comentarios de una lección
     · "topics"   → temas del foro de un curso (con número de respuestas)
     · "replies"  → respuestas dentro de un tema
   Con Supabase se ven los mensajes de TODOS y se actualizan en tiempo real.
   ========================================================================== */
export type Entry = { id: number; text: string; at: number; name: string; avatar: string; mine: boolean; count: number };
type Kind = "comments" | "topics" | "replies";

const cfg = {
  comments: { table: "lesson_comments", field: "text", asc: true },
  topics: { table: "forum_topics", field: "title", asc: false },
  replies: { table: "forum_replies", field: "text", asc: true },
} as const;

/** key = número de lección (comments) o id del tema (replies) */
export function useThread(kind: Kind, courseId: string, key = "") {
  const { table, field, asc } = cfg[kind];
  const localKey = kind === "comments" ? `eduvia.comments.${courseId}.${key}` : kind === "topics" ? `eduvia.foro.${courseId}` : `eduvia.foro.${courseId}.r.${key}`;
  const [list, setList] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(!!supabase);

  const readLocal = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(localKey) || "[]") as { text?: string; title?: string; at?: number }[];
    } catch {
      return [];
    }
  }, [localKey]);

  const load = useCallback(async () => {
    if (!supabase) {
      // modo local: lo guardado en este navegador
      const p = getProfile();
      const localCount = (at: number) => {
        try {
          return JSON.parse(localStorage.getItem(`eduvia.foro.${courseId}.r.${at}`) || "[]").length;
        } catch {
          return 0;
        }
      };
      setList(
        readLocal().map((r, i) => {
          const at = r.at ?? i;
          return { id: at, text: r.text ?? r.title ?? "", at, name: fullName(p) || t("Estudiante"), avatar: p.avatar, mine: true, count: kind === "topics" ? localCount(at) : 0 };
        }),
      );
      return;
    }
    const extra = kind === "topics" ? ",forum_replies(count)" : "";
    const cols: string = `id,user_id,${field},created_at${extra}`;
    let q = supabase.from(table).select(cols);
    if (kind === "replies") q = q.eq("topic_id", Number(key));
    else q = q.eq("course_id", courseId);
    if (kind === "comments") q = q.eq("lesson_key", key);
    const { data } = await q.order("created_at", { ascending: asc }).limit(200);
    const rows = (data ?? []) as unknown as Row[];
    const card = await getCards(rows.map((r) => r.user_id as string));
    const me = currentUid();
    setList(
      rows.map((r) => ({
        id: r.id as number,
        text: r[field] as string,
        at: Date.parse(r.created_at as string),
        ...pick(card(r.user_id as string)),
        mine: r.user_id === me,
        count: ((r.forum_replies as { count: number }[] | undefined)?.[0]?.count as number) ?? 0,
      })),
    );
    setLoading(false);
  }, [table, field, asc, kind, key, courseId, readLocal]);

  useEffect(() => {
    load();
    if (!supabase || (kind === "replies" && !/^\d+$/.test(key))) return;
    // tiempo real: si alguien más escribe, se vuelve a cargar
    const ch = supabase.channel(`${table}-${courseId}-${key}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "*", schema: "public", table }, () => load());
    if (kind === "topics") ch.on("postgres_changes", { event: "*", schema: "public", table: "forum_replies" }, () => load());
    ch.subscribe();
    return () => {
      supabase!.removeChannel(ch);
    };
  }, [load, kind, key, table, courseId]);

  const add = async (text: string) => {
    if (kind === "topics") logActivity({ t: "topic", c: courseId });
    if (!supabase) {
      const item = { [field]: text, at: Date.now() };
      const raw = readLocal();
      try {
        localStorage.setItem(localKey, JSON.stringify(asc ? [...raw, item] : [item, ...raw]));
      } catch {
        /* sin almacenamiento */
      }
      return load();
    }
    const row: Row = { user_id: currentUid(), [field]: text };
    if (kind === "replies") row.topic_id = Number(key);
    else row.course_id = courseId;
    if (kind === "comments") row.lesson_key = key;
    if (!report((await supabase.from(table).insert(row)).error)) await load();
  };

  const remove = async (id: number) => {
    if (!supabase) {
      try {
        localStorage.setItem(localKey, JSON.stringify(readLocal().filter((r, i) => (r.at ?? i) !== id)));
      } catch {
        /* nada */
      }
      return load();
    }
    if (!report((await supabase.from(table).delete().eq("id", id)).error)) await load();
  };

  return { list, loading, add, remove };
}
