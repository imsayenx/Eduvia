import { Link } from "react-router";
import { Icon } from "../icons";
import { Logo } from "./Logo";
import { t } from "../i18n";

const socials = [
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["twitter-x", "X"],
  ["facebook", "Facebook"],
] as const;

export function Footer() {
  return (
    <footer className="relative mt-12 overflow-hidden bg-brand-navy text-white">
      <div className="relative mx-auto flex max-w-370 flex-col gap-8 px-6 py-9 xl:flex-row xl:items-center xl:justify-between">
        <Logo light size={40} tagline={t("Aprende hoy, construye mañana.")} />

        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/70">
          {[
            ["Inicio", "/"],
            ["Cursos", "/cursos"],
            ["Recursos", "/recursos"],
            ["Mis avances", "/mis-avances"],
            ["Comunidad", "/comunidad"],
          ].map(([l, to]) => (
            <Link key={l} to={to} className="transition-colors hover:text-white">
              {t(l)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {socials.map(([name, label]) => (
            <a
              key={name}
              href="#"
              aria-label={label}
              className="press grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/10 hover:bg-white/20 hover:text-white"
            >
              <Icon name={name} size={16} />
            </a>
          ))}
        </div>

        <div className="flex items-start gap-3 border-t border-white/10 pt-6 xl:max-w-xs xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <Icon name="quote" size={22} className="text-brand" />
          <p className="text-sm italic leading-relaxed text-white/70">
            {t("La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo.")}
          </p>
        </div>
      </div>
      <div className="relative border-t border-white/10 px-6 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Eduvia · Plataforma educativa
      </div>
    </footer>
  );
}
