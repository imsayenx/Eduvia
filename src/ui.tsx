import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/* Apple-style scroll reveal. Wrap any block; it fades/slides in once in view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: any;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* Count-up number, triggered when scrolled into view. */
export function CountUp({
  to,
  suffix = "",
  duration = 1200,
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setVal(to);
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(to * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* Animated donut progress ring. */
export function ProgressRing({
  value,
  size = 132,
  stroke = 12,
  label,
  sub,
  track = "var(--color-line)",
  color = "var(--color-mint)",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  track?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (shown / 100) * c;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShown(value);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.4s var(--ease-out-soft)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold text-ink">
          {label ?? (
            <>
              <CountUp to={value} suffix="%" />
            </>
          )}
        </div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
    </div>
  );
}

/* Animated horizontal progress bar that fills on view. */
export function Bar({ value, color = "bg-brand", className = "" }: { value: number; color?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setW(value);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref} className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${w}%`, transition: "width 1.3s var(--ease-out-soft)" }}
      />
    </div>
  );
}

/* "Pelotita" de color con ícono: plana, sin brillos.
   variant="solid": fondo de color e ícono blanco · variant="soft": fondo suave e ícono de color */
export function IconBall({
  icon,
  color,
  size = 44,
  iconSize,
  className = "",
  rounded = "rounded-full",
  variant = "solid",
}: {
  icon: string;
  color: string;
  size?: number;
  iconSize?: number;
  className?: string;
  rounded?: string;
  variant?: "solid" | "soft";
}) {
  const soft = variant === "soft";
  return (
    <span
      className={`relative grid shrink-0 place-items-center ${rounded} ${className}`}
      style={{
        width: size,
        height: size,
        background: soft ? `color-mix(in oklab, ${color} 14%, var(--color-surface))` : color,
        color: soft ? color : "#fff",
      }}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.46)} />
    </span>
  );
}

/* Encabezado de tarjeta: ícono + título + enlace opcional. */
export function CardTitle({ icon, color = "var(--color-brand)", children }: { icon: string; color?: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 font-display text-[17px] font-semibold text-ink">
      <Icon name={icon} size={19} style={{ color }} />
      {children}
    </span>
  );
}

/* Portada de curso: foto encima de un degradado con el ícono del curso.
   Si la foto no carga, queda el degradado (nunca una imagen rota). */
export function CourseCover({
  course,
  className = "",
  children,
  zoom = true,
}: {
  course: { image: string; color: string; icon: string; title: string };
  className?: string;
  children?: ReactNode;
  zoom?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${course.color} ${className}`}>
      <Icon name={course.icon} size={44} className="absolute inset-0 m-auto text-white/25" />
      {!failed && (
        <img
          src={course.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover ${
            zoom ? "transition-transform duration-700 ease-(--ease-out-soft) group-hover:scale-105" : ""
          }`}
        />
      )}
      {children}
    </div>
  );
}
