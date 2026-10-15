import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal, IconBall, CourseCover } from "../ui";
import { courses } from "../data";
import { groups } from "../community";
import { addAnnouncement, forLesson, kindInfo, removeAnnouncement, useAnnouncements, useIsAdmin, useMedia, type MediaKind } from "../lib/content";
import { AddMediaModal, MediaList } from "../components/Media";
import { TextField, btn } from "../components/Modal";
import { cloud } from "../lib/supabase";
import { ago } from "../profile";
import { t } from "../i18n";

/* ==========================================================================
   Panel de contenido (solo administradores):
   subir videos, PDF, archivos y enlaces a cada lección, y publicar anuncios.
   ========================================================================== */
const card = "rounded-[20px] border border-line bg-surface p-5 shadow-(--shadow-card)";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Contenido() {
  const admin = useIsAdmin();
  const [params, setParams] = useSearchParams();
  const target = params.get("curso") ?? courses[0].id;
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"Lecciones" | "Material general" | "Anuncios">("Lecciones");
  const all = useMedia(); // todo el material, para los contadores
  const isGroup = target.startsWith("grupo:");
  const course = courses.find((c) => c.id === target);
  const group = groups.find((g) => `grupo:${g.id}` === target);
  const [adding, setAdding] = useState<null | { key: string | null; place: string; kind: MediaKind }>(null);

  const countFor = (id: string) => all.list.filter((m) => m.course_id === id).length;
  const totals = useMemo(() => {
    const r: Record<MediaKind, number> = { video: 0, pdf: 0, file: 0, link: 0 };
    for (const m of all.list) r[m.kind]++;
    return r;
  }, [all.list]);

  if (!admin)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <IconBall icon="shield-lock" color="#2f6fe4" size={60} className="mx-auto" variant="soft" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t("Solo para administradores")}</h1>
        <p className="mt-2 text-sm text-muted">{t("Para subir videos y PDF tu cuenta debe estar en la tabla «admins» de Supabase. Los pasos están en SUPABASE-VERCEL.md.")}</p>
        <Link to="/" className="press mt-6 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
          {t("Volver al inicio")}
        </Link>
      </div>
    );

  const select = (id: string) => {
    setParams({ curso: id }, { replace: true });
    setTab(id.startsWith("grupo:") ? "Material general" : "Lecciones");
  };

  return (
    <div className="mx-auto max-w-370 space-y-5 px-4 py-5 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-[22px] bg-brand-navy p-7 text-white sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <Icon name="shield-check" size={16} /> {t("Administración")}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-tight">{t("Contenido de los cursos")}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/75">{t("Sube los videos, PDF y archivos de cada lección, agrega enlaces y publica anuncios. Los estudiantes lo ven al instante.")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(totals) as MediaKind[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <Icon name={kindInfo[k].icon} size={12} /> {totals[k]} {t(kindInfo[k].label)}
            </span>
          ))}
        </div>
        {!cloud && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-xs text-amber-200">
            <Icon name="info-circle" size={13} /> {t("Modo local: puedes pegar enlaces. Para subir archivos conecta Supabase.")}
          </p>
        )}
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Selector */}
        <div className={`${card} self-start !p-3 lg:sticky lg:top-24`}>
          <label className="mb-2 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
            <Icon name="search" size={14} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar curso o grupo…")} className="w-full bg-transparent text-sm text-ink placeholder:text-muted" />
          </label>
          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto pr-1">
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("Cursos")}</p>
            {courses
              .filter((c) => norm(`${c.title} ${t(c.title)}`).includes(norm(q)))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => select(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition-colors ${target === c.id ? "bg-brand/10 text-brand" : "text-ink hover:bg-canvas"}`}
                >
                  <CourseCover course={c} zoom={false} className="h-8 w-8 shrink-0 rounded-lg [&_i]:!text-[13px]" />
                  <span className="min-w-0 flex-1 truncate font-medium">{t(c.title)}</span>
                  {countFor(c.id) > 0 && <span className="rounded-full bg-canvas px-2 text-[11px] font-semibold text-muted">{countFor(c.id)}</span>}
                </button>
              ))}
            <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("Grupos")}</p>
            {groups
              .filter((g) => norm(`${g.name} ${t(g.name)}`).includes(norm(q)))
              .map((g) => (
                <button
                  key={g.id}
                  onClick={() => select(`grupo:${g.id}`)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition-colors ${target === `grupo:${g.id}` ? "bg-brand/10 text-brand" : "text-ink hover:bg-canvas"}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${g.color}`}>
                    <g.icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{t(g.name)}</span>
                  {countFor(`grupo:${g.id}`) > 0 && <span className="rounded-full bg-canvas px-2 text-[11px] font-semibold text-muted">{countFor(`grupo:${g.id}`)}</span>}
                </button>
              ))}
          </div>
        </div>

        {/* Editor */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-muted">{isGroup ? t("Grupo") : t("Curso")}</p>
              <h2 className="font-display text-2xl font-semibold text-ink">{t(course?.title ?? group?.name ?? "")}</h2>
            </div>
            <Link to={isGroup ? `/comunidad/grupo/${group?.id}` : `/curso/${target}`} className={btn.ghost}>
              <Icon name="eye" size={14} /> {t("Ver como estudiante")}
            </Link>
          </div>

          <div className="flex gap-2">
            {(isGroup ? (["Material general"] as const) : (["Lecciones", "Material general", "Anuncios"] as const)).map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`press rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${tab === tb ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft hover:text-brand"}`}
              >
                {t(tb === "Material general" && isGroup ? "Recursos del grupo" : tb)}
              </button>
            ))}
          </div>

          {tab === "Lecciones" && course && (
            <div className="space-y-4">
              {course.units.map((u, ui) => (
                <div key={ui} className={card}>
                  <p className="text-xs font-semibold text-muted">{t("Unidad {n}", { n: ui + 1 })}</p>
                  <p className="font-display text-lg font-semibold text-ink">{t(u.title)}</p>
                  <div className="mt-3 divide-y divide-line">
                    {u.lessons.map((l, li) => {
                      const key = `${ui}-${li}`;
                      const items = forLesson(all.list.filter((m) => m.course_id === course.id), key);
                      const place = `${t(course.title)} · ${t("Lección {pos}", { pos: `${ui + 1}.${li + 1}` })}`;
                      return (
                        <div key={key} className="py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="w-8 shrink-0 text-sm font-semibold text-brand">
                              {ui + 1}.{li + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-ink">{t(l.title)}</p>
                              <p className="text-xs text-muted">
                                {t(l.type === "video" ? "Video" : l.type === "lectura" ? "Lectura" : l.type === "práctica" ? "Práctica" : "Quiz")} · {l.min} min
                              </p>
                            </div>
                            <button onClick={() => setAdding({ key, place: `${place} · ${t(l.title)}`, kind: l.type === "video" ? "video" : "pdf" })} className={`${btn.ghost} !py-1.5 text-xs`}>
                              <Icon name="plus-lg" size={12} /> {t("Agregar")}
                            </button>
                          </div>
                          {items.length > 0 && (
                            <div className="mt-2 pl-11">
                              <MediaList items={items} admin />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Material general" && (
            <div className={card}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted">{isGroup ? t("Aparece en la pestaña Recursos del grupo.") : t("Aparece en la página Recursos y en todas las lecciones del curso.")}</p>
                <button onClick={() => setAdding({ key: null, place: t(course?.title ?? group?.name ?? ""), kind: "pdf" })} className={btn.primary}>
                  <Icon name="plus-lg" size={13} /> {t("Agregar")}
                </button>
              </div>
              <MediaList items={all.list.filter((m) => m.course_id === target && !m.lesson_key)} admin empty={t("Todavía no hay material general.")} />
            </div>
          )}

          {tab === "Anuncios" && course && <AnnouncementsEditor courseId={course.id} />}
        </div>
      </div>

      <AddMediaModal open={!!adding} onClose={() => setAdding(null)} courseId={target} lessonKey={adding?.key ?? null} place={adding?.place ?? ""} kind={adding?.kind} />
    </div>
  );
}

function AnnouncementsEditor({ courseId }: { courseId: string }) {
  const { list } = useAnnouncements(courseId);
  const [f, setF] = useState({ title: "", body: "", pinned: false });
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!f.title.trim()) return;
          if (await addAnnouncement({ course_id: courseId, title: f.title.trim(), body: f.body.trim(), pinned: f.pinned })) {
            sileo.success({ title: t("Anuncio publicado") });
            setF({ title: "", body: "", pinned: false });
          }
        }}
        className={`${card} space-y-3 self-start`}
      >
        <p className="font-display font-semibold text-ink">{t("Nuevo anuncio")}</p>
        <TextField label={t("Título")} value={f.title} onChange={(v) => setF({ ...f, title: v })} />
        <TextField label={t("Mensaje")} value={f.body} onChange={(v) => setF({ ...f, body: v })} multiline />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} className="h-4 w-4 accent-(--color-brand)" />
          {t("Fijar arriba")}
        </label>
        <button className={btn.primary}>
          <Icon name="megaphone" size={14} /> {t("Publicar")}
        </button>
      </form>
      <div className="space-y-3">
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{t("Aún no hay anuncios.")}</p>}
        {list.map((a) => (
          <div key={a.id} className={`${card} flex items-start gap-3`}>
            <Icon name={a.pinned ? "pin-angle-fill" : "megaphone"} size={16} className="mt-1 text-brand" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{a.title}</p>
              {a.body && <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{a.body}</p>}
              <p className="mt-1 text-xs text-muted">{ago(a.created_at)}</p>
            </div>
            <button onClick={() => removeAnnouncement(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={t("Eliminar")}>
              <Icon name="trash3" size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
