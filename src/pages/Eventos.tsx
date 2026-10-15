import { useState } from "react";
import { Link } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal } from "../ui";
import { events, groups, useRegistered, useEventCounts } from "../community";
import { t } from "../i18n";

const filters = ["Todos", "Virtual", "Presencial", "Mis eventos"];

export function Eventos() {
  const ec = useEventCounts();
  const [f, setF] = useState("Todos");
  const [reg, toggle] = useRegistered();
  const list = events.filter((e) => f === "Todos" || (f === "Mis eventos" ? reg.has(e.id) : e.mode === f));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <Link to="/comunidad" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <Icon name="arrow-left" size={14} /> {t("Comunidad")}
      </Link>
      <Reveal className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">{t("Próximos eventos")}</h1>
        <p className="text-muted">{t("Talleres, charlas y sesiones de estudio. Inscrito en {n}.", { n: reg.size })}</p>
      </Reveal>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((c) => (
          <button
            key={c}
            onClick={() => setF(c)}
            className={`press rounded-full border px-4 py-2 text-sm font-semibold transition-all ${f === c ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft hover:text-brand"}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="rounded-[20px] border border-dashed border-line bg-surface p-10 text-center text-muted">{t("Aún no te has inscrito a ningún evento.")}</p>}

      <div className="space-y-4">
        {list.map((e, i) => {
          const on = reg.has(e.id);
          const g = groups.find((x) => x.id === e.group);
          return (
            <Reveal key={e.id} delay={i * 40} className="lift flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-(--shadow-card) sm:flex-row">
              <div className="relative h-40 bg-brand-navy sm:h-auto sm:w-60 sm:shrink-0">
                <img src={e.image} alt="" onError={(ev) => (ev.currentTarget.style.display = "none")} className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3 grid h-16 w-14 place-content-center rounded-xl bg-surface text-center text-brand shadow-md">
                  <span className="text-[10px] font-semibold uppercase">{t(e.dow)}</span>
                  <span className="font-display text-xl font-semibold leading-none">{e.day}</span>
                  <span className="text-[10px]">{t(e.month)}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">{t(e.category)}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">{t(e.title)}</h3>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="clock" size={11} /> {e.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name={e.mode === "Virtual" ? "camera-video" : "geo-alt"} size={11} /> {t(e.mode)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="people" size={11} /> {t("{n} cupos", { n: Math.max(0, e.spots - (ec[e.id] ?? 0)) })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {t("Organiza:")} <span className="font-semibold text-ink-soft">{t(e.host)}</span>
                    {g && (
                      <>
                        {" · "}
                        <Link to={`/comunidad/grupo/${g.id}`} className="font-semibold text-brand hover:underline">
                          {t(g.name)}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const now = toggle(e.id);
                    if (now) sileo.success({ title: t("¡Inscrito!"), description: `${t(e.title)} · ${t(e.dow)} ${e.day} ${t(e.month)}` });
                    else sileo.info({ title: t("Inscripción cancelada") });
                  }}
                  className={`press inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    on ? "bg-mint/15 text-mint" : "bg-brand text-white hover:bg-brand-deep"
                  }`}
                >
                  {on ? (
                    <>
                      <Icon name="check-lg" size={14} /> {t("Inscrito")}
                    </>
                  ) : (
                    <>
                      <Icon name="calendar-plus" size={14} /> {t("Inscribirme")}
                    </>
                  )}
                </button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
