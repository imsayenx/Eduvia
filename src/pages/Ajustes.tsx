import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal } from "../ui";
import { changePassword, deleteAccount, mfaDisable, mfaEnroll, mfaStatus, mfaVerify, signOut, usesPassword } from "../auth";
import { cloud } from "../lib/supabase";
import { fmtBytes } from "../lib/content";
import { Notice } from "./Login";
import { setMode, useTheme, type ThemeMode } from "../theme";
import { AccentDots } from "../components/ThemeControls";
import { Modal, TextField, btn } from "../components/Modal";
import { ProfileEditor } from "../components/ProfileEditor";
import { listDevices, removeDevice, saveProfile, useProfile, type Device } from "../profile";
import { languages, setLang, t, useLang, type Lang } from "../i18n";

const sections = [
  { id: "apariencia", label: "Apariencia", icon: "palette" },
  { id: "cuenta", label: "Cuenta", icon: "person" },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "privacidad", label: "Privacidad y seguridad", icon: "shield-check" },
  { id: "idioma", label: "Idioma y región", icon: "globe2" },
  { id: "accesibilidad", label: "Accesibilidad", icon: "universal-access" },
  { id: "datos", label: "Datos y almacenamiento", icon: "database" },
];

function usePref<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem("eduvia.pref." + key);
      return s ? (JSON.parse(s) as T) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      if (localStorage.getItem("eduvia.pref." + key) !== JSON.stringify(v)) {
        localStorage.setItem("eduvia.pref." + key, JSON.stringify(v));
        window.dispatchEvent(new Event("eduvia-settings"));
      }
    } catch {
      /* sin almacenamiento */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export function Ajustes() {
  const nav = useNavigate();
  const { hash } = useLocation();
  const { mode, systemDark } = useTheme();
  const lang = useLang();
  const profile = useProfile();
  const [active, setActive] = useState(hash.slice(1) || "apariencia");
  const [modal, setModal] = useState<null | "password" | "devices" | "edit" | "delete" | "mfa">(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  // Espacio real que usa Eduvia en este navegador
  const [store, setStore] = useState<{ usage: number; quota: number } | null>(null);
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setStore({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => {});
  }, []);
  useEffect(() => {
    if (modal === null) listDevices().then((d) => setDeviceCount(d.length));
  }, [modal]);

  const [n, setN] = usePref("notif", { email: true, push: true, clases: true, comunidad: false, resumen: true });
  const [twoStepLocal, setTwoStepLocal] = usePref("2fa", false);
  const [mfaOn, setMfaOn] = useState(false);
  useEffect(() => {
    if (cloud && modal === null) mfaStatus().then((s) => setMfaOn(s.enabled));
  }, [modal]);
  const twoStep = cloud ? mfaOn : twoStepLocal;
  const [zone, setZone] = usePref("zone", "America/Managua");
  const [a11y, setA11y] = usePref("a11y", { motion: false, contrast: false, size: 16 });
  const [cuenta, setCuenta] = useState({ nombres: profile.nombres, apellidos: profile.apellidos, email: profile.email, phone: profile.phone });

  useEffect(() => {
    const r = document.documentElement;
    r.style.fontSize = a11y.size + "px";
    r.classList.toggle("reduce-motion", a11y.motion);
    r.classList.toggle("high-contrast", a11y.contrast);
  }, [a11y]);

  // Abrir directamente una sección: /ajustes#privacidad
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }, [hash]);

  // Resaltar en el menú la sección visible
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setActive(v.target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const togglePrivate = (makePublic: boolean) => {
    saveProfile({ isPrivate: !makePublic });
    if (makePublic) sileo.info({ title: t("Tu perfil ahora es público"), description: t("Otros estudiantes pueden ver tu perfil.") });
    else sileo.success({ title: t("Ahora tu perfil es privado"), description: t("Solo tú puedes ver tu información, progreso y logros.") });
  };

  const modes: { id: ThemeMode; label: string; icon: string; hint: string }[] = [
    { id: "system", label: "Sistema", icon: "display", hint: systemDark ? t("Ahora: oscuro") : t("Ahora: claro") },
    { id: "light", label: "Claro", icon: "sun", hint: t("Siempre claro") },
    { id: "dark", label: "Oscuro", icon: "moon-stars", hint: t("Siempre oscuro") },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <Reveal>
        <h1 className="font-display text-3xl font-semibold text-ink">{t("Ajustes")}</h1>
        <p className="mt-1 text-muted">{t("Personaliza tu experiencia en Eduvia.")}</p>
      </Reveal>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-2 shadow-(--shadow-card) lg:flex-col">
            {sections.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`press flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active === id ? "bg-brand text-white" : "text-ink-soft hover:bg-canvas"
                }`}
              >
                <Icon name={icon} size={16} /> {t(label)}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          {/* APARIENCIA */}
          <Card id="apariencia" title={t("Apariencia")} desc={t("El modo Sistema sigue automáticamente el modo claro u oscuro de tu dispositivo.")}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {modes.map((m) => {
                const on = mode === m.id;
                const darkPrev = m.id === "dark" || (m.id === "system" && systemDark);
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    aria-pressed={on}
                    className={`press rounded-2xl border-2 p-3 text-left transition-colors ${on ? "border-brand" : "border-line hover:border-muted"}`}
                  >
                    <div
                      className={`mb-3 h-24 overflow-hidden rounded-xl ${
                        m.id === "system" ? "bg-[linear-gradient(90deg,#f4f7fb_50%,#0a1120_50%)]" : darkPrev ? "bg-[#0a1120]" : "bg-[#f4f7fb]"
                      }`}
                    >
                      <div className={`m-3 h-3 w-16 rounded-full ${darkPrev && m.id !== "system" ? "bg-[#1f2b40]" : "bg-[#d9e1ec]"}`} />
                      <div className="mx-3 h-10 rounded-lg bg-brand/80" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        <Icon name={m.icon} size={16} /> {t(m.label)}
                      </span>
                      {on && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-white">
                          <Icon name="check-lg" size={12} />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted">{m.hint}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-ink">{t("Color de acento")}</p>
              <AccentDots size={36} className="gap-3" />
            </div>
          </Card>

          {/* CUENTA */}
          <Card id="cuenta" title={t("Cuenta")} desc={t("Información básica de tu cuenta.")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label={t("Nombres")} value={cuenta.nombres} onChange={(v) => setCuenta({ ...cuenta, nombres: v })} />
              <TextField label={t("Apellidos")} value={cuenta.apellidos} onChange={(v) => setCuenta({ ...cuenta, apellidos: v })} />
              <TextField label={t("Correo electrónico")} type="email" value={cuenta.email} onChange={(v) => setCuenta({ ...cuenta, email: v })} />
              <TextField label={t("Teléfono")} type="tel" value={cuenta.phone} onChange={(v) => setCuenta({ ...cuenta, phone: v })} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!cuenta.nombres.trim()) return sileo.error({ title: t("Escribe tu nombre") });
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cuenta.email)) return sileo.error({ title: t("Correo no válido") });
                  saveProfile(cuenta);
                  sileo.success({ title: t("Cambios guardados") });
                }}
                className={btn.primary}
              >
                {t("Guardar cambios")}
              </button>
              <button onClick={() => setModal("edit")} className={btn.ghost}>
                <Icon name="person-gear" size={15} /> {t("Editar perfil completo")}
              </button>
            </div>
          </Card>

          {/* NOTIFICACIONES */}
          <Card id="notificaciones" title={t("Notificaciones")} desc={t("Elige cómo y cuándo quieres enterarte.")}>
            <Toggle label={t("Correo electrónico")} sub={t("Recibe novedades en tu correo")} on={n.email} set={(v) => setN({ ...n, email: v })} />
            <Toggle label={t("Notificaciones push")} sub={t("Alertas en el navegador")} on={n.push} set={(v) => setN({ ...n, push: v })} />
            <Toggle label={t("Recordatorios de clases")} sub={t("Antes de cada sesión en vivo")} on={n.clases} set={(v) => setN({ ...n, clases: v })} />
            <Toggle label={t("Actividad de la comunidad")} sub={t("Respuestas y menciones")} on={n.comunidad} set={(v) => setN({ ...n, comunidad: v })} />
            <Toggle label={t("Resumen semanal")} sub={t("Tu progreso cada lunes")} on={n.resumen} set={(v) => setN({ ...n, resumen: v })} />
          </Card>

          {/* PRIVACIDAD */}
          <Card id="privacidad" title={t("Privacidad y seguridad")} desc={t("Controla quién ve tu información.")}>
            <Toggle
              label={t("Perfil público")}
              sub={profile.isPrivate ? t("Tu perfil es privado: solo tú puedes verlo") : t("Otros estudiantes pueden ver tu perfil")}
              on={!profile.isPrivate}
              set={togglePrivate}
            />
            {profile.isPrivate && (
              <div className="animate-fade-up my-2 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-ink-soft">
                <Icon name="lock-fill" size={15} className="text-amber-600" />
                <span className="flex-1">{t("Tu perfil es privado. En tu perfil verás el distintivo «Privado».")}</span>
                <button onClick={() => nav("/perfil")} className="shrink-0 text-xs font-semibold text-brand hover:underline">
                  {t("Ver mi perfil")}
                </button>
              </div>
            )}
            <Toggle
              label={t("Mostrar progreso")}
              sub={t("Comparte tus logros en la comunidad")}
              on={profile.showProgress}
              set={(v) => saveProfile({ showProgress: v })}
            />
            <Toggle
              label={t("Verificación en dos pasos")}
              sub={t("Capa extra de seguridad")}
              on={twoStep}
              set={async (v) => {
                if (cloud) {
                  if (v) return setModal("mfa"); // escanear QR y confirmar código
                  const err = await mfaDisable();
                  if (err) return sileo.error({ title: err });
                  setMfaOn(false);
                } else setTwoStepLocal(v);
                sileo[v ? "success" : "info"]({ title: v ? t("Verificación en dos pasos activada") : t("Verificación en dos pasos desactivada") });
              }}
            />
            <Row icon="key" label={t("Cambiar contraseña")} onClick={() => setModal("password")} />
            <Row icon="phone" label={t("Dispositivos conectados")} hint={t("{n} activos", { n: deviceCount || 1 })} onClick={() => setModal("devices")} />
          </Card>

          {/* IDIOMA */}
          <Card id="idioma" title={t("Idioma y región")} desc={t("El idioma cambia toda la aplicación al instante.")}>
            <p className="mb-2 text-xs font-semibold text-ink-soft">{t("Idioma")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    // al cambiar de idioma la app se vuelve a dibujar: volvemos a esta sección
                    window.history.replaceState(window.history.state, "", "/ajustes#idioma");
                    setLang(l.id as Lang);
                    setTimeout(() => sileo.success({ title: t("Idioma cambiado") }), 50);
                  }}
                  aria-pressed={lang === l.id}
                  className={`press flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    lang === l.id ? "border-brand bg-brand/5 text-ink" : "border-line text-ink-soft hover:border-muted"
                  }`}
                >
                  <span className="text-lg leading-none">{l.flag}</span> {l.label}
                  {lang === l.id && <Icon name="check-lg" size={13} className="ml-auto text-brand" />}
                </button>
              ))}
            </div>
            <label className="mt-5 block max-w-sm">
              <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("Zona horaria")}</span>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-brand/60"
              >
                {[
                  ["America/Managua", "Managua (GMT-6)"],
                  ["America/Mexico_City", "Ciudad de México (GMT-6)"],
                  ["America/Bogota", "Bogotá (GMT-5)"],
                  ["America/New_York", "Nueva York (GMT-5)"],
                  ["America/Sao_Paulo", "São Paulo (GMT-3)"],
                  ["Europe/Madrid", "Madrid (GMT+1)"],
                  ["Europe/Paris", "París (GMT+1)"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          {/* ACCESIBILIDAD */}
          <Card id="accesibilidad" title={t("Accesibilidad")} desc={t("Ajusta la interfaz a tus necesidades.")}>
            <Toggle label={t("Reducir movimiento")} sub={t("Minimiza animaciones")} on={a11y.motion} set={(v) => setA11y({ ...a11y, motion: v })} />
            <Toggle label={t("Alto contraste")} sub={t("Mejora la legibilidad")} on={a11y.contrast} set={(v) => setA11y({ ...a11y, contrast: v })} />
            <div className="py-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-ink">{t("Tamaño de texto")}</span>
                <span className="text-muted">{a11y.size}px</span>
              </div>
              <input type="range" min={14} max={20} value={a11y.size} onChange={(e) => setA11y({ ...a11y, size: +e.target.value })} className="w-full accent-(--color-brand)" />
            </div>
          </Card>

          {/* DATOS */}
          <Card id="datos" title={t("Datos y almacenamiento")} desc={t("Gestiona tu información y sesión.")}>
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-ink">{t("Espacio usado en este navegador")}</span>
                <span className="text-muted">{store ? `${fmtBytes(store.usage) || "0 KB"} / ${fmtBytes(store.quota)}` : "—"}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-brand" style={{ width: `${store && store.quota ? Math.max(1, (store.usage / store.quota) * 100) : 0}%` }} />
              </div>
            </div>
            <Row
              icon="download"
              label={t("Exportar mis datos")}
              onClick={() => {
                const datos: Record<string, unknown> = {};
                try {
                  for (const k of Object.keys(localStorage)) if (k.startsWith("eduvia.") && k !== "eduvia.device") datos[k.slice(7)] = JSON.parse(localStorage.getItem(k)!);
                } catch {
                  /* valores que no son JSON se omiten */
                }
                const data = { perfil: profile, datos, exportado: new Date().toISOString() };
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
                a.download = "eduvia-mis-datos.json";
                a.click();
                sileo.success({ title: t("Exportación lista") });
              }}
            />
            <Row
              icon="box-arrow-right"
              label={t("Cerrar sesión")}
              onClick={() => {
                signOut();
                nav("/login");
              }}
            />
            <Row icon="trash3" label={t("Eliminar cuenta")} danger onClick={() => setModal("delete")} />
          </Card>
        </div>
      </div>

      <PasswordModal open={modal === "password"} onClose={() => setModal(null)} />
      <DevicesModal open={modal === "devices"} onClose={() => setModal(null)} />
      <MfaModal
        open={modal === "mfa"}
        onClose={() => setModal(null)}
        onDone={() => {
          setMfaOn(true);
          setModal(null);
          sileo.success({ title: t("Verificación en dos pasos activada") });
        }}
      />
      <ProfileEditor open={modal === "edit"} onClose={() => setModal(null)} />
      <Modal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        title={t("Eliminar cuenta")}
        icon="exclamation-triangle"
        width={460}
        footer={
          <>
            <button onClick={() => setModal(null)} className={btn.ghost}>
              {t("Cancelar")}
            </button>
            <button
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                const err = await deleteAccount();
                setDeleting(false);
                setModal(null);
                if (err) return sileo.error({ title: t("No se pudo eliminar la cuenta"), description: err });
                sileo.success({ title: t("Tu cuenta fue eliminada") });
                nav("/login");
              }}
              className={btn.danger}
            >
              {deleting ? t("Eliminando…") : t("Sí, eliminar")}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">{t("Se borrarán tu progreso, certificados y publicaciones. Esta acción no se puede deshacer.")}</p>
      </Modal>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Cambiar contraseña
-------------------------------------------------------------------------- */
function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [f, setF] = useState({ actual: "", nueva: "", repetir: "" });
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setF({ actual: "", nueva: "", repetir: "" });
      setTried(false);
    }
  }, [open]);
  const strength = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(f.nueva)).length;
  const needsCurrent = usesPassword();
  const [serverErr, setServerErr] = useState("");
  const [busy, setBusy] = useState(false);
  const errs = {
    actual: needsCurrent && !f.actual ? t("Escribe tu contraseña actual") : "",
    nueva: f.nueva.length < 8 ? t("Mínimo 8 caracteres") : "",
    repetir: f.repetir !== f.nueva ? t("Las contraseñas no coinciden") : "",
  };
  const ok = !errs.actual && !errs.nueva && !errs.repetir;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Cambiar contraseña")}
      icon="key"
      width={460}
      footer={
        <>
          <button onClick={onClose} className={btn.ghost}>
            {t("Cancelar")}
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setTried(true);
              setServerErr("");
              if (!ok) return;
              setBusy(true);
              const err = await changePassword(f.actual, f.nueva);
              setBusy(false);
              if (err) return setServerErr(err);
              sileo.success({ title: t("Contraseña actualizada") });
              onClose();
            }}
            className={btn.primary}
          >
            {busy ? t("Guardando…") : t("Actualizar")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {needsCurrent && (
          <TextField label={t("Contraseña actual")} type="password" value={f.actual} onChange={(v) => setF({ ...f, actual: v })} error={tried ? errs.actual : ""} autoComplete="current-password" />
        )}
        <div>
          <TextField label={t("Nueva contraseña")} type="password" value={f.nueva} onChange={(v) => setF({ ...f, nueva: v })} error={tried ? errs.nueva : ""} autoComplete="new-password" />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? (strength < 2 ? "bg-rose-500" : strength < 4 ? "bg-amber-500" : "bg-mint") : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{t("Usa 8+ caracteres con mayúsculas, números y símbolos.")}</p>
        </div>
        <TextField label={t("Repetir nueva contraseña")} type="password" value={f.repetir} onChange={(v) => setF({ ...f, repetir: v })} error={tried ? errs.repetir : ""} autoComplete="new-password" />
        <Notice error={serverErr} />
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   Dispositivos conectados
-------------------------------------------------------------------------- */
function DevicesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [list, setList] = useState<Device[]>([]);
  useEffect(() => {
    if (open) listDevices().then(setList);
  }, [open]);
  const icon = (k: Device["kind"]) => (k === "phone" ? "phone" : k === "tablet" ? "tablet" : "laptop");
  const out = async (id: string) => {
    await removeDevice(id);
    setList(await listDevices());
    sileo.success({ title: id === "all" ? t("Cerraste sesión en los demás dispositivos") : t("Sesión cerrada en ese dispositivo") });
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Dispositivos conectados")}
      icon="phone"
      width={560}
      footer={
        list.length > 1 ? (
          <button onClick={() => out("all")} className="press rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            {t("Cerrar sesión en todos los demás")}
          </button>
        ) : undefined
      }
    >
      <p className="mb-4 text-sm text-muted">{t("Estos son los dispositivos donde tu cuenta tiene una sesión abierta. Si no reconoces alguno, cierra su sesión.")}</p>
      <ul className="space-y-2.5">
        {list.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${d.current ? "bg-brand text-white" : "bg-canvas text-ink-soft"}`}>
              <Icon name={icon(d.kind)} size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                {d.current ? d.name.replace(" en ", ` ${t("en")} `) : t(d.name)}
                {d.current && <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-semibold text-mint">{t("Este dispositivo")}</span>}
              </p>
              <p className="text-xs text-muted">
                {d.place ? `${d.place} · ` : ""}{t(d.last)}
              </p>
            </div>
            {!d.current && (
              <button onClick={() => out(d.id)} className="press shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-rose-300 hover:text-rose-600">
                {t("Cerrar sesión")}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   Activar verificación en dos pasos (Google Authenticator, Authy, 1Password…)
-------------------------------------------------------------------------- */
function MfaModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ id: "", qr: "", secret: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCode("");
    setError("");
    setF({ id: "", qr: "", secret: "" });
    mfaEnroll().then((r) => (r.error ? setError(r.error) : setF(r)));
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Verificación en dos pasos")}
      icon="shield-lock"
      width={460}
      footer={
        <>
          <button onClick={onClose} className={btn.ghost}>
            {t("Cancelar")}
          </button>
          <button
            disabled={busy || code.length !== 6 || !f.id}
            onClick={async () => {
              setBusy(true);
              const err = await mfaVerify(code, f.id);
              setBusy(false);
              if (err) return setError(err);
              onDone();
            }}
            className={`${btn.primary} disabled:opacity-50`}
          >
            {t("Activar")}
          </button>
        </>
      }
    >
      <ol className="space-y-4 text-sm text-ink-soft">
        <li>
          <p className="font-semibold text-ink">1. {t("Escanea este código con tu app de autenticación")}</p>
          <div className="mt-3 grid place-items-center rounded-2xl bg-white p-4">
            {f.qr ? <img src={f.qr} alt={t("Código QR")} className="h-44 w-44" /> : <span className="h-44 w-44 animate-pulse rounded-xl bg-[#eef2f7]" />}
          </div>
          {f.secret && (
            <p className="mt-2 break-all text-center text-xs text-muted">
              {t("O escribe esta clave:")} <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-ink">{f.secret}</code>
            </p>
          )}
        </li>
        <li>
          <p className="mb-2 font-semibold text-ink">2. {t("Escribe el código de 6 dígitos")}</p>
          <TextField label={t("Código")} value={code} onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" />
        </li>
      </ol>
      <div className="mt-3">
        <Notice error={error} />
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   Piezas
-------------------------------------------------------------------------- */
function Card({ id, title, desc, children }: { id: string; title: string; desc: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[20px] border border-line bg-surface p-6 shadow-(--shadow-card)">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mb-5 text-sm text-muted">{desc}</p>
      {children}
    </section>
  );
}

function Toggle({ label, sub, on, set }: { label: string; sub: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => set(!on)}
        className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-mint" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span
          className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-[#fff] shadow-[0_3px_8px_rgba(0,0,0,.15),0_1px_1px_rgba(0,0,0,.16)] transition-transform duration-500 ease-(--ease-apple) ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function Row({ icon, label, hint, danger, onClick }: { icon: string; label: string; hint?: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`press flex w-full items-center gap-3 border-b border-line py-3.5 text-left text-sm font-medium last:border-0 ${danger ? "text-rose-600" : "text-ink"}`}
    >
      <Icon name={icon} size={16} />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      <Icon name="chevron-right" size={13} className="text-muted" />
    </button>
  );
}
