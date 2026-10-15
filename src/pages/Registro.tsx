import { useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowRight, Eye, EyeOff, Icon } from "../icons";
import { Logo } from "../components/Logo";
import { AuthShell, Checkbox, Field, inputCls } from "../components/AuthShell";
import { signUp, useSession } from "../auth";
import { Notice, Spinner } from "./Login";
import { t } from "../i18n";

export function Registro() {
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const { status } = useSession();

  if (status === "in") return <Navigate to="/" replace />;

  return (
    <AuthShell
      title={t("Empieza tu")}
      accent={t("viaje de aprendizaje.")}
      lead={t("Crea tu cuenta gratis y accede a cursos, recursos y una comunidad que aprende contigo.")}
    >
      {sentTo ? (
        <div className="animate-fade-up flex flex-col items-center py-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-mint/15 text-mint">
            <Icon name="envelope-check" size={28} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold text-ink">{t("Revisa tu correo")}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">{t("Enviamos un enlace a {email}. Ábrelo para activar tu cuenta y entrar a Eduvia.", { email: sentTo })}</p>
          <Link to="/login" className="btn-primary press mt-6 rounded-2xl px-6 py-3 text-sm font-semibold">
            {t("Ir a iniciar sesión")}
          </Link>
        </div>
      ) : (
      <>
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={46} />
        <h2 className="mt-5 font-display text-2xl font-bold text-ink">{t("Crea tu cuenta")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("Únete a Eduvia y aprende a tu ritmo.")}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!accept) {
            setError(t("Debes aceptar los términos y condiciones."));
            return;
          }
          (async () => {
            setBusy(true);
            const r = await signUp(f.name, f.email, f.password);
            setBusy(false);
            if (r.error) setError(r.error);
            else if (r.confirm) setSentTo(f.email); // Supabase pide confirmar el correo
          })();
        }}
        className="space-y-3.5"
      >
        <Field icon="person" label={t("Nombre completo")}>
          <input type="text" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("Nombre completo")} className={inputCls} />
        </Field>
        <Field icon="envelope" label={t("Correo")}>
          <input type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder={t("Correo electrónico")} className={inputCls} />
        </Field>

        <Field icon="lock" label={t("Contraseña")}>
          <input type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder={t("Contraseña (mín. 8 caracteres)")} className={inputCls} />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="press grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
            aria-label={t(show ? "Ocultar contraseña" : "Mostrar contraseña")}
          >
            {show ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        </Field>

        <Checkbox
          checked={accept}
          onChange={() => {
            setAccept((a) => !a);
            setError("");
          }}
        >
          {t("Acepto los")}{" "}
          <a href="#" className="font-semibold text-brand hover:underline">
            {t("términos y condiciones")}
          </a>{" "}
          {t("y la política de privacidad.")}
        </Checkbox>
        <Notice error={error} />

        <button type="submit" disabled={busy} className="disabled:opacity-60 btn-primary press flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold">
          {busy ? <Spinner /> : <>{t("Crear cuenta")} <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("¿Ya tienes una cuenta?")}{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t("Inicia sesión")}
        </Link>
      </p>
      </>
      )}
    </AuthShell>
  );
}
