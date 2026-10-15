import { useState } from "react";
import { Link } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal } from "../ui";
import { groups, useJoined, fmt, useGroupCounts } from "../community";
import { t } from "../i18n";

const cats = ["Todos", "Mis grupos", ...Array.from(new Set(groups.map((g) => g.category)))];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Grupos() {
  const gc = useGroupCounts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todos");
  const [joined, toggle] = useJoined();

  const list = groups.filter(
    (g) => norm(`${t(g.name)} ${g.name} ${t(g.desc)}`).includes(norm(q)) && (cat === "Todos" || (cat === "Mis grupos" ? joined.has(g.id) : g.category === cat)),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <Link to="/comunidad" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <Icon name="arrow-left" size={14} /> {t("Comunidad")}
      </Link>
      <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{t("Grupos")}</h1>
          <p className="text-muted">{t(joined.size === 1 ? "Encuentra tu comunidad. Estás en {n} grupo." : "Encuentra tu comunidad. Estás en {n} grupos.", { n: joined.size })}</p>
        </div>
        <label className="flex h-11 w-full max-w-xs items-center gap-2 rounded-full border border-line bg-surface px-4 text-muted focus-within:border-brand/50">
          <Icon name="search" size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Buscar grupos…")} className="flex-1 bg-transparent text-sm text-ink" />
        </label>
      </Reveal>

      <div className="mb-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`press rounded-full border px-4 py-2 text-sm font-semibold transition-all ${cat === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft hover:text-brand"}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-10 text-center text-muted">
          {t(cat === "Mis grupos" ? "Aún no te has unido a ningún grupo." : "No se encontraron grupos.")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g, i) => {
            const on = joined.has(g.id);
            return (
              <Reveal key={g.id} delay={(i % 3) * 60} className="lift overflow-hidden rounded-[20px] border border-line bg-surface shadow-(--shadow-card)">
                <Link to={`/comunidad/grupo/${g.id}`} className="block">
                  <div className="relative h-32 bg-brand-navy">
                    <img src={g.cover} alt="" onError={(e) => (e.currentTarget.style.display = "none")} className="h-full w-full object-cover" />
                    <span className={`absolute -bottom-5 left-5 grid h-12 w-12 place-items-center rounded-xl border-4 border-surface ${g.color}`}>
                      <g.icon size={20} />
                    </span>
                    {g.recommended && <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">{t("Recomendado")}</span>}
                  </div>
                </Link>
                <div className="p-5 pt-7">
                  <Link to={`/comunidad/grupo/${g.id}`} className="font-display font-semibold text-ink hover:text-brand">
                    {t(g.name)}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{t(g.desc)}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Icon name="people" size={12} /> {t("{n} miembros", { n: fmt(gc[g.id] ?? 0) })} · {t(g.category)}
                    </span>
                    <button
                      onClick={() => {
                        const now = toggle(g.id);
                        sileo[now ? "success" : "info"]({ title: now ? t("Te uniste a {g}", { g: t(g.name) }) : t("Saliste de {g}", { g: t(g.name) }) });
                      }}
                      className={`press inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        on ? "border-brand bg-brand text-white" : "border-brand/30 text-brand hover:bg-brand hover:text-white"
                      }`}
                    >
                      {on ? (
                        <>
                          <Icon name="check-lg" size={11} /> {t("Unido")}
                        </>
                      ) : (
                        t("Unirse")
                      )}
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
