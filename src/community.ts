import { useEffect, useState } from "react";
import { locale } from "./i18n";
import { currentUid, pushMembership } from "./lib/sync";
import { supabase as sb } from "./lib/supabase";
import { courses } from "./data";
import { getDone, getActivity, logActivity } from "./progress";
import { Code2, Users, Palette, Heart, Calculator, Globe, FlaskConical, Brain, Camera, Music, type LucideIcon } from "./icons";

export type Group = {
  id: string; name: string; desc: string; icon: LucideIcon; color: string; members: number;
  category: string; cover: string; recommended?: boolean; featured?: boolean; online: number;
};

const u = (id: string, w = 900, h = 400) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

export const groups: Group[] = [
  { id: "desarrollo-web", name: "Desarrollo Web", desc: "Aprende y comparte sobre tecnologías web.", icon: Code2, color: "bg-blue-100 text-blue-600", members: 2340, category: "Tecnología", cover: u("1498050108023-c5249f4df085"), recommended: true, online: 48 },
  { id: "estudio-equipo", name: "Estudio en equipo", desc: "Organiza grupos de estudio y alcanza tus metas.", icon: Users, color: "bg-teal-100 text-teal-600", members: 1580, category: "General", cover: u("1522202176988-66273c2fd55f"), recommended: true, online: 31 },
  { id: "arte-creatividad", name: "Arte y Creatividad", desc: "Comparte tus ideas y proyectos.", icon: Palette, color: "bg-violet-100 text-violet-600", members: 890, category: "Arte", cover: u("1513364776144-60967b0f800f"), recommended: true, online: 12 },
  { id: "bienestar", name: "Bienestar estudiantil", desc: "Motivación, hábitos y equilibrio.", icon: Heart, color: "bg-rose-100 text-rose-600", members: 1120, category: "Bienestar", cover: u("1506126613408-eca07ce68773"), recommended: true, online: 22 },
  { id: "programacion", name: "Programación", desc: "Resuelve dudas de código y practica retos.", icon: Code2, color: "bg-blue-100 text-blue-600", members: 1200, category: "Tecnología", cover: u("1555066931-4365d14bab8c"), featured: true, online: 56 },
  { id: "matematicas", name: "Matemáticas", desc: "Ejercicios, teoría y preparación de exámenes.", icon: Calculator, color: "bg-violet-100 text-violet-600", members: 980, category: "Ciencias", cover: u("1635070041078-e363dbe005cb"), featured: true, online: 19 },
  { id: "diseno", name: "Diseño Gráfico", desc: "Portafolios, feedback y herramientas.", icon: Palette, color: "bg-pink-100 text-pink-600", members: 756, category: "Arte", cover: u("1561070791-2526d30994b5"), featured: true, online: 14 },
  { id: "ingles", name: "Inglés", desc: "Practica conversación y gramática.", icon: Globe, color: "bg-sky-100 text-sky-600", members: 642, category: "Idiomas", cover: u("1546410531-bb4caa6b424d"), featured: true, online: 17 },
  { id: "ciencias", name: "Ciencias", desc: "Física, química y biología en comunidad.", icon: FlaskConical, color: "bg-emerald-100 text-emerald-600", members: 521, category: "Ciencias", cover: u("1532094349884-543bc11b234d"), featured: true, online: 9 },
  { id: "ia", name: "Inteligencia Artificial", desc: "Machine learning, prompts y proyectos de IA.", icon: Brain, color: "bg-indigo-100 text-indigo-600", members: 1870, category: "Tecnología", cover: u("1620712943543-bcc4688e7485"), online: 63 },
  { id: "fotografia", name: "Fotografía", desc: "Técnica, edición y retos semanales.", icon: Camera, color: "bg-amber-100 text-amber-600", members: 433, category: "Arte", cover: u("1452587925148-ce544e77e70d"), online: 6 },
  { id: "musica", name: "Música", desc: "Teoría musical, producción e instrumentos.", icon: Music, color: "bg-fuchsia-100 text-fuchsia-600", members: 388, category: "Arte", cover: u("1511379938547-c1f69419868d"), online: 8 },
];

export type CEvent = { id: string; readonly dow: string; readonly day: string; readonly month: string; date: Date; title: string; time: string; mode: "Virtual" | "Presencial"; host: string; group?: string; category: string; spots: number; image: string };

/* Las fechas se calculan desde hoy para que los eventos siempre sean próximos */
function upcoming(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return {
    date,
    get dow() {
      return date.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "");
    },
    get day() {
      return String(date.getDate()).padStart(2, "0");
    },
    get month() {
      const m = date.toLocaleDateString(locale(), { month: "short" }).replace(".", "");
      return m.charAt(0).toUpperCase() + m.slice(1);
    },
  };
}

