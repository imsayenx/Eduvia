import type { ReactNode } from "react";
import { Icon } from "../icons";
import { IconBall } from "../ui";
import { Logo, LogoMark } from "./Logo";
import { t } from "../i18n";

/** Diseño compartido de Iniciar sesión / Registro: panel de marca + tarjeta del formulario. */
export function AuthShell({ title, accent, lead, children }: { title: string; accent: string; lead: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-100 via-sky-50 to-blue-200 p-12 lg:flex lg:flex-col dark:from-brand-navy dark:via-[#0b1730] dark:to-brand-navy-2">

        <div className="relative">
          <Logo size={46} />
          <h1 className="mt-10 font-display text-[clamp(2.4rem,3.6vw,3.4rem)] font-bold leading-[1.05] text-ink">
            {title}
            <br />
            <span className="text-brand">{accent}</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">{lead}</p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4">
            {[
              ["play-btn-fill", "Contenido", "multimedia", "#1f6fef"],
              ["graph-up-arrow", "Seguimiento", "de progreso", "#259b6a"],
              ["people-fill", "Comunidad", "de aprendizaje", "#7562d0"],
            ].map(([i, a, b, c]) => (
              <div key={a} className="flex items-center gap-2.5">
                <IconBall icon={i} color={c} size={40} rounded="rounded-xl" />
                <span className="text-sm font-semibold leading-tight text-ink">
                  {t(a)}
                  <br />
                  <span className="font-normal text-ink-soft">{t(b)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vista previa de la app (sin fotos) */}
        <div className="relative mt-auto max-w-[460px] pt-12">
          <div className="animate-fade-up rounded-[24px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_60px_-24px_rgba(15,31,61,.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
            <div className="flex items-center gap-3">
              <IconBall icon="code-slash" color="#1f6fef" size={44} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-semibold text-ink">{t("Programación web")}</p>
                <p className="text-xs text-muted">{t("Unidad {u} · Lección {l}", { u: 2, l: 4 })}</p>
              </div>
              <span className="font-display text-xl font-semibold text-brand">62%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e3eaf5] dark:bg-white/10">
              <div className="h-full w-[62%] rounded-full bg-brand" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["12", "Lecciones"],
                ["5 h", "Esta semana"],
                ["7", "Días seguidos"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-canvas/70 px-2 py-2.5 dark:bg-white/[0.04]">
                  <p className="font-display text-base font-semibold text-ink">{n}</p>
                  <p className="text-[11px] text-muted">{t(l)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up ml-auto mt-3 flex w-fit items-center gap-3 rounded-2xl border border-white/70 bg-white/80 py-3 pl-3 pr-5 shadow-lg backdrop-blur-xl [animation-delay:.15s] dark:border-white/10 dark:bg-white/[0.07]">
            <IconBall icon="trophy-fill" color="#e09a1e" size={38} rounded="rounded-xl" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink">{t("Unidad completada")}</p>
              <p className="text-xs text-muted">{t("Fundamentos de HTML y CSS")}</p>
            </div>
          </div>

          <span className="animate-float absolute -right-2 top-2" style={{ animationDelay: "0.6s" }}>
            <LogoMark size={54} />
          </span>
          <p className="font-hand mt-6 rotate-[-3deg] text-2xl text-ink-soft">{t("Tu futuro empieza con lo que aprendes hoy")}</p>
        </div>
      </aside>

      {/* Formulario */}
      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="animate-fade-up relative w-full max-w-[440px] rounded-[28px] border border-line bg-surface p-7 shadow-(--shadow-lift) sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Field({ icon, children, label }: { icon: string; children: ReactNode; label: string }) {
  return (
    <label className="flex h-[52px] items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-brand/60 focus-within:bg-surface focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-brand)_14%,transparent)]">
      <span className="sr-only">{label}</span>
      <Icon name={icon} size={18} className="text-muted" />
      {children}
    </label>
  );
}

export const inputCls = "w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted";

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 ${
          checked ? "border-brand bg-brand text-white" : "border-line bg-surface"
        }`}
      >
        <Icon name="check-lg" size={13} className={`transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} />
      </span>
      <span className="text-ink-soft">{children}</span>
    </label>
  );
}
