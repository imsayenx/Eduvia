-- =============================================================================
--  EDUVIA · Esquema de base de datos para Supabase
--  Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
--  Se puede ejecutar más de una vez (usa "if not exists" / "or replace").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PERFILES  (uno por usuario de auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nombres       text not null default '',
  apellidos     text not null default '',
  email         text,
  phone         text,
  career        text default 'Ingeniería en Sistemas',
  level         text default '1.er año',
  birth         date,
  location      text,
  quote         text,
  goal          text,
  avatar_url    text,
  interests     text[] not null default '{}',
  is_private    boolean not null default false,
  show_progress boolean not null default true,
  settings      jsonb not null default '{}'::jsonb,   -- tema, acento, idioma, notificaciones…
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil: ver el propio" on public.profiles;
create policy "perfil: ver el propio" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil: editar el propio" on public.profiles;
create policy "perfil: editar el propio" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "perfil: crear el propio" on public.profiles;
create policy "perfil: crear el propio" on public.profiles
  for insert with check (auth.uid() = id);

-- Tarjeta pública: lo que otros estudiantes pueden ver.
-- Si el perfil es privado solo se muestra nombre y foto.
create or replace view public.profile_cards as
select
  p.id,
  p.nombres,
  p.apellidos,
  p.avatar_url,
  p.is_private,
  case when p.is_private then null else p.career   end as career,
  case when p.is_private then null else p.location end as location,
  case when p.is_private then null else p.quote    end as quote
from public.profiles p;

grant select on public.profile_cards to authenticated;

-- Crear el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '');
begin
  insert into public.profiles (id, email, nombres, apellidos, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(split_part(full_name, ' ', 1), ''), split_part(new.email, '@', 1)),
    trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantener updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. PROGRESO EN LOS CURSOS
--    (el catálogo de cursos vive en el código: src/data.ts)
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    text not null,
  lesson_key   text not null,               -- "unidad-lección", ej. "0-2"
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, lesson_key)
);

