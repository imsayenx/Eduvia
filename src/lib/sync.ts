import type { User } from "@supabase/supabase-js";
import { sileo } from "sileo";
import { supabase } from "./supabase";
import { courses } from "../data";
import { applyTheme } from "../theme";
import { setLang, t, type Lang } from "../i18n";

/* ==========================================================================
   Sincronización con Supabase.
   La app sigue leyendo del navegador (localStorage) para ser instantánea;
   este archivo:
     · al iniciar sesión, BAJA los datos del usuario y llena esa caché;
     · cada vez que algo cambia, lo SUBE a la base de datos;
     · al cerrar sesión, borra la caché para que otro usuario no la vea.
   ========================================================================== */

let uid: string | null = null;
let pulling = false;
export const currentUid = () => uid;

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: unknown) => {
    try {
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    } catch {
      /* sin almacenamiento */
    }
  },
};
const fire = (...events: string[]) => events.forEach((e) => window.dispatchEvent(new Event(e)));

/** Muestra un aviso si la nube rechaza un cambio (sin conexión, permisos…). */
export function report(error: { message: string } | null | undefined) {
  if (!error) return false;
  console.error("[Supabase]", error.message);
  sileo.error({ title: t("No se pudo guardar en la nube"), description: error.message });
  return true;
}

/* --------------------------------------------------------------------------
   Perfil: columnas de la tabla ↔ objeto que usa la app
-------------------------------------------------------------------------- */
type Row = Record<string, unknown>;
const toProfile = (r: Row) => ({
  nombres: (r.nombres as string) ?? "",
  apellidos: (r.apellidos as string) ?? "",
  email: (r.email as string) ?? "",
  phone: (r.phone as string) ?? "",
  career: (r.career as string) ?? "",
  level: (r.level as string) ?? "",
  birth: (r.birth as string) ?? "",
  location: (r.location as string) ?? "",
  quote: (r.quote as string) ?? "",
  goal: (r.goal as string) ?? "",
  avatar: (r.avatar_url as string) ?? "",
  interests: (r.interests as string[]) ?? [],
  isPrivate: !!r.is_private,
  showProgress: r.show_progress !== false,
});
const columns: Record<string, string> = {
  nombres: "nombres", apellidos: "apellidos", email: "email", phone: "phone", career: "career", level: "level",
  birth: "birth", location: "location", quote: "quote", goal: "goal", avatar: "avatar_url", interests: "interests",
  isPrivate: "is_private", showProgress: "show_progress",
};

/* --------------------------------------------------------------------------
   BAJAR todo al iniciar sesión
-------------------------------------------------------------------------- */
export async function pullAll(user: User) {
  if (!supabase) return;
  uid = user.id;
  pulling = true;
  try {
    const q = (table: string) => supabase!.from(table).select("*").eq(table === "profiles" ? "id" : "user_id", user.id);
    const [prof, done, state, groups, evs, tasks, posts, topics, admin] = await Promise.all([
      q("profiles").maybeSingle(),
      q("lesson_progress"),
      q("course_state"),
      q("group_members"),
      q("event_registrations"),
      q("assignment_submissions"),
      supabase.from("posts").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("forum_topics").select("course_id,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.rpc("is_admin"),
    ]);
    ls.set("eduvia.admin", admin.data === true ? "1" : "0");

    // Perfil (si el disparador aún no lo creó, se crea aquí)
    let p = prof.data as Row | null;
    if (!p) {
      const meta = user.user_metadata ?? {};
      const full = String(meta.full_name ?? meta.name ?? "").trim();
      const [first, ...rest] = full.split(" ");
      const ins = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email, nombres: first || (user.email ?? "").split("@")[0], apellidos: rest.join(" "), avatar_url: meta.avatar_url ?? null })
        .select()
        .single();
      p = ins.data as Row | null;
    }
    if (p) {
      ls.set("eduvia.profile", toProfile(p));
      // Preferencias guardadas en la cuenta (tema, color, idioma, avisos…)
      const s = (p.settings ?? {}) as Record<string, unknown>;
      if (s.theme) ls.set("eduvia.theme", String(s.theme));
      if (s.accent) ls.set("eduvia.accent", String(s.accent));
      if (s.prefs) for (const [k, v] of Object.entries(s.prefs as Row)) ls.set("eduvia.pref." + k, v);
      applyTheme();
      if (s.lang && s.lang !== ls.get("eduvia.lang")) setLang(s.lang as Lang);
    }

    // Progreso: se escribe en TODOS los cursos para no mostrar datos de ejemplo
    const byCourse = (rows: Row[] | null, field: string) => {
      const m: Record<string, unknown[]> = {};
      for (const r of rows ?? []) (m[r.course_id as string] ??= []).push(r[field]);
      return m;
    };
    const doneBy = byCourse(done.data as Row[], "lesson_key");
    const taskBy = byCourse(tasks.data as Row[], "unit_index");
    for (const c of courses) {
      ls.set(`eduvia.done.${c.id}`, doneBy[c.id] ?? []);
      ls.set(`eduvia.tareas.${c.id}`, taskBy[c.id] ?? []);
      try {
        localStorage.removeItem(`eduvia.current.${c.id}`);
      } catch {
        /* nada */
      }
    }
    for (const r of (state.data as Row[]) ?? []) ls.set(`eduvia.current.${r.course_id}`, String(r.current_lesson));

    // Notas de los quiz y registro de actividad con las fechas reales
    const scores: Record<string, Record<string, number>> = {};
    const activity: Row[] = [];
    for (const r of (done.data as Row[]) ?? []) {
      if (r.score != null) (scores[r.course_id as string] ??= {})[r.lesson_key as string] = r.score as number;
      activity.push({ t: "lesson", c: r.course_id, k: r.lesson_key, s: r.score ?? undefined, at: Date.parse(r.completed_at as string) });
    }
    for (const r of (tasks.data as Row[]) ?? []) activity.push({ t: "task", c: r.course_id, k: String(r.unit_index), at: Date.parse(r.submitted_at as string) });
    for (const r of (posts.data as Row[]) ?? []) activity.push({ t: "post", at: Date.parse(r.created_at as string) });
    for (const r of (topics.data as Row[]) ?? []) activity.push({ t: "topic", c: r.course_id, at: Date.parse(r.created_at as string) });
    for (const c of courses) ls.set(`eduvia.scores.${c.id}`, scores[c.id] ?? {});
    ls.set("eduvia.activity", activity.sort((a, b) => (b.at as number) - (a.at as number)).slice(0, 500));

    ls.set("eduvia.joined", ((groups.data as Row[]) ?? []).map((r) => r.group_id));
    ls.set("eduvia.events", ((evs.data as Row[]) ?? []).map((r) => r.event_id));
  } finally {
    pulling = false;
  }
  fire("eduvia-profile", "eduvia-progress", "eduvia-store");
  await registerDevice();
}

