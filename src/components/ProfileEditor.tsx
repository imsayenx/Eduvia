import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Modal, TextField, btn } from "./Modal";
import { Avatar } from "./Navbar";
import { t } from "../i18n";
import { DEFAULT_AVATAR, fileToAvatar, getProfile, saveProfile, toAvatar, type Profile } from "../profile";

/* --------------------------------------------------------------------------
   Selector de foto: subir desde el equipo o tomarla con la cámara
-------------------------------------------------------------------------- */
export function PhotoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);

  const pickFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return sileo.error({ title: t("Ese archivo no es una imagen") });
    if (f.size > 10 * 1024 * 1024) return sileo.error({ title: t("La imagen pesa más de 10 MB") });
    try {
      onChange(await fileToAvatar(f));
    } catch {
      sileo.error({ title: t("No se pudo leer la imagen") });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        <Avatar src={value} size={96} className="ring-4 ring-surface shadow-(--shadow-card)" />
      </div>
      <div className="flex flex-1 flex-wrap justify-center gap-2 sm:justify-start">
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
        <button type="button" onClick={() => file.current?.click()} className={btn.ghost}>
          <Icon name="upload" size={14} /> {t("Subir foto")}
        </button>
        <button type="button" onClick={() => setCamera(true)} className={btn.ghost}>
          <Icon name="camera" size={14} /> {t("Tomar foto")}
        </button>
        {value !== DEFAULT_AVATAR && (
          <button type="button" onClick={() => onChange(DEFAULT_AVATAR)} className="press rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            {t("Quitar")}
          </button>
        )}
        <p className="w-full text-center text-xs text-muted sm:text-left">{t("JPG o PNG. Se recorta en cuadrado automáticamente.")}</p>
      </div>
      {camera && (
        <CameraCapture
          onClose={() => setCamera(false)}
          onCapture={(img) => {
            onChange(img);
            setCamera(false);
          }}
        />
      )}
    </div>
  );
}

