import { t } from "../i18n";
import { accents, setAccent, setMode, useTheme, type Accent, type ThemeMode } from "../theme";
import { Check, Monitor, Moon, Sun } from "../icons";

const modes: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "system", label: "Sistema", Icon: Monitor },
  { id: "light", label: "Claro", Icon: Sun },
  { id: "dark", label: "Oscuro", Icon: Moon },
];

/**
 * Control segmentado Sistema / Claro / Oscuro.
 * La "pastilla" se desliza a la opción elegida (como en iOS).
 */
export function ThemeSwitch({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { mode } = useTheme();
  const idx = modes.findIndex((m) => m.id === mode);
  return (
    <div
      role="radiogroup"
      aria-label={t("Tema de color")}
      className={`relative grid grid-cols-3 rounded-full bg-canvas p-1 ring-1 ring-line ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,.08),0_4px_10px_rgba(0,0,0,.08)] ring-1 ring-line transition-transform duration-500 ease-(--ease-apple)"
        style={{ width: "calc((100% - 8px) / 3)", transform: `translateX(${idx * 100}%)` }}
      />
      {modes.map(({ id, label, Icon }) => {
        const on = mode === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={on}
            title={t(label)}
            onClick={() => setMode(id)}
            className={`press relative z-10 flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold transition-colors ${
              compact ? "h-8 w-9" : "h-8 px-3"
            } ${on ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            <Icon size={14} className={on && id !== "system" ? "fill-current" : ""} />
            {!compact && <span>{t(label)}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Las pelotitas de color para elegir el acento de toda la app. */
export function AccentDots({ size = 28, className = "" }: { size?: number; className?: string }) {
  const { accent } = useTheme();
  return (
    <div role="radiogroup" aria-label={t("Color de acento")} className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {(Object.keys(accents) as Accent[]).map((k) => {
        const on = accent === k;
        return (
          <button
            key={k}
            role="radio"
            aria-checked={on}
            title={t(accents[k].label)}
            onClick={() => setAccent(k)}
            className="press relative grid place-items-center rounded-full"
            style={{
              width: size,
              height: size,
              background: accents[k].brand,
              boxShadow: on
                ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${accents[k].brand}`
                : "none",
              transition: "box-shadow .35s var(--ease-apple), transform .25s var(--ease-out-soft)",
            }}
          >
            <Check
              size={Math.round(size * 0.5)}
              className={`text-white transition-all duration-300 ${on ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
