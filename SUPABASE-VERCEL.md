# Eduvia con Supabase y Vercel: guía paso a paso

Eduvia funciona de dos maneras:

| Modo | Cuándo | Qué pasa |
|---|---|---|
| **Local (demostración)** | No hay archivo `.env` | Entras con cualquier correo y todo se guarda en el navegador. |
| **Nube (Supabase)** | Hay `.env` con las claves | Cuentas reales, base de datos, fotos en la nube, comunidad en tiempo real. |

No hay que cambiar código para pasar de un modo al otro: solo agregar las variables de entorno.

---

## 1. Crear el proyecto en Supabase

1. Entra a <https://supabase.com>, crea una cuenta y luego **New project**.
2. Ponle nombre (ej. `eduvia`), una contraseña para la base de datos y la región más cercana (ej. *East US*).
3. Espera 1–2 minutos a que termine de crearse.

## 2. Crear las tablas

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** y pégalo.
3. Pulsa **Run**. Debe decir *Success*. (Se puede ejecutar otra vez sin problema).

Esto crea:

- **profiles**: el perfil de cada estudiante. Se crea solo al registrarse.
- **lesson_progress**, **course_state** y **assignment_submissions**: el progreso de los cursos y las tareas entregadas.
- **group_members** y **event_registrations**: los grupos a los que se unió y los eventos donde se inscribió.
- **posts**, **post_likes** y **post_replies**: el muro de Comunidad y los grupos.
- **lesson_comments**, **forum_topics** y **forum_replies**: los comentarios de las lecciones y el foro de cada curso.
- **devices**: los dispositivos con sesión abierta.
- **course_ratings**: las estrellas que cada estudiante le da a un curso.
- **lesson_media**, **course_announcements** y **admins**: tu material (videos, PDF, enlaces), los anuncios y quién puede subirlos.
- Los *buckets* **avatars** (fotos de perfil) y **materiales** (tus videos y PDF).

> ¿Ya lo habías ejecutado antes? Vuelve a pegarlo y ejecutarlo: agrega lo nuevo sin borrar nada.

La seguridad (RLS) ya viene configurada:

- Cada quien solo ve y cambia **su** progreso.
- Los mensajes de la comunidad los leen todos, pero solo el autor puede borrarlos.
- Un perfil privado oculta la carrera, la ubicación y la frase.

## 3. Copiar las claves

En **Project Settings → API** (o **API Keys**) copia:

- **Project URL** → `https://xxxx.supabase.co`
- **anon / public key** (o *Publishable key*) → la clave pública
- **service_role key** (o *Secret key*): es **secreta**. Solo se usa en Vercel para eliminar cuentas.

## 4. Probar en tu PC

1. En la carpeta del proyecto, copia `.env.example` y renómbralo a `.env`.
2. Pega tus valores:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

3. En la terminal:

   ```
   npm install
   npm run dev
   ```

4. Abre la dirección que muestra la terminal y crea una cuenta en **Regístrate**.

> Supabase pide confirmar el correo por defecto. Para pruebas rápidas puedes desactivarlo en
> **Authentication → Sign In / Providers → Email → Confirm email**.

## 5. Configurar los enlaces de inicio de sesión

En **Authentication → URL Configuration**:

- **Site URL**: `https://TU-APP.vercel.app` (cuando ya la publiques).
- **Redirect URLs**: agrega las dos:
  - `http://localhost:5173/**`
  - `https://TU-APP.vercel.app/**`

Esto hace funcionar «¿Olvidaste tu contraseña?», la confirmación de correo y Google/Microsoft.

## 6. Hacerte administrador (para subir videos y PDF)

1. Entra a la app y crea tu cuenta normal (Regístrate).
2. En Supabase → **SQL Editor** ejecuta, con tu correo:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'TU-CORREO@gmail.com';
   ```

3. Cierra sesión y vuelve a entrar. En el menú de tu perfil aparece **Administrar contenido**.

Por seguridad nadie puede hacerse administrador desde la app: solo desde el SQL Editor.

## 7. Subir tus videos, PDF y anuncios

En **Administrar contenido**:

1. Elige el curso (o un grupo) en la lista de la izquierda.
2. Usa las pestañas:
   - **Lecciones**: pulsa **Agregar** en la lección y elige el tipo:
     - **Video**: sube un MP4 o pega un enlace de YouTube, Vimeo o Google Drive.
     - **PDF** o **Archivo**: Word, PowerPoint, ZIP…
     - **Enlace**: cualquier página web.
   - **Material general**: lo que sirve para todo el curso. Sale en la página **Recursos** y en «Recursos del curso».
   - **Anuncios**: avisos para los estudiantes, con la opción de fijarlos arriba.

Los estudiantes lo ven al instante:

- El video reemplaza la vista previa de la lección.
- Los PDF aparecen en «Material de apoyo».
- Les llega una notificación de «Nuevo material» o «Nuevo anuncio».

También puedes agregar material desde la misma lección («Material de apoyo» → **Agregar video, PDF o enlace**).

**Límites del plan gratuito de Supabase:** 1 GB de almacenamiento y archivos de hasta 50 MB.

- **Videos**: lo mejor es subirlos a **YouTube como «No listado»** y pegar el enlace. No gastan espacio y se ven en cualquier conexión.
- **PDF y presentaciones**: súbelos directamente.

**Otra opción, sin panel:** escribirlo en el código, en `src/data.ts`, dentro de la lección:

```ts
{ title: "Hola, mundo", min: 8, type: "video",
  video: "https://youtu.be/XXXXXXXXXXX",
  files: [{ title: "Guía 1 (PDF)", url: "/materiales/guia-1.pdf" }] }