/* (se copian los «get» para que el día y el mes salgan en el idioma actual) */
const ev = (days: number, e: Omit<CEvent, "dow" | "day" | "month" | "date">) =>
  Object.defineProperties(e, Object.getOwnPropertyDescriptors(upcoming(days))) as CEvent;

export const events: CEvent[] = [
  ev(4, { id: "taller-ia", title: "Taller de Inteligencia Artificial", time: "10:00 a.m. - 12:00 p.m.", mode: "Virtual", host: "Inteligencia Artificial", group: "ia", category: "Taller", spots: 120, image: u("1677442136019-21780ecad995", 600, 340) }),
  ev(7, { id: "charla-pro", title: "Charla: Desarrollo Profesional", time: "4:00 p.m. - 5:30 p.m.", mode: "Virtual", host: "Eduvia", category: "Charla", spots: 300, image: u("1540575467063-178a50c2df87", 600, 340) }),
  ev(10, { id: "torneo-prog", title: "Torneo de Programación", time: "3:00 p.m. - 6:00 p.m.", mode: "Presencial", host: "Club de Código", group: "programacion", category: "Competencia", spots: 64, image: u("1504384308090-c894fdcc538d", 600, 340) }),
  ev(13, { id: "react-live", title: "Live coding: React desde cero", time: "6:00 p.m. - 7:30 p.m.", mode: "Virtual", host: "Desarrollo Web", group: "desarrollo-web", category: "Taller", spots: 200, image: u("1633356122544-f134324a6cee", 600, 340) }),
  ev(15, { id: "estudio-calc", title: "Sesión de estudio: Cálculo I", time: "5:00 p.m. - 7:00 p.m.", mode: "Virtual", host: "Estudio en equipo", group: "estudio-equipo", category: "Estudio", spots: 40, image: u("1434030216411-0b793f4b4173", 600, 340) }),
  ev(18, { id: "expo-arte", title: "Exposición de proyectos creativos", time: "11:00 a.m. - 2:00 p.m.", mode: "Presencial", host: "Arte y Creatividad", group: "arte-creatividad", category: "Exposición", spots: 80, image: u("1531058020387-3be344556be6", 600, 340) }),
  ev(21, { id: "mindfulness", title: "Mindfulness antes de exámenes", time: "7:00 p.m. - 8:00 p.m.", mode: "Virtual", host: "Bienestar estudiantil", group: "bienestar", category: "Bienestar", spots: 150, image: u("1506126613408-eca07ce68773", 600, 340) }),
  ev(23, { id: "english-club", title: "English Conversation Club", time: "5:00 p.m. - 6:00 p.m.", mode: "Virtual", host: "Grupo Inglés", group: "ingles", category: "Idiomas", spots: 30, image: u("1543269865-cbf427effbad", 600, 340) }),
];

/* Tiny persisted set store shared across pages (joined groups / registered events). */
function useStoredSet(key: string, kind: "group" | "event") {
  const read = () => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      return new Set<string>();
    }
  };
  const [set, setSet] = useState(read);
  useEffect(() => {
    const f = () => setSet(read());
    window.addEventListener("eduvia-store", f);
    return () => window.removeEventListener("eduvia-store", f);
  }, []);
  const toggle = (id: string) => {
    const s = read();
    const now = !s.has(id);
    now ? s.add(id) : s.delete(id);
    localStorage.setItem(key, JSON.stringify([...s]));
    window.dispatchEvent(new Event("eduvia-store"));
    void pushMembership(kind, id, now);
    return now;
  };
  return [set, toggle] as const;
}

export const useJoined = () => useStoredSet("eduvia.joined", "group");
export const useRegistered = () => useStoredSet("eduvia.events", "event");
export const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n));

/* ==========================================================================
   CONTADORES REALES (empiezan en cero)
   Con Supabase salen de las vistas de la base de datos; en modo local,
   solo cuentan lo que hiciste tú en este navegador.
   ========================================================================== */

type CourseStat = { average: number; total: number; students: number };
type Counts = {
  courses: Record<string, CourseStat>;
  groups: Record<string, number>;
  events: Record<string, number>;
  community: { members: number; posts: number; replies: number };
};
const EMPTY: Counts = { courses: {}, groups: {}, events: {}, community: { members: 0, posts: 0, replies: 0 } };
let counts: Counts = EMPTY;
let lastFetch = 0;

const myRating = (id: string) => {
  try {
    return Number(localStorage.getItem(`eduvia.rating.${id}`) || 0);
  } catch {
    return 0;
  }
};
const readSet = (key: string) => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set<string>();
  }
};

