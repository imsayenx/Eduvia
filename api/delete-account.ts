import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/* ==========================================================================
   POST /api/delete-account
   Borra la cuenta del usuario que hace la petición.
   Corre en el servidor de Vercel porque necesita la clave secreta
   SUPABASE_SERVICE_ROLE_KEY (nunca debe ir en el navegador).
   ========================================================================== */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(500).json({ error: "Faltan variables de entorno en Vercel" });

  const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Falta la sesión" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1. ¿Quién es? (se comprueba el token con Supabase, no se confía en el navegador)
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Sesión no válida" });
  const id = data.user.id;

  // 2. Borrar sus fotos de perfil
  const files = await admin.storage.from("avatars").list(id);
  if (files.data?.length) await admin.storage.from("avatars").remove(files.data.map((f) => `${id}/${f.name}`));

  // 3. Borrar el usuario: todas sus filas se borran solas (on delete cascade)
  const del = await admin.auth.admin.deleteUser(id);
  if (del.error) return res.status(500).json({ error: del.error.message });

  return res.status(200).json({ ok: true });
}
