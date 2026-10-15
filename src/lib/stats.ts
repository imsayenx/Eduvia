import { courses, findCourse } from "../data";
import { getActivity, getDone, getScores, percent, useProgressTick, type Activity } from "../progress";
import { t } from "../i18n";

/* ==========================================================================
   Estadísticas REALES del estudiante, calculadas de lo que de verdad hizo.
   Una cuenta nueva ve todo en cero.
   ========================================================================== */

const DAY = 86_400_000;
const startOfDay = (d: Date | number) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/** Minutos de una lección a partir de su clave "u-l" */
function lessonMinutes(courseId?: string, key?: string) {
  const c = courseId ? findCourse(courseId) : undefined;
  if (!c || !key) return 0;
  const [u, l] = key.split("-").map(Number);
  return c.units[u]?.lessons[l]?.min ?? 0;
}

export type Badge = { id: string; icon: string; title: string; desc: string; color: string; earned: boolean; progress: number };
export type Recent = { icon: string; color: string; title: string; sub: string; at: number; to: string };

export function getStats() {
  const activity = getActivity();
  const enCurso = courses.filter((c) => percent(c) > 0 && percent(c) < 100);
  const completados = courses.filter((c) => percent(c) >= 100);
  const empezados = [...enCurso, ...completados];
  const avance = empezados.length ? Math.round(empezados.reduce((s, c) => s + percent(c), 0) / empezados.length) : 0;
  const lecciones = courses.reduce((s, c) => s + getDone(c).size, 0);

  // Tiempo de estudio = duración de las lecciones completadas
  const minutos = courses.reduce((s, c) => {
    const done = getDone(c);
    return s + c.units.reduce((a, u, ui) => a + u.lessons.reduce((b, l, li) => b + (done.has(`${ui}-${li}`) ? l.min : 0), 0), 0);
  }, 0);

  // Días seguidos estudiando (hoy o ayer cuentan para no perder la racha)
  const days = new Set(activity.filter((a) => a.t === "lesson").map((a) => startOfDay(a.at)));
  let racha = 0;
  let d = startOfDay(Date.now());
  if (!days.has(d)) d -= DAY;
  while (days.has(d)) {
    racha++;
    d -= DAY;
  }

  // Promedio de los quiz (0–100)
  const notas = courses.flatMap((c) => Object.values(getScores(c)));
  const promedio = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null;

  // Horas por día (semana actual, lunes a domingo) y por semana (últimas 4)
  const minsOn = (from: number, to: number) =>
    activity.filter((a) => a.t === "lesson" && a.at >= from && a.at < to).reduce((s, a) => s + lessonMinutes(a.c, a.k), 0);
  const today = startOfDay(Date.now());
  const monday = today - ((new Date(today).getDay() + 6) % 7) * DAY;
  const semana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((name, i) => ({
    d: t(name),
    h: +(minsOn(monday + i * DAY, monday + (i + 1) * DAY) / 60).toFixed(1),
    min: minsOn(monday + i * DAY, monday + (i + 1) * DAY),
  }));
  const mes = [3, 2, 1, 0].map((back, i) => ({
    d: t("Sem {n}", { n: i + 1 }),
    h: +(minsOn(monday - back * 7 * DAY, monday - (back - 1) * 7 * DAY) / 60).toFixed(1),
    min: minsOn(monday - back * 7 * DAY, monday - (back - 1) * 7 * DAY),
  }));

  const posts = activity.filter((a) => a.t === "post" || a.t === "topic").length;
  const perfect = notas.some((n) => n === 100);

  const badges: Badge[] = [
    { id: "primer-paso", icon: "flag-fill", title: "Primer paso", desc: "Completa tu primera lección", color: "#2f6fe4", earned: lecciones >= 1, progress: Math.min(1, lecciones) },
    { id: "explorador", icon: "compass-fill", title: "Explorador", desc: "Termina tu primer curso", color: "#259b6a", earned: completados.length >= 1, progress: Math.min(1, avance / 100) },
    { id: "constancia", icon: "calendar-check-fill", title: "Constancia", desc: "Estudia 3 días seguidos", color: "#2793cf", earned: racha >= 3, progress: Math.min(1, racha / 3) },
    { id: "puntaje", icon: "bullseye", title: "Puntaje perfecto", desc: "Saca 100% en un quiz", color: "#de5a4c", earned: perfect, progress: perfect ? 1 : 0 },
    { id: "participativo", icon: "chat-heart-fill", title: "Participativo", desc: "Publica en la comunidad o en un foro", color: "#b4559a", earned: posts >= 1, progress: Math.min(1, posts) },
    { id: "gran-aprendiz", icon: "trophy-fill", title: "Gran aprendiz", desc: "Completa 5 cursos", color: "#e09a1e", earned: completados.length >= 5, progress: Math.min(1, completados.length / 5) },
  ];

  return { enCurso, completados, avance, lecciones, minutos, racha, promedio, semana, mes, badges, recent: recentFrom(activity) };
}

/** Hook: estadísticas que se actualizan solas */
export function useStats() {
  useProgressTick();
  return getStats();
}

/* Actividad reciente (incluye cursos terminados, deducidos del progreso) */
function recentFrom(activity: Activity[]): Recent[] {
  const out: Recent[] = [];
  for (const a of activity) {
    const c = a.c ? findCourse(a.c) : undefined;
    if (a.t === "lesson" && c && a.k) {
      const [u, l] = a.k.split("-").map(Number);
      const lesson = c.units[u]?.lessons[l];
      if (!lesson) continue;
      if (a.s !== undefined) out.push({ icon: "clipboard2-check-fill", color: "#7562d0", title: t("Lograste {n}% en la evaluación", { n: a.s }), sub: `${t(c.title)} · ${t(lesson.title)}`, at: a.at, to: `/curso/${c.id}` });
      else out.push({ icon: "check-circle-fill", color: "#259b6a", title: t("Completaste la lección"), sub: `${t(c.title)} · ${t(lesson.title)}`, at: a.at, to: `/curso/${c.id}` });
    } else if (a.t === "task" && c) out.push({ icon: "file-earmark-check-fill", color: "#2f6fe4", title: t("Entregaste una tarea"), sub: `${t(c.title)} · ${t("Tarea {n}", { n: Number(a.k ?? 0) + 1 })}`, at: a.at, to: `/curso/${c.id}` });
    else if (a.t === "post") out.push({ icon: "chat-dots-fill", color: "#2793cf", title: t("Publicaste en la comunidad"), sub: t("Comunidad"), at: a.at, to: "/comunidad" });
    else if (a.t === "topic" && c) out.push({ icon: "chat-square-text-fill", color: "#2793cf", title: t("Abriste un tema en el foro"), sub: t(c.title), at: a.at, to: `/curso/${c.id}` });
  }
  // cursos terminados: fecha de su última lección
  for (const c of courses.filter((x) => percent(x) >= 100)) {
    const last = activity.find((a) => a.t === "lesson" && a.c === c.id);
    if (last) out.push({ icon: "patch-check-fill", color: "#e09a1e", title: t("Completaste el curso"), sub: t(c.title), at: last.at + 1, to: `/curso/${c.id}` });
  }
  return out.sort((a, b) => b.at - a.at);
}

export const fmtMinutes = (m: number) => (m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`);
