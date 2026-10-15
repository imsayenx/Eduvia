import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { sileo } from "sileo";
import { checkPassword, cloud, setRemember, supabase } from "./lib/supabase";
import { clearCache, deviceId, pullAll, watchRevocation } from "./lib/sync";
import { getProfile, saveProfile } from "./profile";
import { startPresence, stopPresence } from "./community";
import { courses } from "./data";
import { t } from "./i18n";

/* ==========================================================================
   Sesión del usuario.
   · Con Supabase: cuentas reales (correo, Google, Microsoft, 2 pasos).
   · Sin Supabase (modo local): cualquier correo entra, como antes.
   ========================================================================== */

export type Status = "loading" | "in" | "out" | "mfa";
type State = { status: Status; user: User | null; recovery: boolean };

const LOCAL = "eduvia-auth";
const localIn = () => {
  try {
    return sessionStorage.getItem(LOCAL) === "1" || localStorage.getItem(LOCAL) === "1";
  } catch {
    return false;
  }
};

let state: State = { status: cloud ? "loading" : localIn() ? "in" : "out", user: null, recovery: false };
const subs = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};

export function useSession() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
  );
}
export const isAuthed = () => state.status === "in";

/* ------------------------------ Supabase ------------------------------ */
let stopWatch = () => {};

async function enter(user: User) {
  // ¿Tiene verificación en dos pasos y aún no escribió el código?
  const aal = await supabase!.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal.data?.nextLevel === "aal2" && aal.data.currentLevel !== "aal2") {
    set({ status: "mfa", user });
    return;
  }
  set({ status: "loading", user });
  try {
    await pullAll(user);
  } catch (e) {
    // si algo de la sincronización falla, igual se entra (y se avisa en la consola)
    console.error("[Eduvia] No se pudieron cargar todos los datos:", e);
  }
  set({ status: "in", user });
  const p = getProfile();
  startPresence({ id: user.id, name: `${p.nombres} ${p.apellidos}`.trim(), avatar: p.avatar }); // «en línea»
  stopWatch();
  stopWatch = watchRevocation(() => {
    sileo.info({ title: t("Se cerró tu sesión desde otro dispositivo") });
    signOut();
  });
}

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    // Nunca llamar a Supabase directamente dentro de este aviso (puede bloquearse): se usa setTimeout
    setTimeout(() => {
      const user = session?.user ?? null;
      if (event === "PASSWORD_RECOVERY") set({ recovery: true });
      if (!user) {
        stopPresence();
        if (state.user) clearCache();
        stopWatch();
        set({ status: "out", user: null });
      } else if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "MFA_CHALLENGE_VERIFIED") {
        if (state.status !== "in" || state.user?.id !== user.id || event === "MFA_CHALLENGE_VERIFIED") enter(user);
      } else set({ user });
    }, 0);
  });
}

/* Traduce los errores más comunes de Supabase */
function explain(e: { message: string; code?: string } | null) {
  if (!e) return "";
  const m = e.message.toLowerCase();
  if (m.includes("invalid login")) return t("Correo o contraseña incorrectos.");
  if (m.includes("email not confirmed")) return t("Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.");
  if (m.includes("already registered") || m.includes("already been registered")) return t("Ese correo ya tiene una cuenta. Inicia sesión.");
  if (m.includes("password should be") || m.includes("weak")) return t("La contraseña es muy débil. Usa al menos 8 caracteres.");
  if (m.includes("rate limit") || m.includes("security purposes")) return t("Demasiados intentos. Espera un momento y vuelve a intentarlo.");
  if (m.includes("invalid totp") || m.includes("invalid code")) return t("El código no es correcto o ya expiró.");
  if (m.includes("failed to fetch") || m.includes("network")) return t("Sin conexión. Revisa tu internet.");
  return e.message;
}

const origin = () => window.location.origin;
/** En modo local no hay servidor de correo: se avisa en lugar de fingir un envío. */
export const LOCAL_RESET = "local";

