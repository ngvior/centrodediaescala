export const siteSettings = {
  // Config general
  contact_phone: "+54 11 4635-4207",
  contact_address: "José Enrique Rodó 5557, CABA",
  contact_schedule: "Lunes a Viernes de 9:30 a 16:30hs",
  social_facebook: "https://www.facebook.com/centrodediaescala",
  social_linkedin: "",
  social_twitter: "",
  
  // Homepage
  home_hero_title: "Escala Centro de Día",
  home_hero_subtitle: "Bienvenidos",
  home_hero_text: "Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual, los apoyos necesarios mediante actividades ocupacionales, deportivas, pedagógicas y terapéuticas, planificadas de acuerdo a las capacidades y necesidades de los mismos, con el objetivo de posibilitar el más adecuado desempeño en su vida cotidiana y alcanzar el máximo desarrollo de sus potencialidades, favoreciendo así su integración social.",
  home_hero_bg_image: "/a_escala.jpg",

  home_objectives: [
    { title: "Independencia", desc: "Lograr la máxima independencia personal", icon: "fa-check" },
    { title: "Integración", desc: "Promover la integración social, construyendo vínculos sociales que favorezcan el desenvolvimiento del concurrente en la comunidad, tendiendo a la búsqueda de la calidad de vida de cada sujeto", icon: "fa-check" },
    { title: "Habilidades", desc: "Facilitar la adquisición de hábitos para el logro de la autonomía. Favorecer el desarrollo de habilidades y destrezas teniendo en cuenta las potencialidades individuales de cada concurrente", icon: "fa-check" },
    { title: "Socialización / Comunicación", desc: "Fomentar la creación de redes sociales que favorezcan el desarrollo del joven y su familia en la comunidad. Generar espacios de intercambio y reflexión, ampliando el canal de la comunicación entre la familia y la Institución", icon: "fa-check" },
    { title: "Autoestima", desc: "Maximizar las capacidades de cada concurrente fomentando la participación y la autoestima", icon: "fa-check" },
    { title: "Estrategias", desc: "Brindar estrategias que permitan desarrollar habilidades ocupacionales y deportivas, pudiendo trasladar los conocimientos adquiridos a las distintas actividades de la vida diaria", icon: "fa-check" },
  ],

  // Institucion (Nosotros)
  about_title: "Nuestra Institución",
  about_text: "Es para jóvenes y adultos de ambos sexos, mayores de 25 años, con discapacidad intelectual de grado leve, moderado y severo sin dependencia, con o sin patología motora asociada, con o sin trastorno o patología sensorial; compensados psíquicamente. En todos los casos, con previa evaluación del equipo interdisciplinario de nuestra institución.",
  about_facilities_title: "Nuestras Instalaciones",
  about_facilities_text: "Contamos con un espacio recreativo, tres salas de trabajo, un comedor diario, baños especiales y cocina equipada.",
  about_requirements_title: "Requisitos de Inscripción",
  about_requirements_text: "Para incorporarse a nuestro espacio es necesario concertar una entrevista de ingreso con nuestros profesionales.",

  // Contacto
  contact_title: "Los esperamos",
  contact_text: "Estas son nuestras vías de contacto"
};

export const professionals = [
  { id: 1, first_name: "Andrea", last_name: "Cook", role: "Licenciada en Psicología Social", image_url: "/cook.jpg" },
  { id: 2, first_name: "Camila", last_name: "Pagano", role: "Licenciada en Terapia Ocupacional", image_url: "/pagano.jpg" },
  { id: 3, first_name: "Analía", last_name: "Portela", role: "Licenciada en Psicología", image_url: "/portela.jpg" },
  { id: 4, first_name: "Carolina", last_name: "Repetto", role: "Licenciada en Nutrición", image_url: "/repetto.jpg" },
  { id: 5, first_name: "Virginia", last_name: "Castro", role: "Licenciada en Psicomotricidad", image_url: "/castro.jpg" },
  { id: 6, first_name: "Santiago", last_name: "Sanguinetti", role: "Profesor en Educación Física", image_url: "/sanguinetti.jpg" },
  { id: 7, first_name: "Milagros", last_name: "Viña", role: "Profesora de Danzaterapia", image_url: "/vina.jpg" },
  { id: 8, first_name: "Florencia", last_name: "Vasile", role: "Orientadora. Acompañante Terapéutica", image_url: "/vasile.jpg" },
  { id: 9, first_name: "Darío", last_name: "Palmieri", role: "Profesor de Lectoescritura", image_url: "/palmieri.jpg" },
  { id: 10, first_name: "Luciana", last_name: "Verger", role: "Profesora de Yoga", image_url: "/verger.jpg" },
];

