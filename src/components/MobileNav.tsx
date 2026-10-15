import { Link, useLocation } from "react-router";
import { Icon } from "../icons";
import { Logo } from "./Logo";
import { navLinks, Avatar } from "./Navbar";
import { useIsAdmin } from "../lib/content";
import { t } from "../i18n";
import { firstName, useProfile } from "../profile";

/** Menú lateral para celular y tablet (se cierra deslizando a la izquierda). */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const admin = useIsAdmin();
  const { pathname } = useLocation();
  const p = useProfile();
  const extra = [
    { to: "/perfil", label: "Mi perfil", icon: "person" },
    { to: "/ajustes", label: "Ajustes", icon: "gear" },
  ];
  const item = (to: string, label: string, icon: string, on: boolean) => (
    <Link
      key={to}
      to={to}
      onClick={onNavigate}
      className={`press flex h-12 items-center gap-3.5 rounded-xl px-4 text-[15px] font-medium ${on ? "bg-brand text-white" : "text-ink-soft hover:bg-canvas"}`}
    >
      <Icon name={on ? `${icon}-fill` : icon} size={18} /> {t(label)}
    </Link>
  );
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
        <Logo size={36} />
        <button onClick={onNavigate} aria-label={t("Cerrar menú")} className="press grid h-9 w-9 place-items-center rounded-full hover:bg-canvas">
          <Icon name="x-lg" size={16} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navLinks.map((l) => item(l.to, l.label, l.icon, l.match(pathname)))}
        <div className="my-3 h-px bg-line" />
        {extra.map((l) => item(l.to, l.label, l.icon, pathname.startsWith(l.to)))}
        {admin && item("/contenido", "Administrar contenido", "cloud-arrow-up", pathname.startsWith("/contenido"))}
      </nav>
      <Link to="/perfil" onClick={onNavigate} className="m-3 flex items-center gap-3 rounded-2xl bg-canvas p-3">
        <Avatar src={p.avatar} size={40} />
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-ink">{t("Hola, {name}", { name: firstName(p) })}</span>
          <span className="text-xs text-muted">{t("Estudiante")}</span>
        </span>
      </Link>
    </div>
  );
}
