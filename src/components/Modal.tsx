import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../icons";
import { t } from "../i18n";

const stack: number[] = [];
let seq = 0;

/** Ventana modal: oscurece el fondo, se cierra con Escape o tocando fuera. */
export function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const id = ++seq;
    stack.push(id);
    // Escape cierra solo la ventana de más arriba
    const k = (e: KeyboardEvent) => e.key === "Escape" && stack[stack.length - 1] === id && onClose();
    document.addEventListener("keydown", k);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => panel.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", k);
      stack.splice(stack.indexOf(id), 1);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade-in absolute inset-0 bg-[#07122a]/50" onClick={onClose} />
      <div
        ref={panel}
        className="animate-pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-(--shadow-pop) sm:rounded-3xl"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          {icon && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={icon} size={17} />
            </span>
          )}
          <h2 className="flex-1 font-display text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label={t("Cerrar")} className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
            <Icon name="x-lg" size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export const btn = {
  primary: "press inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep disabled:pointer-events-none disabled:opacity-40",
  ghost: "press inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas",
  danger: "press inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700",
};

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  hint,
  multiline,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  autoComplete?: string;
}) {
  const cls = `w-full rounded-xl border bg-surface-2 px-3.5 py-2.5 text-sm text-ink transition-[border-color,box-shadow] placeholder:text-muted focus:bg-surface focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-brand)_14%,transparent)] ${
    error ? "border-rose-500" : "border-line focus:border-brand/60"
  }`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={cls} />
      )}
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
