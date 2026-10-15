import { useState } from "react";
import { Link } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { groups, events, useJoined, useRegistered, fmt, useGroupCounts, useCommunityStats, useOnline } from "../community";
import { Reveal, CountUp, IconBall } from "../ui";
import { SectionHead } from "./Home";
import { Avatar } from "../components/Navbar";
import { t } from "../i18n";
import { ago, firstName, useProfile } from "../profile";
import { useFeed, type FeedPost } from "../lib/feed";
import { cloud } from "../lib/supabase";

const feedTabs = ["Inicio", "Foros", "Grupos", "Eventos", "Mi actividad"] as const;
type FeedTab = (typeof feedTabs)[number];

const av = (id: string) => `https://images.unsplash.com/photo-${id}?w=80&h=80&fit=crop&auto=format`;

const H = 3600_000;
type SampleReply = [name: string, photo: string, text: string, minutesAfter: number];
const sample = (p: { id: number; name: string; role: string; hours: number; avatar: string; text: string; tag: string; image?: string; file?: string; likes: number; comments: SampleReply[] }): FeedPost => {
  const at = Date.now() - p.hours * H;
  const replies = p.comments.map(([name, photo, text, min], i) => ({ id: p.id * 100 + i, name, avatar: av(photo), text, at: at + min * 60_000, mine: false, sample: true }));
  return { ...p, liked: false, replies, replyCount: replies.length, at, mine: false, sample: true };
};
const initialPosts: FeedPost[] = [
  sample({
    id: 1,
    name: "Carlos Méndez",
    role: "Estudiante",
    hours: 2,
    avatar: av("1507003211169-0a1dd7228f2d"),
    text: "¿Alguien tiene algún consejo para mejorar en la materia de Programación? Me está costando un poco entender los ejercicios.",
    tag: "Programación",
    likes: 24,
    comments: [
      ["Ana López", "1544005313-94ddf0286df2", "Practica un poco cada día, aunque sean 20 minutos. Y pregunta en el foro del curso, ahí responden rápido.", 25],
      ["Diego Ramírez", "1544725176-7c40e5a71c5e", "A mí me ayudó resolver los ejercicios en papel antes de escribir el código.", 48],
      ["Luis García", "1472099645785-5658abf4ff4e", "Empieza por la Unidad 1 del curso de Programación web y haz todas las prácticas. Si te trabas, escríbeme por aquí.", 70],
    ],
  }),
  sample({
    id: 2,
    name: "Ana López",
    role: "Estudiante",
    hours: 4,
    avatar: av("1544005313-94ddf0286df2"),
    text: "¡Hoy terminé mi curso de Introducción a la Inteligencia Artificial! Muy buena plataforma, los videos y las actividades son increíbles.",
    tag: "Logro",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=700&h=360&fit=crop&auto=format",
    likes: 36,
    comments: [
      ["Carlos Méndez", "1507003211169-0a1dd7228f2d", "¡Felicidades, Ana! ¿Cuál fue tu parte favorita?", 15],
      ["Ana López", "1544005313-94ddf0286df2", "¡Gracias! La unidad de redes neuronales, los ejemplos son muy claros.", 32],
      ["Valentina Torres", "1438761681033-6461ffad8d80", "Yo voy por la unidad 3, ¡qué motivación!", 60],
    ],
  }),
  sample({
    id: 3,
    name: "Luis García",
    role: "Estudiante",
    hours: 6,
    avatar: av("1472099645785-5658abf4ff4e"),
    text: "Les comparto este recurso sobre bases de datos, puede serles muy útil para el próximo examen.",
    tag: "Recursos",
    file: "Bases de datos - Resumen.pdf",
    likes: 18,
    comments: [
      ["Valentina Torres", "1438761681033-6461ffad8d80", "¡Gracias, Luis! Justo lo necesitaba para el examen.", 20],
      ["Diego Ramírez", "1544725176-7c40e5a71c5e", "¿Incluye ejercicios de normalización?", 41],
    ],
  }),
  sample({
    id: 4,
    name: "Valentina Torres",
    role: "Estudiante",
    hours: 8,
    avatar: av("1438761681033-6461ffad8d80"),
    text: "¿Alguien se apunta al grupo de estudio para el examen de Matemáticas? Podemos reunirnos el sábado.",
    tag: "Grupos",
    likes: 14,
    comments: [
      ["Carlos Méndez", "1507003211169-0a1dd7228f2d", "¡Yo me apunto! ¿A qué hora?", 10],
      ["Valentina Torres", "1438761681033-6461ffad8d80", "¿Les parece a las 3:00 p.m. por videollamada?", 22],
      ["Ana López", "1544005313-94ddf0286df2", "Cuenten conmigo, llevo ejercicios resueltos de funciones.", 35],
    ],
  }),
];

