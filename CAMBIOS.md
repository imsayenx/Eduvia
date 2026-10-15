# Eduvia: cambios

## Diseño
- Barra superior con menú (Inicio, Cursos, Recursos, Mis avances, Comunidad), búsqueda, notificaciones y perfil.
- En celular, el menú se abre con el botón ☰ y se cierra deslizando hacia la izquierda.
- Inicio organizado como el diseño de referencia.
- Paleta más sobria: colores planos, sin brillos ni degradados.
- Íconos: Bootstrap Icons (`npm i bootstrap-icons`), en `src/icons.tsx`.

## Ajustes (el tema solo se cambia aquí)
- Tema Sistema / Claro / Oscuro y color de acento.
- Idioma: Español, English, Português, Français. Cambia toda la app al instante.
  - Los textos están en `src/locales/en.ts`, `pt.ts` y `fr.ts` (la clave es el texto en español).
- Perfil público o privado: muestra un aviso y, en el perfil, el distintivo «Privado».
- Cambiar contraseña, con validación y medidor de seguridad.
- Dispositivos conectados: lista, cerrar sesión en uno o en todos los demás.
- Exportar mis datos: descarga un archivo JSON.

## Perfil
- Editar perfil: nombre, contacto, carrera, frase, meta e intereses.
- Foto: subirla desde el equipo o tomarla con la cámara.
- Todo se guarda en el navegador.

## Cursos
- 18 cursos, cada uno con su propio contenido.
- Nuevo: Programación de aplicaciones de multimedia 1.
- Lecciones navegables con progreso guardado.

Ejecutar: `npm install` y luego `npm run dev`.

## Versión 7: todo funcional
- **Supabase + Vercel**: cuentas reales, base de datos, fotos en la nube y comunidad en tiempo real.
  Guía completa en `SUPABASE-VERCEL.md`. Sin claves, la app sigue en modo local.
- **Login renovado**: sin foto; muestra una vista previa de la app (progreso y logros).
- **¿Olvidaste tu contraseña?**:
  - Con Supabase envía un enlace real a `/restablecer`.
  - En modo local explica qué hacer.
- **Registro**: la cuenta nueva usa tu nombre y correo (ya no aparece «Steven»).
- **Finalizar curso**:
  - Si terminaste todo, muestra el certificado (se puede imprimir).
  - Si faltan lecciones, te dice cuáles y te lleva a ellas.
- **Foro de los cursos**: cada tema se abre y muestra las respuestas de todos; puedes responder y borrar lo tuyo.
- **Comunidad y grupos**: «Ver las N respuestas» muestra lo que otros escribieron.
- **Ajustes**:
  - Cambio de contraseña real.
  - Verificación en dos pasos con código QR.
  - Dispositivos reales: cerrar sesión en otro equipo.
  - Eliminar cuenta.

## Versión 8: todo en cero y contenido propio
- **Todo empieza en cero**: progreso, horas, racha, promedio, valoraciones, miembros, cupos e insignias se calculan de lo que hace cada persona.
  - Una cuenta nueva no tiene datos de ejemplo.
  - Ya no aparece «Steven».
- **Administrar contenido** (para administradores):
  - Subir videos, PDF, archivos y enlaces a cada lección o a cada grupo.
  - Publicar anuncios por curso.
- **Lecciones**: reproducen tu video real (YouTube, Vimeo, Drive o MP4) y muestran tus PDF en «Material de apoyo».
- **Recursos**: muestra el material real de todos los cursos.
- **Calificaciones reales**: la nota de cada quiz (se guarda la mejor). Las tareas aparecen como «Entregada».
- **Valorar cursos**: estrellas al terminar el curso. En las tarjetas se ve el promedio, o «Nuevo» si nadie lo ha valorado.
- **Notificaciones reales**: respuestas a tus publicaciones y temas, anuncios y material nuevo.
- **Comunidad**: personas en línea en tiempo real, miembros reales de cada grupo y eventos siempre con fechas próximas.


## Versión 9: material de estudio incluido
- **110 PDF con el logo de Eduvia**, en `public/materiales/<curso>/`:
  - una guía de estudio (A4) por cada unidad de los 18 cursos;
  - una presentación (16:9) por cada unidad.
- **Cada guía trae**: portada, introducción, objetivos, explicación de cada lección con ideas clave, glosario, actividad práctica, preguntas de repaso y respuestas.
- **Cada presentación trae**: portada, objetivos, una diapositiva por lección, glosario, actividad, repaso y cierre.
- **Dónde aparecen en la app**: en «Material de apoyo» de cada lección (los de su unidad), en «Recursos del curso» y en la página Recursos, con filtros «Guías» y «Presentaciones». Se pueden leer en el navegador o descargar.
- Sin nombres de docentes en ningún lugar de la app.
