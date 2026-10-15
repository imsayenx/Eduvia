import { sileo } from "sileo";
import { Icon } from "../icons";
import { useFavorites } from "../community";
import { t } from "../i18n";

/**
 * Botón de corazón para marcar un curso como favorito.
 * Funciona aunque esté dentro de un enlace (no abre el curso al tocarlo).
 * · variant "float": círculo blanco sobre la portada de las tarjetas
 * · variant "light": para fondos oscuros (encabezado del curso)
 */
export function FavButton({ courseId, title, variant = "float", className = "" }: { courseId: string; title?: string; variant?: "float" | "light"; className?: string }) {
  const [favs, toggle] = useFavorites();
  const on = favs.has(courseId);

  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = toggle(courseId);
    sileo.success({
      title: t(now ? "Agregado a favoritos" : "Quitado de favoritos"),
      description: title ? t(title) : undefined,
    });
  };

  const styles =
    variant === "light"
      ? `h-10 w-10 bg-white/15 ring-1 ring-white/25 hover:bg-white/25 ${on ? "text-rose-300" : "text-white"}`
      : `h-8 w-8 bg-surface/90 shadow-sm backdrop-blur hover:scale-110 ${on ? "text-rose-500" : "text-ink-soft hover:text-rose-500"}`;

  return (
    <button
      type="button"
      onClick={click}
      aria-pressed={on}
      aria-label={t(on ? "Quitar de favoritos" : "Agregar a favoritos")}
      title={t(on ? "Quitar de favoritos" : "Agregar a favoritos")}
      className={`press grid shrink-0 place-items-center rounded-full transition-all ${styles} ${className}`}
    >
      <Icon name={on ? "heart-fill" : "heart"} size={variant === "light" ? 17 : 14} />
    </button>
  );
}
