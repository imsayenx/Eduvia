import { useState } from "react";
import { Link } from "react-router";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Icon } from "../icons";
import { Reveal, CountUp, Bar, IconBall, CourseCover } from "../ui";
import { percent } from "../progress";
import { SectionHead } from "./Home";
import { courses, subjects } from "../data";
import { t } from "../i18n";
import { useProfile } from "../profile";
import { fmtMinutes, useStats } from "../lib/stats";
import { BadgeGrid, RecentList } from "../components/Stats";

const card = "rounded-[20px] border border-line bg-surface p-6 shadow-(--shadow-card)";


export function MisAvances() {
  const p = useProfile();
  const [range, setRange] = useState<"Semanal" | "Mensual">("Semanal");
  const stats = useStats();
  const data = range === "Semanal" ? stats.semana : stats.mes;
  const inMin = Math.max(...data.map((d) => d.min)) < 120; // poco tiempo → se muestra en minutos
  const unit = inMin ? "min" : "h";
  const { enCurso, completados, minutos, promedio, racha } = stats;
  const goalCourse = [...enCurso].sort((a, b) => percent(b) - percent(a))[0];

  // progreso por materia = promedio de los cursos de esa materia
  const porMateria = subjects
    .map((s) => {
      const list = courses.filter((c) => c.subject === s.name);
      return { ...s, val: Math.round(list.reduce((a, c) => a + percent(c), 0) / Math.max(1, list.length)) };
    })
    .filter((s) => s.count > 0);

  return (
    <div className="mx-auto max-w-370 space-y-5 px-4 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.8fr_1fr]">
        <Reveal className="relative overflow-hidden rounded-[22px] bg-brand-navy p-8 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">{t("Mis avances")}</p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-tight">
            {t("Tu progreso,")}
            <br />
            <span className="text-[#7cb6ff]">{t("en un solo lugar")}</span>
          </h1>
          <p className="mt-3 max-w-md text-white/75">{t("Visualiza tus logros, revisa tu rendimiento y sigue avanzando hacia tus metas.")}</p>
          <p className="font-hand absolute right-8 top-6 hidden rotate-[-6deg] text-2xl text-white/85 md:block">{t("Cada avance cuenta")}</p>
          <div className="absolute bottom-6 right-8 hidden gap-3 md:flex">
            <IconBall icon="graph-up-arrow" color="#2f6fe4" size={52} rounded="rounded-2xl" />
            <IconBall icon="bullseye" color="#de5a4c" size={52} rounded="rounded-2xl" />
            <IconBall icon="star-fill" color="#e09a1e" size={52} rounded="rounded-2xl" />
          </div>
        </Reveal>

        <Reveal delay={100} className={card}>
          <SectionHead small icon={<Icon name="bullseye" size={18} className="text-brand" />} title={t("Mi objetivo principal")} to="/perfil" toLabel={t("Editar")} />
          <div className="rounded-2xl bg-canvas p-4">
            <div className="flex items-start gap-3">
              <Icon name="trophy-fill" size={20} className="mt-0.5 text-amber-500" />
              <p className="text-sm text-ink-soft">
                {goalCourse ? (
                  <>
                    {t("Completar el curso de")} <span className="font-semibold text-ink">{t(goalCourse.title)}</span>
                  </>
                ) : (
                  p.goal ? t(p.goal) : t("Empieza un curso para fijar tu primera meta.")
                )}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Bar value={goalCourse ? percent(goalCourse) : 0} />
              <span className="text-xs font-semibold text-brand">{goalCourse ? percent(goalCourse) : 0}%</span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["book", "Cursos en progreso", `${enCurso.length} / ${courses.length}`, (enCurso.length / courses.length) * 100, "#2f6fe4"],
          ["check2-circle", "Cursos completados", String(completados.length), (completados.length / courses.length) * 100, "#259b6a"],
          ["clock", racha > 1 ? t("Tiempo de estudio · {n} días seguidos", { n: racha }) : "Tiempo de estudio", fmtMinutes(minutos), Math.min(100, (minutos / 600) * 100), "#7562d0"],
          ["star", "Promedio general", promedio === null ? "—" : `${promedio} / 100`, promedio ?? 0, "#e09a1e"],
        ].map(([icon, label, val, prog, c], i) => (
          <Reveal key={String(label)} delay={i * 60} className="rounded-[20px] border border-line bg-surface p-5 shadow-(--shadow-card)">
            <div className="flex items-center gap-3">
              <IconBall icon={String(icon)} color={String(c)} size={38} rounded="rounded-xl" variant="soft" />
              <span className="text-sm text-muted">{t(String(label))}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{val}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full" style={{ width: `${prog}%`, background: String(c) }} />
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className={card}>
          <SectionHead small icon={<Icon name="graph-up-arrow" size={18} className="text-brand" />} title={t("Rendimiento por curso")} to="/cursos" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...courses]
              .sort((a, b) => percent(b) - percent(a))
              .slice(0, 4)
              .map((c) => {
                const pc = percent(c);
                return (
                  <Link key={c.id} to={`/curso/${c.id}`} className="lift group overflow-hidden rounded-2xl border border-line">
                    <CourseCover course={c} className="h-24" />
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">{t(c.title)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Bar value={pc} />
                        <span className="text-xs font-semibold text-ink">{pc}%</span>
                      </div>
                      <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${pc >= 100 ? "text-mint" : "text-brand"}`}>
                        <Icon name="check-circle-fill" size={11} /> {t(pc >= 100 ? "Completado" : pc > 0 ? "En progreso" : "Sin empezar")}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </Reveal>

        <Reveal delay={100} className={card}>
          <SectionHead small icon={<Icon name="clock-history" size={18} className="text-brand" />} title={t("Actividad reciente")} to="/comunidad" toLabel={t("Ver todas")} />
          <div className="space-y-4">
            <RecentList items={stats.recent} limit={5} />
          </div>
        </Reveal>
      </div>

      {/* Por materia */}
      <Reveal className={card}>
        <SectionHead small icon={<Icon name="mortarboard-fill" size={18} className="text-brand" />} title={t("Mi progreso por categoría")} />
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {porMateria.map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <IconBall icon={m.icon} color={m.color} size={34} />
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold text-ink">{t(m.name)}</span>
                  <span className="font-semibold text-ink-soft">
                    <CountUp to={m.val} suffix="%" />
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${m.val}%`, background: m.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Reveal className={card}>
          <div id="logros" className="scroll-mt-24" />
          <SectionHead small icon={<Icon name="trophy-fill" size={18} className="text-amber-500" />} title={t("Mis logros")} to="/perfil" />
          <BadgeGrid badges={stats.badges} size={48} className="grid-cols-3" />
        </Reveal>

        <Reveal delay={100} className={card}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[17px] font-semibold text-ink">{t("Estadísticas de aprendizaje")}</h2>
            <div className="flex rounded-full bg-canvas p-1 ring-1 ring-line">
              {(["Semanal", "Mensual"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`press rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${range === r ? "bg-brand text-white" : "text-muted"}`}
                >
                  {t(r)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 12 }} unit={` ${unit}`} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--color-line)", background: "var(--color-surface)", color: "var(--color-ink)", boxShadow: "var(--shadow-lift)" }}
                  cursor={{ stroke: "var(--color-line)" }}
                  formatter={(v) => [`${v} ${unit}`, t("Estudio")]}
                />
                <Line
                  type="monotone"
                  dataKey={inMin ? "min" : "h"}
                  stroke="var(--color-brand)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-brand)", strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "var(--color-surface)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Link to="/cursos" className="press mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">
            {t("Ver cursos")} <Icon name="arrow-right" size={14} />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
