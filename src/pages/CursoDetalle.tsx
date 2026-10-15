import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Modal, btn } from "../components/Modal";
import { Rating } from "../components/Stats";
import { lessonVideo } from "../lib/videos";
import { AddMediaModal, MediaList, MediaPlayer } from "../components/Media";
import { addAnnouncement, builtInMaterials, forLesson, useAnnouncements, useIsAdmin, useMedia, type Media } from "../lib/content";
import { getMyRating, rateCourse } from "../community";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal, ProgressRing, Bar, IconBall, CourseCover } from "../ui";
import { courses, findCourse, type Course, type Lesson, type LessonType } from "../data";
import { flat, getCurrent, getDone, getScores, keyOf, logActivity, percent, setCurrent, setDone, useProgressTick, type LessonRef } from "../progress";
import { Avatar } from "../components/Navbar";
import { locale, t } from "../i18n";
import { ago, firstName, useProfile } from "../profile";
import { useThread } from "../lib/feed";
import { pushAssignment } from "../lib/sync";
import { cloud } from "../lib/supabase";

const tabs = ["Contenido", "Foro", "Anuncios", "Tareas", "Evaluaciones", "Calificaciones"] as const;
type Tab = (typeof tabs)[number];

const typeInfo: Record<LessonType, { label: string; icon: string; color: string }> = {
  video: { label: "Video", icon: "play-btn-fill", color: "#2f6fe4" },
  lectura: { label: "Lectura", icon: "book-half", color: "#259b6a" },
  práctica: { label: "Práctica", icon: "pencil-square", color: "#e09a1e" },
  quiz: { label: "Quiz", icon: "patch-question-fill", color: "#7562d0" },
};

/* número estable a partir de un texto (para datos de ejemplo coherentes) */
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const fmtDate = (d: Date) => d.toLocaleDateString(locale(), { day: "numeric", month: "short" });

/* Estado local guardado (tareas entregadas, comentarios, etc.) */
function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : init;
    } catch {
      return init;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* sin almacenamiento */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export function CursoDetalle() {
  const { id } = useParams();
  const course = findCourse(id);
  if (!course)
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <IconBall icon="question-lg" color="#66758c" size={64} className="mx-auto" />
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">{t("No encontramos este curso")}</h1>
        <p className="mt-2 text-muted">{t("Puede que el enlace esté mal escrito o que el curso ya no exista.")}</p>
        <Link to="/cursos" className="btn-primary press mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold">
          {t("Ver todos los cursos")}
        </Link>
      </div>
    );
  return <CourseView key={course.id} course={course} />;
}

