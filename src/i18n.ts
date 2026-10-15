import { useEffect, useState } from "react";
import en from "./locales/en";
import pt from "./locales/pt";
import fr from "./locales/fr";

/* ==========================================================================
   Idiomas de Eduvia: Español (base), English, Português, Français.
   Los textos se escriben en español dentro de t("..."); si el idioma
   elegido tiene traducción se muestra esa, si no, el español.
   ========================================================================== */

export type Lang = "es" | "en" | "pt" | "fr";

export const languages: { id: Lang; label: string; flag: string }[] = [
  { id: "es", label: "Español", flag: "🇳🇮" },
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "pt", label: "Português", flag: "🇧🇷" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
];

const dicts: Record<Exclude<Lang, "es">, Record<string, string>> = { en, pt, fr };
const KEY = "eduvia.lang";

const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY) as Lang | null;
    return v && ["es", "en", "pt", "fr"].includes(v) ? v : "es";
  } catch {
    return "es";
  }
};

let current: Lang = read();
const listeners = new Set<() => void>();

export const getLang = () => current;

export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* sin almacenamiento */
  }
  document.documentElement.lang = l;
  listeners.forEach((f) => f());
  window.dispatchEvent(new Event("eduvia-settings"));
}

/** Traduce un texto. Variables con llaves: t("Hola, {name}", { name }) */
export function t(s: string, vars?: Record<string, string | number>) {
  let out = current === "es" ? s : (dicts[current][s] ?? s);
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** Código regional para fechas y números. */
export const locale = () => ({ es: "es-NI", en: "en-US", pt: "pt-BR", fr: "fr-FR" })[current];

export function useLang() {
  const [l, setL] = useState(current);
  useEffect(() => {
    const f = () => setL(current);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return l;
}

document.documentElement.lang = current;
