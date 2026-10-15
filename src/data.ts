/* ==========================================================================
   Catálogo de cursos de Eduvia (datos de ejemplo).
   Cada curso tiene sus propias unidades y lecciones; la página del curso,
   las tarjetas y el progreso salen de aquí.
   ========================================================================== */

export type LessonType = "video" | "lectura" | "práctica" | "quiz";
/**
 * Una lección. Opcional: `video` (enlace de YouTube, Vimeo, Drive o .mp4) y
 * `files` (PDF o enlaces) escritos aquí mismo en el código, por ejemplo:
 *   { title: "Hola, mundo", min: 8, type: "video", video: "https://youtu.be/XXXXXXXXXXX",
 *     files: [{ title: "Guía 1", url: "/materiales/guia-1.pdf" }] }
 * (los archivos puestos en la carpeta public/materiales se sirven tal cual).
 * Lo que subas desde «Administrar contenido» se suma a esto.
 */
export type Lesson = { title: string; min: number; type: LessonType; summary?: string; video?: string; files?: { title: string; url: string }[] };
export type Unit = { title: string; summary: string; lessons: Lesson[] };

export type Course = {
  id: string;
  title: string;
  subject: string;
  level: "Principiante" | "Básico" | "Intermedio" | "Avanzado";
  image: string;
  color: string; // degradado de respaldo (si la foto no carga)
  accent: string; // color del curso
  icon: string; // ícono de Bootstrap Icons
  tags: string[];
  weeks: number;
  description: string;
  units: Unit[];
  // calculados
  lessons: number;
  minutes: number;
  hours: string;
};

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=560&fit=crop&auto=format`;
const v = (title: string, min = 12, summary?: string): Lesson => ({ title, min, type: "video", summary });
const r = (title: string, min = 10, summary?: string): Lesson => ({ title, min, type: "lectura", summary });
const p = (title: string, min = 20, summary?: string): Lesson => ({ title, min, type: "práctica", summary });
const q = (title: string, min = 10, summary?: string): Lesson => ({ title, min, type: "quiz", summary });

type Raw = Omit<Course, "lessons" | "minutes" | "hours">;

const raw: Raw[] = [
  {
    id: "matematicas",
    title: "Matemáticas desde cero",
    subject: "Matemáticas",
    level: "Básico",
    image: img("1635070041078-e363dbe005cb"),
    color: "from-slate-700 to-slate-900",
    accent: "#7562d0",
    icon: "plus-slash-minus",
    tags: ["Video", "Interactivo", "Quiz"],
    weeks: 5,
    description: "Domina las bases: operaciones, fracciones, álgebra y ecuaciones, con ejercicios guiados paso a paso.",
    units: [
      {
        title: "Números y operaciones",
        summary: "Repasamos los conjuntos numéricos y las operaciones básicas con sus propiedades.",
        lessons: [v("Números naturales y enteros"), v("Jerarquía de operaciones"), p("Ejercicios de operaciones combinadas"), q("Quiz: operaciones")],
      },
      {
        title: "Fracciones y decimales",
        summary: "Aprendemos a simplificar, comparar y operar fracciones y números decimales.",
        lessons: [v("¿Qué es una fracción?"), v("Suma y resta de fracciones"), r("Fracciones y decimales en la vida diaria"), q("Quiz: fracciones")],
      },
      {
        title: "Álgebra básica",
        summary: "Introducimos variables, expresiones algebraicas y ecuaciones de primer grado.",
        lessons: [v("Expresiones algebraicas"), v("Ecuaciones de primer grado", 18), p("Resolver problemas con ecuaciones"), q("Quiz: álgebra")],
      },
    ],
  },
  {
    id: "programacion-web",
    title: "Programación Web",
    subject: "Tecnología",
    level: "Intermedio",
    image: img("1461749280684-dccba630e2f6"),
    color: "from-indigo-800 to-slate-900",
    accent: "#2f6fe4",
    icon: "code-slash",
    tags: ["Video", "Interactivo", "Quiz"],
    weeks: 6,
    description: "Crea sitios web modernos con HTML, CSS y JavaScript: estructura, diseño adaptable e interactividad.",
    units: [
      {
        title: "HTML: la estructura",
        summary: "Construimos páginas con etiquetas semánticas, enlaces, imágenes y formularios.",
        lessons: [v("Cómo funciona la web"), v("Etiquetas HTML esenciales"), v("Formularios"), p("Tu primera página")],
      },
      {
        title: "CSS: el diseño",
        summary: "Damos estilo con selectores, el modelo de caja, Flexbox y Grid.",
        lessons: [v("Selectores y colores"), v("Modelo de caja"), v("Flexbox y Grid", 20), p("Maqueta una tarjeta de perfil")],
      },
      {
        title: "JavaScript: la interacción",
        summary: "Variables, funciones, eventos y manipulación del DOM.",
        lessons: [v("Variables y tipos de datos"), v("Funciones y eventos"), v("Manipular el DOM"), q("Quiz: JavaScript")],
      },
      {
        title: "Proyecto final",
        summary: "Integramos todo en un sitio adaptable y lo publicamos.",
        lessons: [r("Planificar el proyecto"), p("Construir el sitio", 45), r("Publicar en internet")],
      },
    ],
  },
  {
    id: "multimedia-1",
    title: "Programación de aplicaciones de multimedia 1",
    subject: "Tecnología",
    level: "Intermedio",
    image: img("1498050108023-c5249f4df085"),
    color: "from-fuchsia-800 to-slate-900",
    accent: "#b4559a",
    icon: "collection-play",
    tags: ["Video", "Audio", "Interactivo", "Quiz"],
    weeks: 6,
    description: "Diseña y programa aplicaciones que integran texto, imagen, audio, video y animación usando HTML5, CSS y JavaScript.",
    units: [
      {
        title: "Introducción a la multimedia",
        summary: "Qué es una aplicación multimedia, sus elementos y dónde se usan.",
        lessons: [
          v("¿Qué es la multimedia?"),
          v("Elementos multimedia: texto, imagen, audio, video y animación"),
          r("Tipos de aplicaciones multimedia"),
          q("Quiz: conceptos de multimedia"),
        ],
      },
      {
        title: "Diseño y planificación",
        summary: "Guion multimedia, storyboard, mapa de navegación y principios de interfaz.",
        lessons: [v("El guion multimedia"), v("Storyboard y mapa de navegación"), r("Principios de diseño de interfaces"), p("Planifica tu aplicación")],
      },
      {
        title: "Imagen y audio digital",
        summary: "Formatos, resolución, compresión y edición básica de imagen y sonido.",
        lessons: [v("Imagen digital: formatos y resolución"), v("Audio digital: formatos y compresión"), p("Optimiza imágenes y audio para la web")],
      },
      {
        title: "Video y animación",
        summary: "Formatos de video, códecs y animaciones con CSS y JavaScript.",
        lessons: [v("Video digital y códecs"), v("Animaciones con CSS"), v("Animaciones con JavaScript"), q("Quiz: video y animación")],
      },
      {
        title: "Desarrollo de la aplicación",
        summary: "HTML5 multimedia, canvas e interactividad para construir tu proyecto final.",
        lessons: [
          v("Etiquetas audio y video de HTML5"),
          v("Dibujar con canvas"),
          v("Interactividad con eventos"),
          p("Proyecto final: aplicación multimedia interactiva", 60),
        ],
      },
    ],
  },
  {
    id: "historia",
    title: "Historia de Nicaragua",
    subject: "Historia",
    level: "Básico",
    image: img("1552832230-c0197dd311b5"),
    color: "from-amber-700 to-stone-800",
    accent: "#e09a1e",
    icon: "bank",
    tags: ["Video", "Imagen", "Quiz"],
    weeks: 4,
    description: "Un recorrido por los pueblos originarios, la colonia, la independencia y la Nicaragua contemporánea.",
    units: [
      {
        title: "Pueblos originarios",
        summary: "Conocemos a los pueblos que habitaban el territorio antes de la llegada de los europeos.",
        lessons: [v("Nicaraos, chorotegas y miskitos"), r("Organización social y cultura"), q("Quiz: pueblos originarios")],
      },
      {
        title: "La época colonial",
        summary: "La conquista, la fundación de ciudades y la vida durante la colonia.",
        lessons: [v("La conquista española"), v("Fundación de León y Granada"), r("Economía y sociedad colonial")],
      },
      {
        title: "Independencia y siglo XIX",
        summary: "El proceso de independencia y la formación del Estado nicaragüense.",
        lessons: [v("La independencia de 1821"), v("Guerra Nacional de 1856"), q("Quiz: siglo XIX")],
      },
      {
        title: "Nicaragua contemporánea",
        summary: "Los principales procesos del siglo XX y la Nicaragua de hoy.",
        lessons: [v("Siglo XX: cambios y conflictos"), r("Cultura e identidad nicaragüense"), p("Línea del tiempo")],
      },
    ],
  },
  {
    id: "ingles",
    title: "Inglés para principiantes",
    subject: "Inglés",
    level: "Principiante",
    image: img("1529655683826-aba9b3e77383"),
    color: "from-sky-700 to-blue-900",
    accent: "#2793cf",
    icon: "globe2",
    tags: ["Video", "Audio", "Interactivo"],
    weeks: 6,
    description: "Empieza a comunicarte en inglés: saludos, presentaciones, vocabulario cotidiano y gramática esencial.",
    units: [
      {
        title: "Hello! Primeros pasos",
        summary: "Saludos, presentaciones y el verbo to be.",
        lessons: [v("Greetings and introductions"), v("The verb to be"), p("Practice: introduce yourself"), q("Quiz: unit 1")],
      },
      {
        title: "My daily life",
        summary: "Rutinas, horas y el presente simple.",
        lessons: [v("Telling the time"), v("Present simple"), p("Listening: a day in the life")],
      },
      {
        title: "Around town",
        summary: "Lugares, direcciones y preposiciones de lugar.",
        lessons: [v("Places in the city"), v("Asking for directions"), q("Quiz: around town")],
      },
    ],
  },
  {
    id: "bases-de-datos",
    title: "Bases de datos",
    subject: "Tecnología",
    level: "Intermedio",
    image: img("1544383835-bda2bc66a55d"),
    color: "from-blue-800 to-slate-900",
    accent: "#2f6fe4",
    icon: "database",
    tags: ["Video", "Interactivo", "Quiz"],
    weeks: 4,
    description: "Aprende a diseñar, administrar y trabajar con bases de datos relacionales utilizando MySQL.",
    units: [
      {
        title: "Introducción a los sistemas de bases de datos",
        summary: "Qué es una base de datos, tipos y cómo se organizan los sistemas gestores.",
        lessons: [
          v("¿Qué es una base de datos?"),
          v("Tipos de bases de datos"),
          v("Estructuras de los SGBD", 13, "Conocerás las estructuras de los Sistemas Gestores de Bases de Datos: monolítica, jerárquica, máquina virtual, cliente-servidor y microkernel."),
          r("Ventajas y desventajas"),
          p("Actividad de la unidad"),
        ],
      },
      {
        title: "Consultas SQL básicas",
        summary: "SELECT, filtros, ordenamiento y funciones de agregación.",
        lessons: [v("SELECT y FROM"), v("WHERE y operadores"), v("ORDER BY y LIMIT"), p("Practica tus consultas")],
      },
      {
        title: "Tablas y relaciones",
        summary: "Claves primarias y foráneas, relaciones y normalización.",
        lessons: [v("Claves primarias y foráneas"), v("Relaciones 1:N y N:M"), r("Normalización"), q("Quiz: modelo relacional")],
      },
      {
        title: "Procedimientos almacenados y triggers",
        summary: "Automatiza tareas dentro de la base de datos.",
        lessons: [v("Procedimientos almacenados"), v("Triggers"), p("Proyecto: base de datos de una tienda", 40)],
      },
    ],
  },
  {
    id: "diseno-grafico",
    title: "Diseño Gráfico",
    subject: "Arte",
    level: "Principiante",
    image: img("1626785774573-4b799315345d"),
    color: "from-fuchsia-700 to-purple-900",
    accent: "#b4559a",
    icon: "vector-pen",
    tags: ["Video", "Imagen"],
    weeks: 4,
    description: "Fundamentos del diseño: color, tipografía, composición y creación de piezas para redes sociales.",
    units: [
      {
        title: "Principios del diseño",
        summary: "Equilibrio, contraste, jerarquía y espacio en blanco.",
        lessons: [v("¿Qué hace bueno a un diseño?"), v("Composición y jerarquía"), p("Analiza un afiche")],
      },
      {
        title: "Color y tipografía",
        summary: "Psicología del color, paletas y cómo combinar tipografías.",
        lessons: [v("Teoría del color"), v("Elegir tipografías"), p("Crea tu paleta")],
      },
      {
        title: "Proyecto: identidad visual",
        summary: "Diseña un logotipo y piezas para redes sociales.",
        lessons: [v("Diseño de logotipos"), p("Tu identidad visual", 40), q("Quiz final")],
      },
    ],
  },
  {
    id: "sistema-solar",
    title: "El Sistema Solar",
    subject: "Ciencias",
    level: "Intermedio",
    image: img("1614732414444-096e5f1122d5"),
    color: "from-orange-600 to-slate-900",
    accent: "#e0783a",
    icon: "globe-americas",
    tags: ["Video", "Imagen", "Interactivo"],
    weeks: 3,
    description: "Descubre los planetas, sus características y los misterios del universo en este curso interactivo.",
    units: [
      {
        title: "Nuestro lugar en el universo",
        summary: "El Sol, las galaxias y cómo se formó el sistema solar.",
        lessons: [v("El Sol, nuestra estrella"), v("¿Cómo se formó el sistema solar?"), r("Distancias en el espacio")],
      },
      {
        title: "Los planetas",
        summary: "Planetas rocosos, gigantes gaseosos y sus lunas.",
        lessons: [v("Mercurio, Venus, Tierra y Marte"), v("Júpiter y Saturno"), v("Urano y Neptuno"), q("Quiz: los planetas")],
      },
      {
        title: "Más allá de los planetas",
        summary: "Planetas enanos, cometas, asteroides y la exploración espacial.",
        lessons: [v("Cometas y asteroides"), r("La exploración espacial"), p("Maqueta del sistema solar", 30)],
      },
    ],
  },
  {
    id: "biologia",
    title: "La célula y sus funciones",
    subject: "Ciencias",
    level: "Básico",
    image: img("1532094349884-543bc11b234d"),
    color: "from-emerald-700 to-teal-900",
    accent: "#259b6a",
    icon: "flower1",
    tags: ["Video", "Imagen", "Quiz"],
    weeks: 4,
    description: "Explora la unidad básica de la vida: tipos de células, organelos y procesos como la respiración celular.",
    units: [
      {
        title: "Introducción a la célula",
        summary: "Teoría celular y diferencias entre células procariotas y eucariotas.",
        lessons: [v("La teoría celular"), v("Procariotas y eucariotas"), q("Quiz: tipos de células")],
      },
      {
        title: "Organelos celulares",
        summary: "Núcleo, mitocondrias, ribosomas y más: qué hace cada uno.",
        lessons: [v("El núcleo y el ADN"), v("Mitocondrias y cloroplastos"), r("Membrana celular"), p("Dibuja una célula")],
      },
      {
        title: "Funciones de la célula",
        summary: "Nutrición, respiración celular y división.",
        lessons: [v("Respiración celular"), v("Mitosis y meiosis"), q("Quiz final")],
      },
    ],
  },
  {
    id: "inteligencia-artificial",
    title: "Introducción a la Inteligencia Artificial",
    subject: "Tecnología",
    level: "Principiante",
    image: img("1620712943543-bcc4688e7485"),
    color: "from-indigo-700 to-violet-900",
    accent: "#5566cc",
    icon: "cpu",
    tags: ["Video", "Interactivo"],
    weeks: 4,
    description: "Entiende qué es la IA, cómo aprenden las máquinas y cómo usarla de forma responsable en tus estudios.",
    units: [
      {
        title: "¿Qué es la IA?",
        summary: "Historia, conceptos clave y tipos de inteligencia artificial.",
        lessons: [v("Breve historia de la IA"), v("IA, machine learning y deep learning"), q("Quiz: conceptos")],
      },
      {
        title: "Cómo aprenden las máquinas",
        summary: "Datos, modelos y entrenamiento explicado de forma sencilla.",
        lessons: [v("Datos y patrones"), v("Redes neuronales sin fórmulas"), p("Entrena un clasificador sin código")],
      },
      {
        title: "IA en tu día a día",
        summary: "Asistentes, prompts y uso ético de la IA.",
        lessons: [v("Cómo escribir buenos prompts"), r("Ética y uso responsable"), p("Usa la IA para estudiar")],
      },
    ],
  },
  {
    id: "python",
    title: "Python desde cero",
    subject: "Tecnología",
    level: "Principiante",
    image: img("1555066931-4365d14bab8c"),
    color: "from-teal-700 to-slate-900",
    accent: "#1f998c",
    icon: "terminal",
    tags: ["Video", "Interactivo", "Quiz"],
    weeks: 5,
    description: "Aprende a programar con Python: variables, condiciones, ciclos, funciones y tu primer proyecto.",
    units: [
      {
        title: "Primeros pasos",
        summary: "Instalación, el intérprete y tus primeras líneas de código.",
        lessons: [v("Instalar Python"), v("Hola, mundo"), v("Variables y tipos"), q("Quiz: fundamentos")],
      },
      {
        title: "Control de flujo",
        summary: "Condiciones y ciclos para que tu programa tome decisiones.",
        lessons: [v("if, elif y else"), v("Ciclos for y while"), p("Juego: adivina el número")],
      },
      {
        title: "Funciones y listas",
        summary: "Organiza tu código y trabaja con colecciones de datos.",
        lessons: [v("Funciones"), v("Listas y diccionarios"), p("Proyecto: lista de tareas", 40)],
      },
    ],
  },
  {
    id: "react",
    title: "React para principiantes",
    subject: "Tecnología",
    level: "Avanzado",
    image: img("1633356122544-f134324a6cee"),
    color: "from-cyan-700 to-slate-900",
    accent: "#2793cf",
    icon: "filetype-jsx",
    tags: ["Video", "Interactivo"],
    weeks: 5,
    description: "Construye interfaces modernas con componentes, estado y hooks de React.",
    units: [
      {
        title: "Componentes",
        summary: "JSX, props y cómo dividir una interfaz en componentes.",
        lessons: [v("¿Qué es React?"), v("JSX y componentes"), v("Props"), p("Tu primer componente")],
      },
      {
        title: "Estado e interacción",
        summary: "useState, eventos y listas dinámicas.",
        lessons: [v("useState"), v("Eventos y formularios"), v("Renderizar listas"), q("Quiz: estado")],
      },
      {
        title: "Proyecto",
        summary: "Una app completa con datos y rutas.",
        lessons: [v("useEffect y datos"), v("Rutas con React Router"), p("Proyecto final", 50)],
      },
    ],
  },
  {
    id: "ingles-conversacional",
    title: "Inglés conversacional",
    subject: "Inglés",
    level: "Intermedio",
    image: img("1543269865-cbf427effbad"),
    color: "from-blue-700 to-indigo-900",
    accent: "#2f6fe4",
    icon: "chat-quote",
    tags: ["Audio", "Video", "Interactivo"],
    weeks: 4,
    description: "Gana fluidez con conversaciones reales, pronunciación y expresiones de uso diario.",
    units: [
      {
        title: "Small talk",
        summary: "Romper el hielo y mantener una conversación.",
        lessons: [v("Starting a conversation"), v("Useful expressions"), p("Role play: meeting someone new")],
      },
      {
        title: "Pronunciation",
        summary: "Sonidos difíciles, entonación y ritmo.",
        lessons: [v("Vowel sounds"), v("Intonation"), p("Record yourself")],
      },
      {
        title: "Real situations",
        summary: "En el restaurante, de viaje y en una entrevista.",
        lessons: [v("At the restaurant"), v("Travelling"), v("Job interview"), q("Final quiz")],
      },
    ],
  },
  {
    id: "pintura",
    title: "Pintura y color",
    subject: "Arte",
    level: "Básico",
    image: img("1513364776144-60967b0f800f"),
    color: "from-rose-600 to-purple-900",
    accent: "#de5a4c",
    icon: "palette",
    tags: ["Video", "Imagen"],
    weeks: 3,
    description: "Técnicas de acuarela y acrílico, mezcla de colores y composición para tus primeras obras.",
    units: [
      {
        title: "Materiales y técnica",
        summary: "Pinceles, papeles, pinturas y cómo usarlos.",
        lessons: [v("Materiales básicos"), v("Técnicas de pincel"), p("Ejercicios de trazo")],
      },
      {
        title: "Mezcla de colores",
        summary: "Círculo cromático, armonías y contraste.",
        lessons: [v("El círculo cromático"), v("Armonías de color"), p("Paleta limitada")],
      },
      {
        title: "Tu primera obra",
        summary: "Composición y un paisaje paso a paso.",
        lessons: [v("Composición"), p("Pinta un paisaje", 45)],
      },
    ],
  },
  {
    id: "fotografia",
    title: "Fotografía con tu celular",
    subject: "Arte",
    level: "Principiante",
    image: img("1452587925148-ce544e77e70d"),
    color: "from-stone-700 to-slate-900",
    accent: "#7562d0",
    icon: "camera",
    tags: ["Video", "Imagen"],
    weeks: 3,
    description: "Toma mejores fotos con lo que tienes: luz, encuadre, composición y edición básica.",
    units: [
      {
        title: "Luz y encuadre",
        summary: "Aprovecha la luz natural y la regla de los tercios.",
        lessons: [v("La luz lo es todo"), v("Regla de los tercios"), p("Reto: 5 fotos con luz natural")],
      },
      {
        title: "Edición",
        summary: "Ajustes básicos y estilo propio.",
        lessons: [v("Exposición y contraste"), v("Color y estilo"), q("Quiz final")],
      },
    ],
  },
  {
    id: "musica",
    title: "Teoría musical básica",
    subject: "Arte",
    level: "Principiante",
    image: img("1511379938547-c1f69419868d"),
    color: "from-violet-700 to-slate-900",
    accent: "#7562d0",
    icon: "music-note-beamed",
    tags: ["Audio", "Video", "Quiz"],
    weeks: 3,
    description: "Lee partituras, entiende el ritmo y construye acordes desde cero.",
    units: [
      {
        title: "Ritmo",
        summary: "Figuras musicales, compases y tempo.",
        lessons: [v("Figuras y silencios"), v("Compases"), p("Ejercicios de ritmo")],
      },
      {
        title: "Melodía y armonía",
        summary: "Notas, escalas y acordes básicos.",
        lessons: [v("Las notas en el pentagrama"), v("Escalas mayores"), v("Acordes"), q("Quiz final")],
      },
    ],
  },
  {
    id: "tecnicas-estudio",
    title: "Técnicas de estudio",
    subject: "Otros",
    level: "Principiante",
    image: img("1434030216411-0b793f4b4173"),
    color: "from-sky-700 to-slate-900",
    accent: "#2793cf",
    icon: "journal-check",
    tags: ["Video", "Interactivo"],
    weeks: 2,
    description: "Organiza tu tiempo, toma mejores apuntes y prepárate para tus exámenes con métodos probados.",
    units: [
      {
        title: "Organiza tu tiempo",
        summary: "Planificación semanal y la técnica Pomodoro.",
        lessons: [v("Planificar tu semana"), v("Técnica Pomodoro"), p("Arma tu horario")],
      },
      {
        title: "Aprende mejor",
        summary: "Apuntes, mapas mentales y repaso espaciado.",
        lessons: [v("Método Cornell"), v("Mapas mentales"), v("Repaso espaciado"), q("Quiz final")],
      },
    ],
  },
  {
    id: "bienestar",
    title: "Mindfulness y bienestar",
    subject: "Otros",
    level: "Principiante",
    image: img("1506126613408-eca07ce68773"),
    color: "from-emerald-600 to-slate-900",
    accent: "#259b6a",
    icon: "heart-pulse",
    tags: ["Audio", "Video"],
    weeks: 2,
    description: "Herramientas para manejar el estrés, mejorar tu concentración y cuidar tu bienestar como estudiante.",
    units: [
      {
        title: "Atención plena",
        summary: "Qué es el mindfulness y cómo practicarlo cada día.",
        lessons: [v("¿Qué es el mindfulness?"), v("Respiración consciente"), p("Práctica guiada de 10 minutos")],
      },
      {
        title: "Hábitos saludables",
        summary: "Descanso, pausas activas y manejo del estrés antes de exámenes.",
        lessons: [v("Dormir bien para aprender mejor"), v("Manejo del estrés"), q("Autoevaluación")],
      },
    ],
  },
];

export const courses: Course[] = raw.map((c) => {
  const all = c.units.flatMap((u) => u.lessons);
  const minutes = all.reduce((s, l) => s + l.min, 0);
  return { ...c, lessons: all.length, minutes, hours: `${(minutes / 60).toFixed(1)} h` };
});

export const findCourse = (id?: string) => courses.find((c) => c.id === id);

/* Materias: los conteos se calculan con el catálogo */
const subjectMeta = [
  { name: "Matemáticas", icon: "plus-slash-minus", color: "#7562d0" },
  { name: "Ciencias", icon: "flask", color: "#259b6a" },
  { name: "Historia", icon: "bank", color: "#e09a1e" },
  { name: "Inglés", icon: "globe2", color: "#2793cf" },
  { name: "Tecnología", icon: "code-slash", color: "#1f998c" },
  { name: "Arte", icon: "palette-fill", color: "#b4559a" },
  { name: "Otros", icon: "three-dots", color: "#66758c" },
];
export const subjects = subjectMeta.map((s) => ({ ...s, count: courses.filter((c) => c.subject === s.name).length }));

export const filterTabs = ["Todos", ...subjectMeta.map((s) => s.name)];
