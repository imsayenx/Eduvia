import logoIcon from "../assets/logo-icon.png";

/**
 * Logo de Eduvia: ícono (birrete + libro) + nombre.
 * Sobre fondos oscuros (`light`, barra lateral, pie, modo oscuro) el ícono va
 * sobre una placa blanca para que el azul no se pierda.
 */
export function Logo({
  light = false,
  size = 34,
  showText = true,
  tagline,
}: {
  light?: boolean;
  size?: number;
  showText?: boolean;
  tagline?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        data-on-dark={light || undefined}
        className="logo-tile relative grid shrink-0 place-items-center rounded-[28%] transition-[background-color,box-shadow] duration-300"
        style={{ width: size, height: size }}
      >
        <img src={logoIcon} alt="" draggable={false} className="logo-img h-full w-full select-none object-contain" />
      </span>
      {showText && (
        <span className="leading-none">
          <span
            className={`block font-display text-[22px] font-bold tracking-[-0.03em] ${
              light ? "text-white" : "text-[#1e3a8a] dark:text-ink"
            }`}
          >
            Eduvia
          </span>
          {tagline && <span className={`mt-1 block text-[11px] ${light ? "text-white/60" : "text-muted"}`}>{tagline}</span>}
        </span>
      )}
    </span>
  );
}

/** Solo el ícono del logo, sobre una placa blanca (para fondos de color). */
export function LogoMark({ size = 40, className = "", float = false }: { size?: number; className?: string; float?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-[28%] bg-white shadow-[0_10px_24px_-10px_rgba(15,40,100,.55),inset_0_-1px_0_rgba(15,33,64,.08)] ${
        float ? "animate-float" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={logoIcon} alt="" draggable={false} className="h-[82%] w-[82%] select-none object-contain" />
    </span>
  );
}
