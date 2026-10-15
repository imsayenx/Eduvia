import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { report } from "./sync";
import { courses } from "../data";
import { MATERIAL_SIZES } from "./materials-manifest";
import { t } from "../i18n";

/* ==========================================================================
   CONTENIDO DE LOS CURSOS: videos, PDF, archivos, enlaces y anuncios.
   · Con Supabase: se guardan en la tabla lesson_media y los archivos en el
     bucket «materiales». Solo los administradores pueden subir o borrar.
   · Modo local: puedes pegar enlaces (YouTube, Drive, PDF en internet);
     se guardan en este navegador.
   ========================================================================== */

export type MediaKind = "video" | "pdf" | "file" | "link";
export type Media = {
  id: number;
  course_id: string; // id del curso, o "grupo:<id>" para los recursos de un grupo
  lesson_key: string | null; // "u-l" o null = material general
  kind: MediaKind;
  title: string;
  url: string;
  storage_path?: string | null;
  size_bytes?: number | null;
  created_at: string;
  tag?: "guia" | "presentacion"; // material incluido con la app
};
export type Announcement = { id: number; course_id: string; title: string; body: string; pinned: boolean; created_at: string };

const EVT = "eduvia-content";
const LOCAL_MEDIA = "eduvia.media";
const LOCAL_ANN = "eduvia.announcements";
const readLocal = <T,>(k: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
};
const writeLocal = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new Event(EVT));
};

/** ¿Puede este usuario administrar contenido? (en modo local, sí) */
export function useIsAdmin() {
  const read = () => {
    if (!supabase) return true;
    try {
      return localStorage.getItem("eduvia.admin") === "1";
    } catch {
      return false;
    }
  };
  const [v, setV] = useState(read);
  useEffect(() => {
    const f = () => setV(read());
    window.addEventListener("eduvia-profile", f);
    return () => window.removeEventListener("eduvia-profile", f);
  }, []);
  return v;
}

/* --------------------------------------------------------------------------
   Leer material (de un curso o de todos)
-------------------------------------------------------------------------- */
export function useMedia(courseId?: string) {
  const [list, setList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setList(readLocal<Media>(LOCAL_MEDIA).filter((m) => !courseId || m.course_id === courseId));
      setLoading(false);
      return;
    }
    let q = supabase.from("lesson_media").select("*").order("created_at", { ascending: true });
    if (courseId) q = q.eq("course_id", courseId);
    const { data } = await q.limit(1000);
    setList((data ?? []) as Media[]);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
    window.addEventListener(EVT, load);
    let ch: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (supabase) {
      ch = supabase.channel(`media-${courseId ?? "all"}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "*", schema: "public", table: "lesson_media" }, () => load());
      ch.subscribe();
    }
    return () => {
      window.removeEventListener(EVT, load);
      if (ch && supabase) supabase.removeChannel(ch);
    };
  }, [load, courseId]);

  return { list, loading, reload: load };
}

/** Material de una lección concreta */
export const forLesson = (list: Media[], key: string) => list.filter((m) => m.lesson_key === key);

/* --------------------------------------------------------------------------
   Agregar / borrar
-------------------------------------------------------------------------- */
type NewMedia = { course_id: string; lesson_key: string | null; kind: MediaKind; title: string; url: string; storage_path?: string; size_bytes?: number };

export async function addMedia(m: NewMedia) {
  if (!supabase) {
    writeLocal(LOCAL_MEDIA, [...readLocal<Media>(LOCAL_MEDIA), { ...m, id: Date.now(), created_at: new Date().toISOString() }]);
    return true;
  }
  const ok = !report((await supabase.from("lesson_media").insert(m)).error);
  if (ok) window.dispatchEvent(new Event(EVT));
  return ok;
}

export async function removeMedia(m: Media) {
  if (!supabase) {
    writeLocal(LOCAL_MEDIA, readLocal<Media>(LOCAL_MEDIA).filter((x) => x.id !== m.id));
    return;
  }
  if (m.storage_path) await supabase.storage.from("materiales").remove([m.storage_path]);
  report((await supabase.from("lesson_media").delete().eq("id", m.id)).error);
  window.dispatchEvent(new Event(EVT));
}

/** Sube un archivo al bucket «materiales» mostrando el porcentaje de avance. */
export async function uploadFile(file: File, folder: string, onProgress: (pct: number) => void): Promise<{ url: string; path: string } | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const clean = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${clean}`;
  const base = import.meta.env.VITE_SUPABASE_URL;

  // Se usa XMLHttpRequest para poder mostrar el avance (supabase-js no lo da)
  const ok = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/materiales/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_ANON_KEY ?? "");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(true);
      let msg = xhr.responseText;
      try {
        msg = JSON.parse(xhr.responseText).message ?? msg;
      } catch {
        /* texto plano */
      }
      report({ message: xhr.status === 413 ? "El archivo es demasiado grande para tu plan de Supabase." : msg });
      resolve(false);
    };
    xhr.onerror = () => {
      report({ message: "Sin conexión" });
      resolve(false);
    };
    xhr.send(file);
  });
  if (!ok) return null;
  return { url: supabase.storage.from("materiales").getPublicUrl(path).data.publicUrl, path };
}