/* ------------------------------ Acciones ------------------------------ */
/** Devuelve un mensaje de error, o "" si todo salió bien. */
export async function signIn(email: string, password: string, remember = true) {
  setRemember(remember);
  if (!supabase) {
    // Modo local: si aún no hay perfil, se crea con el nombre del correo
    if (!getProfile().nombres && email) {
      const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      saveProfile({ nombres: name, email });
    }
    try {
      (remember ? localStorage : sessionStorage).setItem(LOCAL, "1");
    } catch {
      /* nada */
    }
    set({ status: "in" });
    return "";
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return explain(error);
}

/** Devuelve { error } o { confirm: true } si hay que confirmar el correo. */
export async function signUp(name: string, email: string, password: string) {
  if (!supabase) {
    // Cuenta nueva en modo local: se empieza de cero (sin los datos de ejemplo)
    clearCache();
    for (const c of courses) {
      try {
        localStorage.setItem(`eduvia.done.${c.id}`, "[]");
      } catch {
        /* nada */
      }
    }
    const [nombres, ...rest] = name.trim().split(/\s+/);
    saveProfile({
      nombres, apellidos: rest.join(" "), email, phone: "", career: "Ingeniería en Sistemas", level: "1.er año", birth: "",
      location: "", quote: "", goal: "", avatar: "", interests: [], isPrivate: false, showProgress: true,
    });
    await signIn(email, password);
    return { error: "", confirm: false };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: origin() },
  });
  if (!error && data.user && data.user.identities?.length === 0) return { error: t("Ese correo ya tiene una cuenta. Inicia sesión."), confirm: false };
  return { error: explain(error), confirm: !error && !data.session };
}

export async function signInWith(provider: "google" | "azure") {
  if (!supabase) return signIn("", "");
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: origin(), scopes: provider === "azure" ? "email" : undefined },
  });
  return explain(error);
}

export async function sendReset(email: string) {
  if (!supabase) return LOCAL_RESET;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin() + "/restablecer" });
  return explain(error);
}

/** Cambiar contraseña. Si la cuenta usa contraseña, primero se comprueba la actual. */
export async function changePassword(current: string, next: string) {
  if (!supabase) return "";
  const user = state.user;
  if (current && user?.email && user.app_metadata?.provider === "email") {
    if (!(await checkPassword(user.email, current))) return t("La contraseña actual no es correcta.");
  }
  const { error } = await supabase.auth.updateUser({ password: next });
  if (!error) set({ recovery: false });
  return explain(error);
}

export const usesPassword = () => !cloud || state.user?.app_metadata?.provider === "email";

export async function signOut() {
  if (!supabase) {
    try {
      sessionStorage.removeItem(LOCAL);
      localStorage.removeItem(LOCAL);
    } catch {
      /* nada */
    }
    set({ status: "out" });
    return;
  }
  set({ status: "out" }); // la pantalla cambia al instante; la caché se borra al confirmar
  await supabase.from("devices").delete().eq("id", deviceId());
  await supabase.auth.signOut({ scope: "local" });
}
/** Alias para el código existente */
export const logout = () => void signOut();

/** Elimina la cuenta usando la función de Vercel /api/delete-account. */
export async function deleteAccount() {
  if (!supabase) {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("eduvia.")) localStorage.removeItem(k);
    } catch {
      /* nada */
    }
    await signOut();
    return "";
  }
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/delete-account", { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token}` } }).catch(() => null);
  if (!res?.ok) return t("No se pudo eliminar la cuenta. Inténtalo más tarde.");
  await supabase.auth.signOut({ scope: "local" });
  return "";
}

/* ---------------------- Verificación en dos pasos ---------------------- */
export async function mfaStatus() {
  if (!supabase) return { enabled: false, factorId: "" };
  const { data } = await supabase.auth.mfa.listFactors();
  const f = data?.totp?.[0];
  return { enabled: !!f, factorId: f?.id ?? "" };
}

/** Paso 1: genera el código QR para la app de autenticación. */
export async function mfaEnroll() {
  if (!supabase) return { error: t("Disponible al conectar Supabase."), id: "", qr: "", secret: "" };
  // borrar intentos anteriores sin terminar
  const { data: list } = await supabase.auth.mfa.listFactors();
  for (const f of list?.all ?? []) if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Eduvia ${Date.now()}` });
  return { error: explain(error), id: data?.id ?? "", qr: data?.totp.qr_code ?? "", secret: data?.totp.secret ?? "" };
}

/** Paso 2 (y al iniciar sesión): comprobar el código de 6 dígitos. */
export async function mfaVerify(code: string, factorId?: string) {
  if (!supabase) return "";
  const id = factorId || (await mfaStatus()).factorId;
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code });
  return explain(error);
}

export async function mfaDisable() {
  if (!supabase) return "";
  const { factorId } = await mfaStatus();
  if (!factorId) return "";
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return explain(error);
}

/** Cerrar la sesión en otro dispositivo, o en todos los demás. */
export async function revokeDevice(id: string | "all") {
  if (!supabase) return;
  if (id === "all") {
    await supabase.from("devices").update({ revoked: true }).neq("id", deviceId());
    await supabase.auth.signOut({ scope: "others" });
  } else await supabase.from("devices").update({ revoked: true }).eq("id", id);
}
