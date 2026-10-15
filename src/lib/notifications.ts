import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { currentUid, getCards } from "./sync";
import { courses, findCourse } from "../data";
import { getDone } from "../progress";
import { t } from "../i18n";

/* ==========================================================================
   Notificaciones reales:
     · respuestas a tus publicaciones y a tus temas del foro
     · anuncios y material nuevo en los cursos que estás tomando
   «Leídas» se guarda en el navegador.
   ========================================================================== */
export type Notif = { id: string; icon: string; color: string; title: string; sub: string; at: number; to: string };

const SEEN = "eduvia.notif.seen";
const getSeen = () => {
  try {
    return Number(localStorage.getItem(SEEN) || 0);
  } catch {
    return 0;
  }
};

type Row = Record<string, unknown>;
const ms = (v: unknown) => Date.parse(String(v));

export function useNotifications() {
  const [list, setList] = useState<Notif[]>([]);
  const [seen, setSeen] = useState(getSeen);

  const load = useCallback(async () => {
    const started = courses.filter((c) => getDone(c).size > 0).map((c) => c.id);
    const out: Notif[] = [];
    const uid = currentUid();

    if (!supabase || !uid) {
      out.push({ id: "welcome", icon: "stars", color: "#2f6fe4", title: t("¡Bienvenido a Eduvia!"), sub: t("Explora los cursos y empieza tu primera lección."), at: 0, to: "/cursos" });
      setList(out);
      return;
    }

    const [pr, fr, an, md, me] = await Promise.all([
      supabase.from("post_replies").select("id,text,created_at,user_id,posts!inner(user_id,group_id)").eq("posts.user_id", uid).neq("user_id", uid).order("created_at", { ascending: false }).limit(15),
      supabase.from("forum_replies").select("id,text,created_at,user_id,forum_topics!inner(user_id,course_id,title)").eq("forum_topics.user_id", uid).neq("user_id", uid).order("created_at", { ascending: false }).limit(15),
      started.length ? supabase.from("course_announcements").select("id,course_id,title,created_at").in("course_id", started).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      started.length ? supabase.from("lesson_media").select("id,course_id,title,kind,created_at").in("course_id", started).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      supabase.auth.getUser(),
    ]);
    const prRows = (pr.data ?? []) as Row[];
    const frRows = (fr.data ?? []) as Row[];
    const card = await getCards([...prRows, ...frRows].map((r) => r.user_id as string));

    for (const r of prRows) {
      const post = r.posts as Row;
      out.push({
        id: `pr${r.id}`,
        icon: "chat-dots-fill",
        color: "#2793cf",
        title: t("{name} respondió tu publicación", { name: card(r.user_id as string).name }),
        sub: String(r.text),
        at: ms(r.created_at),
        to: post?.group_id ? `/comunidad/grupo/${post.group_id}` : "/comunidad",
      });
    }
    for (const r of frRows) {
      const topic = r.forum_topics as Row;
      out.push({
        id: `fr${r.id}`,
        icon: "chat-square-text-fill",
        color: "#7562d0",
        title: t("{name} respondió tu tema", { name: card(r.user_id as string).name }),
        sub: `«${topic?.title}» · ${r.text}`,
        at: ms(r.created_at),
        to: `/curso/${topic?.course_id}`,
      });
    }
    for (const r of (an.data ?? []) as Row[])
      out.push({ id: `an${r.id}`, icon: "megaphone-fill", color: "#e09a1e", title: t("Nuevo anuncio"), sub: `${t(findCourse(String(r.course_id))?.title ?? "")} · ${r.title}`, at: ms(r.created_at), to: `/curso/${r.course_id}` });
    for (const r of (md.data ?? []) as Row[])
      out.push({ id: `md${r.id}`, icon: r.kind === "video" ? "play-btn-fill" : "file-earmark-arrow-down-fill", color: "#259b6a", title: t("Nuevo material"), sub: `${t(findCourse(String(r.course_id))?.title ?? "")} · ${r.title}`, at: ms(r.created_at), to: `/curso/${r.course_id}` });

    const created = me.data.user?.created_at;
    out.push({ id: "welcome", icon: "stars", color: "#2f6fe4", title: t("¡Bienvenido a Eduvia!"), sub: t("Explora los cursos y empieza tu primera lección."), at: created ? ms(created) : 0, to: "/cursos" });
    setList(out.sort((a, b) => b.at - a.at).slice(0, 20));
  }, []);

  useEffect(() => {
    load();
    if (!supabase) return;
    let timer: number | undefined;
    const later = () => {
      clearTimeout(timer);
      timer = window.setTimeout(load, 500);
    };
    const ch = supabase
      .channel(`avisos-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_replies" }, later)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_replies" }, later)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "course_announcements" }, later)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lesson_media" }, later)
      .subscribe();
    window.addEventListener("eduvia-progress", later);
    return () => {
      clearTimeout(timer);
      supabase!.removeChannel(ch);
      window.removeEventListener("eduvia-progress", later);
    };
  }, [load]);

  const markAll = () => {
    const now = Date.now();
    try {
      localStorage.setItem(SEEN, String(now));
    } catch {
      /* nada */
    }
    setSeen(now);
  };

  const unread = list.filter((n) => n.at > seen || (n.id === "welcome" && seen === 0)).length;
  return { list, seen, unread, markAll };
}
