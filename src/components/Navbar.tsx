import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Icon } from "../icons";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { logout } from "../auth";
import { useIsAdmin } from "../lib/content";
import { useNotifications } from "../lib/notifications";
import { cloud } from "../lib/supabase";
import { t } from "../i18n";
import { ago, firstName, fullName, useProfile, DEFAULT_AVATAR } from "../profile";

export const AVATAR = DEFAULT_AVATAR;

export const navLinks = [
  { to: "/", label: "Inicio", icon: "house", match: (p: string) => p === "/" },
  { to: "/cursos", label: "Cursos", icon: "mortarboard", match: (p: string) => p.startsWith("/curso") },
  { to: "/recursos", label: "Recursos", icon: "folder", match: (p: string) => p.startsWith("/recursos") },
  { to: "/mis-avances", label: "Mis avances", icon: "bar-chart-line", match: (p: string) => p.startsWith("/mis-avances") },
  { to: "/comunidad", label: "Comunidad", icon: "people", match: (p: string) => p.startsWith("/comunidad") },
];

/** Barra superior: logo, menú, búsqueda, notificaciones y perfil. */
export function Navbar({ onMenu }: { onMenu: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<null | "bell" | "user">(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const notif = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wrap = useRef<HTMLDivElement>(null);
  const profile = useProfile();
  const admin = useIsAdmin(); // con Supabase: solo cuentas en la tabla «admins»

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobileSearch(false));
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileSearch(false);
  }, [pathname]);

  const toggle = (k: "bell" | "user") => setOpen((o) => (o === k ? null : k));

  return (
    <header
      className={`glass sticky top-0 z-40 transition-[box-shadow] duration-300 ${
        scrolled ? "shadow-[0_1px_0_var(--color-line),0_6px_20px_-12px_rgba(15,31,61,.18)]" : "shadow-[0_1px_0_var(--color-line)]"
      }`}
    >
      <div ref={wrap} className="mx-auto flex h-[68px] max-w-370 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          onClick={onMenu}
          className="press grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-canvas lg:hidden"
          aria-label={t("Abrir menú")}
        >
          <Icon name="list" size={22} />
        </button>
        <Link to="/" className="press shrink-0 rounded-xl" aria-label="Eduvia">
          <Logo size={38} />
        </Link>

        <NavLinks pathname={pathname} />

        <SearchBox className="ml-auto hidden w-full max-w-[380px] md:block" />

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 md:ml-0">
          <button
            onClick={() => setMobileSearch((v) => !v)}
            className="press grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas md:hidden"
            aria-label={t("Buscar")}
          >
            <Icon name={mobileSearch ? "x-lg" : "search"} size={mobileSearch ? 17 : 18} />
          </button>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => toggle("bell")}
              aria-expanded={open === "bell"}
              aria-label={t("Notificaciones")}
              className={`press relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-canvas ${open === "bell" ? "bg-canvas text-ink" : ""}`}
            >
              <Icon name={open === "bell" ? "bell-fill" : "bell"} size={19} />
              {notif.unread > 0 && <span className="absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full border-2 border-surface bg-rose-500" />}
            </button>
            <Popover open={open === "bell"} className="w-[340px] max-w-[calc(100vw-24px)]">
              <div className="flex items-center justify-between px-3 pb-1 pt-2">
                <p className="font-display text-[15px] font-semibold text-ink">{t("Notificaciones")}</p>
                {notif.unread > 0 && (
                  <button onClick={notif.markAll} className="text-xs font-semibold text-brand hover:underline">
                    {t("Marcar todo como leído")}
                  </button>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {notif.list.map((n) => {
                  const isNew = n.at > notif.seen || (n.id === "welcome" && notif.seen === 0);
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        notif.markAll();
                        setOpen(null);
                        navigate(n.to);
                      }}
                      className="flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-canvas"
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white ${isNew ? "" : "opacity-50"}`} style={{ background: n.color }}>
                        <Icon name={n.icon} size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${isNew ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>{n.title}</span>
                        <span className="line-clamp-2 block text-xs text-muted">{n.sub}</span>
                      </span>
                      {n.at > 0 && <span className="shrink-0 text-[11px] text-muted">{ago(n.at)}</span>}
                    </button>
                  );
                })}
              </div>
            </Popover>
          </div>

          {/* Perfil */}
          <div className="relative">
            <button
              onClick={() => toggle("user")}
              aria-expanded={open === "user"}
              className={`press flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-canvas ${open === "user" ? "bg-canvas" : ""}`}
            >
              <Avatar src={profile.avatar} size={38} />
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-sm font-semibold text-ink">{t("Hola, {name}", { name: firstName(profile) })}</span>
                <span className="block text-xs text-muted">{t("Estudiante")}</span>
              </span>
              <Icon name="chevron-down" size={12} className={`hidden text-muted transition-transform duration-300 sm:grid ${open === "user" ? "rotate-180" : ""}`} />
            </button>
            <Popover open={open === "user"} className="w-64">
              <div className="flex items-center gap-3 px-3 pb-3 pt-2">
                <Avatar src={profile.avatar} size={44} />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-ink">{fullName(profile)}</p>
                  <p className="truncate text-xs text-muted">{profile.email}</p>
                </div>
              </div>
              <div className="h-px bg-line" />
              <div className="py-1">
                <MenuItem to="/perfil" icon="person" label={t("Mi perfil")} />
                <MenuItem to="/mis-avances" icon="bar-chart-line" label={t("Mis avances")} />
                <MenuItem to="/ajustes" icon="gear" label={t("Ajustes")} />
                {admin && <MenuItem to="/contenido" icon="cloud-arrow-up" label={t("Administrar contenido")} />}
              </div>
              <div className="h-px bg-line" />
              <div className="pt-1">
                <MenuItem to="/login" icon="box-arrow-right" label={t("Cerrar sesión")} onClick={logout} danger />
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {mobileSearch && (
        <div className="animate-fade-in px-4 pb-3 md:hidden">
          <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}

/** Enlaces del menú con un subrayado que se desliza al activo. */
function NavLinks({ pathname }: { pathname: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);
  const active = navLinks.find((l) => l.match(pathname))?.to;

  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const measure = () => {
      const el = nav.querySelector<HTMLElement>(`[data-to="${active}"]`);
      if (!el) return setBar(null);
      setBar({ x: el.offsetLeft + 12, w: el.offsetWidth - 24 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [active]);

  return (
    <nav ref={ref} className="relative ml-6 hidden h-full items-center gap-1 lg:flex">
      {navLinks.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          data-to={l.to}
          aria-current={active === l.to ? "page" : undefined}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-[14.5px] font-medium transition-colors ${active === l.to ? "text-ink" : "text-ink-soft hover:text-ink"}`}
        >
          {t(l.label)}
        </Link>
      ))}
      {bar && (
        <span
          aria-hidden
          className="absolute bottom-3 h-[2.5px] rounded-full bg-brand transition-[transform,width] duration-500 ease-(--ease-apple)"
          style={{ transform: `translateX(${bar.x}px)`, width: bar.w, left: 0 }}
        />
      )}
    </nav>
  );
}

export function Avatar({ src, size = 40, className = "" }: { src: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed || !src ? (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand/10 text-brand ${className}`} style={{ width: size, height: size }}>
      <Icon name="person-fill" size={size * 0.5} />
    </span>
  ) : (
    <img src={src} alt="" onError={() => setFailed(true)} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  );
}

function Popover({ open, children, className = "" }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      data-open={open}
      role="menu"
      className={`popover absolute right-0 top-[calc(100%+10px)] rounded-2xl border border-line bg-surface p-1.5 shadow-(--shadow-pop) ${className}`}
    >
      {children}
    </div>
  );
}

function MenuItem({ to, icon, label, onClick, danger }: { to: string; icon: string; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        danger ? "text-rose-600 hover:bg-rose-50" : "text-ink-soft hover:bg-canvas hover:text-ink"
      }`}
    >
      <Icon name={icon} size={16} />
      {label}
    </Link>
  );
}
