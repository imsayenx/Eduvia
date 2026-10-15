import { useState } from "react";
import { Link, useParams } from "react-router";
import { sileo } from "sileo";
import { Icon } from "../icons";
import { Reveal, IconBall } from "../ui";
import { events, groups, useJoined, useRegistered, fmt, useGroupCounts, useGroupMembers } from "../community";
import { currentUid } from "../lib/sync";
import { useIsAdmin, useMedia } from "../lib/content";
import { AddMediaModal, MediaList } from "../components/Media";
import { Avatar } from "../components/Navbar";
import { EventItem, RepliesPeek } from "./Comunidad";
import { t } from "../i18n";
import { ago, firstName, useProfile } from "../profile";
import { useFeed, type FeedPost } from "../lib/feed";
import { cloud } from "../lib/supabase";

const av = (id: string) => `https://images.unsplash.com/photo-${id}?w=80&h=80&fit=crop&auto=format`;
const members = [
  ["Laura Ríos", "Estudiante", "1438761681033-6461ffad8d80"],
  ["Carlos Méndez", "Estudiante", "1507003211169-0a1dd7228f2d"],
  ["Ana López", "Estudiante", "1544005313-94ddf0286df2"],
  ["Luis García", "Estudiante", "1472099645785-5658abf4ff4e"],
  ["Valentina Torres", "Estudiante", "1531123897727-8f129e1688ce"],
  ["Diego Ramírez", "Estudiante", "1544725176-7c40e5a71c5e"],
];
const tabs = ["Publicaciones", "Miembros", "Recursos", "Eventos"] as const;
const card = "rounded-[20px] border border-line bg-surface p-5 shadow-(--shadow-card)";

const sample = (who: string[], text: string, likes: number, hours: number, pinned = false, reps: [number, string][] = []): FeedPost => {
  const at = Date.now() - hours * 3600_000;
  const replies = reps.map(([m, txt], i) => ({ id: hours * 100 + i, name: members[m][0], avatar: av(members[m][2]), text: txt, at: at + (i + 1) * 900_000, mine: false, sample: true }));
  return { id: hours + likes, name: who[0], role: who[1], avatar: av(who[2]), text, tag: "", likes, liked: false, replies, replyCount: replies.length, at, label: pinned ? "Fijado" : undefined, pinned, mine: false, sample: true };
};
const samples = [
  sample(members[0], "¡Bienvenidos! Preséntense y cuéntennos qué quieren aprender este mes.", 42, 48, true, [
    [1, "¡Hola a todos! Soy Carlos, quiero mejorar en lógica de programación."],
    [4, "Hola, soy Valentina. Este mes quiero terminar mi primer proyecto."],
  ]),
  sample(members[1], "¿Alguien quiere armar una sesión de práctica este jueves? Puedo compartir pantalla.", 12, 1, false, [
    [5, "¡Yo! ¿A qué hora sería?"],
    [2, "Me uno si es después de las 5:00 p.m."],
  ]),
  sample(members[2], "Subí mis apuntes de la última clase en la pestaña de Recursos, espero les sirvan.", 27, 3),
];

