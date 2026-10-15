/* ==========================================================================
   VIDEOS DE YOUTUBE DE CADA LECCIÓN
   · Uno por lección de tipo «video»: [id del video, título, canal].
   · Todos se comprobaron con YouTube (existen y se pueden ver dentro de
     otras páginas). Se reproducen dentro de Eduvia con youtube-nocookie.
   · Si un administrador sube otro video a la lección desde el panel, se
     muestra ese en lugar de este.
   · Para cambiar uno: reemplaza el id (las 11 letras después de «v=» en el
     enlace de YouTube) y el título.
   ========================================================================== */

type Entry = [id: string, title: string, channel: string];

export const LESSON_VIDEOS: Record<string, Record<string, Entry>> = {
  "matematicas": {
    "0-0": ["KY5iFYnjC-c", "NÚMEROS NATURALES y ENTEROS Explicación Fácil", "Aprende sin parar"],
    "0-1": ["27KzUX-126M", "JERARQUÍA DE OPERACIONES (nivel fácil)", "escoolcrearmatematicas"],
    "1-0": ["xNcOGKj1hrc", "¡Ahora sí vas a entender las FRACCIONES!", "CuriosaMente"],
    "1-1": ["qJtoI1ipxs8", "SUMA Y RESTA DE FRACCIONES CON DIFERENTE DENOMINADOR", "Daniel Carreón"],
    "2-0": ["wZzDhzbNq5M", "Expresiones algebraicas. INTRODUCCIÓN al ÁLGEBRA", "Ruben Sebastian"],
    "2-1": ["ZM-1LH7xw5U", "ECUACIONES DE PRIMER GRADO DESDE CERO, PARA PRINCIPIANTES", "Matemáticas con Juan"],
  },
  "programacion-web": {
    "0-0": ["49zdlyLSwhQ", "Modelo Cliente Servidor, Explicación Simple", "Fazt"],
    "0-2": ["bj7Xtdsjclk", "HTML Paso a Paso: Formularios", "Developeando"],
    "1-0": ["0YXp3NCjxiE", "Selectores Básicos en CSS", "render2web"],
    "1-1": ["D6ojCuVYBVw", "Qué es el modelo de caja en CSS y cómo funciona", "enguillem"],
    "1-2": ["hEcrTFblhvU", "Aprende FLEXBOX y CSS Grid Layout desde cero", "Kiko Palomares"],
    "2-0": ["XC-Mdb6KMBM", "VARIABLES y TIPOS de datos - Curso de JAVASCRIPT desde CERO", "Desarrollo Útil"],
    "0-1": ["kO6XGYU4vAg", "Etiquetas Básicas de HTML: Guía Completa para Principiantes", "ProfesorenVideo"],
    "2-1": ["8Juz73pfNhQ", "Curso Javascript - EVENTOS [addEventListener]", "Programando el Destino"],
    "2-2": ["8H8GUgukKWI", "Tutorial práctico de manipulación del DOM con JavaScript", "JuanDavid_Dev"],
  },
  "multimedia-1": {
    "0-0": ["e-lQYKYbOtI", "¿Qué es la multimedia?", "Udearroba"],
    "0-1": ["uy4Bt9aln-Y", "Elementos multimedia conceptos básicos", "Franahid Dsilva"],
    "1-0": ["__rM1L7BcGM", "Elaboración del guion literario y técnico del proyecto multimedia", "Carlos Alberto Fuel Tulcán"],
    "1-1": ["q3YIgn35g2o", "¿Qué es un MAPA DE NAVEGACIÓN - ÁRBOL DE NAVEGACIÓN? Cómo se hace paso a paso", "Design Thinking 24 7 by Jorge Huertas"],
    "2-0": ["HsH_ufa_hPI", "Todos los Formatos de Imagen Explicados en 8 Minutos", "Explainer Chris ESP"],
    "2-1": ["gMc-QCfKlqM", "FORMATOS DE AUDIO DIGITAL - PCM, DSD, WAV, FLAC, MP3 y MQA", "HiFi"],
    "3-0": ["Na1ystVpfUQ", "¿Qué son los CÓDECS de VÍDEO? ¿Son lo mismo que los FORMATOS de VÍDEO?", "Francisco Javier \"GASUX\""],
    "3-1": ["NEeGjKPjkis", "Cómo hacer una animación web con CSS - Keyframes", "Llave Dorada"],
    "3-2": ["t_K8Ff-2Xbw", "Tutorial de Javascript en Español -46- Animaciones Basicas", "LaZonaInformatica"],
    "4-0": ["S_9A2AUmV_8", "HTML5 desde cero: vídeo y audio con html", "Programación en español"],
    "4-1": ["PiCg4KYhhJU", "Tutorial HTML5: Canvas Básico", "Alejandro Ramirez Tello"],
    "4-2": ["Gs5qlozK3Z4", "Aprogramar con JavaScript - 130 Los eventos del Mouse en JS", "Aprogramar"],
  },
  "historia": {
    "0-0": ["q1GEX7Yjhzg", "Pueblos Originarios de Nicaragua", "Lizz Moncada"],
    "1-0": ["tT7P_33xJRc", "Conquista y Colonizacion de Nicaragua", "Jorge Ivan Silva Mejia"],
    "1-1": ["9O-GIn1rjaI", "León y Granada: Hermanas y rivales", "ExtraPlusTV"],
    "2-0": ["1zI0QaScNxo", "La independencia de Centroamérica", "Ruben Zuniga"],
    "2-1": ["adVDURP5oIM", "La Guerra Centroamericana contra los Filibusteros / La Campaña Nacional de 1856-1857", "Exfors Histori"],
    "3-0": ["tgURVwR58Kk", "Todas las Guerras y Conflictos de NICARAGUA - La Historia de Nicaragua", "Exfors Histori"],
  },
  "ingles": {
    "0-0": ["7aWhs5G6I-I", "English Greetings & Introductions for Beginners", "Learn English Speaking with BLOOM"],
    "0-1": ["AcDyLZxlZUY", "Aprende el VERBO TO BE en inglés desde CERO Fácil y rápido", "INGLES Sin Verguenza"],
    "1-0": ["uQ6E_Gu_IgU", "Lección 49 - Cómo decir y preguntar la hora en inglés - Telling the time", "Francisco Ochoa Inglés Fácil"],
    "1-1": ["KTw_lY22nZQ", "PRESENT SIMPLE. Clase de inglés para principiantes", "La Teacher Miss Claire"],
    "2-0": ["AvWePChDuPI", "Lugares de la Ciudad en Inglés (Places in the City)", "Inglés Paso a Paso con Lucie"],
    "2-1": ["CEJchyc_a38", "Aprende a dar y pedir direcciones en inglés", "Teacher Avelino"],
  },
  "bases-de-datos": {
    "0-0": ["knVwokXITGI", "¿Qué son las BASES DE DATOS? - La mejor explicación en español", "EDteam"],
    "0-1": ["xkMDTulV8r4", "BASES de DATOS RELACIONALES vs NO RELACIONALES", "Byspel - Iván L."],
    "0-2": ["yQEFZj7D7iY", "Arquitectura de un SGBD", "Rosibel Cordero"],
    "1-0": ["4v9UZqaWt5A", "TUTORIAL SQL #2: Consultas básicas: SELECT con una sola tabla", "campusMVP.es"],
    "1-1": ["qmpxUczoCLQ", "Cómo usar AND, OR, LIKE, BETWEEN y NULL en SQL Server explicado fácil", "Astrit Valdivia"],
    "1-2": ["jkH0ySNOkDo", "ORDER BY y LIMIT en MySQL", "Ericka Zavala"],
    "2-0": ["pOiFYBFHwf0", "BASE DE DATOS LLAVE PRIMARIA Y FORANEA", "Byspel - Iván L."],
    "2-1": ["tawZmX6KM4c", "Relaciones entre tablas: Uno a uno, Uno a muchos y muchos a muchos", "Remigio Huarcaya Almeyda"],
    "3-0": ["LRtgL-DcOb0", "Como crear PROCEDIMIENTOS ALMACENADOS en MySQL Paso a Paso", "EdTics Academy"],
    "3-1": ["C2s-qbcyIS8", "Como crear un TRIGGER (disparador) en MySQL Workbench Ejemplo paso a paso", "EdTics Academy"],
  },
  "diseno-grafico": {
    "0-0": ["rsjNv-wYAlM", "Los Principios Básicos del Diseño - Con ejemplos de cada Principio", "Anasaci. Diseño Web en Zaragoza"],
    "0-1": ["_F4MTXXydWA", "JERARQUÍA VISUAL Qué es y cómo aplicarla en diseño gráfico", "Hey Jaime"],
    "1-0": ["1mxdOZu3X1U", "Diseño Gráfico 12: Teoría del color, significados y sistemas de color", "Ger Garpe"],
    "1-1": ["xC2NYtyxZPE", "Fundamentos de tipografía (explicado fácil)", "Trino"],
    "2-0": ["lySrQsxQ4fo", "Cómo diseñar un LOGOTIPO en 6 pasos", "seosve"],
  },
  "sistema-solar": {
    "0-0": ["7u8vX92dvWw", "El Sol y sus Capas: Explorando Nuestra Estrella", "Perucultural Académico"],
    "0-1": ["oPGLVbCNof0", "¿CÓMO SE FORMÓ EL SISTEMA SOLAR?", "El canal natural por Jorge Duque"],
    "1-0": ["1SVHLbXiyIQ", "Los planetas rocosos del sistema solar", "educacciontv"],
    "1-1": ["M_nKtx9RW8w", "Júpiter vs Saturno: ¿Qué hay dentro de estos planetas gigantes?", "Genial Serie"],
    "1-2": ["FU-BowHSJjs", "Los Planetas Gaseosos: Júpiter, Saturno, Urano y Neptuno", "Esmeralda Te Enseña"],
    "2-0": ["fiZv2mO5Hpg", "¿Cuál es la diferencia entre COMETAS, ASTEROIDES, METEOROIDES, METEOROS y METEORITOS?", "Bluecinante"],
  },
  "biologia": {
    "0-0": ["Qcdhlx4Ujs4", "La Teoría Celular / Explicada Fácil", "En Minutos • Educación"],
    "0-1": ["LuwB5JNe8WE", "¿Cuál es la diferencia entre CÉLULAS PROCARIOTAS y EUCARIOTAS?", "Bluecinante"],
    "1-0": ["S-k8ST3VEkE", "El NÚCLEO CELULAR explicado: funciones, estructura y características", "Astraway"],
    "1-1": ["d6nldzO1o1Q", "Mitocondrias y cloroplastos", "Luciana Bazán"],
    "2-0": ["YefwfJ8IpEI", "Respiración celular: Crash Course Biología #27", "Crash Course en Español"],
    "2-1": ["0me8gOydg64", "MITOSIS Y MEIOSIS Explicación fácil sobre sus DIFERENCIAS", "Biologicamente"],
  },
  "inteligencia-artificial": {
    "0-0": ["WCM0h9TX7cY", "La historia completa de la Inteligencia Artificial (por EDteam)", "EDteam"],
    "0-1": ["6kDGzmyLDsA", "DIFERENCIAS entre IA, Machine Learning y Deep Learning", "TodoCode"],
    "1-0": ["FwhCq9ZoKNw", "¿Qué es el Machine Learning? Explicado fácil para principiantes", "Curiosidades sobre la IA"],
    "1-1": ["qBjkzIv_tmY", "¿Qué es una RED NEURONAL? Así es como APRENDE una INTELIGENCIA ARTIFICIAL", "Divulgación Científica IA - Javi Ródenas"],
    "2-0": ["BRy7Z3ZoQZk", "Cómo ESCRIBIR PROMPTS perfectos - Aprende prompt engineering con el método de GOOGLE", "Xavier Mitjana"],
  },
  "python": {
    "0-0": ["1VEb1B4f8SE", "Cómo Instalar Python en Windows 10 y 11 Fácil y Rápido", "Tecnotutoriales"],
    "0-1": ["lQy2urna3lA", "HOLA MUNDO en Python - Tu primer programa", "Charly Cimino"],
    "0-2": ["SxziXI0aDho", "VARIABLES en Python - TIPOS DE DATOS, expresiones y OPERACIONES", "Turbo Código"],
    "1-0": ["iFBcCDDDsms", "Condicionales en Python desde Cero [IF, ELIF, ELSE]", "Sergio A. Castaño Giraldo"],
    "1-1": ["oRYIFor_Xjg", "CURSO TUTORIAL PYTHON - 5) Bucles for y while", "Errodringer"],
    "2-0": ["hrv1ruHxiQY", "Funciones en Python desde Cero - Ejercicios Resueltos [DEF]", "Sergio A. Castaño Giraldo"],
    "2-1": ["vx2CVaXXfxU", "CURSO TUTORIAL PYTHON - 3) Listas, tuplas y diccionarios", "Errodringer"],
  },
  "react": {
    "0-0": ["lWQ69WX7-hA", "¿Qué es React.js y cómo funciona? - La mejor explicación en español", "EDteam"],
    "0-1": ["0RF87r13Cys", "¿Qué es REACT JSX? Introducción a JSX - Curso de REACT JS desde CERO", "EWebik"],
    "0-2": ["yFT8RVoltkQ", "Como usar props en ReactJS", "Pablo Monteserín"],
    "1-0": ["LmldFbeSTFc", "QUÉ es un ESTADO en REACT - CÓMO usar USESTATE - Curso de React desde cero #9", "Desarrollo Útil"],
    "1-1": ["8OQHGp6peSY", "React - FORMULARIOS - Cómo crear y enviar formularios", "AMazaing Code"],
    "1-2": ["I7rJX8NFFZQ", "Lists and Keys - Listas y Keys - Curso de REACT JS desde CERO", "EWebik"],
    "2-0": ["JEWFdKmr5wM", "Fetching y Mutación de Datos en React con el hook useEffect - Bootcamp FullStack", "midudev"],
    "2-1": ["7xRVnmWcTE8", "React Router Dom V6 - Tutorial Práctico desde Cero", "Fazt Code"],
  },
  "ingles-conversacional": {
    "0-0": ["_C1zOPtNhko", "How to Make Small Talk in English - English Conversation Lesson", "Oxford Online English"],
    "0-1": ["2eSLWZ6qSeo", "50 Important English Expressions for daily conversation", "Speak English With Vanessa"],
    "1-0": ["m-fQCPuAGhI", "Improve Your English Accent - Pronounce Vowel Sounds Correctly", "Oxford Online English"],
    "1-1": ["ImWCV5iRoq8", "How to use QUESTION INTONATION in ENGLISH", "Pronunciation with Emma"],
    "2-0": ["lvw_ht29FXE", "At the Restaurant (ordering food) - English Conversation Practice", "Learn English with Tangerine Academy"],
    "2-1": ["TsFfaZ_jiEI", "Learn Essential English Conversations for Travelers: Airport, Hotel, Taxi, Airplane", "Vivid English Avenue"],
    "2-2": ["jaxgeXPgAz0", "Top 10 Job Interview Questions in English", "Learn English with EnglishClass101.com"],
  },
  "pintura": {
    "0-0": ["goCVzL73jQo", "Materiales necesarios para iniciarse en la pintura acrilica", "Pintar con Clari"],
    "0-1": ["yUz6nvlp0Aw", "Guía Básica de PINCELADAS", "Marupadeco"],
    "1-0": ["xzroDZ77UUQ", "Círculo de Colores: Colores primarios, secundarios y terciarios", "Natalia Salazar"],
    "1-1": ["cov2Bclv2e4", "Teoría del color 3: Combinaciones de color: Colores armónicos, complementarios y análogos", "Escuela de Pintura en Miniatura"],
    "2-0": ["9nSeTtMNkFk", "¿Qué es la COMPOSICIÓN artística? Fundamentos para realizar obras de arte", "Juliane Arte"],
  },
  "fotografia": {
    "0-0": ["NJGyj_5iWi4", "TIPS para tomar MEJORES FOTOS con tu celular", "Isa Marcial"],
    "0-1": ["Ebd-P77YcVQ", "Regla de los tercios en fotografía - Curso de fotografía", "Edutin Academy"],
    "1-0": ["ZhthaYsWRvI", "Cómo editar tus fotos en el celular: SuperApps (Snapseed)", "Paréntesis.com"],
    "1-1": ["HP-iW_EJI-c", "EDITAR fotos en LIGHTROOM MOBILE para iPhone y Android (Tutorial)", "Arturo Goga"],
  },
  "musica": {
    "0-0": ["1yW_k18D2Go", "Teoría musical: Figuras musicales y silencios (nivel inicial)", "Aula de música con Paco"],
    "0-1": ["Ftu3kZturiU", "Compases simples: 2/4, 3/4 y 4/4", "Lenguaje Musical, paso a paso"],
    "1-0": ["QErkhopSDf8", "Pentagrama, clave de sol y notas musicales", "Patricia Falgueras del Alamo"],
    "1-1": ["jxjx9jI5Ljs", "Las Escalas Mayores y Menores Explicadas Desde Cero", "Teoría Musical y Composición con Isaac"],
    "1-2": ["1DS6CQiWHXM", "Qué es un ACORDE. Tipos de Acordes. COMO se forman los ACORDES", "Jonathan Alvarez - Musico Elite"],
  },
  "tecnicas-estudio": {
    "0-0": ["ycg8X-1LX2k", "Cómo PLANIFICAR tu SEMANA de ESTUDIO", "Tiempo entre Papeles"],
    "0-1": ["rvjMtbjKxCA", "LA TÉCNICA POMODORO - Qué es, Cómo Funciona, Secretos y Estrategias", "Pablo Lomeli"],
    "1-0": ["Hnezutoszpc", "Cómo Tomar Apuntes con el MÉTODO CORNELL (Muy fácil en 5 Pasos)", "Pablo Lomeli"],
    "1-1": ["a_KvaqkXn-w", "Mapas Mentales paso a paso: Revoluciona tu forma de estudiar", "Formación Ninja"],
    "1-2": ["S5xCm34JEWc", "Técnica de estudio: Repaso espaciado", "Iosu Gamboa"],
  },
  "bienestar": {
    "0-0": ["J3mJNUtDZ3Q", "MINDFULNESS: ¿Qué es? + 7 CLAVES para Iniciarse en la Atención Plena", "Instituto Europeo de Psicología Positiva"],
    "0-1": ["B_STgDNO-_U", "Respiración Consciente para Principiantes", "Medita para Transformar"],
    "1-0": ["27ZLOFhtdoU", "Dormir para Aprender ¿Qué papel tiene el sueño en la memoria y el aprendizaje?", "Clínica Eduardo Anitua"],
    "1-1": ["WGy3Fan4dUs", "Cómo LIDIAR con el ESTRÉS en el Estudio (con 7 Técnicas Efectivas)", "Pablo Lomeli"],
  },
};

/** Video de una lección ("u-l", empezando en 0), o null si no tiene. */
export function lessonVideo(courseId: string, key: string) {
  const v = LESSON_VIDEOS[courseId]?.[key];
  if (!v) return null;
  const [id, title, channel] = v;
  return { id, title, channel, url: `https://www.youtube.com/watch?v=${id}` };
}