const tagColor: Record<string, string> = {
  Programación: "bg-blue-100 text-blue-700",
  Logro: "bg-amber-100 text-amber-700",
  Recursos: "bg-violet-100 text-violet-700",
  Grupos: "bg-emerald-100 text-emerald-700",
  Pregunta: "bg-sky-100 text-sky-600",
};

const card = "rounded-[20px] border border-line bg-surface p-5 shadow-(--shadow-card)";

export function Comunidad() {
  const me = useProfile();
  const [tab, setTab] = useState<FeedTab>("Inicio");
  const feed = useFeed(null, initialPosts);
  const gc = useGroupCounts();
  const cstats = useCommunityStats();
  const online = useOnline();
  const posts = feed.posts;
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [composer, setComposer] = useState("");
  const [filter, setFilter] = useState("Todo");
  const [joinedSet, toggleJoined] = useJoined();
  const [reg, toggleReg] = useRegistered();

  const [busy, setBusy] = useState(false);
  const publish = async () => {
    const text = composer.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await feed.publish(text, "Pregunta");
    setBusy(false);
    if (!ok) return;
    setComposer("");
    sileo.success({ title: t("Publicación compartida") });
  };

  const sendReply = async (id: number) => {
    const text = (drafts[id] || "").trim();
    if (!text) return;
    setDrafts((d) => ({ ...d, [id]: "" }));
    if (await feed.reply(id, text)) sileo.success({ title: t("Respuesta publicada") });
  };

  const toggleJoin = (id: string, name: string) => {
    if (toggleJoined(id)) sileo.success({ title: t("Te uniste a {g}", { g: t(name) }), description: t("Toca el grupo para ver su contenido.") });
    else sileo.info({ title: t("Saliste de {g}", { g: t(name) }) });
  };

  const toggleLike = feed.toggleLike;

  const shown = posts.filter((p) => {
    if (tab === "Foros") return ["Programación", "Pregunta", "Grupos"].includes(p.tag);
    if (tab === "Mi actividad") return p.mine || p.liked || p.replies.some((r) => r.mine);
    return filter === "Todo" || p.tag === filter;
  });


  return (
    <div className="mx-auto max-w-370 px-4 py-5 sm:px-6">
      {/* Encabezado */}
      <Reveal className="relative mb-5 overflow-hidden rounded-[22px] bg-brand-navy p-8 text-white">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <Icon name="people" size={17} /> {t("Comunidad")}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-tight">
          {t("Conecta, comparte")}
          <br />
          <span className="text-[#7cb6ff]">{t("y aprende juntos")}</span>
        </h1>
        <p className="mt-3 max-w-md text-white/75">{t("Únete a una comunidad de estudiantes que, como tú, quieren llegar más lejos.")}</p>
        <p className="font-hand absolute right-10 top-8 hidden rotate-[-6deg] text-2xl text-white/85 lg:block">{t("Buenas ideas, mejores aprendizajes")}</p>
        <div className="absolute bottom-7 right-10 hidden gap-3 lg:flex">
          <IconBall icon="chat-dots-fill" color="#2f6fe4" size={52} rounded="rounded-2xl" />
          <IconBall icon="lightbulb-fill" color="#e09a1e" size={52} rounded="rounded-2xl" />
          <IconBall icon="people-fill" color="#7562d0" size={52} rounded="rounded-2xl" />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px]">
        {/* Izquierda */}
        <div className="space-y-5">
          <Reveal className={card}>
            <p className="mb-3 font-display font-semibold text-ink">{t("Mi perfil")}</p>
            <div className="flex items-center gap-3">
              <Avatar src={me.avatar} size={44} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{firstName(me)}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  {t("Estudiante")}
                  {me.isPrivate && (
                    <>
                      {" · "}
                      <Icon name="lock-fill" size={10} /> {t("Privado")}
                    </>
                  )}
                </p>
              </div>
            </div>
            <Link to="/perfil" className="press mt-3 block rounded-xl border border-line py-2 text-center text-sm font-semibold text-brand hover:bg-brand/5">
              {t("Ver mi perfil")}
            </Link>
          </Reveal>

          <Reveal delay={60} className={card}>
            <SectionHead small icon={<Icon name="people-fill" size={17} className="text-brand" />} title={t("Grupos destacados")} to="/comunidad/grupos" />
            <div className="space-y-1">
              {groups
                .filter((g) => g.featured)
                .map((g) => (
                  <Link key={g.id} to={`/comunidad/grupo/${g.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas">
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${g.color}`}>
                      <g.icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-sm font-semibold text-ink">{t(g.name)}</p>
                      <p className="text-xs text-muted">{t("{n} miembros", { n: fmt(gc[g.id] ?? 0) })}</p>
                    </div>
                    {joinedSet.has(g.id) && <Icon name="check-lg" size={14} className="text-brand" />}
                  </Link>
                ))}
            </div>
          </Reveal>

          <Reveal delay={120} className={card}>
            <p className="mb-3 font-display font-semibold text-ink">{t("Comunidad en números")}</p>
            {[
              [fmt(cstats.members), "Miembros", "people"],
              [String(groups.length), "Grupos", "grid"],
              [fmt(cstats.posts), "Publicaciones", "chat-square-text"],
            ].map(([n, l, i]) => (
              <div key={l} className="mb-2 flex items-center gap-3">
                <IconBall icon={i} color="#2f6fe4" size={36} rounded="rounded-lg" variant="soft" />
                <div>
                  <p className="font-display font-semibold text-ink">{n}</p>
                  <p className="text-xs text-muted">{t(l)}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Centro */}
        <div className="min-w-0">
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {feedTabs.map((ft) => (
              <button
                key={ft}
                onClick={() => setTab(ft)}
                className={`press shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
                  tab === ft ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-soft hover:text-brand"
                }`}
              >
                {t(ft)}
              </button>
            ))}
          </div>

          {(tab === "Inicio" || tab === "Foros" || tab === "Mi actividad") && (
            <>
              {/* Escribir publicación */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  publish();
                }}
                className={`${card} mb-4 flex items-center gap-3 !p-3`}
              >
                <Avatar src={me.avatar} size={40} />
                <input
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder={t("¿Qué quieres compartir o preguntar, {name}?", { name: firstName(me) })}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted"
                />
                <button disabled={!composer.trim() || busy} className="press shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
                  {t("Publicar")}
                </button>
              </form>

              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold text-ink">
                  <Icon name="chat-square-text" size={17} className="text-brand" /> {t(tab === "Mi actividad" ? "Mi actividad" : "Publicaciones recientes")}
                </h2>
                {tab === "Inicio" && (
                  <label className="flex items-center gap-2 text-xs text-muted">
                    {t("Filtrar por:")}
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-soft">
                      {["Todo", "Programación", "Logro", "Recursos", "Grupos", "Pregunta"].map((o) => (
                        <option key={o} value={o}>
                          {t(o)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="space-y-4">
                {feed.loading && <p className="p-6 text-center text-sm text-muted">{t("Cargando publicaciones…")}</p>}
                {!feed.loading && shown.length === 0 && (
                  <p className="rounded-[20px] border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
                    {tab === "Mi actividad" || !cloud ? t("Aún no tienes actividad. Publica algo, responde o dale me gusta a una publicación.") : t("Aún no hay publicaciones. ¡Sé el primero en compartir algo!")}
                  </p>
                )}
                {shown.map((p) => (
                  <article key={p.id} className={card}>
                    <div className="flex items-start gap-3">
                      <Avatar src={p.avatar} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                            <p className="text-xs text-muted">
                              {t(p.role)} · {ago(p.at)}
                            </p>
                          </div>
                          {p.mine && cloud && (
                            <button onClick={() => feed.remove(p.id)} className="press grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={t("Eliminar")} title={t("Eliminar")}>
                              <Icon name="trash3" size={13} />
                            </button>
                          )}
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tagColor[p.tag] ?? "bg-canvas text-ink-soft"}`}>{t(p.tag)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.sample ? t(p.text) : p.text}</p>

                        {p.image && (
                          <img
                            src={p.image}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                            className="mt-3 h-52 w-full rounded-xl bg-canvas object-cover"
                            alt=""
                          />
                        )}
                        {p.file && (
                          <div className="mt-3 flex items-center gap-3 rounded-xl bg-canvas p-3">
                            <IconBall icon="file-earmark-pdf-fill" color="#de5a4c" size={40} rounded="rounded-lg" variant="soft" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-ink">{t(p.file)}</p>
                              <p className="text-xs text-muted">2.4 MB</p>
                            </div>
                            <button
                              onClick={() => sileo.success({ title: t("Descarga iniciada"), description: t(p.file!) })}
                              className="press grid h-9 w-9 place-items-center rounded-lg text-brand hover:bg-brand/10"
                              aria-label={t("Descargar")}
                            >
                              <Icon name="download" size={16} />
                            </button>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-5 text-sm text-muted">
                          <button onClick={() => toggleLike(p.id)} className={`press inline-flex items-center gap-1.5 ${p.liked ? "text-brand" : "hover:text-brand"}`}>
                            <Icon name={p.liked ? "hand-thumbs-up-fill" : "hand-thumbs-up"} size={15} /> {p.likes}
                          </button>
                          <button
                            onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))}
                            className={`press inline-flex items-center gap-1.5 ${open[p.id] ? "text-brand" : "hover:text-brand"}`}
                          >
                            <Icon name="chat" size={15} /> {p.replyCount} · {t("Responder")}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(window.location.origin + "/comunidad").catch(() => {});
                              sileo.success({ title: t("Enlace copiado") });
                            }}
                            className="press inline-flex items-center gap-1.5 hover:text-brand"
                          >
                            <Icon name="share" size={14} /> {t("Compartir")}
                          </button>
                        </div>

                        {!open[p.id] && p.replies.length > 0 && <RepliesPeek replies={p.replies} onOpen={() => setOpen((o) => ({ ...o, [p.id]: true }))} />}

                        {open[p.id] && (
                          <div className="animate-fade-up mt-4 space-y-3 border-t border-line pt-4">
                            {p.replies.map((r) => (
                              <div key={r.id} className="flex gap-2.5">
                                <Avatar src={r.avatar} size={32} />
                                <div className="flex-1 rounded-2xl bg-canvas px-3.5 py-2.5">
                                  <p className="text-xs font-semibold text-ink">
                                    {r.mine ? `${r.name} (${t("tú")})` : r.name} <span className="font-normal text-muted">· {ago(r.at)}</span>
                                  </p>
                                  <p className="text-sm text-ink-soft">{r.sample ? t(r.text) : r.text}</p>
                                </div>
                              </div>
                            ))}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                sendReply(p.id);
                              }}
                              className="flex items-center gap-2.5"
                            >
                              <Avatar src={me.avatar} size={32} />
                              <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-canvas py-1.5 pl-4 pr-1.5 transition focus-within:border-brand/50">
                                <input
                                  autoFocus
                                  value={drafts[p.id] || ""}
                                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                                  placeholder={t("Responder a {name}…", { name: p.name.split(" ")[0] })}
                                  className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted"
                                />
                                <button
                                  type="submit"
                                  disabled={!(drafts[p.id] || "").trim()}
                                  className="press grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-40"
                                  aria-label={t("Enviar")}
                                >
                                  <Icon name="send-fill" size={13} />
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {tab === "Grupos" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {groups.map((g) => {
                const on = joinedSet.has(g.id);
                return (
                  <div key={g.id} className={`${card} flex items-start gap-3`}>
                    <Link to={`/comunidad/grupo/${g.id}`} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${g.color}`}>
                      <g.icon size={18} />
                    </Link>
                    <Link to={`/comunidad/grupo/${g.id}`} className="group min-w-0 flex-1 leading-snug">
                      <p className="text-sm font-semibold text-ink group-hover:text-brand">{t(g.name)}</p>
                      <p className="text-xs text-muted">{t(g.desc)}</p>
                      <p className="mt-1 text-[11px] text-muted">{t("{n} miembros", { n: fmt(gc[g.id] ?? 0) })}</p>
                    </Link>
                    <JoinButton on={on} onClick={() => toggleJoin(g.id, g.name)} />
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Eventos" && (
            <div className="space-y-3">
              {events.map((e) => (
                <EventItem key={e.id} e={e} on={reg.has(e.id)} toggle={toggleReg} />
              ))}
              <Link to="/comunidad/eventos" className="block text-center text-sm font-semibold text-brand hover:underline">
                {t("Ver todos los eventos")}
              </Link>
            </div>
          )}
        </div>

        {/* Derecha */}
        <div className="space-y-5 lg:col-span-2 xl:col-span-1">
          <Reveal className={card}>
            <SectionHead small icon={<Icon name="people-fill" size={17} className="text-brand" />} title={t("Grupos recomendados")} to="/comunidad/grupos" />
            <div className="space-y-3">
              {groups
                .filter((g) => g.recommended)
                .map((g) => {
                  const on = joinedSet.has(g.id);
                  return (
                    <div key={g.id} className="flex items-start gap-3">
                      <Link to={`/comunidad/grupo/${g.id}`} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${g.color}`}>
                        <g.icon size={16} />
                      </Link>
                      <Link to={`/comunidad/grupo/${g.id}`} className="group min-w-0 flex-1 leading-tight">
                        <p className="text-sm font-semibold text-ink group-hover:text-brand">{t(g.name)}</p>
                        <p className="text-xs text-muted">{t(g.desc)}</p>
                      </Link>
                      <JoinButton on={on} onClick={() => toggleJoin(g.id, g.name)} />
                    </div>
                  );
                })}
            </div>
          </Reveal>

          <Reveal delay={60} className={card}>
            <SectionHead small icon={<Icon name="calendar-event" size={17} className="text-brand" />} title={t("Próximos eventos")} to="/comunidad/eventos" />
            <div className="space-y-3">
              {events.slice(0, 3).map((e) => (
                <EventItem key={e.id} e={e} on={reg.has(e.id)} toggle={toggleReg} compact />
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className={card}>
            <p className="mb-3 flex items-center gap-2 font-display font-semibold text-ink">
              <Icon name="circle-fill" size={9} className="text-mint" /> {t("Usuarios en línea")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(online.length ? online : [{ id: "yo", name: firstName(me), avatar: me.avatar }]).slice(0, 11).map((u) => (
                <div key={u.id} className="relative" title={u.name}>
                  <Avatar src={u.avatar} size={36} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-mint" />
                </div>
              ))}
              {online.length > 11 && (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  +<CountUp to={online.length - 11} />
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">{online.length > 1 ? t("{n} personas conectadas ahora", { n: online.length }) : t("Solo tú por ahora")}</p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* Vista previa: caras de quienes respondieron + «Ver respuestas» */
export function RepliesPeek({ replies, onOpen }: { replies: { id: number; avatar: string; name: string }[]; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="press mt-3 flex items-center gap-2 text-xs font-semibold text-brand hover:underline">
      <span className="flex -space-x-2">
        {replies.slice(-3).map((r) => (
          <Avatar key={r.id} src={r.avatar} size={22} className="ring-2 ring-surface" />
        ))}
      </span>
      {replies.length === 1 ? t("Ver 1 respuesta") : t("Ver las {n} respuestas", { n: replies.length })}
    </button>
  );
}

function JoinButton({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`press inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
        on ? "border-brand bg-brand text-white" : "border-brand/30 text-brand hover:bg-brand hover:text-white"
      }`}
    >
      {on ? (
        <>
          <Icon name="check-lg" size={11} /> {t("Unido")}
        </>
      ) : (
        t("Unirse")
      )}
    </button>
  );
}

export function EventItem({ e, on, toggle, compact }: { e: (typeof events)[number]; on: boolean; toggle: (id: string) => boolean; compact?: boolean }) {
  return (
    <div className={`flex gap-3 ${compact ? "" : "rounded-[20px] border border-line bg-surface p-4 shadow-(--shadow-card)"}`}>
      <div className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-brand/10 text-center text-brand">
        <span className="text-[10px] font-semibold uppercase">{t(e.dow)}</span>
        <span className="font-display text-lg font-semibold leading-none">{e.day}</span>
        <span className="text-[10px]">{t(e.month)}</span>
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-sm font-semibold text-ink">{t(e.title)}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
          <Icon name="clock" size={11} /> {e.time}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted">
          <Icon name={e.mode === "Virtual" ? "camera-video" : "geo-alt"} size={11} /> {t("Modalidad: {m}", { m: t(e.mode) })}
        </p>
        <button
          onClick={() => {
            const now = toggle(e.id);
            if (now) sileo.success({ title: t("¡Inscrito!"), description: t(e.title) });
            else sileo.info({ title: t("Inscripción cancelada") });
          }}
          className={`press mt-2 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
            on ? "bg-mint/15 text-mint" : "bg-brand/10 text-brand hover:bg-brand hover:text-white"
          }`}
        >
          {on ? (
            <>
              <Icon name="check-lg" size={11} /> {t("Inscrito")}
            </>
          ) : (
            t("Inscribirme")
          )}
        </button>
      </div>
    </div>
  );
}