```

Si el PDF está en tu PC, ponlo en la carpeta `public/materiales/` del proyecto y se publicará junto con la app.

## 8. Empezar de cero

Una cuenta nueva siempre empieza en cero: sin progreso, sin estrellas, sin miembros y sin publicaciones. Todos los números se calculan de lo que la gente hace de verdad.

Si hiciste pruebas y quieres dejar todo limpio antes de publicar, ejecuta en el SQL Editor:

```sql
-- Borra la actividad de prueba (progreso, comunidad, foros, valoraciones…)
truncate public.lesson_progress, public.course_state, public.assignment_submissions,
         public.group_members, public.event_registrations, public.posts, public.post_likes,
         public.post_replies, public.lesson_comments, public.forum_topics, public.forum_replies,
         public.course_ratings, public.devices restart identity cascade;

-- (Opcional) borrar también las cuentas de prueba. ¡Esto borra a TODOS los usuarios!
-- delete from auth.users;
```

Tu material (videos, PDF y anuncios) no se borra con esto.

## 9. Google y Microsoft (opcional)

En **Authentication → Sign In / Providers**:

- **Google**
  1. Crea un *OAuth Client ID* (tipo *Web*) en <https://console.cloud.google.com> → *APIs y servicios* → *Credenciales*.
  2. En *URI de redireccionamiento autorizados* pega la *Callback URL* que muestra Supabase (`https://xxxx.supabase.co/auth/v1/callback`).
  3. Copia el *Client ID* y el *Client Secret* en Supabase y activa el proveedor.
- **Azure (Microsoft)**
  1. Registra una app en <https://entra.microsoft.com> → *App registrations*, con la misma Callback URL.
  2. Crea un *client secret*.
  3. En Supabase pega el *Application (client) ID*, el *secret* y como *Azure Tenant URL* `https://login.microsoftonline.com/common`.

## 10. Publicar en Vercel

1. Sube el proyecto a GitHub. El archivo `.env` **no** se sube: ya está en `.gitignore`.
2. En <https://vercel.com>: **Add New → Project** → elige el repositorio. Vercel detecta Vite solo.
3. Antes de *Deploy*, en **Environment Variables** agrega:

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | tu Project URL |
   | `VITE_SUPABASE_ANON_KEY` | tu clave pública |
   | `SUPABASE_SERVICE_ROLE_KEY` | tu clave **secreta** (sin `VITE_` delante) |

4. Pulsa **Deploy**. Copia la dirección que te da (ej. `https://eduvia.vercel.app`) y ponla en el paso 5.

> Si cambias una variable en Vercel, vuelve a publicar (**Deployments → Redeploy**) para que se aplique.

---

## Cómo está organizado el código

| Archivo | Qué hace |
|---|---|
| `src/lib/supabase.ts` | Crea la conexión. Si no hay claves, la app entra en modo local. |
| `src/auth.ts` | Iniciar sesión y registrarse, Google/Microsoft, recuperar la contraseña, verificación en dos pasos, cerrar sesión, eliminar la cuenta. |
| `src/lib/sync.ts` | Al entrar **baja** tus datos; cada cambio lo **sube**; al salir borra la copia del navegador. |
| `src/lib/feed.ts` | Publicaciones, me gusta, respuestas y foros, con **tiempo real**. |
| `src/lib/content.ts` | Videos, PDF, enlaces y anuncios: subir con barra de avance, listar, borrar. |
| `src/lib/stats.ts` | Estadísticas reales: horas, racha, promedio, insignias y actividad. |
| `src/lib/notifications.ts` | Notificaciones reales: respuestas, anuncios y material nuevo. |
| `src/pages/Contenido.tsx` | Panel **Administrar contenido**. |
| `api/delete-account.ts` | Función de Vercel que borra la cuenta con la clave secreta. Esa clave nunca llega al navegador. |
| `vercel.json` | Hace que rutas como `/cursos` funcionen al recargar la página. |
| `supabase/schema.sql` | Tablas, seguridad, tiempo real y almacenamiento de fotos. |

### Ejemplo: cómo se guarda una lección completada

```ts
// src/progress.ts: la pantalla se actualiza al instante (caché local)…
setDone(course, ref, true);

// …y src/lib/sync.ts lo sube a Supabase
await supabase.from("lesson_progress").upsert({ user_id, course_id, lesson_key: "0-2" });
```

### Ejemplo: comunidad en tiempo real

```ts
supabase
  .channel("feed")
  .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, recargar)
  .subscribe();
```

Si otra persona publica, responde o da me gusta, aparece sola en tu pantalla.

## Problemas comunes

- **«Invalid API key»**: la clave está mal copiada o le sobra un espacio en el `.env`.
- **El enlace del correo lleva a una página en blanco o a `localhost`**: revisa el paso 5.
- **No llegan correos**: el correo incluido en Supabase envía muy pocos por hora y es solo para pruebas. Para uso real configura tu propio SMTP en **Authentication → Emails → SMTP Settings**.
- **No veo «Administrar contenido»**: revisa el paso 6 y vuelve a iniciar sesión.
- **Un video subido no se reproduce**: usa MP4 (H.264). Los formatos .mov o .avi no los abren todos los navegadores.
- **«Eliminar cuenta» falla en tu PC**: es normal. Esa función solo existe en Vercel (o con `npx vercel dev`).
