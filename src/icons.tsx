import type { CSSProperties } from "react";

/**
 * Capa de íconos sobre Bootstrap Icons (npm i bootstrap-icons).
 *
 * Cada ícono es un componente que acepta `size` y `className`, igual que antes,
 * así las páginas no tuvieron que cambiar su forma de usarlos.
 * Si en `className` aparece una clase `fill-*`, se usa la variante rellena
 * del ícono (por ejemplo star → star-fill).
 *
 * También puedes usar cualquier ícono del catálogo directamente:
 *   <Icon name="rocket-takeoff" size={20} />
 * Catálogo: https://icons.getbootstrap.com
 */

export type IconProps = {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export function Icon({ name, size = 18, className = "", style, title }: IconProps & { name: string }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <i
      className={`bi bi-${name} ico ${className}`}
      style={{ fontSize: px, width: px, height: px, ...style }}
      aria-hidden={title ? undefined : true}
      title={title}
      role={title ? "img" : undefined}
    />
  );
}

export type LucideIcon = (p: IconProps) => React.JSX.Element;

const mk = (name: string, filled?: string): LucideIcon => {
  const C = ({ className = "", ...p }: IconProps) => {
    const wantsFill = filled && /(^|\s)fill-/.test(className);
    return <Icon name={wantsFill ? filled! : name} className={className} {...p} />;
  };
  C.displayName = `Icon(${name})`;
  return C;
};

/* --- Navegación y estructura --- */
export const Home = mk("house", "house-fill");
export const Search = mk("search");
export const Bell = mk("bell", "bell-fill");
export const BellOff = mk("bell-slash");
export const ChevronDown = mk("chevron-down");
export const ChevronRight = mk("chevron-right");
export const ChevronLeft = mk("chevron-left");
export const ArrowRight = mk("arrow-right");
export const ArrowLeft = mk("arrow-left");
export const X = mk("x-lg");
export const Menu = mk("list");
export const SidebarIcon = mk("layout-sidebar-inset");
export const MoreHorizontal = mk("three-dots");
export const LogOut = mk("box-arrow-right");
export const Settings = mk("gear", "gear-fill");
export const SlidersHorizontal = mk("sliders");

/* --- Personas / cuenta --- */
export const User = mk("person", "person-fill");
export const Users = mk("people", "people-fill");
export const Mail = mk("envelope");
export const Lock = mk("lock", "lock-fill");
export const KeyRound = mk("key");
export const Eye = mk("eye");
export const EyeOff = mk("eye-slash");
export const Shield = mk("shield-check");
export const Smartphone = mk("phone");
export const Camera = mk("camera", "camera-fill");
export const MapPin = mk("geo-alt", "geo-alt-fill");
export const Pencil = mk("pencil");
export const BadgeCheck = mk("patch-check", "patch-check-fill");

/* --- Educación --- */
export const GraduationCap = mk("mortarboard", "mortarboard-fill");
export const BookOpen = mk("book", "book-fill");
export const BookOpenCheck = mk("journal-check");
export const BookMarked = mk("journal-bookmark");
export const Library = mk("bookshelf");
export const Building2 = mk("building");
export const Lightbulb = mk("lightbulb", "lightbulb-fill");
export const Calculator = mk("calculator");
export const FlaskConical = mk("flask");
export const Brain = mk("cpu");
export const Code2 = mk("code-slash");
export const Globe = mk("globe2");
export const Palette = mk("palette", "palette-fill");
export const Music = mk("music-note-beamed");
export const PenTool = mk("pen");
export const Presentation = mk("easel");

/* --- Multimedia --- */
export const Video = mk("camera-video", "camera-video-fill");
export const Play = mk("play", "play-fill");
export const Pause = mk("pause", "pause-fill");
export const PlayCircle = mk("play-circle", "play-circle-fill");
export const SkipForward = mk("skip-forward", "skip-forward-fill");
export const Volume2 = mk("volume-up");
export const Maximize = mk("arrows-fullscreen");
export const Headphones = mk("headphones");
export const Image = mk("image");
export const Gamepad2 = mk("controller");
export const MousePointerClick = mk("hand-index-thumb");

/* --- Archivos --- */
export const FileText = mk("file-earmark-text", "file-earmark-text-fill");
export const File = mk("file-earmark-zip");
export const Download = mk("download");
export const Link2 = mk("link-45deg");
export const Database = mk("database");
export const Trash2 = mk("trash3");

/* --- Progreso / logros --- */
export const Star = mk("star", "star-fill");
export const Bookmark = mk("bookmark", "bookmark-fill");
export const Flame = mk("fire");
export const Trophy = mk("trophy", "trophy-fill");
export const Award = mk("award", "award-fill");
export const Crown = mk("gem");
export const Compass = mk("compass", "compass-fill");
export const Target = mk("bullseye");
export const TrendingUp = mk("graph-up-arrow");
export const BarChart3 = mk("bar-chart-line", "bar-chart-line-fill");
export const CheckSquare = mk("check2-square");
export const ClipboardCheck = mk("clipboard-check", "clipboard-check-fill");
export const CheckCircle2 = mk("check-circle-fill");
export const Circle = mk("circle");
export const Check = mk("check-lg");

/* --- Tiempo --- */
export const Clock = mk("clock", "clock-fill");
export const Calendar = mk("calendar3");
export const CalendarPlus = mk("calendar-plus");

/* --- Social --- */
export const ThumbsUp = mk("hand-thumbs-up", "hand-thumbs-up-fill");
export const MessageCircle = mk("chat", "chat-fill");
export const Share2 = mk("share", "share-fill");
export const Send = mk("send", "send-fill");
export const Heart = mk("heart", "heart-fill");
export const Pin = mk("pin-angle", "pin-angle-fill");

/* --- Apariencia / accesibilidad --- */
export const Monitor = mk("display");
export const Sun = mk("sun", "sun-fill");
export const Moon = mk("moon-stars", "moon-stars-fill");
export const Accessibility = mk("universal-access");
