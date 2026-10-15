import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ==========================================================================
   Conexión con Supabase.
   Las claves salen de las variables de entorno (archivo .env o Vercel):
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
   Si no están, la app funciona en «modo local» (todo se guarda en el navegador).
   ========================================================================== */

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/* «Recordarme»: si se desmarca, la sesión se guarda en sessionStorage
   y se cierra sola al cerrar el navegador. */
const REMEMBER = "eduvia.remember";
export function setRemember(v: boolean) {
  try {
    localStorage.setItem(REMEMBER, v ? "1" : "0");
  } catch {
    /* sin almacenamiento */
  }
}
const remember = () => {
  try {
    return localStorage.getItem(REMEMBER) !== "0";
  } catch {
    return true;
  }
};

const storage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k) ?? sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      const [keep, drop] = remember() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(k, v);
      drop.removeItem(k);
    } catch {
      /* sin almacenamiento */
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    } catch {
      /* sin almacenamiento */
    }
  },
};

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
      })
    : null;

/** true cuando la app está conectada a Supabase. */
export const cloud = !!supabase;

/** Comprueba una contraseña sin tocar la sesión actual (cliente temporal sin guardar nada). */
export async function checkPassword(email: string, password: string) {
  if (!url || !key) return true;
  const temp = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "eduvia-check" } });
  const { error } = await temp.auth.signInWithPassword({ email, password });
  if (!error) await temp.auth.signOut({ scope: "local" });
  return !error;
}
