import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { deviceId, describeDevice, pushProfile } from "./lib/sync";
import { revokeDevice } from "./auth";
import { locale } from "./i18n";

/* ==========================================================================
   Perfil del estudiante (se guarda en el navegador).
   Lo usan la barra superior, la página de Perfil, Comunidad y Ajustes.
   ========================================================================== */

export type Profile = {
  nombres: string;
  apellidos: string;
  email: string;
  phone: string;
  career: string;
  level: string;
  birth: string; // AAAA-MM-DD
  location: string;
  quote: string;
  avatar: string; // URL o imagen en base64
  interests: string[];
  goal: string;
  isPrivate: boolean;
  showProgress: boolean;
};

export const DEFAULT_AVATAR = "";

/* Perfil vacío: cada cuenta empieza en cero y lo completa el estudiante. */
const blank: Profile = {
  nombres: "", apellidos: "", email: "", phone: "", career: "", level: "", birth: "", location: "", quote: "",
  avatar: "", interests: [], goal: "", isPrivate: false, showProgress: true,
};
const defaults = blank;

const KEY = "eduvia.profile";
const EVT = "eduvia-profile";

export function getProfile(): Profile {
  try {
    const s = localStorage.getItem(KEY);
    return s ? { ...defaults, ...JSON.parse(s) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveProfile(patch: Partial<Profile>) {
  const next = { ...getProfile(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* si la foto es muy grande y no cabe, se guarda el resto */
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...next, avatar: getProfile().avatar }));
    } catch {
      /* sin almacenamiento */
    }
  }
  window.dispatchEvent(new Event(EVT));
  void pushProfile(patch); // subir a Supabase (si está conectado)
  return next;
}

export function useProfile() {
  const [p, setP] = useState(getProfile);
  useEffect(() => {
    const f = () => setP(getProfile());
    window.addEventListener(EVT, f);
    return () => window.removeEventListener(EVT, f);
  }, []);
  return p;
}

export const fullName = (p: Profile) => `${p.nombres} ${p.apellidos}`.trim();
export const firstName = (p: Profile) => p.nombres.split(" ")[0] || "Estudiante";

/** Reduce una imagen (archivo o foto de cámara) a un cuadrado de 320 px en JPEG. */
export function toAvatar(src: CanvasImageSource, w: number, h: number) {
  const size = 320;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const s = Math.min(w, h);
  ctx.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.85);
}

export function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(toAvatar(img, img.naturalWidth, img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* --------------------------------------------------------------------------
   Dispositivos con sesión activa
-------------------------------------------------------------------------- */
export type Device = { id: string; name: string; kind: "desktop" | "phone" | "tablet"; place: string; last: string; current?: boolean };

/** "hace 5 minutos", "hace 2 días"… en el idioma elegido */
export function ago(date: string | number | Date) {
  const s = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, "second"], [3600, "minute"], [86400, "hour"], [604800, "day"], [2629800, "week"], [31557600, "month"]];
  for (const [i, [lim, unit]] of steps.entries()) {
    if (Math.abs(s) < lim) {
      const div = i ? steps[i - 1][0] : 1;
      return unit === "second" ? rtf.format(0, "second") : rtf.format(Math.round(s / div), unit);
    }
  }
  return rtf.format(Math.round(s / 31557600), "year");
}

const thisDevice = (): Device => ({ id: deviceId(), ...describeDevice(), last: "Activo ahora", current: true });

/* Modo local: este navegador + dos dispositivos de ejemplo */
const DKEY = "eduvia.devices.removed";
const others: Device[] = [
  { id: "phone", name: "Eduvia en Android · Samsung Galaxy A54", kind: "phone", place: "Managua", last: "Hace 2 horas" },
  { id: "lab", name: "Chrome en Windows · Laboratorio UCN", kind: "desktop", place: "Managua", last: "Hace 3 días" },
];
const removedLocal = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(DKEY) || "[]");
  } catch {
    return [];
  }
};

export async function listDevices(): Promise<Device[]> {
  if (!supabase) return [thisDevice(), ...others.filter((d) => !removedLocal().includes(d.id))];
  const { data } = await supabase.from("devices").select("*").eq("revoked", false).order("last_seen", { ascending: false });
  const mine = deviceId();
  const rows = (data ?? []) as { id: string; name: string; kind: Device["kind"]; place: string | null; last_seen: string }[];
  return [thisDevice(), ...rows.filter((r) => r.id !== mine).map((r) => ({ id: r.id, name: r.name, kind: r.kind, place: r.place ?? "", last: ago(r.last_seen) }))];
}

export async function removeDevice(id: string) {
  if (supabase) return revokeDevice(id);
  try {
    localStorage.setItem(DKEY, JSON.stringify(id === "all" ? others.map((d) => d.id) : [...removedLocal(), id]));
  } catch {
    /* sin almacenamiento */
  }
}