/** Al cerrar sesión: borra los datos personales del navegador. */
export function clearCache() {
  uid = null;
  const keep = new Set(["eduvia.theme", "eduvia.accent", "eduvia.lang", "eduvia.remember", "eduvia.device"]);
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("eduvia.") && !keep.has(k)) localStorage.removeItem(k);
  } catch {
    /* nada */
  }
  cards.clear();
  fire("eduvia-profile", "eduvia-progress", "eduvia-store");
}

/* --------------------------------------------------------------------------
   SUBIR cambios
-------------------------------------------------------------------------- */
const ready = () => !!supabase && !!uid && !pulling;

/** Convierte una foto en base64 (data:image/jpeg…) en archivo y la sube a Storage. */
async function uploadAvatar(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${uid}/avatar-${Date.now()}.jpg`;
  const up = await supabase!.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (report(up.error)) return null;
  // borrar fotos anteriores para no ocupar espacio
  const old = await supabase!.storage.from("avatars").list(uid!);
  const stale = (old.data ?? []).map((f) => `${uid}/${f.name}`).filter((p) => p !== path);
  if (stale.length) await supabase!.storage.from("avatars").remove(stale);
  return supabase!.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

export async function pushProfile(patch: Record<string, unknown>) {
  if (!ready()) return;
  const row: Row = {};
  for (const [k, v] of Object.entries(patch)) if (columns[k]) row[columns[k]] = v === "" && k === "birth" ? null : v;
  if (typeof patch.avatar === "string" && patch.avatar.startsWith("data:")) {
    const url = await uploadAvatar(patch.avatar);
    if (!url) return;
    row.avatar_url = url;
    // guardar la URL pública en la caché (más liviana que el base64)
    try {
      const p = JSON.parse(ls.get("eduvia.profile") || "{}");
      ls.set("eduvia.profile", { ...p, avatar: url });
      fire("eduvia-profile");
    } catch {
      /* nada */
    }
  }
  if (Object.keys(row).length) report((await supabase!.from("profiles").update(row).eq("id", uid)).error);
}

export async function pushLesson(courseId: string, lessonKey: string, done: boolean, score?: number) {
  if (!ready()) return;
  const tb = supabase!.from("lesson_progress");
  const { error } = done
    ? await tb.upsert({ user_id: uid, course_id: courseId, lesson_key: lessonKey, ...(score !== undefined ? { score } : {}) })
    : await tb.delete().match({ user_id: uid, course_id: courseId, lesson_key: lessonKey });
  report(error);
}

export async function pushCurrent(courseId: string, lessonKey: string) {
  if (!ready()) return;
  report((await supabase!.from("course_state").upsert({ user_id: uid, course_id: courseId, current_lesson: lessonKey, updated_at: new Date().toISOString() })).error);
}

export async function pushReset(courseId: string) {
  if (!ready()) return;
  const m = { user_id: uid, course_id: courseId };
  const [a, b] = await Promise.all([supabase!.from("lesson_progress").delete().match(m), supabase!.from("course_state").delete().match(m)]);
  report(a.error ?? b.error);
}

/** Unirse/salir de un grupo o inscribirse/cancelar un evento. */
export async function pushMembership(kind: "group" | "event", id: string, on: boolean) {
  if (!ready()) return;
  const [table, col] = kind === "group" ? ["group_members", "group_id"] : ["event_registrations", "event_id"];
  const row = { user_id: uid, [col]: id };
  report((on ? await supabase!.from(table).upsert(row) : await supabase!.from(table).delete().match(row)).error);
}

export async function pushAssignment(courseId: string, unit: number, on: boolean) {
  if (!ready()) return;
  const row = { user_id: uid, course_id: courseId, unit_index: unit };
  const tb = supabase!.from("assignment_submissions");
  report((on ? await tb.upsert(row) : await tb.delete().match(row)).error);
}

/* Tema, color, idioma y preferencias de Ajustes se guardan en profiles.settings */
let settingsTimer: number | undefined;
function pushSettings() {
  if (!ready()) return;
  clearTimeout(settingsTimer);
  settingsTimer = window.setTimeout(async () => {
    const prefs: Row = {};
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("eduvia.pref.")) prefs[k.slice(12)] = JSON.parse(localStorage.getItem(k)!);
    } catch {
      /* nada */
    }
    const settings = { theme: ls.get("eduvia.theme"), accent: ls.get("eduvia.accent"), lang: ls.get("eduvia.lang"), prefs };
    report((await supabase!.from("profiles").update({ settings }).eq("id", uid)).error);
  }, 600);
}
window.addEventListener("eduvia-settings", pushSettings);

/* --------------------------------------------------------------------------
   Tarjetas públicas de otros usuarios (nombre y foto) con caché
-------------------------------------------------------------------------- */
export type Card = { id: string; name: string; avatar: string; isPrivate: boolean };
const cards = new Map<string, Card>();

export async function getCards(ids: string[]) {
  const missing = [...new Set(ids)].filter((id) => !cards.has(id));
  if (supabase && missing.length) {
    const { data } = await supabase.from("profile_cards").select("id,nombres,apellidos,avatar_url,is_private").in("id", missing);
    for (const r of (data as Row[]) ?? [])
      cards.set(r.id as string, { id: r.id as string, name: `${r.nombres ?? ""} ${r.apellidos ?? ""}`.trim() || t("Estudiante"), avatar: (r.avatar_url as string) ?? "", isPrivate: !!r.is_private });
  }
  return (id: string): Card => cards.get(id) ?? { id, name: t("Estudiante"), avatar: "", isPrivate: false };
}
window.addEventListener("eduvia-profile", () => uid && cards.delete(uid));

/* --------------------------------------------------------------------------
   Dispositivos: cada navegador tiene un id propio y se registra al entrar
-------------------------------------------------------------------------- */
export function deviceId() {
  let id = ls.get("eduvia.device");
  if (!id) {
    // randomUUID solo existe en https o localhost; en la red local (http://192.168…) se arma a mano
    id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));
    ls.set("eduvia.device", id);
  }
  return id;
}

export function describeDevice() {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const kind = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|Android|iPhone/.test(ua) ? "phone" : "desktop";
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const place = zone.split("/").pop()?.replace(/_/g, " ") ?? "";
  return { name: `${browser} en ${os}`, kind: kind as "desktop" | "phone" | "tablet", place };
}

async function registerDevice() {
  if (!supabase || !uid) return;
  const d = describeDevice();
  await supabase.from("devices").upsert({ id: deviceId(), user_id: uid, ...d, last_seen: new Date().toISOString(), revoked: false });
}

/** Si otro dispositivo cerró esta sesión, salir. Se revisa al volver a la pestaña y cada minuto. */
export function watchRevocation(onRevoked: () => void) {
  if (!supabase) return () => {};
  const check = async () => {
    if (!uid || document.hidden) return;
    const { data } = await supabase!.from("devices").select("revoked").eq("id", deviceId()).maybeSingle();
    if (data?.revoked) onRevoked();
    else await supabase!.from("devices").update({ last_seen: new Date().toISOString() }).eq("id", deviceId());
  };
  const timer = window.setInterval(check, 60_000);
  window.addEventListener("focus", check);
  return () => {
    clearInterval(timer);
    window.removeEventListener("focus", check);
  };
}
