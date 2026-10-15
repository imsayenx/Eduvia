import { useState } from "react";
import { Link } from "react-router";
import { Icon } from "../icons";
import { Reveal, IconBall } from "../ui";
import { t } from "../i18n";
import { courses } from "../data";
import { groups } from "../community";
import { fmtBytes, getFile, isFile, builtInMaterials, kindInfo, useIsAdmin, useMedia, type Media } from "../lib/content";

const cats = ["Todos", "Guías", "Presentaciones", "Documentos", "Videos", "Enlaces"];
const catOf = (m: Media) => (m.tag === "guia" ? "Guías" : m.tag === "presentacion" ? "Presentaciones" : m.kind === "video" ? "Videos" : m.kind === "link" ? "Enlaces" : "Documentos");

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Recursos() {
  const [cat, setCat] = useState("Todos");
  const [q, setQ] = useState("");
  const { list, loading } = useMedia(); // material real subido en «Administrar contenido»
  const admin = useIsAdmin();
  const courseName = (id: string) => {
    if (id.startsWith("grupo:")) return t(groups.find((g) => `grupo:${g.id}` === id)?.name ?? "");
    return t(courses.find((c) => c.id === id)?.title ?? "");
  };
  const linkOf = (m: Media) => (m.course_id.startsWith("grupo:") ? `/comunidad/grupo/${m.course_id.slice(6)}` : `/curso/${m.course_id}`);
  // Primero lo subido por el administrador (más reciente arriba) y luego las guías y presentaciones incluidas
  const all = [...[...list].reverse(), ...builtInMaterials()];
  const filtered = all
    .filter((m) => (cat === "Todos" || catOf(m) === cat) && norm(`${m.title} ${courseName(m.course_id)}`).includes(norm(q)));

  return (
    <div className="mx-auto max-w-370 space-y-5 px-4 py-5 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-[22px] bg-brand-navy p-8 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <Icon name="folder2-open" size={17} /> {t("Recursos")}
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-tight">{t("Material para llevar tu aprendizaje más lejos")}</h1>
        <p className="mt-2 max-w-lg text-sm text-white/70">{t("Descarga guías, mira videos y explora recursos seleccionados para reforzar cada tema.")}</p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-5 flex h-12 max-w-md items-center gap-2 rounded-full bg-white px-4 text-[#0f1f3d]">
          <Icon name="search" size={16} className="text-[#6b778c]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar recursos…")} className="w-full bg-transparent text-sm placeholder:text-[#6b778c]" />
        </form>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["journal-bookmark", "Documentos", "PDF, guías y plantillas.", "#2f6fe4", "Guías"],
          ["play-btn", "Videos educativos", "Contenido en alta definición.", "#7562d0", "Videos"],
          ["people", "Foro de estudiantes", "Pregunta, comparte, aprende.", "#1f998c", ""],
        ].map(([icon, ti, s, c, go], i) => (
          <Reveal key={ti} delay={i * 60} className="rounded-[20px] border border-line bg-surface p-6 text-center shadow-(--shadow-card)">
            <IconBall icon={icon} color={c} size={56} className="mx-auto" variant="soft" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">{t(ti)}</p>
            <p className="text-sm text-muted">{t(s)}</p>
            {go ? (
              <button onClick={() => setCat(go)} className="press mt-4 inline-flex items-center gap-1 rounded-full btn-navy px-5 py-2 text-sm font-semibold text-white">
                {t("Explorar")} <Icon name="arrow-right" size={13} />
              </button>
            ) : (
              <Link to="/comunidad" className="press mt-4 inline-flex items-center gap-1 rounded-full btn-navy px-5 py-2 text-sm font-semibold text-white">
                {t("Unirme")} <Icon name="arrow-right" size={13} />
              </Link>
            )}
          </Reveal>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`press rounded-full border px-5 py-2 text-sm font-semibold transition-all ${cat === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft hover:text-brand"}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((m, i) => {
          const k = kindInfo[m.kind];
          return (
            <Reveal key={m.id} delay={(i % 4) * 40} className="lift rounded-[20px] border border-line bg-surface shadow-(--shadow-card)">
              <div onClick={() => getFile(m)} className="flex h-full cursor-pointer items-center gap-3 p-4">
              <IconBall icon={k.icon} color={k.color} size={44} rounded="rounded-xl" variant="soft" />
              <div className="min-w-0 flex-1">
                <button type="button" className="line-clamp-2 text-left text-sm font-semibold leading-snug text-ink hover:text-brand">
                  {m.title}
                </button>
                <Link to={linkOf(m)} onClick={(e) => e.stopPropagation()} className="line-clamp-1 text-xs text-muted hover:text-brand">
                  {t(k.label)} · {courseName(m.course_id)}
                  {m.size_bytes ? ` · ${fmtBytes(m.size_bytes)}` : ""}
                </Link>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); getFile(m); }} className="press grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand hover:bg-brand/10" aria-label={t(isFile(m) ? "Descargar" : "Abrir")} title={t(isFile(m) ? "Descargar" : "Abrir")}>
                <Icon name={isFile(m) ? "download" : "box-arrow-up-right"} size={16} />
              </button>
              </div>
            </Reveal>
          );
        })}
      </div>
      {!loading && filtered.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-line bg-surface p-10 text-center">
          <Icon name="folder2-open" size={28} className="text-brand" />
          <p className="mt-2 font-semibold text-ink">{all.length ? t("No se encontraron recursos.") : t("Todavía no hay recursos publicados.")}</p>
          {!all.length && <p className="mt-1 text-sm text-muted">{t("Cuando se suban videos, PDF o enlaces a los cursos, aparecerán aquí.")}</p>}
          {admin && !all.length && (
            <Link to="/contenido" className="press mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
              <Icon name="cloud-arrow-up" size={14} /> {t("Subir material")}
            </Link>
          )}
        </div>
      )}

      <Reveal className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-surface p-8 text-center shadow-(--shadow-card)">
        <h2 className="font-display text-2xl font-semibold text-ink">{t("¿No encuentras lo que buscas?")}</h2>
        <p className="text-muted">{t("Explora nuestro catálogo completo de cursos y desbloquea aún más recursos.")}</p>
        <Link to="/cursos" className="press inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-deep">
          {t("Ver cursos")} <Icon name="arrow-right" size={14} />
        </Link>
      </Reveal>
    </div>
  );
}
