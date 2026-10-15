import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Icon } from "../icons";
import { courses } from "../data";
import { groups } from "../community";
import { percent } from "../progress";
import { IconBall } from "../ui";
import { t } from "../i18n";

type Result = {
  kind: "Cursos" | "Lecciones" | "Grupos" | "Páginas";
  title: string;
  sub: string;
  to: string;
  icon: string;
  color: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const pages: Result[] = [
  { kind: "Páginas", title: "Inicio", sub: "Tu panel principal", to: "/", icon: "house-fill", color: "#2f6fe4" },
  { kind: "Páginas", title: "Cursos", sub: "Todo el catálogo", to: "/cursos", icon: "mortarboard-fill", color: "#1f6fef" },
  { kind: "Páginas", title: "Recursos", sub: "Guías, videos y plantillas", to: "/recursos", icon: "folder-fill", color: "#e09a1e" },
  { kind: "Páginas", title: "Mis avances", sub: "Tu progreso y logros", to: "/mis-avances", icon: "bar-chart-line-fill", color: "#259b6a" },
  { kind: "Páginas", title: "Comunidad", sub: "Foros, grupos y eventos", to: "/comunidad", icon: "people-fill", color: "#7562d0" },
  { kind: "Páginas", title: "Eventos", sub: "Talleres y charlas", to: "/comunidad/eventos", icon: "calendar-event-fill", color: "#de5a4c" },
  { kind: "Páginas", title: "Perfil", sub: "Tu información", to: "/perfil", icon: "person-fill", color: "#66758c" },
  { kind: "Páginas", title: "Ajustes", sub: "Tema, colores y cuenta", to: "/ajustes", icon: "gear-fill", color: "#66758c" },
];

function search(q: string): Result[] {
  const n = norm(q.trim());
  if (!n) return [];
  const words = n.split(/\s+/);
  const hit = (s: string) => {
    const t = norm(s);
    return words.every((w) => t.includes(w));
  };

  const c: Result[] = courses
    .filter((x) => hit(`${t(x.title)} ${x.title} ${t(x.subject)} ${t(x.level)}`))
    .map((x) => ({
      kind: "Cursos",
      title: t(x.title),
      sub: `${t(x.subject)} · ${t(x.level)}${percent(x) ? ` · ${percent(x)}%` : ""}`,
      to: `/curso/${x.id}`,
      icon: x.icon,
      color: x.accent,
    }));

  const l: Result[] = courses
    .flatMap((x) =>
      x.units.flatMap((u, ui) =>
        u.lessons
          .filter((le) => hit(`${t(le.title)} ${le.title}`))
          .map((le) => ({
            kind: "Lecciones" as const,
            title: t(le.title),
            sub: `${t(x.title)} · ${t("Unidad {n}", { n: ui + 1 })}`,
            to: `/curso/${x.id}`,
            icon: "play-circle-fill",
            color: x.accent,
          })),
      ),
    )
    .slice(0, 4);

  const g: Result[] = groups
    .filter((x) => hit(`${t(x.name)} ${x.name} ${t(x.desc)} ${t(x.category)}`))
    .map((x) => ({ kind: "Grupos", title: t(x.name), sub: t(x.desc), to: `/comunidad/grupo/${x.id}`, icon: "people-fill", color: "#7562d0" }));

  const p = pages.filter((x) => hit(`${t(x.title)} ${x.title} ${t(x.sub)}`)).map((x) => ({ ...x, title: t(x.title), sub: t(x.sub) }));
  return [...c.slice(0, 5), ...l, ...g.slice(0, 3), ...p.slice(0, 3)];
}

/** Búsqueda estilo Spotlight: sugiere cursos, lecciones, grupos y páginas mientras escribes. */
export function SearchBox({ autoFocus = false, onDone, className = "" }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(q), [q]);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  const suggestions = useMemo(
    () =>
      courses
        .filter((c) => percent(c) > 0 && percent(c) < 100)
        .slice(0, 3)
        .map<Result>((c) => ({ kind: "Cursos", title: t(c.title), sub: `${t("Continuar")} · ${percent(c)}%`, to: `/curso/${c.id}`, icon: c.icon, color: c.accent })),
    [open], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const list = q.trim() ? results : suggestions;

  // Ctrl + K / ⌘ + K abre la búsqueda desde cualquier lugar
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, []);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const pick = (r?: Result) => {
    if (r) nav(r.to);
    else if (q.trim()) nav(`/cursos?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
    setQ("");
    input.current?.blur();
    onDone?.();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, list.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(list[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    }
  };

  let lastKind = "";
  const showPanel = open && (list.length > 0 || q.trim().length > 0);

  return (
    <div ref={box} className={`relative ${className}`}>
      <div
        className={`group flex h-11 items-center gap-2.5 rounded-full px-4 text-muted transition-[background-color,box-shadow] duration-300 ${
          open ? "bg-surface shadow-[0_0_0_1px_var(--color-line),0_10px_30px_-12px_rgba(15,33,64,.25)]" : "bg-canvas shadow-[0_0_0_1px_var(--color-line)]"
        }`}
      >
        <Icon name="search" size={16} className={`transition-colors ${open ? "text-brand" : ""}`} />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          aria-label={t("Buscar")}
          autoComplete="off"
          spellCheck={false}
          className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted"
          placeholder={t("Buscar cursos, lecciones o grupos…")}
        />
        {q ? (
          <button
            onClick={() => {
              setQ("");
              input.current?.focus();
            }}
            className="press grid h-6 w-6 place-items-center rounded-full bg-line/70 text-muted hover:text-ink"
            aria-label={t("Borrar búsqueda")}
          >
            <Icon name="x" size={14} />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md bg-surface px-1.5 py-0.5 font-sans text-[11px] text-muted shadow-[0_0_0_1px_var(--color-line)] lg:block">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        )}
      </div>

      <div
        id="search-results"
        role="listbox"
        data-open={showPanel}
        className="popover absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-(--shadow-pop)"
        style={{ ["--origin" as string]: "top center" }}
      >
        {!q.trim() && list.length > 0 && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("Continuar aprendiendo")}</p>}
        {list.map((r, i) => {
          const header = q.trim() && r.kind !== lastKind;
          lastKind = r.kind;
          return (
            <div key={r.kind + r.title + i}>
              {header && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{t(r.kind)}</p>}
              <button
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${active === i ? "bg-brand/10" : ""}`}
              >
                <IconBall icon={r.icon} color={r.color} size={34} rounded="rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    <Highlight text={r.title} q={q} />
                  </span>
                  <span className="block truncate text-xs text-muted">{r.sub}</span>
                </span>
                {active === i && <Icon name="arrow-return-left" size={13} className="text-brand" />}
              </button>
            </div>
          );
        })}
        {q.trim() && (
          <button
            role="option"
            aria-selected={active === list.length}
            onMouseEnter={() => setActive(list.length)}
            onClick={() => pick()}
            className={`mt-1 flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors ${
              active === list.length ? "bg-brand/10" : ""
            } ${list.length ? "border-t border-line" : ""}`}
          >
            <span className="grid h-[34px] w-[34px] place-items-center rounded-lg bg-canvas text-muted">
              <Icon name="search" size={14} />
            </span>
            <span className="flex-1 text-ink-soft">
              {t(list.length ? "Ver todos los resultados para" : "Sin coincidencias exactas. Buscar")} <b className="text-ink">“{q.trim()}”</b>{" "}
              {t("en cursos")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const n = norm(q.trim());
  if (!n) return <>{text}</>;
  const i = norm(text).indexOf(n.split(/\s+/)[0]);
  if (i < 0) return <>{text}</>;
  const len = n.split(/\s+/)[0].length;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-brand/15 text-brand">{text.slice(i, i + len)}</mark>
      {text.slice(i + len)}
    </>
  );
}