function CourseView({ course }: { course: Course }) {
  useProgressTick();
  const all = useMemo(() => flat(course), [course]);
  const [cur, setCur] = useState<LessonRef>(() => getCurrent(course));
  const [openUnit, setOpenUnit] = useState(cur.u);
  const [tab, setTab] = useState<Tab>("Contenido");
  const [finish, setFinish] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const done = getDone(course);
  const pc = percent(course);
  const idx = all.findIndex((r) => r.u === cur.u && r.l === cur.l);
  const unit = course.units[cur.u];
  const lesson = unit.lessons[cur.l];
  const isLast = idx === all.length - 1;
  const unitDone = (u: number) => course.units[u].lessons.every((_, l) => done.has(`${u}-${l}`));

  const go = (ref: LessonRef, scroll = true) => {
    setCur(ref);
    setCurrent(course, ref);
    setOpenUnit(ref.u);
    if (scroll && window.innerWidth < 1024) playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const complete = (ref: LessonRef = cur, quiet = false, score?: number) => {
    const wasDone = done.has(keyOf(ref));
    if (wasDone) {
      if (score !== undefined) setDone(course, ref, true, score); // se guarda la mejor nota
      return;
    }
    setDone(course, ref, true, score);
    const after = getDone(course);
    const unitNowDone = course.units[ref.u].lessons.every((_, l) => after.has(`${ref.u}-${l}`));
    if (quiet) return;
    if (after.size === all.length) sileo.success({ title: t("¡Curso completado!"), description: t("Terminaste {course}. ¡Felicidades!", { course: t(course.title) }) });
    else if (unitNowDone) sileo.success({ title: t("Unidad completada"), description: t(course.units[ref.u].title) });
  };

  const next = () => {
    if (isLast) {
      complete(cur, true);
      setFinish(true); // ventana de «curso terminado» o de lecciones pendientes
      return;
    }
    complete();
    go(all[idx + 1]);
  };
  const prev = () => idx > 0 && go(all[idx - 1]);

  // Atajos de teclado: ← y → para cambiar de lección
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (tab !== "Contenido" || (e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const doneCount = done.size;
  const nextTaskUnit = course.units.findIndex((_, u) => !unitDone(u));

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      <Link to="/cursos" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <Icon name="arrow-left" size={14} className="transition-transform group-hover:-translate-x-0.5" /> {t("Todos los cursos")}
      </Link>

      {/* Encabezado del curso */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Reveal
          className="relative overflow-hidden rounded-[28px] p-7 text-white shadow-(--shadow-lift) sm:p-8"
          style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${course.accent} 55%, #0c2a5e), #0b1d42)` }}
        >
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
            <Icon name={pc >= 100 ? "check-circle-fill" : pc > 0 ? "play-circle-fill" : "stars"} size={12} />
            {t(pc >= 100 ? "Curso completado" : pc > 0 ? "Curso en progreso" : "Nuevo para ti")} · {t(course.subject)}
          </span>
          <div className="relative flex items-start gap-4">
            <IconBall icon={course.icon} color={course.accent} size={60} rounded="rounded-2xl" />
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight">{t(course.title)}</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/75">{t(course.description)}</p>
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <Meta icon="bar-chart">{t("Nivel: {level}", { level: t(course.level) })}</Meta>
            <Meta icon="calendar3">{t("{n} semanas", { n: course.weeks })}</Meta>
            <Meta icon="collection-play">{t("{n} lecciones", { n: course.lessons })} · {course.hours}</Meta>
            <Rating courseId={course.id} light />
          </div>
        </Reveal>

        <Reveal delay={100} className="@container rounded-3xl border border-line bg-surface p-5 shadow-(--shadow-card)">
          <p className="mb-4 flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
            <Icon name="graph-up-arrow" size={18} className="text-brand" /> {t("Tu progreso en el curso")}
          </p>
          <div className="flex items-center gap-5">
            <ProgressRing key={pc} value={pc} size={108} stroke={10} sub={t("Completado")} color="var(--color-brand)" />
            <div className="space-y-2.5 text-sm">
              <Stat icon="collection-play-fill" n={`${doneCount} / ${all.length}`} l={t("Lecciones")} />
              <Stat icon="clipboard-check-fill" n={`${course.units.filter((_, u) => unitDone(u)).length} / ${course.units.length}`} l={t("Unidades")} />
              <Stat icon="clock-fill" n={`${Math.round(((pc / 100) * course.minutes) / 60 * 10) / 10} h`} l={t("Estudiadas")} />
            </div>
          </div>
          <button
            onClick={() => {
              setTab("Contenido");
              go(getCurrent(course));
            }}
            className="btn-primary press mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
          >
            {t(pc >= 100 ? "Repasar" : pc > 0 ? "Continuar donde lo dejé" : "Comenzar curso")} <Icon name="arrow-right" size={14} />
          </button>
        </Reveal>
      </div>

      {/* Pestañas */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`press shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
              tab === tb ? "border-brand bg-brand text-white shadow-md shadow-brand/25" : "border-line bg-surface text-ink-soft hover:text-brand"
            }`}
          >
            {t(tb)}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-page">
        {tab === "Contenido" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] 2xl:grid-cols-[300px_1fr_300px]">
            {/* Unidades y lecciones */}
            <div className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-2 no-scrollbar">
              {course.units.map((u, i) => {
                const n = u.lessons.filter((_, l) => done.has(`${i}-${l}`)).length;
                const open = openUnit === i;
                return (
                  <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-(--shadow-card)">
                    <button onClick={() => setOpenUnit(open ? -1 : i)} className="flex w-full items-center gap-3 p-4 text-left">
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                          n === u.lessons.length ? "bg-mint text-white" : "bg-brand/10 text-brand"
                        }`}
                      >
                        {n === u.lessons.length ? <Icon name="check-lg" size={15} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-muted">{t("Unidad {n}", { n: i + 1 })} · {n}/{u.lessons.length}</span>
                        <span className="block font-display text-sm font-semibold leading-snug text-ink">{t(u.title)}</span>
                      </span>
                      <Icon name="chevron-down" size={14} className={`text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                    </button>
                    <div className="grid transition-[grid-template-rows] duration-500 ease-(--ease-apple)" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3">
                          <Bar value={Math.round((n / u.lessons.length) * 100)} className="mx-1 mb-2 !h-1.5" color={n === u.lessons.length ? "bg-mint" : "bg-brand"} />
                          <ul className="space-y-0.5">
                            {u.lessons.map((l, j) => {
                              const active = cur.u === i && cur.l === j;
                              const isDone = done.has(`${i}-${j}`);
                              return (
                                <li key={j}>
                                  <button
                                    onClick={() => go({ u: i, l: j })}
                                    aria-current={active ? "step" : undefined}
                                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                                      active ? "bg-brand/10 font-semibold text-brand" : "text-ink-soft hover:bg-canvas"
                                    }`}
                                  >
                                    {isDone ? (
                                      <Icon name="check-circle-fill" size={16} className="text-mint" />
                                    ) : active ? (
                                      <Icon name="play-circle-fill" size={16} className="text-brand" />
                                    ) : (
                                      <Icon name="circle" size={16} className="text-slate-300" />
                                    )}
                                    <span className="w-7 shrink-0 text-xs font-semibold opacity-60">
                                      {i + 1}.{j + 1}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate">{t(l.title)}</span>
                                    <Icon name={typeInfo[l.type].icon} size={12} className="opacity-50" />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lección actual */}
            <div ref={playerRef} className="scroll-mt-24">
              <LessonPanel
                key={keyOf(cur)}
                course={course}
                lesson={lesson}
                unitTitle={unit.title}
                unitSummary={unit.summary}
                number={`${cur.u + 1}.${cur.l + 1}`}
                done={done.has(keyOf(cur))}
                onComplete={(score) => complete(cur, false, score)}
                onToggleDone={() => setDone(course, cur, !done.has(keyOf(cur)))}
                onPrev={idx > 0 ? prev : undefined}
                onNext={next}
                isLast={isLast}
                position={t("{a} de {b}", { a: idx + 1, b: all.length })}
              />
            </div>

            {/* Lateral */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2 2xl:col-span-1 2xl:grid-cols-1 2xl:self-start">
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-(--shadow-card)">
                <p className="mb-3 flex items-center gap-2 font-display font-semibold text-ink">
                  <Icon name="calendar-event" size={17} className="text-brand" /> {t("Siguiente actividad")}
                </p>
                {nextTaskUnit === -1 ? (
                  <p className="rounded-xl bg-mint/10 p-4 text-sm font-medium text-mint">{t("¡Completaste todas las actividades! 🎉")}</p>
                ) : (
                  <div className="rounded-xl bg-canvas p-4">
                    <p className="text-sm font-semibold text-ink">
                      {t("Tarea {n}", { n: nextTaskUnit + 1 })}: {t(course.units[nextTaskUnit].title)}
                    </p>
                    <p className="mt-1 text-xs text-muted">{t("Fecha límite: {date}", { date: fmtDate(due(nextTaskUnit)) })}</p>
                    <button onClick={() => setTab("Tareas")} className="btn-primary press mt-3 rounded-lg px-4 py-2 text-xs font-semibold">
                      {t("Ver detalles")}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-(--shadow-card)">
                <p className="mb-2 font-display font-semibold text-ink">{t("Recursos del curso")}</p>
                <CourseFiles courseId={course.id} />
              </div>
            </div>
          </div>
        )}

        {tab === "Foro" && <Foro course={course} />}
        {tab === "Anuncios" && <Anuncios course={course} />}
        {tab === "Tareas" && <Tareas course={course} unitDone={unitDone} />}
        {tab === "Evaluaciones" && <Evaluaciones course={course} unitDone={unitDone} />}
        {tab === "Calificaciones" && <Calificaciones course={course} unitDone={unitDone} />}
      </div>
      <FinishModal
        open={finish}
        course={course}
        onClose={() => setFinish(false)}
        onGoPending={(ref) => {
          setFinish(false);
          setTab("Contenido");
          go(ref);
        }}
      />
    </div>
  );
}

/* Fechas de entrega de ejemplo: una por semana desde hoy */
const due = (u: number) => {
  const d = new Date();
  d.setDate(d.getDate() + 7 * (u + 1) - 3);
  return d;
};

/* Material general del curso (subido en «Administrar contenido») */
function CourseFiles({ courseId }: { courseId: string }) {
  const { list } = useMedia(courseId);
  const admin = useIsAdmin();
  const general = [...list.filter((m) => !m.lesson_key), ...builtInMaterials(courseId)];
  return (
    <div className="text-sm">
      <MediaList items={general} empty={t("Aún no hay recursos para este curso.")} />
      {admin && (
        <Link to={`/contenido?curso=${courseId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
          <Icon name="cloud-arrow-up" size={13} /> {t("Administrar contenido")}
        </Link>
      )}
    </div>
  );
}

/* Calificar el curso con estrellas (cuenta en la valoración que ven todos) */
function RateCourse({ course }: { course: Course }) {
  const [stars, setStars] = useState(() => getMyRating(course.id));
  const [hover, setHover] = useState(0);
  const shown = hover || stars;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
      <span className="text-sm font-semibold text-ink">{stars ? t("Tu valoración") : t("¿Qué te pareció el curso?")}</span>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={async () => {
              setStars(n);
              await rateCourse(course.id, n);
              sileo.success({ title: t("¡Gracias por tu valoración!") });
            }}
            className="press grid h-9 w-9 place-items-center rounded-lg hover:bg-amber-50"
            aria-label={t("{n} estrellas", { n })}
          >
            <Icon name={n <= shown ? "star-fill" : "star"} size={20} className={n <= shown ? "text-amber-400" : "text-muted"} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* Al pulsar «Finalizar curso» */
function FinishModal({ open, course, onClose, onGoPending }: { open: boolean; course: Course; onClose: () => void; onGoPending: (r: LessonRef) => void }) {
  const nav = useNavigate();
  const me = useProfile();
  const done = getDone(course);
  const pending = flat(course).filter((r) => !done.has(keyOf(r)));
  const complete = pending.length === 0;
  const today = new Date().toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });

  if (!complete)
    return (
      <Modal open={open} onClose={onClose} title={t("Casi terminas")} icon="hourglass-split" width={480}
        footer={
          <>
            <button onClick={onClose} className={btn.ghost}>{t("Cerrar")}</button>
            <button onClick={() => onGoPending(pending[0])} className={btn.primary}>
              {t("Ir a la lección pendiente")} <Icon name="arrow-right" size={13} />
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {pending.length === 1
            ? t("Te falta 1 lección para terminar {course}.", { course: t(course.title) })
            : t("Te faltan {n} lecciones para terminar {course}.", { n: pending.length, course: t(course.title) })}
        </p>
        <ul className="mt-4 max-h-56 space-y-1.5 overflow-y-auto">
          {pending.map((r) => (
            <li key={keyOf(r)}>
              <button onClick={() => onGoPending(r)} className="flex w-full items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 text-left text-sm hover:bg-brand/5">
                <Icon name="circle" size={13} className="text-muted" />
                <span className="flex-1 text-ink">{t(course.units[r.u].lessons[r.l].title)}</span>
                <span className="text-xs text-muted">{t("Unidad {n}", { n: r.u + 1 })}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    );

  return (
    <Modal open={open} onClose={onClose} title={t("¡Curso completado!")} icon="trophy" width={560}
      footer={
        <>
          <button onClick={() => window.print()} className={btn.ghost}>
            <Icon name="printer" size={14} /> {t("Imprimir certificado")}
          </button>
          <button onClick={() => nav("/mis-avances")} className={btn.primary}>
            {t("Ver mis avances")} <Icon name="arrow-right" size={13} />
          </button>
        </>
      }
    >
      <div id="certificado" className="relative overflow-hidden rounded-2xl border-2 p-6 text-center" style={{ borderColor: course.accent }}>
        <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-15" style={{ background: course.accent }} />
        <IconBall icon="award-fill" color={course.accent} size={60} className="mx-auto" rounded="rounded-2xl" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("Certificado de finalización")}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">{`${me.nombres} ${me.apellidos}`.trim() || t("Estudiante")}</p>
        <p className="mt-1 text-sm text-ink-soft">{t("completó el curso")}</p>
        <p className="mt-1 font-display text-lg font-semibold" style={{ color: course.accent }}>{t(course.title)}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
          <span><Icon name="collection-play" size={12} /> {t("{n} lecciones", { n: course.lessons })}</span>
          <span><Icon name="clock" size={12} /> {course.hours}</span>
          <span><Icon name="calendar3" size={12} /> {today}</span>
        </div>
        <p className="mt-4 text-xs font-semibold text-muted">Eduvia</p>
      </div>
      <RateCourse course={course} />
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-canvas p-3 text-sm">
        <span className="text-ink-soft">{t("¿Qué sigue?")}</span>
        <button onClick={() => nav(`/cursos?materia=${encodeURIComponent(course.subject)}`)} className="font-semibold text-brand hover:underline">
          {t("Más cursos de {s}", { s: t(course.subject) })}
        </button>
      </div>
    </Modal>
  );
}

function Meta({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon name={icon} size={14} /> {children}
    </span>
  );
}

function Stat({ icon, n, l }: { icon: string; n: string; l: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={15} className="text-mint" />
      <span className="font-semibold text-ink">{n}</span>
      <span className="text-muted">{l}</span>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Panel de la lección: video simulado, lectura, práctica o quiz
-------------------------------------------------------------------------- */
function LessonPanel({
  course,
  lesson,
  unitTitle,
  unitSummary,
  number,
  done,
  onComplete,
  onToggleDone,
  onPrev,
  onNext,
  isLast,
  position,
}: {
  course: Course;
  lesson: Lesson;
  unitTitle: string;
  unitSummary: string;
  number: string;
  done: boolean;
  onComplete: (score?: number) => void;
  onToggleDone: () => void;
  onPrev?: () => void;
  onNext: () => void;
  isLast: boolean;
  position: string;
}) {
  const info = typeInfo[lesson.type];
  // Material real subido por el administrador (videos, PDF, enlaces)
  const media = useMedia(course.id);
  const admin = useIsAdmin();
  const [adding, setAdding] = useState(false);
  const [nu, nl] = number.split(".").map(Number);
  const lessonKey = `${nu - 1}-${nl - 1}`;
  // Video de YouTube de la lección (src/lib/videos.ts)
  const yt = lesson.video ? null : lessonVideo(course.id, lessonKey);
  // Material escrito en data.ts (video / files) + material subido desde el panel
  const fromCode: Media[] = [
    ...(lesson.video || yt ? [{ id: -1, course_id: course.id, lesson_key: lessonKey, kind: "video" as const, title: t(lesson.title), url: lesson.video ?? yt!.url, created_at: "" }] : []),
    ...(lesson.files ?? []).map((f, i) => ({ id: -2 - i, course_id: course.id, lesson_key: lessonKey, kind: (f.url.toLowerCase().endsWith(".pdf") ? "pdf" : "link") as Media["kind"], title: f.title, url: f.url, created_at: "" })),
  ];
  const uploaded = forLesson(media.list, lessonKey);
  const mine = [...fromCode, ...uploaded];
  // si el administrador subió un video a esta lección, ese tiene prioridad
  const video = uploaded.find((m) => m.kind === "video") ?? fromCode.find((m) => m.kind === "video");
  const credit = video?.id === -1 ? yt : null;
  // + guía y presentación de la unidad (incluidas en la app) + material general del curso
  const extras = [...mine.filter((m) => m !== video), ...builtInMaterials(course.id, nu - 1), ...media.list.filter((m) => !m.lesson_key)];
  const [detail, setDetail] = useState<"Descripción" | "Material de apoyo" | "Comentarios">("Descripción");
  const description =
    lesson.summary ??
    `${t(unitSummary)} ${t("En esta lección trabajamos «{lesson}» con ejemplos claros y una actividad corta para practicar lo aprendido.", { lesson: t(lesson.title) })}`;

  return (
    <div className="rounded-3xl border border-line bg-surface p-4 shadow-(--shadow-card) sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">
            {t("Unidad {n}", { n: number.split(".")[0] })} · {t(unitTitle)}
          </p>
          <h2 className="mt-0.5 flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <span className="text-brand">{number}</span> {t(lesson.title)}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold" style={{ background: `${info.color}1f`, color: info.color }}>
              <Icon name={info.icon} size={11} /> {t(info.label)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={11} /> {lesson.min} min
            </span>
            <span>{t("Lección {pos}", { pos: position })}</span>
          </p>
        </div>
        <button
          onClick={onToggleDone}
          className={`press inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            done ? "bg-mint/15 text-mint" : "bg-brand/10 text-brand hover:bg-brand/15"
          }`}
        >
          <Icon name={done ? "check-circle-fill" : "circle"} size={14} /> {t(done ? "Completada" : "Marcar como vista")}
        </button>
      </div>

      {video ? (
        <div className="mb-4">
          <MediaPlayer key={video.url} media={video} onEnded={() => onComplete()} />
          {credit && (
            <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-muted">
              <Icon name="youtube" size={13} className="shrink-0 text-[#ff0033]" />
              <span className="truncate">
                {t("Video de {channel} en YouTube", { channel: credit.channel })} · «{credit.title}»
              </span>
              <a href={credit.url} target="_blank" rel="noreferrer" className="ml-auto shrink-0 font-semibold text-brand hover:underline">
                {t("Ver en YouTube")}
              </a>
            </p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <Icon name="info-circle" size={12} /> {t("Cuando termines el video, pulsa «Marcar como vista».")}
          </p>
        </div>
      ) : (
        lesson.type === "video" && <VideoPlayer course={course} lesson={lesson} onEnd={() => onComplete()} />
      )}
      {lesson.type === "lectura" && <Reading course={course} lesson={lesson} description={description} />}
      {lesson.type === "práctica" && <Practice key={lesson.title} lesson={lesson} onAllDone={() => onComplete()} />}
      {lesson.type === "quiz" && <Quiz course={course} lesson={lesson} onPass={onComplete} />}

      {/* Detalle */}
      <div className="mt-5 flex gap-5 border-b border-line text-sm">
        {(["Descripción", "Material de apoyo", "Comentarios"] as const).map((dt) => (
          <button
            key={dt}
            onClick={() => setDetail(dt)}
            className={`relative pb-2.5 font-semibold transition-colors ${detail === dt ? "text-brand" : "text-muted hover:text-ink"}`}
          >
            {t(dt)}
            <span
              className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand transition-transform duration-300 ${
                detail === dt ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm leading-relaxed text-ink-soft">
        {detail === "Descripción" && <p className="rounded-2xl bg-canvas p-4">{description}</p>}
        {detail === "Material de apoyo" && (
          <div className="space-y-3">
            <MediaList items={extras} admin={admin} empty={t("Aún no hay material de apoyo para esta lección.")} />
            {admin && (
              <button onClick={() => setAdding(true)} className="press inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand/40 px-3.5 py-2 text-sm font-semibold text-brand hover:bg-brand/5">
                <Icon name="plus-lg" size={13} /> {t("Agregar video, PDF o enlace")}
              </button>
            )}
          </div>
        )}
        {detail === "Comentarios" && <Comments courseId={course.id} lessonKey={String(number)} />}
        <AddMediaModal open={adding} onClose={() => setAdding(false)} courseId={course.id} lessonKey={lessonKey} place={`${t(course.title)} · ${number} ${t(lesson.title)}`} kind={lesson.type === "video" ? "video" : "pdf"} />
      </div>

      {/* Navegación */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="press inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="arrow-left" size={14} /> <span className="hidden sm:inline">{t("Lección anterior")}</span>
        </button>
        <span className="hidden text-xs text-muted md:inline">{t("Usa ← → para moverte entre lecciones")}</span>
        <button onClick={onNext} className="btn-primary press inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
          {isLast ? (
            <>
              {t("Finalizar curso")} <Icon name="flag-fill" size={14} />
            </>
          ) : (
            <>
              {t("Siguiente lección")} <Icon name="arrow-right" size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* Video simulado (la app no tiene videos reales): avanza y al terminar marca la lección. */
function VideoPlayer({ course, lesson, onEnd }: { course: Course; lesson: Lesson; onEnd: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // 0..1
  const total = lesson.min * 60;
  const DEMO_SECONDS = 15; // la demo dura 15 s reales

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPos((p) => {
        const n = Math.min(1, p + 0.25 / DEMO_SECONDS);
        if (n >= 1) {
          setPlaying(false);
          onEnd();
        }
        return n;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  return (
    <div className="group/player relative overflow-hidden rounded-2xl bg-slate-900">
      <CourseCover course={course} zoom={false} className="aspect-video w-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
      <div className="absolute left-5 top-5 max-w-[70%]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{t(course.title)}</p>
        <p className="mt-1 font-display text-xl font-bold leading-tight text-white sm:text-2xl">{t(lesson.title)}</p>
      </div>
      <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
        <Icon name="hourglass-split" size={11} /> {t("Vista previa · video pendiente")}
      </span>
      <button
        onClick={() => (pos >= 1 ? (setPos(0), setPlaying(true)) : setPlaying((p) => !p))}
        aria-label={t(playing ? "Pausar" : "Reproducir")}
        className={`press absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-white/90 text-slate-900 shadow-xl backdrop-blur transition-opacity ${
          playing ? "opacity-0 group-hover/player:opacity-100" : ""
        }`}
      >
        <Icon name={playing ? "pause-fill" : pos >= 1 ? "arrow-clockwise" : "play-fill"} size={30} className={playing || pos >= 1 ? "" : "ml-1"} />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div onClick={seek} className="group/bar mb-2.5 h-1.5 w-full cursor-pointer rounded-full bg-white/25 transition-[height] hover:h-2">
          <div className="relative h-full rounded-full bg-brand" style={{ width: `${pos * 100}%` }}>
            <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button onClick={() => setPlaying((p) => !p)} className="press" aria-label={t(playing ? "Pausar" : "Reproducir")}>
            <Icon name={playing ? "pause-fill" : "play-fill"} size={18} />
          </button>
          <button onClick={() => setPos((p) => Math.min(1, p + 10 / total))} className="press" aria-label={t("Adelantar 10 segundos")}>
            <Icon name="skip-forward-fill" size={16} />
          </button>
          <span className="text-xs tabular-nums">
            {fmtTime(pos * total)} / {fmtTime(total)}
          </span>
          <div className="ml-auto flex items-center gap-4 text-white/85">
            <Icon name="volume-up" size={17} />
            <Icon name="badge-cc" size={17} />
            <Icon name="arrows-fullscreen" size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Reading({ course, lesson, description }: { course: Course; lesson: Lesson; description: string }) {
  return (
    <article className="rounded-2xl bg-canvas p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconBall icon="book-half" color="#259b6a" size={44} rounded="rounded-xl" />
        <div>
          <p className="font-display text-lg font-semibold text-ink">{t(lesson.title)}</p>
          <p className="text-xs text-muted">
            {t("Lectura")} · {lesson.min} min
          </p>
        </div>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
        <p>{description}</p>
        <p>
          {t("Lee con calma y toma nota de las ideas principales. Al final, intenta explicar con tus propias palabras qué aprendiste: es la mejor forma de comprobar que lo entendiste.")}
        </p>
        <div className="rounded-xl border-l-4 border-brand bg-surface p-4">
          <p className="text-sm font-semibold text-ink">{t("Idea clave")}</p>
          <p className="mt-1 text-sm">{t("Relaciona «{lesson}» con algo de tu vida diaria; así lo recordarás más fácilmente.", { lesson: t(lesson.title) })}</p>
        </div>
      </div>
    </article>
  );
}

function Practice({ lesson, onAllDone }: { lesson: Lesson; onAllDone: () => void }) {
  const steps = [
    t("Lee las instrucciones y el ejemplo"),
    t("Realiza la actividad: {lesson}", { lesson: t(lesson.title) }),
    t("Revisa tu trabajo con la guía"),
    t("Súbelo o compártelo en el foro del curso"),
  ];
  const [checked, setChecked] = useState<boolean[]>(steps.map(() => false));
  const toggle = (i: number) => {
    const n = checked.map((c, j) => (j === i ? !c : c));
    setChecked(n);
    if (n.every(Boolean)) onAllDone();
  };
  const count = checked.filter(Boolean).length;
  return (
    <div className="rounded-2xl bg-canvas p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconBall icon="pencil-square" color="#e09a1e" size={44} rounded="rounded-xl" />
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-ink">{t("Actividad práctica")}</p>
          <p className="text-xs text-muted">
            {t("{a} de {b} pasos", { a: count, b: steps.length })} · ~{lesson.min} min
          </p>
        </div>
      </div>
      <Bar value={(count / steps.length) * 100} color="bg-amber-500" className="mb-4" />
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li key={s}>
            <button onClick={() => toggle(i)} className="flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left ring-1 ring-line transition-colors hover:ring-brand/30">
              <Icon name={checked[i] ? "check-circle-fill" : "circle"} size={18} className={checked[i] ? "text-mint" : "text-muted"} />
              <span className={`text-sm ${checked[i] ? "text-muted line-through" : "font-medium text-ink"}`}>{s}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Quiz generado con los temas del propio curso */
function Quiz({ course, lesson, onPass }: { course: Course; lesson: Lesson; onPass: (score: number) => void }) {
  const questions = useMemo(() => {
    const others = courses.filter((c) => c.id !== course.id).flatMap((c) => c.units.flatMap((u) => u.lessons.map((l) => t(l.title))));
    return course.units
      .slice(0, 3)
      .map((u, i) => {
        const right = t(u.lessons.find((l) => l.type !== "quiz")?.title ?? u.lessons[0].title);
        const h = hash(course.id + i);
        const wrong = [others[h % others.length], others[(h * 7 + 3) % others.length]];
        const opts = [right, ...wrong].sort((a, b) => hash(a + h) - hash(b + h));
        return { q: t("¿Qué tema forma parte de la unidad «{unit}»?", { unit: t(u.title) }), opts, right };
      });
  }, [course]);
  const [ans, setAns] = useState<Record<number, string>>({});
  const [sent, setSent] = useState(false);
  const score = questions.filter((q, i) => ans[i] === q.right).length;

  return (
    <div className="rounded-2xl bg-canvas p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconBall icon="patch-question-fill" color="#7562d0" size={44} rounded="rounded-xl" />
        <div>
          <p className="font-display text-lg font-semibold text-ink">{t(lesson.title)}</p>
          <p className="text-xs text-muted">{t("{n} preguntas · necesitas {m} correctas", { n: questions.length, m: Math.ceil(questions.length * 0.6) })}</p>
        </div>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <fieldset key={i}>
            <legend className="mb-2 text-sm font-semibold text-ink">
              {i + 1}. {q.q}
            </legend>
            <div className="grid gap-2">
              {q.opts.map((o) => {
                const chosen = ans[i] === o;
                const state = sent ? (o === q.right ? "ok" : chosen ? "bad" : "") : chosen ? "sel" : "";
                return (
                  <button
                    key={o}
                    disabled={sent}
                    onClick={() => setAns((a) => ({ ...a, [i]: o }))}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm ring-1 transition-colors ${
                      state === "ok"
                        ? "bg-mint/10 text-ink ring-mint"
                        : state === "bad"
                          ? "bg-rose-50 text-ink ring-rose-500"
                          : state === "sel"
                            ? "bg-brand/10 text-ink ring-brand"
                            : "bg-surface text-ink-soft ring-line hover:ring-brand/40"
                    }`}
                  >
                    <Icon
                      name={state === "ok" ? "check-circle-fill" : state === "bad" ? "x-circle-fill" : chosen ? "record-circle" : "circle"}
                      size={16}
                      className={state === "ok" ? "text-mint" : state === "bad" ? "text-rose-500" : chosen ? "text-brand" : "text-muted"}
                    />
                    {o}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!sent ? (
          <button
            disabled={Object.keys(ans).length < questions.length}
            onClick={() => {
              setSent(true);
              if (score >= Math.ceil(questions.length * 0.6)) {
                sileo.success({ title: `${t("¡Aprobado!")} ${score}/${questions.length}` });
                onPass(Math.round((score / questions.length) * 100));
              } else sileo.warning({ title: `${score}/${questions.length}: ${t("inténtalo de nuevo")}` });
            }}
            className="btn-primary press rounded-xl px-5 py-2.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-40"
          >
            {t("Enviar respuestas")}
          </button>
        ) : (
          <>
            <span className={`text-sm font-semibold ${score >= Math.ceil(questions.length * 0.6) ? "text-mint" : "text-rose-600"}`}>
              {t("Resultado: {a} de {b}", { a: score, b: questions.length })}
            </span>
            <button
              onClick={() => {
                setAns({});
                setSent(false);
              }}
              className="press rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-surface"
            >
              {t("Intentar de nuevo")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Comments({ courseId, lessonKey }: { courseId: string; lessonKey: string }) {
  const { list, add, remove } = useThread("comments", courseId, lessonKey); // Supabase o navegador
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-3">
      {list.length === 0 && <p className="text-muted">{t("Sé el primero en comentar esta lección. ¡Comparte tus dudas!")}</p>}
      {list.map((c) => (
        <div key={c.id} className="group flex gap-2.5">
          <Avatar src={c.avatar} size={32} />
          <div className="flex-1 rounded-2xl bg-canvas px-3.5 py-2.5">
            <p className="text-xs font-bold text-ink">
              {c.name} <span className="font-normal text-muted">· {ago(c.at)}</span>
            </p>
            <p className="text-sm text-ink-soft">{c.text}</p>
          </div>
          {c.mine && (
            <button onClick={() => remove(c.id)} className="press self-center rounded-lg p-1.5 text-muted opacity-0 transition hover:text-rose-600 group-hover:opacity-100 focus:opacity-100" aria-label={t("Eliminar")}>
              <Icon name="trash3" size={13} />
            </button>
          )}
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          add(draft.trim());
          setDraft("");
        }}
        className="flex items-center gap-2 rounded-full bg-canvas py-1.5 pl-4 pr-1.5 ring-1 ring-line focus-within:ring-brand/50"
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Escribe un comentario…")} className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted" />
        <button disabled={!draft.trim()} className="press grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={t("Enviar")}>
          <Icon name="send-fill" size={13} />
        </button>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Pestañas: Foro, Anuncios, Tareas, Evaluaciones, Calificaciones
-------------------------------------------------------------------------- */
const people = [
  ["Carlos Méndez", "1507003211169-0a1dd7228f2d"],
  ["Ana López", "1544005313-94ddf0286df2"],
  ["Valentina Torres", "1438761681033-6461ffad8d80"],
  ["Diego Ramírez", "1544725176-7c40e5a71c5e"],
];
const av = (id: string) => `https://images.unsplash.com/photo-${id}?w=80&h=80&fit=crop&auto=format`;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-5 shadow-(--shadow-card) ${className}`}>{children}</div>;
}

/* Respuestas de ejemplo para los temas de muestra (modo local) */
const sampleReplies = [
  ["Yo tengo los míos, los subo esta noche a Recursos.", "Revisa también el resumen al final de la lección, ayuda bastante.", "¡Gracias! A mí también me sirven."],
  ["¿En qué parte te trabaste? Yo lo entendí haciendo el ejercicio de práctica.", "Vuelve a ver el video desde la mitad, ahí lo explica con un ejemplo.", "A mí me pasó igual: la clave está en leer bien el enunciado."],
  ["¡Excelente resumen, muy claro!", "Me sirvió para repasar antes del quiz, gracias.", "¿Lo podrías compartir también en PDF?"],
];

type Topic = { key: string; title: string; name: string; avatar: string; at: number; count: number; mine: boolean; samples: { name: string; avatar: string; text: string; at: number }[] };

function Foro({ course }: { course: Course }) {
  const topics = useThread("topics", course.id); // temas reales (Supabase) o del navegador
  const [draft, setDraft] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const me = useProfile();
  const DAY = 86_400_000;

  // Temas de ejemplo: solo en modo local (con Supabase se ven los temas reales de todos)
  const seed: Topic[] = cloud
    ? []
    : course.units.slice(0, 3).map((u, i) => {
        const who = people[(hash(course.id) + i) % people.length];
        return {
          key: `s${i}`,
          title:
            i === 0
              ? t("¿Alguien tiene apuntes de «{x}»?", { x: t(u.lessons[0].title) })
              : i === 1
                ? t("Duda con «{x}»", { x: t(u.lessons[1]?.title ?? u.title) })
                : t("Comparto mi resumen de {x}", { x: t(u.title) }),
          name: who[0],
          avatar: av(who[1]),
          at: Date.now() - (i + 1) * DAY,
          count: 0,
          mine: false,
          samples: sampleReplies[i].map((text, k) => {
            const p = people[(hash(course.id) + i + k + 1) % people.length];
            return { name: p[0], avatar: av(p[1]), text: t(text), at: Date.now() - (i + 1) * DAY + (k + 1) * 3_600_000 };
          }),
        };
      });
  const all: Topic[] = [
    ...topics.list.map((m) => ({ key: String(m.id), title: m.text, name: m.name, avatar: m.avatar, at: m.at, count: m.count, mine: m.mine, samples: [] })),
    ...seed,
  ];
  const open = all.find((x) => x.key === openKey);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {open ? (
        <TopicView course={course} topic={open} onBack={() => setOpenKey(null)} onDelete={open.mine ? () => { topics.remove(Number(open.key)); setOpenKey(null); } : undefined} />
      ) : (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              topics.add(draft.trim());
              setDraft("");
              sileo.success({ title: t("Tema publicado en el foro") });
            }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-(--shadow-card)"
          >
            <Avatar src={me.avatar} size={40} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Pregunta algo sobre {course}…", { course: t(course.title) })} className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted" />
            <button disabled={!draft.trim()} className="btn-primary press shrink-0 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40">
              {t("Publicar")}
            </button>
          </form>
          {cloud && !topics.loading && all.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">{t("Todavía no hay temas. ¡Abre el primero!")}</p>
          )}
          {all.map((th) => (
            <button key={th.key} onClick={() => setOpenKey(th.key)} className="lift flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left shadow-(--shadow-card)">
              <Avatar src={th.avatar} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{th.title}</p>
                <p className="text-xs text-muted">
                  {th.mine ? `${th.name || firstName(me)} (${t("tú")})` : th.name} · {ago(th.at)}
                </p>
              </div>
              <ReplyCount topic={th} course={course} />
              <Icon name="chevron-right" size={14} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}
      <Card className="self-start">
        <p className="mb-2 font-display font-semibold text-ink">{t("Reglas del foro")}</p>
        <ul className="space-y-2 text-sm text-ink-soft">
          {["Sé respetuoso con tus compañeros", "Busca antes de preguntar", "Comparte material propio o citado"].map((r) => (
            <li key={r} className="flex gap-2">
              <Icon name="check-lg" size={14} className="mt-0.5 text-mint" /> {t(r)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* Número de respuestas (en modo local suma las de ejemplo + las tuyas) */
function ReplyCount({ topic, course }: { topic: Topic; course: Course }) {
  let n = topic.count + topic.samples.length;
  if (!cloud && topic.key.startsWith("s")) {
    try {
      n += JSON.parse(localStorage.getItem(`eduvia.foro.${course.id}.r.${topic.key}`) || "[]").length;
    } catch {
      /* nada */
    }
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-ink-soft">
      <Icon name="chat" size={12} /> {n}
    </span>
  );
}

/* Un tema abierto: pregunta + todas las respuestas + responder */
function TopicView({ course, topic, onBack, onDelete }: { course: Course; topic: Topic; onBack: () => void; onDelete?: () => void }) {
  const replies = useThread("replies", course.id, topic.key);
  const [draft, setDraft] = useState("");
  const me = useProfile();
  const list = [...topic.samples.map((x, i) => ({ id: -1 - i, ...x, mine: false })), ...replies.list];
  return (
    <div className="animate-fade-up space-y-3">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <Icon name="arrow-left" size={13} /> {t("Volver al foro")}
      </button>
      <Card>
        <div className="flex items-start gap-3">
          <Avatar src={topic.avatar} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-snug text-ink">{topic.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {topic.name} · {ago(topic.at)}
            </p>
          </div>
          {onDelete && (
            <button onClick={onDelete} className="press grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={t("Eliminar")} title={t("Eliminar")}>
              <Icon name="trash3" size={14} />
            </button>
          )}
        </div>
      </Card>

      <p className="px-1 pt-1 text-sm font-semibold text-ink">
        {list.length === 1 ? t("1 respuesta") : t("{n} respuestas", { n: list.length })}
      </p>
      {list.length === 0 && <p className="px-1 text-sm text-muted">{t("Nadie ha respondido todavía. ¡Ayuda a tu compañero!")}</p>}
      {list.map((r) => (
        <div key={r.id} className="group flex gap-2.5">
          <Avatar src={r.avatar} size={34} />
          <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="text-xs font-semibold text-ink">
              {r.mine ? `${r.name} (${t("tú")})` : r.name} <span className="font-normal text-muted">· {ago(r.at)}</span>
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">{r.text}</p>
          </div>
          {r.mine && (
            <button onClick={() => replies.remove(r.id)} className="press self-center rounded-lg p-1.5 text-muted opacity-0 transition hover:text-rose-600 group-hover:opacity-100 focus:opacity-100" aria-label={t("Eliminar")}>
              <Icon name="trash3" size={13} />
            </button>
          )}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          replies.add(draft.trim());
          setDraft("");
        }}
        className="flex items-center gap-2.5 pt-1"
      >
        <Avatar src={me.avatar} size={34} />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-4 pr-1.5 focus-within:border-brand/50">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Escribe tu respuesta…")} className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted" />
          <button disabled={!draft.trim()} className="press grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={t("Enviar")}>
            <Icon name="send-fill" size={13} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Anuncios({ course }: { course: Course }) {
  // Anuncios reales publicados desde «Administrar contenido»
  const { list } = useAnnouncements(course.id);
  const admin = useIsAdmin();
  const [draft, setDraft] = useState("");
  const items = list.map((a) => ({ id: a.id, h: a.title, b: a.body, d: ago(a.created_at), pin: a.pinned }));
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {admin && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            if (await addAnnouncement({ course_id: course.id, title: draft.trim(), body: "", pinned: false })) setDraft("");
          }}
          className="flex items-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-surface p-2 pl-4"
        >
          <Icon name="megaphone" size={15} className="text-brand" />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Escribe un anuncio para el curso…")} className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted" />
          <button disabled={!draft.trim()} className="btn-primary press rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-40">
            {t("Publicar")}
          </button>
        </form>
      )}
      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">{t("Aún no hay anuncios en este curso.")}</p>
      )}
      {items.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start gap-3">
            <IconBall icon="megaphone-fill" color={course.accent} size={40} rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{a.h}</p>
                {a.pin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    <Icon name="pin-angle-fill" size={10} /> {t("Fijado")}
                  </span>
                )}
              </div>
              {a.b && <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{a.b}</p>}
              <p className="mt-2 text-xs text-muted">{a.d}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Tareas({ course, unitDone }: { course: Course; unitDone: (u: number) => boolean }) {
  const [sent, setSent] = useStored<number[]>(`eduvia.tareas.${course.id}`, []);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {course.units.map((u, i) => {
        const isSent = sent.includes(i);
        const ready = unitDone(i);
        return (
          <Card key={i} className="flex flex-col">
            <div className="flex items-start gap-3">
              <IconBall icon="clipboard-check-fill" color={isSent ? "#259b6a" : course.accent} size={40} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {t("Tarea {n}", { n: i + 1 })}: {t(u.title)}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{t(u.summary)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted">
                <Icon name="calendar3" size={11} /> {t("Vence el {date}", { date: fmtDate(due(i)) })}
              </span>
              {isSent ? (
                <button
                  onClick={() => {
                    setSent(sent.filter((x) => x !== i));
                    void pushAssignment(course.id, i, false);
                  }} className="press inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3.5 py-1.5 text-xs font-semibold text-mint">
                  <Icon name="check-lg" size={12} /> {t("Entregada · deshacer")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSent([...sent, i]);
                    void pushAssignment(course.id, i, true);
                    logActivity({ t: "task", c: course.id, k: String(i) });
                    sileo.success({ title: t("Tarea entregada"), description: t(u.title) });
                  }}
                  className="btn-primary press rounded-full px-4 py-1.5 text-xs font-semibold"
                >
                  {t(ready ? "Entregar tarea" : "Entregar (unidad sin terminar)")}
                </button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* Evaluaciones = los quiz del curso, con la mejor nota real obtenida */
function quizList(course: Course) {
  const scores = getScores(course);
  return course.units.flatMap((u, ui) =>
    u.lessons.map((l, li) => ({ u: ui, l: li, unit: u, lesson: l, score: scores[`${ui}-${li}`] as number | undefined })).filter((x) => x.lesson.type === "quiz"),
  );
}

function Evaluaciones({ course }: { course: Course; unitDone: (u: number) => boolean }) {
  useProgressTick();
  const list = quizList(course);
  if (!list.length) return <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">{t("Este curso no tiene evaluaciones.")}</p>;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((q, i) => {
        const ok = q.score !== undefined;
        return (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <IconBall icon={ok ? "patch-check-fill" : "clipboard2-check"} color={ok ? "#259b6a" : "#94a3b8"} size={40} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{t("Unidad {n}", { n: q.u + 1 })} · {t(q.unit.title)}</p>
                <p className="font-semibold leading-snug text-ink">{t(q.lesson.title)}</p>
              </div>
            </div>
            {ok ? (
              <div className="mt-4 flex items-end justify-between">
                <span className="text-sm text-muted">{t("Tu mejor nota")}</span>
                <span className={`font-display text-2xl font-bold ${q.score! >= 60 ? "text-mint" : "text-rose-600"}`}>{q.score}/100</span>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-canvas p-3 text-sm text-muted">{t("Aún no la has presentado. Está en la lección {n}.", { n: `${q.u + 1}.${q.l + 1}` })}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Calificaciones({ course }: { course: Course; unitDone: (u: number) => boolean }) {
  useProgressTick();
  let sent: number[] = [];
  try {
    sent = JSON.parse(localStorage.getItem(`eduvia.tareas.${course.id}`) || "[]");
  } catch {
    /* vacío */
  }
  const quizzes = quizList(course);
  const rows = [
    ...quizzes.map((q) => ({ name: t(q.lesson.title), value: q.score === undefined ? null : `${q.score}`, graded: q.score !== undefined })),
    ...course.units.map((u, i) => ({ name: `${t("Tarea {n}", { n: i + 1 })}: ${t(u.title)}`, value: sent.includes(i) ? t("Entregada") : null, graded: false })),
  ];
  const notas = quizzes.filter((q) => q.score !== undefined).map((q) => q.score!);
  const graded = notas;
  const avg = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">{t("Actividad")}</th>
              <th className="px-5 py-3 text-right font-semibold">{t("Nota")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="px-5 py-3 text-ink">{r.name}</td>
                <td className="px-5 py-3 text-right">
                  {r.value === null ? <span className="text-muted">{t("Pendiente")}</span> : <span className={`font-semibold ${r.graded ? "text-ink" : "text-mint"}`}>{r.value}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="self-start text-center">
        <p className="text-sm text-muted">{t("Promedio del curso")}</p>
        <p className="mt-1 font-display text-5xl font-bold text-ink">{avg ?? "—"}</p>
        <p className="mt-2 text-xs text-muted">
          {t("{a} de {b} evaluaciones presentadas", { a: graded.length, b: quizzes.length })}
        </p>
      </Card>
    </div>
  );
}