/* --------------------------------------------------------------------------
   Anuncios de cada curso
-------------------------------------------------------------------------- */
export function useAnnouncements(courseId: string) {
  const [list, setList] = useState<Announcement[]>([]);
  const load = useCallback(async () => {
    if (!supabase) {
      setList(readLocal<Announcement>(LOCAL_ANN).filter((a) => a.course_id === courseId).sort(order));
      return;
    }
    const { data } = await supabase.from("course_announcements").select("*").eq("course_id", courseId).limit(100);
    setList(((data ?? []) as Announcement[]).sort(order));
  }, [courseId]);
  useEffect(() => {
    load();
    window.addEventListener(EVT, load);
    return () => window.removeEventListener(EVT, load);
  }, [load]);
  return { list, reload: load };
}
const order = (a: Announcement, b: Announcement) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.created_at) - Date.parse(a.created_at);

export async function addAnnouncement(a: { course_id: string; title: string; body: string; pinned: boolean }) {
  if (!supabase) {
    writeLocal(LOCAL_ANN, [...readLocal<Announcement>(LOCAL_ANN), { ...a, id: Date.now(), created_at: new Date().toISOString() }]);
    return true;
  }
  const ok = !report((await supabase.from("course_announcements").insert(a)).error);
  if (ok) window.dispatchEvent(new Event(EVT));
  return ok;
}

export async function removeAnnouncement(id: number) {
  if (!supabase) return writeLocal(LOCAL_ANN, readLocal<Announcement>(LOCAL_ANN).filter((x) => x.id !== id));
  report((await supabase.from("course_announcements").delete().eq("id", id)).error);
  window.dispatchEvent(new Event(EVT));
}

/* --------------------------------------------------------------------------
   Reproductor: convierte enlaces de YouTube, Vimeo o Drive en reproductor
-------------------------------------------------------------------------- */
export function embedOf(url: string): { type: "iframe" | "video"; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return { type: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview` };
  return { type: "video", src: url };
}

export const kindInfo: Record<MediaKind, { icon: string; color: string; label: string }> = {
  video: { icon: "play-btn-fill", color: "#7562d0", label: "Video" },
  pdf: { icon: "file-earmark-pdf-fill", color: "#de5a4c", label: "PDF" },
  file: { icon: "file-earmark-arrow-down-fill", color: "#2f6fe4", label: "Archivo" },
  link: { icon: "link-45deg", color: "#1f998c", label: "Enlace" },
};

export const fmtBytes = (b?: number | null) =>
  !b ? "" : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : b < 1024 ** 3 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024 ** 3).toFixed(2)} GB`;

/**
 * Enlace para DESCARGAR (no solo abrir). Los archivos subidos a Supabase se
 * descargan con su título como nombre; los enlaces externos se abren tal cual.
 */
export function downloadUrl(m: Media) {
  if (!m.storage_path) return m.url;
  const ext = m.storage_path.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const name = m.title.replace(/[\\/:*?"<>|]+/g, " ").trim() + ext;
  return `${m.url}${m.url.includes("?") ? "&" : "?"}download=${encodeURIComponent(name)}`;
}

/** ¿Es un archivo descargable (subido a Supabase o incluido en la app)? */
export const isFile = (m: Media) => !!m.storage_path || m.url.startsWith("/materiales/");

/* --------------------------------------------------------------------------
   Material INCLUIDO con la app (public/materiales): una guía de estudio y una
   presentación en PDF por cada unidad de cada curso.
-------------------------------------------------------------------------- */
export function builtInMaterials(courseId?: string, unit?: number): Media[] {
  const list: Media[] = [];
  courses.forEach((c, ci) => {
    if (courseId && c.id !== courseId) return;
    const sizes = MATERIAL_SIZES[c.id] ?? {};
    c.units.forEach((u, ui) => {
      if (unit !== undefined && ui !== unit) return;
      for (const [tag, label, n] of [["guia", "Guía de estudio", 1], ["presentacion", "Presentación", 2]] as const) {
        const file = `unidad-${ui + 1}-${tag}.pdf`;
        if (!(file in sizes)) continue;
        list.push({
          id: -(ci * 1000 + ui * 10 + n),
          course_id: c.id,
          lesson_key: null,
          kind: "pdf",
          title: `${t(label)} · ${t("Unidad {n}", { n: ui + 1 })}: ${t(u.title)}`,
          url: `/materiales/${c.id}/${file}`,
          size_bytes: sizes[file],
          created_at: "",
          tag,
        });
      }
    });
  });
  return list;
}


/* --------------------------------------------------------------------------
   Descargar (o abrir, si es un enlace externo) al tocar CUALQUIER parte de la
   fila: hace exactamente lo mismo que el botón de la flecha.
-------------------------------------------------------------------------- */
export function getFile(m: Media) {
  const a = document.createElement("a");
  a.rel = "noreferrer";
  a.target = "_blank";
  if (isFile(m)) {
    a.href = downloadUrl(m);
    // nombre del archivo sin tildes ni símbolos
    const ext = (m.storage_path ?? m.url).match(/\.[a-z0-9]+$/i)?.[0] ?? "";
    const name = m.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/·/g, "-").replace(/[^\w .()-]+/g, " ").replace(/\s+/g, " ").trim();
    a.download = (name || "archivo") + ext;
  } else a.href = m.url;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
