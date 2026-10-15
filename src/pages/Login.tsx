import { useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowRight, Eye, EyeOff } from "../icons";
import { Logo, LogoMark } from "../components/Logo";
import { AuthShell, Checkbox, Field, inputCls } from "../components/AuthShell";
import { Icon } from "../icons";
import { LOCAL_RESET, mfaVerify, sendReset, signIn, signInWith, signOut, useSession } from "../auth";
import { cloud } from "../lib/supabase";
import { t } from "../i18n";

export function Login() {
  const { status } = useSession();
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  if (status === "in") return <Navigate to="/" replace />;
  if (status === "mfa") return <MfaStep />;

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setError("");
    setInfo("");
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    return !err;
  };

  return (
    <AuthShell
      title={t("Aprende hoy,")}
      accent={t("construye mañana.")}
      lead={t("Una plataforma educativa multimedia e interactiva diseñada para que aprendas a tu ritmo, explores tus intereses y alcances tus metas.")}
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={46} />
        <h2 className="mt-5 font-display text-2xl font-bold text-ink">{forgot ? t("Recupera tu contraseña") : t("¡Bienvenido de nuevo!")}</h2>
        <p className="mt-1 text-sm text-muted">
          {forgot ? t("Te enviaremos un enlace para crear una nueva.") : t("Inicia sesión para continuar tu aprendizaje.")}
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (forgot) {
            setBusy(true);
            setError("");
            const r = await sendReset(email);
            setBusy(false);
            if (r === LOCAL_RESET) {
              // Modo demostración: no hay correo real, así que se deja entrar con una contraseña nueva
              setForgot(false);
              setPassword("");
              setInfo(t("Modo demostración: no se envían correos. Escribe una contraseña nueva e inicia sesión. Con Supabase conectado llegará un enlace a {email}.", { email }));
            } else if (r) setError(r);
            else setInfo(t("Listo. Si el correo tiene una cuenta, recibirás un enlace para cambiar la contraseña."));
            return;
          }
          await run(() => signIn(email, password, remember));
        }}
        className="space-y-3.5"
      >
        <Field icon="envelope" label={t("Correo")}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("Correo electrónico")}
            className={inputCls}
          />
        </Field>
        {!forgot && (
          <>
            <Field icon="lock" label={t("Contraseña")}>
              <input
                type={show ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Contraseña")}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="press grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label={t(show ? "Ocultar contraseña" : "Mostrar contraseña")}
              >
                {show ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </Field>

            <div className="flex items-center justify-between pt-0.5">
              <Checkbox checked={remember} onChange={() => setRemember((r) => !r)}>
                {t("Recordarme")}
              </Checkbox>
              <button type="button" onClick={() => { setForgot(true); setError(""); }} className="text-sm font-semibold text-brand hover:underline">
                {t("¿Olvidaste tu contraseña?")}
              </button>
            </div>
          </>
        )}

        <Notice error={error} info={info} />

        <button type="submit" disabled={busy} className="btn-primary press flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60">
          {busy ? <Spinner /> : forgot ? t("Enviar enlace") : t("Iniciar sesión")} {!busy && <ArrowRight size={16} />}
        </button>
        {forgot && (
          <button type="button" onClick={() => { setForgot(false); setInfo(""); setError(""); }} className="w-full text-center text-sm font-semibold text-muted hover:text-brand">
            {t("Volver a iniciar sesión")}
          </button>
        )}
      </form>

      {!forgot && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> {t("O puedes continuar con")} <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => run(() => signInWith("google"))} className="press flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas">
              <GoogleIcon /> {t("Google")}
            </button>
            <button onClick={() => run(() => signInWith("azure"))} className="press flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas">
              <MicrosoftIcon /> {t("Microsoft")}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {t("¿No tienes una cuenta?")}{" "}
            <Link to="/registro" className="font-semibold text-brand hover:underline">
              {t("Regístrate")}
            </Link>
          </p>
        </>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-brand/[0.07] p-4 ring-1 ring-brand/15">
        <LogoMark size={36} />
        <p className="text-sm text-ink-soft">
          {cloud ? t("Accede a todo tu contenido, cursos, recursos y mucho más.") : t("Modo de demostración: puedes entrar con cualquier correo. Tus datos se guardan en este navegador.")}
        </p>
      </div>
    </AuthShell>
  );
}

/* Segundo paso: código de la app de autenticación */
function MfaStep() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <AuthShell title={t("Aprende hoy,")} accent={t("construye mañana.")} lead={t("Tu cuenta está protegida con verificación en dos pasos.")}>
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Icon name="shield-lock" size={26} />
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-ink">{t("Verificación en dos pasos")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Escribe el código de 6 dígitos de tu app de autenticación.")}</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const err = await mfaVerify(code);
          setBusy(false);
          setError(err);
        }}
        className="space-y-3.5"
      >
        <Field icon="123" label={t("Código")}>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className={`${inputCls} tracking-[0.4em]`}
          />
        </Field>
        <Notice error={error} />
        <button disabled={busy || code.length !== 6} className="btn-primary press flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60">
          {busy ? <Spinner /> : t("Verificar")}
        </button>
        <button type="button" onClick={() => signOut()} className="w-full text-center text-sm font-semibold text-muted hover:text-brand">
          {t("Usar otra cuenta")}
        </button>
      </form>
    </AuthShell>
  );
}

export function Notice({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return (
    <p className={`animate-fade-up flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${error ? "bg-rose-500/10 text-rose-600" : "bg-mint/12 text-mint"}`} role={error ? "alert" : "status"}>
      <Icon name={error ? "exclamation-circle-fill" : "check-circle-fill"} size={15} className="mt-0.5 shrink-0" /> {error || info}
    </p>
  );
}

export function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="…" />;
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5Z" />
      <path fill="#FF3D00" d="M6.3 14.7 12.9 19c1.8-4.5 6.1-7.5 11.1-7.5 3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 24 4 20 20 0 0 0 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1A20 20 0 0 0 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5Z" />
    </svg>
  );
}

export function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}