function CameraCapture({ onClose, onCapture }: { onClose: () => void; onCapture: (img: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  useEffect(() => {
    let s: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t("Tu navegador no permite usar la cámara. Prueba con Chrome o Edge, o sube una foto."));
        return;
      }
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 960 } }, audio: false });
        if (cancelled) return s.getTracks().forEach((tr) => tr.stop());
        setStream(s);
        if (video.current) video.current.srcObject = s;
        setError("");
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(
          name === "NotAllowedError"
            ? t("No diste permiso para usar la cámara. Actívalo en el candado de la barra de direcciones.")
            : name === "NotFoundError"
              ? t("No encontramos una cámara en este dispositivo.")
              : t("No se pudo abrir la cámara."),
        );
      }
    })();
    return () => {
      cancelled = true;
      s?.getTracks().forEach((tr) => tr.stop());
    };
  }, [facing]);

  const capture = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // espejo para la cámara frontal, como en un selfie
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    if (facing === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    setShot(toAvatar(c, c.width, c.height));
  };

  const stop = () => stream?.getTracks().forEach((tr) => tr.stop());

  return (
    <Modal
      open
      onClose={() => {
        stop();
        onClose();
      }}
      title={t("Tomar foto")}
      icon="camera"
      width={520}
      footer={
        shot ? (
          <>
            <button onClick={() => setShot(null)} className={btn.ghost}>
              <Icon name="arrow-counterclockwise" size={14} /> {t("Repetir")}
            </button>
            <button
              onClick={() => {
                stop();
                onCapture(shot);
              }}
              className={btn.primary}
            >
              <Icon name="check-lg" size={14} /> {t("Usar esta foto")}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className={btn.ghost} disabled={!!error}>
              <Icon name="arrow-repeat" size={14} /> {t("Cambiar cámara")}
            </button>
            <button onClick={capture} className={btn.primary} disabled={!stream || !!error}>
              <Icon name="camera-fill" size={14} /> {t("Capturar")}
            </button>
          </>
        )
      }
    >
      <div className="relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-3xl bg-[#0b1220]">
        {error ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <Icon name="camera-video-off" size={34} className="mx-auto text-white/60" />
              <p className="mt-3 text-sm text-white/80">{error}</p>
            </div>
          </div>
        ) : shot ? (
          <img src={shot} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <video ref={video} autoPlay playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />
            <span className="pointer-events-none absolute inset-[12%] rounded-full ring-2 ring-white/70 ring-offset-0" />
            {!stream && <p className="absolute inset-x-0 bottom-4 text-center text-xs text-white/70">{t("Abriendo cámara…")}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------------------
   Editor completo del perfil
-------------------------------------------------------------------------- */
export function ProfileEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [p, setP] = useState<Profile>(getProfile);
  const [newInterest, setNewInterest] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (open) {
      setP(getProfile());
      setTried(false);
    }
  }, [open]);

  const set = <K extends keyof Profile>(k: K) => (v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const errors = {
    nombres: !p.nombres.trim() ? t("Escribe tu nombre") : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ? t("Correo no válido") : "",
  };
  const valid = !errors.nombres && !errors.email;

  const save = () => {
    setTried(true);
    if (!valid) return;
    saveProfile({ ...p, nombres: p.nombres.trim(), apellidos: p.apellidos.trim() });
    sileo.success({ title: t("Perfil actualizado") });
    onClose();
  };

  const addInterest = () => {
    const v = newInterest.trim();
    if (v && !p.interests.includes(v) && p.interests.length < 10) set("interests")([...p.interests, v]);
    setNewInterest("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Editar perfil")}
      icon="pencil"
      width={680}
      footer={
        <>
          <button onClick={onClose} className={btn.ghost}>
            {t("Cancelar")}
          </button>
          <button onClick={save} className={btn.primary}>
            <Icon name="check-lg" size={14} /> {t("Guardar cambios")}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold text-ink">{t("Foto de perfil")}</h3>
          <PhotoPicker value={p.avatar} onChange={set("avatar")} />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-ink">{t("Información personal")}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label={t("Nombres")} value={p.nombres} onChange={set("nombres")} error={tried ? errors.nombres : ""} autoComplete="given-name" />
            <TextField label={t("Apellidos")} value={p.apellidos} onChange={set("apellidos")} autoComplete="family-name" />
            <TextField label={t("Correo electrónico")} type="email" value={p.email} onChange={set("email")} error={tried ? errors.email : ""} autoComplete="email" />
            <TextField label={t("Teléfono")} type="tel" value={p.phone} onChange={set("phone")} autoComplete="tel" />
            <TextField label={t("Carrera")} value={p.career} onChange={set("career")} />
            <TextField label={t("Año / Nivel")} value={p.level} onChange={set("level")} />
            <TextField label={t("Fecha de nacimiento")} type="date" value={p.birth} onChange={set("birth")} />
            <TextField label={t("Ubicación")} value={p.location} onChange={set("location")} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">{t("Sobre ti")}</h3>
          <TextField label={t("Frase personal")} value={p.quote} onChange={set("quote")} placeholder={t("Una frase que te inspire")} />
          <TextField label={t("Mi meta")} value={p.goal} onChange={set("goal")} multiline />
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{t("Intereses")}</span>
            <div className="flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-brand">
                  {t(i)}
                  <button onClick={() => set("interests")(p.interests.filter((x) => x !== i))} aria-label={t("Quitar")} className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand/15">
                    <Icon name="x" size={13} />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addInterest();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-line py-0.5 pl-3 pr-1"
              >
                <input value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder={t("Agregar interés")} className="w-28 bg-transparent text-xs text-ink placeholder:text-muted" />
                <button className="grid h-6 w-6 place-items-center rounded-full text-brand hover:bg-brand/10" aria-label={t("Agregar")}>
                  <Icon name="plus-lg" size={13} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

/** Ventana rápida solo para cambiar la foto (botón de cámara del perfil). */
export function PhotoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [v, setV] = useState(getProfile().avatar);
  useEffect(() => {
    if (open) setV(getProfile().avatar);
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("Foto de perfil")}
      icon="person-bounding-box"
      width={520}
      footer={
        <>
          <button onClick={onClose} className={btn.ghost}>
            {t("Cancelar")}
          </button>
          <button
            onClick={() => {
              saveProfile({ avatar: v });
              sileo.success({ title: t("Foto actualizada") });
              onClose();
            }}
            className={btn.primary}
          >
            {t("Guardar")}
          </button>
        </>
      }
    >
      <PhotoPicker value={v} onChange={setV} />
    </Modal>
  );
}