create table if not exists public.course_state (
  user_id        uuid not null references auth.users (id) on delete cascade,
  course_id      text not null,
  current_lesson text not null default '0-0',
  started        boolean not null default true,
  updated_at     timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- Tareas entregadas (una por unidad)
create table if not exists public.assignment_submissions (
  user_id      uuid not null references auth.users (id) on delete cascade,
  course_id    text not null,
  unit_index   int  not null,
  submitted_at timestamptz not null default now(),
  primary key (user_id, course_id, unit_index)
);

-- -----------------------------------------------------------------------------
-- 3. COMUNIDAD
-- -----------------------------------------------------------------------------
create table if not exists public.group_members (
  group_id  text not null,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.event_registrations (
  event_id      text not null,
  user_id       uuid not null references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Publicaciones: del muro general (group_id null) o de un grupo
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  group_id   text,
  text       text not null check (char_length(text) between 1 and 2000),
  tag        text not null default 'Pregunta',
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_group_idx on public.posts (group_id);

create table if not exists public.post_likes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid   not null references auth.users (id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.post_replies (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  text       text   not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Comentarios en cada lección
create table if not exists public.lesson_comments (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null,
  lesson_key text not null,
  text       text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists lesson_comments_idx on public.lesson_comments (course_id, lesson_key);

-- Temas del foro de cada curso
create table if not exists public.forum_topics (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null,
  title      text not null check (char_length(title) between 1 and 300),
  created_at timestamptz not null default now()
);

-- Respuestas dentro de cada tema del foro
create table if not exists public.forum_replies (
  id         bigint generated always as identity primary key,
  topic_id   bigint not null references public.forum_topics (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  text       text   not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_idx on public.forum_replies (topic_id);

-- Valoraciones de los cursos (1 a 5 estrellas, una por estudiante)
create table if not exists public.course_ratings (
  user_id    uuid not null references auth.users (id) on delete cascade,
  course_id  text not null,
  stars      int  not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- Nota de los quiz (0 a 100) guardada junto a la lección completada
alter table public.lesson_progress add column if not exists score int check (score between 0 and 100);

-- -----------------------------------------------------------------------------
-- 4. DISPOSITIVOS CON SESIÓN
-- -----------------------------------------------------------------------------
create table if not exists public.devices (
  id         uuid primary key,                         -- lo genera el navegador
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  kind       text not null default 'desktop',          -- desktop | phone | tablet
  place      text,                                     -- zona horaria, ej. "Managua"
  last_seen  timestamptz not null default now(),
  revoked    boolean not null default false,           -- true = se cerró su sesión
  created_at timestamptz not null default now()
);

alter table public.devices add column if not exists place text;

-- -----------------------------------------------------------------------------
-- 5. SEGURIDAD (Row Level Security)
-- -----------------------------------------------------------------------------
-- Datos personales: cada quien solo ve y cambia lo suyo
do $$
declare t text;
begin
  foreach t in array array['lesson_progress','course_state','assignment_submissions',
                           'group_members','event_registrations','devices','course_ratings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "propio: todo" on public.%I', t);
    execute format('create policy "propio: todo" on public.%I for all
                    using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Contenido de la comunidad: lo leen todos los usuarios con sesión,
-- pero solo el autor puede crear, editar o borrar lo suyo
do $$
declare t text;
begin
  foreach t in array array['posts','post_likes','post_replies','lesson_comments','forum_topics','forum_replies']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "comunidad: leer" on public.%I', t);
    execute format('create policy "comunidad: leer" on public.%I for select to authenticated using (true)', t);
    execute format('drop policy if exists "comunidad: crear" on public.%I', t);
    execute format('create policy "comunidad: crear" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('drop policy if exists "comunidad: borrar" on public.%I', t);
    execute format('create policy "comunidad: borrar" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
  end loop;
end $$;

drop policy if exists "comunidad: editar" on public.posts;
create policy "comunidad: editar" on public.posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Contadores públicos (miembros por grupo / inscritos por evento) sin exponer quién es quién
create or replace view public.group_counts as
  select group_id, count(*)::int as members from public.group_members group by group_id;
create or replace view public.event_counts as
  select event_id, count(*)::int as registered from public.event_registrations group by event_id;
grant select on public.group_counts, public.event_counts to authenticated;

-- -----------------------------------------------------------------------------
-- 5b. CONTADORES REALES (todo empieza en cero)
--     Las vistas cuentan sin mostrar datos privados de nadie.
-- -----------------------------------------------------------------------------
create or replace view public.course_rating_stats as
  select course_id, round(avg(stars)::numeric, 1)::float as average, count(*)::int as total
  from public.course_ratings group by course_id;

create or replace view public.course_student_counts as
  select course_id, count(distinct user_id)::int as students
  from public.lesson_progress group by course_id;

create or replace view public.group_member_list as
  select gm.group_id, gm.joined_at, pc.id, pc.nombres, pc.apellidos, pc.avatar_url
  from public.group_members gm join public.profile_cards pc on pc.id = gm.user_id;

create or replace view public.community_stats as
  select (select count(*) from public.profiles)::int     as members,
         (select count(*) from public.posts)::int        as posts,
         (select count(*) from public.post_replies)::int as replies;

-- -----------------------------------------------------------------------------
-- 5c. CONTENIDO DE LOS CURSOS (videos, PDF, enlaces y anuncios)
--     Solo los ADMINISTRADORES pueden subir o borrar; todos pueden ver.
--     Para hacerte administrador (una sola vez), en el SQL Editor:
--       insert into public.admins (user_id)
--       select id from auth.users where email = 'TU-CORREO@gmail.com';
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins: verse a sí mismo" on public.admins;
create policy "admins: verse a sí mismo" on public.admins for select to authenticated using (auth.uid() = user_id);
-- (no hay política para insertar: solo se agregan desde el SQL Editor)

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.lesson_media (
  id           bigint generated always as identity primary key,
  course_id    text not null,
  lesson_key   text,                       -- "unidad-lección" (ej. "0-2"); vacío = material general del curso
  kind         text not null check (kind in ('video', 'pdf', 'file', 'link')),
  title        text not null check (char_length(title) between 1 and 200),
  url          text not null,              -- YouTube, Vimeo, Drive o el archivo subido a Storage
  storage_path text,                       -- ruta en el bucket "materiales" (si se subió un archivo)
  size_bytes   bigint,
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now()
);
create index if not exists lesson_media_idx on public.lesson_media (course_id, lesson_key);

create table if not exists public.course_announcements (
  id         bigint generated always as identity primary key,
  course_id  text not null,
  title      text not null check (char_length(title) between 1 and 200),
  body       text not null default '',
  pinned     boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['lesson_media','course_announcements']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "contenido: leer" on public.%I', t);
    execute format('create policy "contenido: leer" on public.%I for select to authenticated using (true)', t);
    execute format('drop policy if exists "contenido: administrar" on public.%I', t);
    execute format('create policy "contenido: administrar" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Las vistas solo para usuarios con sesión (nunca para visitantes anónimos)
do $$
declare v text;
begin
  foreach v in array array['profile_cards','group_counts','event_counts','course_rating_stats',
                           'course_student_counts','group_member_list','community_stats']
  loop
    execute format('revoke all on public.%I from anon', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 6. TIEMPO REAL (la comunidad se actualiza sola)
-- -----------------------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.posts';        exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.post_likes';   exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.post_replies'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.lesson_comments'; exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.forum_topics';    exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.forum_replies';   exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.lesson_media';         exception when others then null; end;
  begin execute 'alter publication supabase_realtime add table public.course_announcements'; exception when others then null; end;
end $$;

-- -----------------------------------------------------------------------------
-- 7. FOTOS DE PERFIL (Storage)
--    Cada usuario sube a avatars/<su-id>/... y la foto es pública para mostrarla.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars: ver" on storage.objects;
create policy "avatars: ver" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars: subir la propia" on storage.objects;
create policy "avatars: subir la propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: cambiar la propia" on storage.objects;
create policy "avatars: cambiar la propia" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars: borrar la propia" on storage.objects;
create policy "avatars: borrar la propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- 8. MATERIALES DE LOS CURSOS (Storage): videos, PDF y otros archivos
--    Todos los estudiantes pueden verlos; solo los administradores suben.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('materiales', 'materiales', true)
on conflict (id) do update set public = true;

drop policy if exists "materiales: ver" on storage.objects;
create policy "materiales: ver" on storage.objects
  for select using (bucket_id = 'materiales');

drop policy if exists "materiales: administrar" on storage.objects;
create policy "materiales: administrar" on storage.objects
  for all to authenticated
  using (bucket_id = 'materiales' and public.is_admin())
  with check (bucket_id = 'materiales' and public.is_admin());
