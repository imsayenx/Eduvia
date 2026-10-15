import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type Accent = "blue" | "violet" | "emerald" | "rose" | "amber" | "cyan";

/* Las "pelotitas" de color de acento */
export const accents: Record<Accent, { label: string; brand: string; deep: string }> = {
  blue: { label: "Azul", brand: "#1f6fef", deep: "#1653c6" },
  violet: { label: "Violeta", brand: "#7c3aed", deep: "#6025c9" },
  emerald: { label: "Esmeralda", brand: "#10a36b", deep: "#0b8456" },
  rose: { label: "Rosa", brand: "#e11d63", deep: "#be1350" },
  amber: { label: "Ámbar", brand: "#e8890c", deep: "#c26f05" },
  cyan: { label: "Turquesa", brand: "#0891b2", deep: "#0e7490" },
};

const MODE_KEY = "eduvia.theme";
const ACCENT_KEY = "eduvia.accent";
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

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
    /* almacenamiento bloqueado: el tema sigue funcionando en memoria */
  }
};

export const getMode = (): ThemeMode => (read(MODE_KEY) as ThemeMode) || "system";
export const getAccent = (): Accent => {
  const a = read(ACCENT_KEY) as Accent;
  return a && a in accents ? a : "blue";
};
export const systemIsDark = () => mq().matches;
export const isDark = () => {
  const m = getMode();
  return m === "dark" || (m === "system" && systemIsDark());
};

/* --- pequeño "store" para que la barra superior, Ajustes y Login estén sincronizados --- */
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

export function applyTheme() {
  const dark = isDark();
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  const a = accents[getAccent()];
  root.style.setProperty("--color-brand", a.brand);
  root.style.setProperty("--color-brand-deep", a.deep);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0a1120" : "#f2f6fc");
  emit();
}

/** Cambia el tema con un fundido suave (si el navegador lo soporta y no hay "reducir movimiento"). */
function withTransition(fn: () => void) {
  const reduce =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("reduce-motion");
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!reduce && typeof d.startViewTransition === "function") d.startViewTransition(fn);
  else fn();
}

export function setMode(m: ThemeMode) {
  write(MODE_KEY, m);
  window.dispatchEvent(new Event("eduvia-settings"));
  withTransition(applyTheme);
}
export function setAccent(a: Accent) {
  write(ACCENT_KEY, a);
  window.dispatchEvent(new Event("eduvia-settings"));
  applyTheme();
}

export function initTheme() {
  applyTheme();
  // En modo "Sistema" el tema cambia solo cuando el dispositivo cambia de claro a oscuro.
  mq().addEventListener("change", () => {
    if (getMode() === "system") withTransition(applyTheme);
    else emit();
  });
}

/** Hook: estado actual del tema, se actualiza en vivo. */
export function useTheme() {
  const snap = () => ({ mode: getMode(), accent: getAccent(), dark: isDark(), systemDark: systemIsDark() });
  const [s, setS] = useState(snap);
  useEffect(() => {
    const f = () => setS(snap());
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return s;
}
