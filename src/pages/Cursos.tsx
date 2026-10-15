import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Icon } from "../icons";
import { Reveal, IconBall, CourseCover, Bar } from "../ui";
import { courses, filterTabs, type Course } from "../data";
import { ctaFor, percent, useProgressTick } from "../progress";
import logoIcon from "../assets/logo-icon.png";
import { t } from "../i18n";
import { Rating } from "../components/Stats";
import { useCourseStats } from "../community";

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function Cursos() {
  const cstats = useCourseStats();
  useProgressTick();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("materia") ?? "Todos");
  const [level, setLevel] = useState("Todos");
  const [dur, setDur] = useState("Cualquiera");
  const [mode, setMode] = useState("Todas");
  const [sort, setSort] = useState("Más populares");
  const qRaw = params.get("q") ?? "";
  const q = norm(qRaw.trim());

  const filtered = useMemo(() => {
    let list = courses.filter((c) => tab === "Todos" || c.subject === tab);
    if (q)
      list = list.filter((c) =>
        norm(`${c.title} ${c.subject} ${c.tags.join(" ")} ${c.units.map((u) => u.title).join(" ")}`).includes(q),
      );
    if (level !== "Todos") list = list.filter((c) => c.level === level);
    if (dur !== "Cualquiera") {
      const h = (c: Course) => c.minutes / 60;
      list = list.filter((c) => (dur === "Menos de 2 h" ? h(c) < 2 : dur === "2 a 4 h" ? h(c) >= 2 && h(c) <= 4 : h(c) > 4));
    }
    if (mode !== "Todas") list = list.filter((c) => c.tags.includes(mode));
    if (sort === "Mejor valorados") list = [...list].sort((a, b) => (cstats[b.id]?.average ?? 0) - (cstats[a.id]?.average ?? 0));
    if (sort === "Más cortos") list = [...list].sort((a, b) => a.minutes - b.minutes);
    if (sort === "Mi progreso") list = [...list].sort((a, b) => percent(b) - percent(a));
    return list;
  }, [tab, level, dur, mode, sort, q, cstats]);

  const filtering = q || tab !== "Todos" || level !== "Todos" || dur !== "Cualquiera" || mode !== "Todas";
  const enCurso = filtered.filter((c) => percent(c) > 0 && percent(c) < 100);
  const resto = filtering ? filtered : filtered.filter((c) => !enCurso.includes(c));

  const clear = () => {
    setTab("Todos");
    setLevel("Todos");
    setDur("Cualquiera");
    setMode("Todas");
    setParams({});
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* Encabezado */}
      <Reveal className="relative mb-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-blue-50 via-surface to-sky-50 p-8 shadow-(--shadow-card)">
        <div className="animate-float pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 items-end gap-3 md:flex">
          <IconBall icon="book-fill" color="#2f6fe4" size={52} rounded="rounded-2xl" />
          <span className="logo-tile mb-6 grid h-[76px] w-[76px] place-items-center rounded-3xl bg-white shadow-[0_14px_30px_-12px_rgba(31,111,239,.6)]">
            <img src={logoIcon} alt="" className="h-[60px] w-[60px] object-contain" />
          </span>
          <IconBall icon="lightbulb-fill" color="#e09a1e" size={52} rounded="rounded-2xl" />
        </div>
        <h1 className="font-display text-4xl font-bold text-ink">{t("Cursos")}</h1>
        <p className="mt-1 text-muted">
          {t("{n} cursos para seguir aprendiendo a tu ritmo.", { n: courses.length })}
        </p>
        {qRaw && (
          <button
            onClick={() => setParams({})}
            className="press mt-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand"
          >
            {t("Resultados para “{q}”", { q: qRaw })} <Icon name="x-lg" size={12} />
          </button>
        )}
      </Reveal>

      {/* Materias */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filterTabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`press rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
              tab === tb
                ? "border-brand bg-brand text-white shadow-md shadow-brand/25"
                : "border-line bg-surface text-ink-soft hover:border-brand/40 hover:text-brand"
            }`}
          >
            {t(tb)}
          </button>
        ))}
      </div>

      {/* Filtros (todos funcionan) */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select label={t("Nivel")} value={level} onChange={setLevel} options={["Todos", "Principiante", "Básico", "Intermedio", "Avanzado"]} />
        <Select label={t("Duración")} value={dur} onChange={setDur} options={["Cualquiera", "Menos de 2 h", "2 a 4 h", "Más de 4 h"]} />
        <Select label={t("Modalidad")} value={mode} onChange={setMode} options={["Todas", "Video", "Interactivo", "Audio", "Imagen", "Quiz"]} />
        <Select label={t("Ordenar por")} value={sort} onChange={setSort} options={["Más populares", "Mejor valorados", "Más cortos", "Mi progreso"]} />
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <IconBall icon="search" color="#66758c" size={56} />
          <p className="mt-4 font-display text-lg font-semibold text-ink">{t("No encontramos cursos")}</p>
          <p className="mt-1 text-sm text-muted">{t("Prueba con otra palabra o quita algunos filtros.")}</p>
          <button onClick={clear} className="btn-primary press mt-5 rounded-full px-5 py-2.5 text-sm font-semibold">
            {t("Ver todos los cursos")}
          </button>
        </div>
      ) : (
        <>
          {!filtering && enCurso.length > 0 && (
            <>
              <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold text-ink">
                <Icon name="play-circle-fill" size={22} className="text-brand" /> {t("Continúa donde lo dejaste")}
              </h2>
              <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {enCurso.map((c, i) => (
                  <Reveal key={c.id} delay={i * 60}>
                    <FeaturedCard course={c} />
                  </Reveal>
                ))}
              </div>
            </>
          )}

          <h2 className="mb-4 font-display text-2xl font-bold text-ink">
            {filtering ? t(filtered.length === 1 ? "{n} resultado" : "{n} resultados", { n: filtered.length }) : t("Explora más cursos")}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {resto.map((c, i) => (
              <Reveal key={c.id} delay={(i % 4) * 60}>
                <FeaturedCard course={c} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const active = value !== options[0];
  return (
    <label
      className={`relative flex h-12 items-center gap-2 rounded-2xl border bg-surface pl-4 pr-10 text-sm shadow-(--shadow-card) transition-colors focus-within:border-brand/50 ${
        active ? "border-brand/40" : "border-line"
      }`}
    >
      <span className="shrink-0 text-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent font-semibold text-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {t(o)}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={13} className="pointer-events-none absolute right-4 text-muted" />
    </label>
  );
}

const tagIcon: Record<string, string> = {
  Video: "play-btn",
  Interactivo: "hand-index-thumb",
  Quiz: "patch-question",
  Imagen: "image",
  Audio: "headphones",
};

const levelColor: Record<string, string> = {
  Principiante: "bg-emerald-100 text-emerald-700",
  Básico: "bg-violet-100 text-violet-700",
  Intermedio: "bg-blue-100 text-blue-700",
  Avanzado: "bg-rose-100 text-rose-700",
};

function FeaturedCard({ course: c }: { course: Course }) {
  const pc = percent(c);
  return (
    <Link
      to={`/curso/${c.id}`}
      className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow-card)"
    >
      <CourseCover course={c} className="h-40">
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
          <Icon name={c.icon} size={12} style={{ color: c.accent }} /> {t(c.subject)}
        </span>
        {pc >= 100 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold text-white">
            <Icon name="check-lg" size={11} /> {t("Completado")}
          </span>
        )}
      </CourseCover>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold leading-snug text-ink">{t(c.title)}</h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${levelColor[c.level]}`}>{t(c.level)}</span>
          <Rating courseId={c.id} />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {c.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1">
              <Icon name={tagIcon[tag] ?? "dot"} size={12} /> {t(tag)}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("{n} lecciones", { n: c.lessons })} · {c.hours}
        </p>

        {pc > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>{t("Progreso")}</span>
              <span className="font-semibold text-ink">{pc}%</span>
            </div>
            <Bar value={pc} color={pc >= 100 ? "bg-mint" : "bg-brand"} />
          </div>
        )}

        <span className="min-h-4 flex-1" />
        <span className="btn-primary press flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold">
          {t(ctaFor(c))} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