function localCounts(): Counts {
  const c: Counts = { courses: {}, groups: {}, events: {}, community: { members: 1, posts: getActivity().filter((a) => a.t === "post").length, replies: 0 } };
  for (const x of courses) {
    const r = myRating(x.id);
    c.courses[x.id] = { average: r, total: r ? 1 : 0, students: getDone(x).size ? 1 : 0 };
  }
  for (const id of readSet("eduvia.joined")) c.groups[id] = 1;
  for (const id of readSet("eduvia.events")) c.events[id] = 1;
  return c;
}

export async function refreshCounts(force = false) {
  if (!sb) {
    counts = localCounts();
    window.dispatchEvent(new Event("eduvia-counts"));
    return;
  }
  if (!force && Date.now() - lastFetch < 20_000) return;
  lastFetch = Date.now();
  const [r, s, g, e, c] = await Promise.all([
    sb.from("course_rating_stats").select("*"),
    sb.from("course_student_counts").select("*"),
    sb.from("group_counts").select("*"),
    sb.from("event_counts").select("*"),
    sb.from("community_stats").select("*").maybeSingle(),
  ]);
  const next: Counts = { courses: {}, groups: {}, events: {}, community: (c.data as Counts["community"]) ?? EMPTY.community };
  for (const x of courses) next.courses[x.id] = { average: 0, total: 0, students: 0 };
  for (const row of (r.data ?? []) as { course_id: string; average: number; total: number }[]) Object.assign((next.courses[row.course_id] ??= { average: 0, total: 0, students: 0 }), { average: row.average, total: row.total });
  for (const row of (s.data ?? []) as { course_id: string; students: number }[]) (next.courses[row.course_id] ??= { average: 0, total: 0, students: 0 }).students = row.students;
  for (const row of (g.data ?? []) as { group_id: string; members: number }[]) next.groups[row.group_id] = row.members;
  for (const row of (e.data ?? []) as { event_id: string; registered: number }[]) next.events[row.event_id] = row.registered;
  counts = next;
  window.dispatchEvent(new Event("eduvia-counts"));
}

function useCounts() {
  const [c, setC] = useState(counts);
  useEffect(() => {
    const f = () => setC(counts);
    const g = () => refreshCounts(true);
    window.addEventListener("eduvia-counts", f);
    window.addEventListener("eduvia-store", g);
    refreshCounts();
    return () => {
      window.removeEventListener("eduvia-counts", f);
      window.removeEventListener("eduvia-store", g);
    };
  }, []);
  return c;
}

export const useCourseStats = () => useCounts().courses;
export const useGroupCounts = () => useCounts().groups;
export const useEventCounts = () => useCounts().events;
export const useCommunityStats = () => useCounts().community;

/** Calificar un curso con 1–5 estrellas (una vez por estudiante; se puede cambiar). */
export async function rateCourse(courseId: string, stars: number) {
  try {
    localStorage.setItem(`eduvia.rating.${courseId}`, String(stars));
  } catch {
    /* nada */
  }
  if (sb && currentUid()) await sb.from("course_ratings").upsert({ user_id: currentUid(), course_id: courseId, stars });
  await refreshCounts(true);
}
export const getMyRating = myRating;

/** Miembros reales de un grupo */
export type Member = { id: string; name: string; avatar: string };
export function useGroupMembers(groupId: string, joined: boolean) {
  const [list, setList] = useState<Member[]>([]);
  useEffect(() => {
    if (!sb) return;
    sb.from("group_member_list")
      .select("id,nombres,apellidos,avatar_url")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true })
      .limit(200)
      .then(({ data }) => setList(((data ?? []) as { id: string; nombres: string; apellidos: string; avatar_url: string }[]).map((r) => ({ id: r.id, name: `${r.nombres} ${r.apellidos ?? ""}`.trim(), avatar: r.avatar_url ?? "" }))));
  }, [groupId, joined]);
  return list;
}

/* --------------------------------------------------------------------------
   Personas en línea ahora (Supabase Realtime Presence)
-------------------------------------------------------------------------- */
let online: Member[] = [];
let channel: ReturnType<NonNullable<typeof sb>["channel"]> | null = null;

export function startPresence(me: Member) {
  if (!sb || channel) return;
  channel = sb.channel("en-linea", { config: { presence: { key: me.id } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel!.presenceState<Member>();
      online = Object.values(state).map((v) => v[0]).filter(Boolean);
      window.dispatchEvent(new Event("eduvia-online"));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") channel!.track(me);
    });
}
export function stopPresence() {
  if (channel && sb) sb.removeChannel(channel);
  channel = null;
  online = [];
}
export function useOnline() {
  const [list, setList] = useState(online);
  useEffect(() => {
    const f = () => setList(online);
    window.addEventListener("eduvia-online", f);
    return () => window.removeEventListener("eduvia-online", f);
  }, []);
  return list;
}

export { logActivity };
