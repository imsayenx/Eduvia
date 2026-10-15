import { Link } from "react-router";
import { Icon } from "../icons";
import { IconBall } from "../ui";
import { ago } from "../profile";
import { t } from "../i18n";
import type { Badge, Recent } from "../lib/stats";
import { useCourseStats } from "../community";

/** Lista de actividad real; si no hay nada, invita a empezar. */
export function RecentList({ items, limit = 4, size = 36 }: { items: Recent[]; limit?: number; size?: number }) {
  if (!items.length)
    return (
      <div className="rounded-2xl border border-dashed border-line p-5 text-center">
        <Icon name="stars" size={22} className="text-brand" />
        <p className="mt-2 text-sm font-semibold text-ink">{t("Aún no hay actividad")}</p>
        <p className="text-xs text-muted">{t("Completa tu primera lección y aquí verás tus avances.")}</p>
        <Link to="/cursos" className="press mt-3 inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
          {t("Explorar cursos")} <Icon name="arrow-right" size={11} />
        </Link>
      </div>
    );
  return (
    <div className="space-y-3.5">
      {items.slice(0, limit).map((r) => (
        <Link key={`${r.at}-${r.title}`} to={r.to} className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-canvas">
          <IconBall icon={r.icon} color={r.color} size={size} />
          <div className="min-w-0 flex-1 leading-snug">
            <p className="text-[13.5px] font-semibold text-ink">{r.title}</p>
            <p className="truncate text-xs text-ink-soft">{r.sub}</p>
            <p className="text-[11px] text-muted">{ago(r.at)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Insignias: a color las ganadas, en gris (con barra de avance) las pendientes. */
export function BadgeGrid({ badges, size = 52, className = "grid-cols-3 sm:grid-cols-6" }: { badges: Badge[]; size?: number; className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {badges.map((b) => (
        <div key={b.id} className="text-center" title={t(b.desc)}>
          <div className={`relative mx-auto w-fit transition ${b.earned ? "" : "opacity-40 grayscale"}`}>
            <IconBall icon={b.icon} color={b.color} size={size} />
            {!b.earned && (
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-muted ring-1 ring-line">
                <Icon name="lock-fill" size={9} />
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-ink">{t(b.title)}</p>
          <p className="text-[11px] leading-tight text-muted">{t(b.desc)}</p>
          {!b.earned && b.progress > 0 && (
            <div className="mx-auto mt-1.5 h-1 w-12 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full" style={{ width: `${b.progress * 100}%`, background: b.color }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Valoración real del curso; si nadie lo ha calificado, dice «Nuevo». */
export function Rating({ courseId, light = false }: { courseId: string; light?: boolean }) {
  const s = useCourseStats()[courseId];
  if (!s || !s.total)
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${light ? "bg-white/15 text-white" : "bg-brand/10 text-brand"}`}>
        <Icon name="stars" size={10} /> {t("Nuevo")}
      </span>
    );
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${light ? "text-white" : "text-ink"}`}>
      <Icon name="star-fill" size={11} className="text-amber-400" /> {s.average.toFixed(1)}
      <span className={`font-normal ${light ? "text-white/70" : "text-muted"}`}>({s.total})</span>
    </span>
  );
}
