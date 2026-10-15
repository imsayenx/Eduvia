import { Link } from "react-router";
import { Icon } from "../icons";
import { Reveal, ProgressRing, IconBall, CourseCover } from "../ui";
import { courses, subjects, findCourse, type Course } from "../data";
import { getCurrent, percent, useProgressTick } from "../progress";
import { t } from "../i18n";
import { useStats } from "../lib/stats";
import { Rating, RecentList } from "../components/Stats";
import { useCourseStats } from "../community";

const card = "rounded-[20px] border border-line bg-surface shadow-(--shadow-card)";

export function Home() {
  useProgressTick();
  const stats = useStats();
  const cstats = useCourseStats();
  const destacado = findCourse("multimedia-1")!;
  // Populares = los que más estudiantes han empezado (al inicio, una selección fija)
  const base = ["matematicas", "biologia", "historia", "ingles", "programacion-web"];
  const populares = [...courses]
    .sort((a, b) => (cstats[b.id]?.students ?? 0) - (cstats[a.id]?.students ?? 0) || base.indexOf(b.id) - base.indexOf(a.id))
    .slice(0, 5);

  // Estadísticas a partir del progreso guardado
  const { enCurso, completados, avance } = stats;
  const next = [...enCurso].sort((a, b) => percent(b) - percent(a))[0] ?? courses[0];
  const nextRef = getCurrent(next);
  const nextLesson = next.units[nextRef.u].lessons[nextRef.l];

  return (
    <div className="mx-auto max-w-370 space-y-5 px-4 py-5 sm:px-6">
      {/* ===== FILA 1: hero + materias | curso destacado ===== */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_460px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Reveal className="relative flex-1 overflow-hidden rounded-[22px] bg-brand-navy text-white">
            <div className="grid h-full min-h-[250px] md:grid-cols-[1.1fr_1fr]">
              <div className="relative z-10 flex flex-col justify-center p-7 sm:p-9">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">{t("Aprende · Explora · Avanza")}</p>
                <h1 className="mt-3 font-display text-[clamp(1.9rem,2.7vw,2.55rem)] font-semibold leading-[1.08]">
                  {t("Tu conocimiento,")}
                  <br />
                  <span className="text-[#7cb6ff]">{t("sin límites")}</span>
                </h1>
                <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-white/75">
                  {t("En Eduvia combinamos la educación con la tecnología para que aprendas de forma interactiva, divertida y a tu propio ritmo.")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/cursos" className="press inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">
                    {t("Explorar cursos")} <Icon name="arrow-right" size={14} />
                  </Link>
                  <Link
                    to="/curso/programacion-web"
                    className="press inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/60 hover:bg-white/10"
                  >
                    <Icon name="play-circle" size={15} /> {t("Ver cómo funciona")}
                  </Link>
                </div>
              </div>

              <div className="relative hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=900&h=600&fit=crop&auto=format"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/30 to-transparent" />
                <Tile className="left-[6%] top-[22%]" icon="play-fill" delay={0} />
                <Tile className="left-[2%] top-[48%]" icon="book" delay={1.2} />
                <Tile className="left-[16%] top-[70%]" icon="controller" delay={0.6} />
                <p className="font-hand absolute right-6 top-6 max-w-[170px] rotate-[-8deg] text-right text-[22px] leading-[1.05] text-white/90">
                  {t("Grandes metas, mejores oportunidades")}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Materias */}
          <Reveal className={`${card} grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-4 2xl:grid-cols-7`}>
            {subjects.map((s) => (
              <Link
                key={s.name}
                to={`/cursos?materia=${encodeURIComponent(s.name)}`}
                className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-line px-2.5 py-2 transition-colors hover:border-brand/30 hover:bg-canvas"
              >
                <IconBall icon={s.icon} color={s.color} size={36} className="transition-transform duration-300 group-hover:scale-105" />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">{t(s.name)}</span>
                  <span className="text-[11px] text-muted">{t(s.count === 1 ? "{n} curso" : "{n} cursos", { n: s.count })}</span>
                </span>
              </Link>
            ))}
          </Reveal>
        </div>

        {/* Curso destacado */}
        <Reveal delay={100} className={`${card} @container flex flex-col p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
              <Icon name="star-fill" size={17} className="text-amber-400" /> {t("Curso destacado")}
            </span>
            <MoreLink to="/cursos">{t("Ver todos")}</MoreLink>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 @sm:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col">
              <CourseCover course={destacado} className="h-36 rounded-2xl">
                <span className="absolute bottom-2.5 left-2.5 rounded-md bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">{t(destacado.subject)}</span>
              </CourseCover>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{t(destacado.title)}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(destacado.description)}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <Meta icon="journal-text">{t("{n} lecciones", { n: destacado.lessons })}</Meta>
                <Meta icon="clock">{destacado.hours}</Meta>
                <Meta icon="bar-chart">{t("Nivel: {level}", { level: t(destacado.level) })}</Meta>
              </div>
              <span className="flex-1" />
              <Link to={`/curso/${destacado.id}`} className="press mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-deep">
                {t(percent(destacado) > 0 ? "Continuar curso" : "Comenzar curso")} <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 @sm:grid-cols-1">
              {[
                ["play-btn", "Videos HD", "Explicaciones visuales", "#2f6fe4"],
                ["file-earmark-richtext", "Infografías", "Resúmenes interactivos", "#259b6a"],
                ["pencil-square", "Ejercicios", "Practica lo aprendido", "#2793cf"],
                ["controller", "Juegos", "Aprende jugando", "#de5a4c"],
                ["clipboard2-check", "Evaluaciones", "Mide tu progreso", "#7562d0"],
              ].map(([icon, ti, s, c]) => (
                <div key={ti} className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-2.5 py-2 ring-1 ring-line">
                  <IconBall icon={icon} color={c} size={34} rounded="rounded-[10px]" variant="soft" />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[13px] font-semibold text-ink">{t(ti)}</p>
                    <p className="truncate text-[11px] text-muted">{t(s)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ===== FILA 2: populares | progreso | logros ===== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[2fr_1.05fr_0.95fr]">
        <Reveal className={`${card} p-5 lg:col-span-2 2xl:col-span-1`}>
          <SectionHead icon={<Icon name="fire" size={20} className="text-orange-500" />} title={t("Cursos populares")} to="/cursos" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {populares.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={80} className={`${card} @container p-5`}>
          <SectionHead small icon={<Icon name="bar-chart-line-fill" size={18} className="text-brand" />} title={t("Mi progreso")} to="/mis-avances" toLabel={t("Ver detalles")} />
          <div className="flex flex-col items-center gap-4 @xs:flex-row">
            <ProgressRing value={avance} size={116} stroke={11} sub={t("Avance general")} />
            <div className="grid w-full flex-1 grid-cols-3 gap-2 @xs:grid-cols-1">
              {[
                [String(enCurso.length), "Cursos en progreso", "play-circle"],
                [String(completados.length), "Cursos completados", "check2-circle"],
                [String(completados.length), "Certificados obtenidos", "award"],
              ].map(([n, l, i]) => (
                <div key={l} className="flex flex-col items-center gap-0.5 rounded-xl bg-surface-2 px-2 py-2.5 text-center ring-1 ring-line @xs:flex-row @xs:gap-2.5 @xs:py-2 @xs:text-left">
                  <Icon name={i} size={15} className="text-brand" />
                  <span className="font-display text-base font-semibold leading-none text-ink">{n}</span>
                  <span className="text-[11px] leading-tight text-muted">{t(l)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mb-2 mt-4 text-sm font-semibold text-ink">{t("Tu próxima actividad")}</p>
          <div className="flex flex-col gap-3 rounded-2xl p-3 ring-1 ring-line @sm:flex-row @sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CourseCover course={next} zoom={false} className="h-12 w-12 shrink-0 rounded-lg [&_i]:!text-[18px]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{t(nextLesson.title)}</p>
                <p className="truncate text-xs text-muted">
                  {t(next.title)} · {nextLesson.min} min
                </p>
              </div>
            </div>
            <Link to={`/curso/${next.id}`} className="press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-deep">
              {t(enCurso.length ? "Continuar" : "Comenzar")} <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={140} className={`${card} p-5`}>
          <SectionHead small icon={<Icon name="trophy-fill" size={18} className="text-amber-500" />} title={t("Actividad reciente")} to="/mis-avances" />
          <div>
            <RecentList items={stats.recent} limit={4} size={38} />
          </div>
        </Reveal>
      </div>

      {/* ===== FILA 3: actividades | recursos | CTA ===== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[1.6fr_1.15fr_0.85fr]">
        <Reveal className={`${card} p-5 lg:col-span-2 2xl:col-span-1`}>
          <SectionHead small icon={<Icon name="controller" size={19} className="text-brand" />} title={t("Actividades interactivas")} to="/recursos" toLabel={t("Ver todas")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Quiz de Historia", "Pon a prueba tus conocimientos.", "Juego", "#e09a1e", "Jugar ahora", "bank", "historia"],
              ["Laboratorio Virtual", "Explora y experimenta sin riesgos.", "Simulación", "#1f998c", "Comenzar", "flask", "biologia"],
              ["Calcula y Avanza", "Resuelve los problemas y gana puntos.", "Juego", "#7562d0", "Jugar ahora", "plus-slash-minus", "matematicas"],
              ["Crea tu Infografía", "Diseña y aprende de forma visual.", "Actividad", "#2793cf", "Comenzar", "easel2", "diseno-grafico"],
            ].map(([ti, s, tag, c, cta, icon, to]) => (
              <Link key={ti} to={`/curso/${to}`} className="lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="grid h-[92px] place-items-center" style={{ background: c }}>
                  <Icon name={icon} size={30} className="text-white/95 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="flex flex-1 flex-col items-start p-3">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-[10px] font-semibold text-ink-soft">{t(tag)}</span>
                  <p className="mt-1.5 text-[13px] font-semibold text-ink">{t(ti)}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted">{t(s)}</p>
                  <span className="flex-1" />
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg btn-navy px-3 py-1.5 text-[11px] font-semibold text-white">
                    {t(cta)} <Icon name="arrow-right" size={10} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100} className={`${card} p-5`}>
          <SectionHead small icon={<Icon name="journal-bookmark-fill" size={18} className="text-brand" />} title={t("Recursos adicionales")} to="/recursos" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["journal-bookmark", "Biblioteca digital", "Libros, artículos y más.", "Explorar", "#2f6fe4", "/recursos"],
              ["play-btn", "Videos educativos", "Contenido en HD.", "Ver videos", "#7562d0", "/recursos"],
              ["people", "Foro de estudiantes", "Pregunta, comparte, aprende.", "Unirme", "#2f6fe4", "/comunidad"],
            ].map(([icon, ti, s, cta, c, to]) => (
              <div key={ti} className="flex flex-col items-center rounded-2xl border border-line p-3.5 text-center">
                <IconBall icon={icon} color={c} size={48} variant="soft" />
                <p className="mt-2.5 text-[13px] font-semibold text-ink">{t(ti)}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">{t(s)}</p>
                <span className="flex-1" />
                <Link to={to} className="press mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg btn-navy py-2 text-[11.5px] font-semibold text-white">
                  {t(cta)} <Icon name="arrow-right" size={10} />
                </Link>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={180} className="relative min-h-[230px] overflow-hidden rounded-[20px] bg-brand-navy p-6 text-white">
          <img
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=500&fit=crop&auto=format"
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="absolute inset-y-0 right-0 h-full w-[55%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/85 to-brand-navy/10" />
          <div className="relative flex h-full min-h-[180px] flex-col">
            <h3 className="max-w-[210px] font-display text-[22px] font-semibold leading-tight">{t("Tu futuro comienza con una buena educación")}</h3>
            <span className="flex-1" />
            <Link to="/comunidad" className="press mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">
              {t("Únete a la comunidad")} <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------- piezas compartidas ---------- */

function MoreLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
      {children} <Icon name="arrow-right" size={11} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function SectionHead({
  icon,
  title,
  to,
  toLabel,
  small,
}: {
  icon: React.ReactNode;
  title: string;
  to?: string;
  toLabel?: string;
  small?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className={`flex items-center gap-2.5 font-display font-semibold text-ink ${small ? "text-[17px]" : "text-[19px]"}`}>
        {icon} {title}
      </h2>
      {to && <MoreLink to={to}>{toLabel ?? t("Ver todos")}</MoreLink>}
    </div>
  );
}

function Meta({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name={icon} size={13} /> {children}
    </span>
  );
}

function Tile({ className, icon, delay }: { className: string; icon: string; delay: number }) {
  return (
    <span
      className={`animate-float absolute grid h-12 w-12 place-items-center rounded-2xl bg-brand/90 text-white ring-1 ring-white/30 ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon name={icon} size={20} />
    </span>
  );
}

export function CourseCard({ course: c }: { course: Course }) {
  const pc = percent(c);
  return (
    <Link to={`/curso/${c.id}`} className="lift group block min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <CourseCover course={c} className="h-[100px]">
        <span className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-[10.5px] font-semibold text-white">{t(c.subject)}</span>
      </CourseCover>
      <div className="p-2.5">
        <p className="line-clamp-1 text-[13px] font-semibold text-ink">{t(c.title)}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {t("Nivel: {level}", { level: t(c.level) })} · {c.hours}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <Rating courseId={c.id} />
          <Icon name={pc > 0 ? "bookmark-fill" : "bookmark"} size={13} className={pc > 0 ? "text-brand" : "text-muted"} />
        </div>
      </div>
    </Link>
  );
}
