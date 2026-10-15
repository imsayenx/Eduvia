import { useEffect, useState } from "react";
import type { Course } from "./data";
import { pushCurrent, pushLesson, pushReset } from "./lib/sync";

/* ==========================================================================
   Progreso de cada curso (lecciones completadas y lección actual).
   Se guarda en el navegador para que no se pierda al recargar.
   ========================================================================== */

export type LessonRef = { u: number; l: number };
export const keyOf = ({ u, l }: LessonRef) => `${u}-${l}`;

const DONE = (id: string) => `eduvia.done.${id}`;
const CUR = (id: string) => `eduvia.current.${id}`;
const EVT = "eduvia-progress";

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* sin almacenamiento */
  }
};

/** Todas las lecciones del curso en orden. */
export function flat(course: Course): LessonRef[] {
  return course.units.flatMap((unit, u) => unit.lessons.map((_, l) => ({ u, l })));
}

export function getDone(course: Course): Set<string> {
  try {
    return new Set(JSON.parse(read(DONE(course.id)) || "[]"));
  } catch {
    return new Set();
  }
}

/* --------------------------------------------------------------------------
   Notas de los quiz (0–100) y registro de actividad con fecha real
-------------------------------------------------------------------------- */
const SCORES = (id: string) => `eduvia.scores.${id}`;
const ACT = "eduvia.activity";

export type Activity = { t: "lesson" | "task" | "post" | "topic"; c?: string; k?: string; s?: number; at: number };

export function getScores(course: Course): Record<string, number> {
  try {
    return JSON.parse(read(SCORES(course.id)) || "{}");
  } catch {
    return {};
  }
}

export function getActivity(): Activity[] {
  try {
    return JSON.parse(read(ACT) || "[]");
  } catch {
    return [];
  }
}

export function logActivity(a: Omit<Activity, "at"> & { at?: number }) {
  const list = [{ ...a, at: a.at ?? Date.now() }, ...getActivity()].slice(0, 500);
  write(ACT, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

/** Marca una lección. En los quiz se guarda también la nota (se queda la mejor). */
export function setDone(course: Course, ref: LessonRef, done = true, score?: number) {
  const s = getDone(course);
  const key = keyOf(ref);
  const was = s.has(key);
  done ? s.add(key) : s.delete(key);
  write(DONE(course.id), JSON.stringify([...s]));

  const scores = getScores(course);
  let best = scores[key];
  if (done && score !== undefined && (best === undefined || score > best)) {
    best = score;
    scores[key] = score;
    write(SCORES(course.id), JSON.stringify(scores));
  }
  if (!done && key in scores) {
    delete scores[key];
    write(SCORES(course.id), JSON.stringify(scores));
  }
  if (done && !was) logActivity({ t: "lesson", c: course.id, k: key, s: score });
  if (!done) write(ACT, JSON.stringify(getActivity().filter((a) => !(a.t === "lesson" && a.c === course.id && a.k === key))));

  window.dispatchEvent(new Event(EVT));
  if (done !== was || score !== undefined) void pushLesson(course.id, key, done, best);
}

export function percent(course: Course) {
  const total = flat(course).length;
  return total ? Math.round((getDone(course).size / total) * 100) : 0;
}

/** Lección donde quedó el estudiante (o la primera sin completar). */
export function getCurrent(course: Course): LessonRef {
  const all = flat(course);
  const s = read(CUR(course.id));
  if (s) {
    const [u, l] = s.split("-").map(Number);
    if (course.units[u]?.lessons[l]) return { u, l };
  }
  const done = getDone(course);
  return all.find((r) => !done.has(keyOf(r))) ?? all[all.length - 1];
}

export function setCurrent(course: Course, ref: LessonRef) {
  if (read(CUR(course.id)) === keyOf(ref)) return;
  write(CUR(course.id), keyOf(ref));
  window.dispatchEvent(new Event(EVT));
  void pushCurrent(course.id, keyOf(ref));
}

export function resetCourse(course: Course) {
  write(DONE(course.id), "[]");
  write(CUR(course.id), "0-0");
  write(SCORES(course.id), "{}");
  write(ACT, JSON.stringify(getActivity().filter((a) => !(a.t === "lesson" && a.c === course.id))));
  window.dispatchEvent(new Event(EVT));
  void pushReset(course.id);
}

/** Hook: se vuelve a renderizar cuando cambia cualquier progreso. */
export function useProgressTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((n) => n + 1);
    window.addEventListener(EVT, f);
    window.addEventListener("storage", f);
    return () => {
      window.removeEventListener(EVT, f);
      window.removeEventListener("storage", f);
    };
  }, []);
}

export const ctaFor = (course: Course) => {
  const pc = percent(course);
  return pc >= 100 ? "Repasar curso" : pc > 0 ? "Continuar curso" : "Comenzar curso";
};
