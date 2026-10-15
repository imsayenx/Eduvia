import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { useSession } from "../auth";
import { LogoMark } from "./Logo";
import { t } from "../i18n";


export function Layout() {
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setDrawer(false);
  }, [pathname]);

  const { status } = useSession();
  if (status === "loading")
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="flex flex-col items-center gap-4 text-sm text-muted">
          <span className="animate-pulse">
            <LogoMark size={52} />
          </span>
          {t("Cargando tu espacio…")}
        </div>
      </div>
    );
  if (status !== "in") return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onMenu={() => setDrawer(true)} />
      <main key={pathname} className="animate-page flex-1">
        <Outlet />
      </main>
      <Footer />
      <Drawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Menú móvil: se arrastra 1:1 con el dedo y se cierra según la velocidad
   del gesto (proyección de impulso), igual que las hojas de iOS.
--------------------------------------------------------------------------- */
const WIDTH = 288;
const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d);
const rubber = (o: number, dim: number, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const g = useRef({ startX: 0, startY: 0, base: 0, locked: false, hist: [] as { x: number; t: number }[] });

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    g.current = { startX: e.clientX, startY: e.clientY, base: 0, locked: false, hist: [{ x: e.clientX, t: e.timeStamp }] };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s.hist.length) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // pequeña histéresis
      if (Math.abs(dy) > Math.abs(dx)) {
        s.hist = []; // es un scroll vertical, no un arrastre
        return;
      }
      s.locked = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    s.hist.push({ x: e.clientX, t: e.timeStamp });
    if (s.hist.length > 6) s.hist.shift();
    setDrag(dx > 0 ? rubber(dx, WIDTH) : dx); // resistencia al pasar el borde
  };
  const onUp = () => {
    const s = g.current;
    if (!s.locked || drag === null) {
      s.hist = [];
      return;
    }
    const a = s.hist[0];
    const b = s.hist[s.hist.length - 1];
    const v = b && a && b.t !== a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0; // px/s
    const landing = drag + project(v);
    s.hist = [];
    s.locked = false;
    setDrag(null);
    if (landing < -WIDTH / 2) onClose();
  };

  const x = drag ?? (open ? 0 : -WIDTH - 24);
  const progress = Math.max(0, Math.min(1, 1 + x / WIDTH));

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className="absolute inset-0 bg-[#050b18]/45 backdrop-blur-[2px]"
        style={{
          opacity: open ? progress : 0,
          transition: drag === null ? "opacity .4s ease" : "none",
        }}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t("Menú")}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute inset-y-0 left-0 overflow-hidden rounded-r-[24px] bg-surface shadow-2xl"
        style={{
          width: WIDTH,
          transform: `translate3d(${x}px,0,0)`,
          transition: drag === null ? "transform .5s var(--ease-apple)" : "none",
          touchAction: "pan-y",
        }}
      >
        <MobileNav onNavigate={onClose} />
      </div>
    </div>
  );
}
