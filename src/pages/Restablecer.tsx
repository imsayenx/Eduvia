import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { sileo } from "sileo";
import { ArrowRight, Icon } from "../icons";
import { Logo } from "../components/Logo";
import { AuthShell, Field, inputCls } from "../components/AuthShell";
import { changePassword, useSession } from "../auth";
import { Notice, Spinner } from "./Login";
import { t } from "../i18n";

/* Página a la que llega el enlace de «¿Olvidaste tu contraseña?» */
export function Restablecer() {
  const { status } = useSession();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthShell title={t("Aprende hoy,")} accent={t("construye mañana.")} lead={t("Elige una contraseña nueva para tu cuenta.")}>
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={46} />
        <h2 className="mt-5 font-display text-2xl font-bold text-ink">{t("Nueva contraseña")}</h2>
      </div>
      {status === "loading" ? (
        <p className="text-center text-sm text-muted">{t("Comprobando el enlace…")}</p>
      ) : status === "out" ? (
        <div className="space-y-4 text-center">
          <Notice error={t("El enlace no es válido o ya expiró. Pide uno nuevo.")} />
          <Link to="/login" className="font-semibold text-brand hover:underline">
            {t("Volver a iniciar sesión")}
          </Link>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.length < 8) return setError(t("Mínimo 8 caracteres"));
            if (pw !== pw2) return setError(t("Las contraseñas no coinciden"));
            setBusy(true);
            const err = await changePassword("", pw);
            setBusy(false);
            if (err) return setError(err);
            sileo.success({ title: t("Contraseña actualizada") });
            nav("/");
          }}
          className="space-y-3.5"
        >
          <Field icon="lock" label={t("Nueva contraseña")}>
            <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t("Nueva contraseña")} className={inputCls} />
          </Field>
          <Field icon="lock-fill" label={t("Repetir nueva contraseña")}>
            <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={t("Repetir nueva contraseña")} className={inputCls} />
          </Field>
          <Notice error={error} />
          <button disabled={busy} className="btn-primary press flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60">
            {busy ? <Spinner /> : <>{t("Guardar contraseña")} <ArrowRight size={16} /></>}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Icon name="shield-check" size={12} /> {t("Usa 8+ caracteres con mayúsculas, números y símbolos.")}
          </p>
        </form>
      )}
    </AuthShell>
  );
}
