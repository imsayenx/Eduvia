import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { IconBall } from "../ui";
import { Modal, TextField, btn } from "./Modal";
import { addMedia, embedOf, fmtBytes, getFile, isFile, kindInfo, removeMedia, uploadFile, type Media, type MediaKind } from "../lib/content";
import { cloud } from "../lib/supabase";
import { ago } from "../profile";
import { t } from "../i18n";

/* Reproductor real: YouTube / Vimeo / Drive (iframe) o archivo de video */
export function MediaPlayer({ media, onEnded }: { media: Media; onEnded?: () => void }) {
  const e = embedOf(media.url);
  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-(--shadow-card)">
      {e.type === "iframe" ? (
        <iframe
          src={e.src}
          title={media.title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <video src={e.src} controls playsInline preload="metadata" onEnded={onEnded} className="aspect-video w-full bg-black" />
      )}
    </div>
  );
}

/* Lista de archivos y enlaces para ver o descargar */
export function MediaList({ items, empty, admin }: { items: Media[]; empty?: string; admin?: boolean }) {
  if (!items.length) return empty ? <p className="rounded-xl bg-canvas p-4 text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="space-y-2">
      {items.map((m) => {
        const k = kindInfo[m.kind];
        return (
          <li key={m.id} onClick={() => getFile(m)} className="group flex cursor-pointer items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 transition-colors hover:bg-brand/5">
            <Icon name={k.icon} size={17} style={{ color: k.color }} />
            <button type="button" className="min-w-0 flex-1 text-left" title={t(isFile(m) ? "Descargar" : "Abrir")}>
              <span className="block truncate font-medium text-ink group-hover:text-brand">{m.title}</span>
              <span className="text-xs text-muted">
                {t(k.label)}
                {m.size_bytes ? ` · ${fmtBytes(m.size_bytes)}` : ""}
                {m.created_at ? ` · ${ago(m.created_at)}` : ""}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                getFile(m);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-brand"
              aria-label={t(isFile(m) ? "Descargar" : "Abrir")}
              title={t(isFile(m) ? "Descargar" : "Abrir")}
            >
              <Icon name={isFile(m) ? "download" : "box-arrow-up-right"} size={14} />
            </button>
            {admin && m.id > 0 && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await removeMedia(m);
                  sileo.info({ title: t("Material eliminado") });
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted opacity-60 hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                aria-label={t("Eliminar")}
              >
                <Icon name="trash3" size={13} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Ventana para agregar material (solo administradores) */
export function AddMediaModal({
  open,
  onClose,
  courseId,
  lessonKey,
  place,
  kind: initialKind = "video",
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lessonKey: string | null;
  place: string; // texto: «Python · Lección 1.2»
  kind?: MediaKind;
}) {
  const [kind, setKind] = useState<MediaKind>(initialKind);
  const [source, setSource] = useState<"file" | "url">(cloud ? "file" : "url");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setSource(cloud && initialKind !== "link" ? "file" : "url");
    setTitle("");
    setUrl("");
    setFile(null);
    setProgress(null);
    setError("");
  }, [open, initialKind]);

  const pick = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    if (f.type.startsWith("video/")) setKind("video");
    else if (f.type === "application/pdf") setKind("pdf");
    else if (kind === "video" || kind === "link") setKind("file");
  };

  const save = async () => {
    setError("");
    if (!title.trim()) return setError(t("Escribe un título."));
    if (source === "url") {
      if (!/^https?:\/\//.test(url.trim())) return setError(t("Pega un enlace que empiece con https://"));
      const ok = await addMedia({ course_id: courseId, lesson_key: lessonKey, kind, title: title.trim(), url: url.trim() });
      if (ok) done();
      return;
    }
    if (!file) return setError(t("Elige un archivo."));
    setProgress(0);
    const up = await uploadFile(file, courseId.replace(":", "-"), setProgress);
    if (!up) return setProgress(null);
    const ok = await addMedia({ course_id: courseId, lesson_key: lessonKey, kind, title: title.trim(), url: up.url, storage_path: up.path, size_bytes: file.size });
    if (ok) done();
    else setProgress(null);
  };
  const done = () => {
    sileo.success({ title: t("Material agregado"), description: title });
    onClose();
  };

  const uploading = progress !== null;
  const accept = kind === "video" ? "video/*" : kind === "pdf" ? "application/pdf" : undefined;

  return (
    <Modal
      open={open}
      onClose={() => !uploading && onClose()}
      title={t("Agregar material")}
      icon="cloud-arrow-up"
      width={560}
      footer={
        <>
          <button onClick={onClose} disabled={uploading} className={btn.ghost}>
            {t("Cancelar")}
          </button>
          <button onClick={save} disabled={uploading} className={btn.primary}>
            {uploading ? t("Subiendo… {n}%", { n: progress }) : t("Guardar")}
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-muted">
        <Icon name="geo" size={12} /> {place}
      </p>

      {/* Tipo */}
      <div className="grid grid-cols-4 gap-2">
        {(["video", "pdf", "file", "link"] as MediaKind[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              if (k === "link") setSource("url");
            }}
            className={`press flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${
              kind === k ? "border-brand bg-brand/10 text-brand" : "border-line text-ink-soft hover:bg-canvas"
            }`}
          >
            <Icon name={kindInfo[k].icon} size={18} style={{ color: kind === k ? undefined : kindInfo[k].color }} />
            {t(kindInfo[k].label)}
          </button>
        ))}
      </div>

      {/* Origen */}
      {kind !== "link" && (
        <div className="mt-4 flex rounded-full bg-canvas p-1 ring-1 ring-line">
          {(["file", "url"] as const).map((s) => (
            <button
              key={s}
              disabled={s === "file" && !cloud}
              onClick={() => setSource(s)}
              className={`press flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 ${source === s ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
            >
              {s === "file" ? t("Subir archivo") : t("Pegar enlace")}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {source === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !uploading && input.current?.click()}
            className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
              drag ? "border-brand bg-brand/5" : "border-line hover:border-brand/50"
            }`}
          >
            <input ref={input} type="file" hidden accept={accept} onChange={(e) => pick(e.target.files?.[0])} />
            {file ? (
              <div className="flex items-center gap-3 text-left">
                <IconBall icon={kindInfo[kind].icon} color={kindInfo[kind].color} size={42} rounded="rounded-xl" variant="soft" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                  <p className="text-xs text-muted">{fmtBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Icon name="cloud-arrow-up" size={28} className="text-brand" />
                <p className="mt-2 text-sm font-semibold text-ink">{t("Arrastra el archivo aquí o haz clic para elegirlo")}</p>
                <p className="text-xs text-muted">{kind === "video" ? t("MP4 o WebM. Para videos largos usa un enlace de YouTube.") : t("PDF, Word, PowerPoint, ZIP…")}</p>
              </>
            )}
            {uploading && (
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : (
          <TextField
            label={kind === "video" ? t("Enlace del video (YouTube, Vimeo, Drive o .mp4)") : t("Enlace")}
            value={url}
            onChange={setUrl}
          />
        )}
        <TextField label={t("Título")} value={title} onChange={setTitle} />
        {!cloud && <p className="text-xs text-muted">{t("En modo local solo se pueden pegar enlaces. Para subir archivos conecta Supabase.")}</p>}
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      </div>
    </Modal>
  );
}
