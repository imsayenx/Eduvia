import { useState } from "react";
import { Link } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal, ProgressRing, Bar, CourseCover, IconBall } from "../ui";
import { SectionHead } from "./Home";
import { courses } from "../data";
import { percent, useProgressTick } from "../progress";
import { Avatar } from "../components/Navbar";
import { ProfileEditor, PhotoModal } from "../components/ProfileEditor";
import { fullName, saveProfile, useProfile } from "../profile";
import { locale, t } from "../i18n";
import { useStats } from "../lib/stats";
import { BadgeGrid, RecentList } from "../components/Stats";

const card = "rounded-[20px] border border-line bg-surface p-6 shadow-(--shadow-card)";

export function Perfil() {
  useProgressTick();
  const stats = useStats();
  const p = useProfile();
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(false);

  const enCurso = courses.filter((c) => percent(c) > 0 && percent(c) < 100);
  const completados = stats.completados.length;
  const inscritos = enCurso.length + completados;
  const avance = Math.round(enCurso.reduce((s, c) => s + percent(c), 0) / Math.max(1, enCurso.length));
  const birth = p.birth ? new Date(p.birth + "T12:00:00").toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" }) : "—";

  const makePublic = () => {
    saveProfile({ isPrivate: false });
    sileo.info({ title: t("Tu perfil ahora es público"), description: t("Otros estudiantes pueden ver tu perfil.") });
  };

  return (
    <div className="mx-auto max-w-370 space-y-5 px-4 py-5 sm:px-6">
      {/* Aviso de perfil privado */}
      {p.isPrivate && (
        <Reveal className="flex flex-col gap-3 rounded-[20px] border border-amber-300/60 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-500/30">
          <IconBall icon="lock-fill" color="#c98a12" size={42} rounded="rounded-xl" />
          <div className="flex-1">
            <p className="font-semibold text-ink">{t("Tu perfil es privado")}</p>
            <p className="text-sm text-ink-soft">{t("Solo tú puedes ver tu información, progreso y logros. Los demás estudiantes verán únicamente tu nombre y foto.")}</p>
          </div>
          <button onClick={makePublic} className="press rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-canvas">
            {t("Hacer público")}
          </button>
        </Reveal>
      )}

      {/* Encabezado */}
      <Reveal className="relative overflow-hidden rounded-[22px] border border-line bg-surface shadow-(--shadow-card)">
        <div className="h-24 bg-brand-navy sm:h-28" />
        <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="-mt-14 flex flex-col items-center gap-4 text-center sm:-mt-12 sm:flex-row sm:items-end sm:text-left">
            <div className="relative shrink-0">
              <Avatar src={p.avatar} size={128} className="ring-[5px] ring-surface" />
              <button
                onClick={() => setPhoto(true)}
                aria-label={t("Cambiar foto")}
                title={t("Cambiar foto")}
                className="press absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-brand text-white ring-4 ring-surface hover:bg-brand-deep"
              >
                <Icon name="camera-fill" size={16} />
              </button>
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">{fullName(p)}</h1>
                {p.isPrivate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700" title={t("Tu perfil es privado")}>
                    <Icon name="lock-fill" size={11} /> {t("Privado")}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-ink-soft sm:justify-start">
                <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">{t("Estudiante")}</span>
                {p.career && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="mortarboard" size={14} /> {t(p.career)}
                  </span>
                )}
                {p.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="geo-alt" size={14} /> {p.location}
                  </span>
                )}
              </div>
              {p.quote && <p className="mt-2 text-sm italic text-brand">“{t(p.quote)}”</p>}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface-2 py-3 ring-1 ring-line">
              {[
                [inscritos, "Cursos inscritos", "book", "#2f6fe4"],
                [completados, "Cursos completados", "patch-check", "#259b6a"],
                [stats.promedio === null ? "—" : stats.promedio, "Promedio general", "star", "#e09a1e"],
              ].map(([n, l, i, c]) => (
                <div key={String(l)} className="px-5 text-center">
                  <Icon name={String(i)} size={18} style={{ color: String(c) }} />
                  <p className="mt-0.5 font-display text-xl font-semibold text-ink">{n}</p>
                  <p className="text-[11px] leading-tight text-muted">{t(String(l))}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setEditing(true)} className="press inline-flex items-center justify-center gap-2 rounded-xl border border-brand/40 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white">
              <Icon name="pencil" size={14} /> {t("Editar perfil")}
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-5">
          <Reveal className={card}>
            <p className="mb-4 flex items-center gap-2.5 font-display text-[17px] font-semibold text-ink">
              <Icon name="person-vcard" size={19} className="text-brand" /> {t("Información personal")}
            </p>
            <dl className="space-y-3 text-sm">
              {[
                ["Nombre", fullName(p)],
                ["Correo electrónico", p.email],
                ["Teléfono", p.phone],
                ["Carrera", p.career && t(p.career)],
                ["Nivel", p.level && t(p.level)],
                ["Fecha de nacimiento", birth],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-2.5 last:border-0">
                  <dt className="shrink-0 text-muted">{t(k)}</dt>
                  <dd className="min-w-0 break-words text-right font-medium text-ink">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <button onClick={() => setEditing(true)} className="press mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-canvas py-2.5 text-sm font-semibold text-brand hover:bg-brand/10">
              <Icon name="pencil" size={13} /> {t("Editar información")}
            </button>
          </Reveal>

          <Reveal delay={60} className={card}>
            <p className="mb-2 flex items-center gap-2.5 font-display text-[17px] font-semibold text-ink">
              <Icon name="gear" size={18} className="text-brand" /> {t("Configuración")}
            </p>
            {[
              ["lock", "Cambiar contraseña", "/ajustes#privacidad"],
              [p.isPrivate ? "eye-slash" : "eye", p.isPrivate ? "Privacidad · Perfil privado" : "Privacidad · Perfil público", "/ajustes#privacidad"],
              ["bell", "Notificaciones", "/ajustes#notificaciones"],
              ["sliders", "Preferencias", "/ajustes#apariencia"],
            ].map(([i, l, to]) => (
              <Link key={l} to={to} className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink">
                <Icon name={i} size={16} className="text-muted" /> {t(l)}
                <Icon name="chevron-right" size={13} className="ml-auto text-muted" />
              </Link>
            ))}
          </Reveal>
        </div>

        {/* Columna central */}
        <div className="space-y-5">
          <Reveal className={`${card} @container`}>
            <SectionHead small icon={<Icon name="bar-chart-line-fill" size={18} className="text-brand" />} title={t("Mi progreso")} to="/mis-avances" />
            <div className="flex flex-col items-center gap-4 @xs:flex-row">
              <ProgressRing value={avance} size={112} sub={t("Avance general")} />
              <div className="w-full flex-1 space-y-2">
                {[
                  [inscritos, "Cursos inscritos", "book"],
                  [completados, "Cursos completados", "check2-circle"],
                  [completados, "Certificados obtenidos", "award"],
                ].map(([n, l, i]) => (
                  <div key={String(l)} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 ring-1 ring-line">
                    <Icon name={String(i)} size={15} className="text-brand" />
                    <span className="font-display font-semibold text-ink">{n}</span>
                    <span className="text-xs text-muted">{t(String(l))}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mb-2 mt-5 text-sm font-semibold text-ink">{t("Cursos en curso")}</p>
            <div className="space-y-3">
              {enCurso.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <CourseCover course={c} zoom={false} className="h-11 w-11 shrink-0 rounded-lg [&_i]:!text-[18px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{t(c.title)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Bar value={percent(c)} />
                      <span className="text-xs font-semibold text-ink">{percent(c)}%</span>
                    </div>
                  </div>
                  <Link to={`/curso/${c.id}`} className="press shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-deep">
                    {t("Continuar")}
                  </Link>
                </div>
              ))}
              {enCurso.length === 0 && <p className="text-sm text-muted">{t("Aún no tienes cursos en progreso.")}</p>}
            </div>
          </Reveal>

          <Reveal delay={60} className={card}>
            <SectionHead small icon={<Icon name="trophy-fill" size={18} className="text-amber-500" />} title={t("Mis logros")} to="/mis-avances" />
            <BadgeGrid badges={stats.badges} size={44} className="grid-cols-3" />
          </Reveal>
        </div>

        {/* Columna derecha */}
        <div className="space-y-5 lg:col-span-2 xl:col-span-1">
          <Reveal className={card}>
            <SectionHead small icon={<Icon name="clock-history" size={18} className="text-brand" />} title={t("Actividad reciente")} to="/mis-avances" toLabel={t("Ver todas")} />
            <RecentList items={stats.recent} limit={4} />
          </Reveal>

          <Reveal delay={60} className={card}>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2.5 font-display text-[17px] font-semibold text-ink">
                <Icon name="bullseye" size={18} className="text-brand" /> {t("Mi meta")}
              </p>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                <Icon name="pencil" size={11} /> {t("Editar")}
              </button>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-sm text-ink-soft">{p.goal ? t(p.goal) : t("Aún no has escrito tu meta.")}</p>
              {p.goal && (
                <div className="mt-3 flex items-center gap-2">
                  <Bar value={stats.avance} />
                  <span className="text-xs font-semibold text-brand">{stats.avance}%</span>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={120} className={card}>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2.5 font-display text-[17px] font-semibold text-ink">
                <Icon name="heart" size={17} className="text-rose-500" /> {t("Intereses")}
              </p>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                <Icon name="pencil" size={11} /> {t("Editar")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.interests.length === 0 && <p className="text-sm text-muted">{t("Agrega tus intereses para encontrar cursos y grupos para ti.")}</p>}
              {p.interests.map((i) => (
                <span key={i} className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand">
                  {t(i)}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <ProfileEditor open={editing} onClose={() => setEditing(false)} />
      <PhotoModal open={photo} onClose={() => setPhoto(false)} />
    </div>
  );
}
