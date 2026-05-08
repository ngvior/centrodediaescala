export const siteSettings = {
  // Config general
  contact_phone: "+54 11 4635-4207",
  contact_address: "José Enrique Rodó 5557, CABA",
  contact_schedule: "Lunes a Viernes de 9:30 a 16:30hs",
  social_facebook: "https://www.facebook.com/centrodediaescala",
  
  // Homepage
  home_hero_title: "Escala Centro de Día",
  home_hero_subtitle: "Bienvenidos",
  home_hero_text: "Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual, los apoyos necesarios mediante actividades ocupacionales, deportivas, pedagógicas y terapéuticas, planificadas de acuerdo a las capacidades y necesidades de los mismos, con el objetivo de posibilitar el más adecuado desempeño en su vida cotidiana y alcanzar el máximo desarrollo de sus potencialidades, favoreciendo así su integración social.",
  home_hero_bg_image: "/a_escala.jpg",

  home_objectives: [
    { title: "Independencia", desc: "Lograr la máxima independencia personal." },
    { title: "Integración", desc: "Promover la integración social, construyendo vínculos sociales que favorezcan el desenvolvimiento del concurrente en la comunidad." },
    { title: "Habilidades", desc: "Facilitar la adquisición de hábitos para el logro de la autonomía. Favorecer el desarrollo de habilidades y destrezas." },
    { title: "Socialización", desc: "Fomentar la creación de redes sociales que favorezcan el desarrollo del joven y su familia en la comunidad." },
    { title: "Autoestima", desc: "Maximizar las capacidades de cada concurrente fomentando la participación y la autoestima." },
    { title: "Estrategias", desc: "Brindar estrategias que permitan desarrollar habilidades ocupacionales y deportivas." },
  ],

  // Institucion (Nosotros)
  about_title: "Nuestra Institución",
  about_text: "Es para jóvenes y adultos de ambos sexos, mayores de 25 años, con discapacidad intelectual de grado leve, moderado y severo sin dependencia, con o sin patología motora asociada, con o sin trastorno o patología sensorial; compensados psíquicamente. En todos los casos, con previa evaluación del equipo interdisciplinario de nuestra institución.",
  about_facilities_title: "Nuestras Instalaciones",
  about_facilities_text: "Contamos con un espacio recreativo, tres salas de trabajo, un comedor diario, baños especiales y cocina equipada.",
  about_requirements_title: "Requisitos de Inscripción",
  about_requirements_text: "Para incorporarse a nuestro espacio es necesario concertar una entrevista de ingreso con nuestros profesionales. Fotocopia de Certificado de Discapacidad. Fotocopia de DNI. Mayor a 25 años.",

  // Contacto
  contact_title: "Contacto",
  contact_text: "Comunicate con nosotros para solicitar una entrevista de ingreso o por cualquier consulta."
};

export const professionals = [
  { id: 1, first_name: "Mariana", last_name: "De Leo", role: "Directora", image_url: "/deleo.jpg" },
  { id: 2, first_name: "Silvia", last_name: "Arraygada", role: "Coordinadora", image_url: "/arraygada.jpg" },
  { id: 3, first_name: "Laura", last_name: "Buffa", role: "Psicóloga", image_url: "/buffa.jpg" },
  { id: 4, first_name: "Romina", last_name: "Castro", role: "Trabajadora Social", image_url: "/castro.jpg" },
  { id: 5, first_name: "Martín", last_name: "Dinca", role: "Terapista Ocupacional", image_url: "/dinca.jpg" },
];

export const activities = [
  { 
    id: 1, 
    title: "Integración", 
    description: "Salidas a la comunidad, con fines culturales, recreativos y deportivos. Cine, teatro, museos.",
    image_url: "/camina/camina1.jpg",
    category: "Integración"
  },
  { 
    id: 2, 
    title: "Terapéuticas", 
    description: "Musicoterapia, Natación, Folclore, Expresión Corporal, Teatro y Psicomotricidad.",
    image_url: "/camina/camina2.jpg",
    category: "Terapéuticas"
  },
  { 
    id: 3, 
    title: "Deportivas", 
    description: "Nuestro enfoque se centra en que la persona conozca, desarrolle y disfrute de su propio cuerpo.",
    image_url: "/camina/camina3.jpg",
    category: "Deporte"
  },
  { 
    id: 4, 
    title: "Terapia Asistida con Animales", 
    description: "Modalidad de tratamiento o abordaje con animales para mejorar el estado físico y emocional.",
    image_url: "/camina/camina4.jpg",
    category: "Terapéuticas"
  },
  { 
    id: 5, 
    title: "Ocupacionales", 
    description: "Desempeño o realización de actividades de autocuidado, productivas, lúdicas y de ocio.",
    image_url: "/cook.jpg",
    category: "Ocupacional"
  },
  { 
    id: 6, 
    title: "Manos Que Hacen", 
    description: "Trabajos producto de nuestros talleres ocupacionales, clases regulares y clases especiales.",
    image_url: "/assesore.jpg",
    category: "Talleres"
  }
];

export const events = [
  {
    id: 1,
    title: "Caminata & Kermesse Anual",
    slug: "caminata-kermesse",
    content: "El evento consistirá en la realización de la edición de Escala/Camina. La misma tiene como principal objetivo canalizar el acompañamiento de la sociedad, al tiempo que sensibiliza y contribuye a una sociedad más justa, equitativa, solidaria e inclusiva.",
    event_date: "Octubre",
    cover_image_url: "/camina/camina_main.jpg"
  }
];