export function GrupoDetalle() {
  const { id } = useParams();
  const g = groups.find((x) => x.id === id);
  const me = useProfile();
  const [joined, toggle] = useJoined();
  const [reg, toggleReg] = useRegistered();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Publicaciones");
  const [notif, setNotif] = useState(true);
  const [draft, setDraft] = useState("");
  const feed = useFeed(id ?? null, samples);
  const [openPost, setOpenPost] = useState<number | null>(null);
  const gc = useGroupCounts();
  const groupMedia = useMedia(`grupo:${id}`);
  const admin = useIsAdmin();
  const [addingRes, setAddingRes] = useState(false);
  const cloudMembers = useGroupMembers(id ?? "", joined.has(id ?? ""));
  const myId = currentUid() ?? "yo";
  // Miembros reales (Supabase) o solo tú en modo local
  const memberList = cloud ? cloudMembers : joined.has(id ?? "") ? [{ id: "yo", name: `${me.nombres} ${me.apellidos}`.trim(), avatar: me.avatar }] : []; // publicaciones del grupo (en tiempo real con Supabase)
  const posts = feed.posts;

  if (!g)
    return (
      <div className="p-10 text-center text-muted">
        {t("Grupo no encontrado.")}{" "}
        <Link to="/comunidad/grupos" className="text-brand">
          {t("Ver grupos")}
        </Link>
      </div>
    );

  const on = joined.has(g.id);
  const gEvents = events.filter((e) => e.group === g.id);
  const join = () => {
    const now = toggle(g.id);
    if (now) sileo.success({ title: t("¡Bienvenido a {g}!", { g: t(g.name) }), description: t("Ya puedes publicar, ver recursos y unirte a eventos.") });
    else sileo.info({ title: t("Saliste de {g}", { g: t(g.name) }) });
  };
  const publish = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    if (await feed.publish(text, "Grupo")) sileo.success({ title: t("Publicado en el grupo") });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <Link to="/comunidad/grupos" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <Icon name="arrow-left" size={14} /> {t("Todos los grupos")}
      </Link>

      <Reveal className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-(--shadow-card)">
        <div className="relative h-44 bg-brand-navy sm:h-56">
          <img src={g.cover} alt="" onError={(e) => (e.currentTarget.style.display = "none")} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-16 flex items-end gap-4">
            <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-surface shadow-lg ${g.color}`}>
              <g.icon size={32} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{t(g.name)}</h1>
              <p className="text-sm text-muted">{t(g.desc)}</p>
              <p className="mt-1 text-xs text-muted">
                {t("{n} miembros", { n: fmt(gc[g.id] ?? 0) })} · {t(g.category)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {on && (
              <button
                onClick={() => {
                  setNotif(!notif);
                  sileo.info({ title: t(notif ? "Notificaciones silenciadas" : "Notificaciones activadas") });
                }}
                className="press grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-soft hover:text-brand"
                title={t("Notificaciones")}
              >
                <Icon name={notif ? "bell" : "bell-slash"} size={16} />
              </button>
            )}
            <button
              onClick={join}
              className={`press inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                on ? "border border-line text-ink-soft hover:border-rose-300 hover:text-rose-500" : "bg-brand text-white hover:bg-brand-deep"
              }`}
            >
              {on ? (
                <>
                  <Icon name="box-arrow-right" size={14} /> {t("Salir del grupo")}
                </>
              ) : (
                t("Unirme al grupo")
              )}
            </button>
          </div>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-4">
          {tabs.map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`relative shrink-0 px-4 py-3.5 text-sm font-semibold transition-colors ${tab === tb ? "text-brand" : "text-muted hover:text-ink"}`}
            >
              {t(tb)}
              {tab === tb && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="relative min-w-0">
          {!on && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-canvas/70 backdrop-blur-[3px]">
              <div className="animate-pop-in max-w-sm rounded-[20px] border border-line bg-surface p-6 text-center shadow-(--shadow-lift)">
                <IconBall icon="lock-fill" color="#2f6fe4" size={48} className="mx-auto" variant="soft" />
                <p className="mt-3 font-display font-semibold text-ink">{t("Únete para ver el contenido")}</p>
                <p className="mt-1 text-sm text-muted">{t("Al unirte podrás leer y publicar, descargar recursos del grupo e inscribirte a sus eventos.")}</p>
                <button onClick={join} className="press mt-4 w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white">
                  {t("Unirme a {g}", { g: t(g.name) })}
                </button>
              </div>
            </div>
          )}

          <div className={!on ? "pointer-events-none max-h-[520px] select-none overflow-hidden" : ""}>
            {tab === "Publicaciones" && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    publish();
                  }}
                  className={`${card} flex items-center gap-3 !p-3`}
                >
                  <Avatar src={me.avatar} size={40} />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("Escribe algo en {g}…", { g: t(g.name) })}
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted"
                  />
                  <button disabled={!draft.trim()} className="press grid h-9 w-9 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={t("Publicar")}>
                    <Icon name="send-fill" size={13} />
                  </button>
                </form>
                {cloud && !feed.loading && posts.length === 0 && (
                  <p className="rounded-[20px] border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">{t("Aún no hay publicaciones. ¡Sé el primero en compartir algo!")}</p>
                )}
                {posts.map((p) => (
                  <div key={p.id} className={`animate-fade-up ${card}`}>
                    <div className="flex items-center gap-3">
                      <Avatar src={p.avatar} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{p.name}</p>
                        <p className="text-xs text-muted">
                          {t(p.role)} · {p.label ? t(p.label) : ago(p.at)}
                        </p>
                      </div>
                      {p.mine && cloud && (
                        <button onClick={() => feed.remove(p.id)} className="press grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={t("Eliminar")}>
                          <Icon name="trash3" size={13} />
                        </button>
                      )}
                      {p.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          <Icon name="pin-angle-fill" size={10} /> {t("Fijado")}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">{p.sample ? t(p.text) : p.text}</p>
                    <div className="mt-3 flex gap-5 text-sm text-muted">
                      <button onClick={() => feed.toggleLike(p.id)} className={`press inline-flex items-center gap-1.5 ${p.liked ? "text-brand" : "hover:text-brand"}`}>
                        <Icon name={p.liked ? "hand-thumbs-up-fill" : "hand-thumbs-up"} size={14} /> {p.likes}
                      </button>
                      <button onClick={() => setOpenPost(openPost === p.id ? null : p.id)} className={`press inline-flex items-center gap-1.5 ${openPost === p.id ? "text-brand" : "hover:text-brand"}`}>
                        <Icon name="chat" size={14} /> {p.replyCount} · {t("Responder")}
                      </button>
                    </div>
                    {openPost !== p.id && p.replies.length > 0 && <RepliesPeek replies={p.replies} onOpen={() => setOpenPost(p.id)} />}
                    {openPost === p.id && <GroupReplies post={p} me={me.avatar} onReply={(text) => feed.reply(p.id, text)} />}
                  </div>
                ))}
              </div>
            )}

            {tab === "Miembros" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {memberList.length === 0 && <p className="text-sm text-muted">{t("Todavía no hay miembros. ¡Sé el primero en unirte!")}</p>}
                {memberList.map((m) => (
                  <div key={m.id} className={`${card} flex items-center gap-3 !p-4`}>
                    <Avatar src={m.avatar} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{m.id === myId ? `${m.name} (${t("tú")})` : m.name}</p>
                      <p className="text-xs text-muted">{t("Estudiante")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "Recursos" && (
              <div className={`${card} space-y-3`}>
                <MediaList items={groupMedia.list} admin={admin} empty={t("Este grupo aún no tiene recursos.")} />
                {admin && (
                  <button onClick={() => setAddingRes(true)} className="press inline-flex items-center gap-1.5 rounded-xl border border-dashed border-brand/40 px-3.5 py-2 text-sm font-semibold text-brand hover:bg-brand/5">
                    <Icon name="plus-lg" size={13} /> {t("Agregar recurso")}
                  </button>
                )}
                <AddMediaModal open={addingRes} onClose={() => setAddingRes(false)} courseId={`grupo:${g.id}`} lessonKey={null} place={t(g.name)} kind="pdf" />
              </div>
            )}

            {tab === "Eventos" && (
              <div className="space-y-3">
                {gEvents.length === 0 && (
                  <p className="rounded-[20px] border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
                    {t("Este grupo no tiene eventos programados.")}{" "}
                    <Link to="/comunidad/eventos" className="font-semibold text-brand">
                      {t("Ver todos los eventos")}
                    </Link>
                  </p>
                )}
                {gEvents.map((e) => (
                  <EventItem key={e.id} e={e} on={reg.has(e.id)} toggle={toggleReg} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className={card}>
            <p className="mb-2 font-display font-semibold text-ink">{t("Acerca del grupo")}</p>
            <p className="text-sm text-muted">
              {t(g.desc)} {t("Un espacio para resolver dudas, compartir material y aprender en comunidad.")}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {["Sé respetuoso con todos", "Comparte material propio o citado", "Sin spam ni publicidad"].map((r) => (
                <li key={r} className="flex gap-2">
                  <Icon name="check-lg" size={14} className="mt-0.5 text-mint" />
                  {t(r)}
                </li>
              ))}
            </ul>
          </div>
          <div className={card}>
            <p className="mb-3 font-display font-semibold text-ink">{t("Próximo evento")}</p>
            {gEvents[0] ? <EventItem e={gEvents[0]} on={reg.has(gEvents[0].id)} toggle={toggleReg} compact /> : <p className="text-sm text-muted">{t("Sin eventos por ahora.")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupReplies({ post, me, onReply }: { post: FeedPost; me: string; onReply: (text: string) => Promise<boolean> }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="animate-fade-up mt-4 space-y-3 border-t border-line pt-4">
      {post.replies.map((r) => (
        <div key={r.id} className="flex gap-2.5">
          <Avatar src={r.avatar} size={30} />
          <div className="flex-1 rounded-2xl bg-canvas px-3.5 py-2.5">
            <p className="text-xs font-semibold text-ink">
              {r.mine ? `${r.name} (${t("tú")})` : r.name} <span className="font-normal text-muted">· {ago(r.at)}</span>
            </p>
            <p className="text-sm text-ink-soft">{r.sample ? t(r.text) : r.text}</p>
          </div>
        </div>
      ))}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          setDraft("");
          if (await onReply(text)) sileo.success({ title: t("Respuesta publicada") });
        }}
        className="flex items-center gap-2.5"
      >
        <Avatar src={me} size={30} />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-line bg-canvas py-1.5 pl-4 pr-1.5 focus-within:border-brand/50">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("Escribe tu respuesta…")} className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted" />
          <button disabled={!draft.trim()} className="press grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={t("Enviar")}>
            <Icon name="send-fill" size={13} />
          </button>
        </div>
      </form>
    </div>
  );
}