export const activities = [
  { 
    id: 1, 
    title: "Integración", 
    description: "La finalidad de estas actividades tienden a la socialización de los jóvenes en espacios internos y externos al centro de día, de esta manera se realizaran salidas a la comunidad, con fines culturales, recreativos y deportivos. Algunas de las actividades: Cine, teatro, museos, exposiciones, ferias, bailes, etc, Encuentros de intercambio deportivo y culturales con otras instituciones y/o entidades.",
    image_url: "",
    category: "Integración",
    icon: "thumbs-up"
  },
  { 
    id: 2, 
    title: "Terapéuticas", 
    description: "Musicoterapia, Natación, Folclore, Expresión Corporal, Teatro y Psicomotricidad. Utilizaremos la música y/o sus elementos musicales (sonido, ritmo, melodía y armonía) como un proceso creado para facilitar y promover la comunicación, las relaciones intrapersonales, el movimiento, la expresión, la organización y otros objetivos terapéuticos relevantes.",
    image_url: "",
    category: "Terapéuticas",
    icon: "music"
  },
  { 
    id: 3, 
    title: "Terapia Asistida con Animales", 
    description: "La Terapia Asistida con Animales es una modalidad de tratamiento o abordaje terapéutico en que un animal, que cumple determinados requisitos, forma parte integral del proceso. Su propósito es el de fomentar la mejoría en el funcionamiento físico, social, emocional y/o cognitivo de los seres humanos.",
    image_url: "",
    category: "Terapéuticas",
    icon: "heart"
  },
  { 
    id: 4, 
    title: "Deportivas", 
    description: "Nuestro enfoque se centra en que la persona con discapacidad conozca, desarrolle y disfrute de su propio cuerpo, de la relación con sus pares, docentes profesionales y con el medio que lo rodea. Algunas de las Actividades: Caminatas, Deportes individuales y de Conjunto, Circuitos, Vida en la Naturaleza.",
    image_url: "",
    category: "Deporte",
    icon: "heart"
  },
  { 
    id: 5, 
    title: "Ocupacionales", 
    description: "El desempeño o realización de actividades de autocuidado y automantenimiento, productivas, educativas, lúdicas y de ocio, permiten al joven-adulto participar como un miembro que contribuye a su entorno personal, social, cultural y físico. Desde nuestro enfoque, la ocupación puede ser aplicada terapéuticamente como un medio que promueve el desarrollo, mantenimiento y recuperación de las capacidades, destrezas o aptitudes del concurrente.",
    image_url: "",
    category: "Ocupacional",
    icon: "shop"
  },
  { 
    id: 6, 
    title: "Manos Que Hacen", 
    description: "Estamos orgullosos de lo que hacemos con nuestras manos, y queremos compartirlo con ustedes. Estos trabajos son producto de nuestros talleres ocupacionales, clases regulares y clases especiales. Clases de Cocina, Taller de Creación de Máscaras de Teatro, Taller de Pintura sobre Tela, Clases de Serigrafía, Taller de Decoración de Macetas.",
    image_url: "",
    category: "Talleres",
    icon: "pencil"
  }
];

export const gallery = [
  { id: 1, title: "Actividades Deportivas", category: "Deportivo", image_url: "/camina/2016/1.jpg" },
  { id: 2, title: "Natación", category: "Deportivo", image_url: "/camina/2016/2.jpg" },
  { id: 3, title: "Taller", category: "Ocupacional", image_url: "/camina/2016/3.jpg" },
  { id: 4, title: "Arte", category: "Nuestras Manos", image_url: "/camina/2016/4.jpg" },
  { id: 5, title: "Terapia", category: "Terapéutico", image_url: "/camina/2016/5.jpg" },
  { id: 6, title: "Integración", category: "Integración", image_url: "/camina/2016/6.jpg" },
  { id: 7, title: "Canina", category: "Terapia Canina", image_url: "/camina/2016/7.jpg" },
  { id: 8, title: "Equipo", category: "Todas", image_url: "/camina/2016/8.jpg" }
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
