-- Escala idempotent fixture data. Run only after supabase/schema.sql.

INSERT INTO public.site_settings (setting_group, setting_key, setting_value, setting_type, description) VALUES
('MARCA_NAV', 'brand_name', 'ESCALA', 'TEXT', 'Nombre visible en el encabezado y pie de página'),
('MARCA_NAV', 'brand_subtitle', 'Centro de Día', 'TEXT', 'Texto secundario visible junto a la marca'),
('MARCA_NAV', 'header_navigation', $$[{"label":"Inicio","href":"#inicio"},{"label":"Nuestra Institución","href":"#institucion"},{"label":"Actividades","href":"#actividades"},{"label":"Galería","href":"#galeria"},{"label":"Equipo","href":"#equipo"},{"label":"Contacto","href":"#contacto"}]$$, 'JSON', 'Lista de enlaces del encabezado con label y href'),
('MARCA_NAV', 'footer_copyright', 'Todos los derechos reservados', 'TEXT', 'Texto legal visible en el pie de página'),
('CONTACTO', 'contact_phone', '+54 11 4635-4207', 'TEXT', 'Teléfono principal de contacto'),
('CONTACTO', 'contact_address', 'José Enrique Rodó 5557, CABA', 'TEXT', 'Dirección de la institución'),
('CONTACTO', 'contact_schedule', 'Lunes a Viernes de 9:30 a 16:30hs', 'TEXT', 'Horario de atención al público'),
('CONTACTO', 'contact_address_label', 'Dirección', 'TEXT', 'Etiqueta visible de la tarjeta de dirección'),
('CONTACTO', 'contact_phone_label', 'Teléfono', 'TEXT', 'Etiqueta visible de la tarjeta de teléfono'),
('CONTACTO', 'contact_schedule_label', 'Horarios', 'TEXT', 'Etiqueta visible de la tarjeta de horarios'),
('REDES', 'social_facebook', 'https://www.facebook.com/centrodediaescala', 'LINK', 'Enlace al perfil de Facebook'),
('REDES', 'social_linkedin', '', 'LINK', 'Enlace opcional al perfil de LinkedIn; vacío no se renderiza'),
('REDES', 'social_twitter', '', 'LINK', 'Enlace opcional al perfil de Twitter/X; vacío no se renderiza'),
('HOMEPAGE', 'home_hero_title', 'Escala Centro de Día', 'TEXT', 'Título principal del banner de inicio'),
('HOMEPAGE', 'home_hero_subtitle', 'Bienvenidos', 'TEXT', 'Subtítulo del banner de inicio'),
('HOMEPAGE', 'home_hero_text', 'Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual, los apoyos necesarios mediante actividades ocupacionales, deportivas, pedagógicas y terapéuticas, planificadas de acuerdo a las capacidades y necesidades de los mismos, con el objetivo de posibilitar el más adecuado desempeño en su vida cotidiana y alcanzar el máximo desarrollo de sus potencialidades, favoreciendo así su integración social.', 'RICHTEXT', 'Texto descriptivo debajo del título principal'),
('HOMEPAGE', 'home_hero_cta_label', 'Conocenos', 'TEXT', 'Texto visible del botón principal'),
('HOMEPAGE', 'home_hero_bg_image', '/a_escala.jpg', 'IMAGE_URL', 'Imagen de fondo del banner de inicio'),
('ABOUT', 'about_title', 'Nuestra Institución', 'TEXT', 'Título de la página de nosotros'),
('ABOUT', 'about_text', 'Es para jóvenes y adultos de ambos sexos, mayores de 25 años, con discapacidad intelectual de grado leve, moderado y severo sin dependencia, con o sin patología motora asociada, con o sin trastorno o patología sensorial; compensados psíquicamente. En todos los casos, con previa evaluación del equipo interdisciplinario de nuestra institución.', 'RICHTEXT', 'Texto descriptivo de la institución'),
('ABOUT', 'about_objectives_title', 'Objetivos', 'TEXT', 'Título visible sobre la lista de objetivos institucionales'),
('ABOUT', 'about_facilities_title', 'Nuestras Instalaciones', 'TEXT', 'Título de la sección instalaciones'),
('ABOUT', 'about_facilities_text', 'Contamos con un espacio recreativo, tres salas de trabajo, un comedor diario, baños especiales y cocina equipada.', 'RICHTEXT', 'Descripción de instalaciones'),
('ABOUT', 'about_compliance_title', 'Nuestro Centro cumple con:', 'TEXT', 'Título de la lista de cumplimiento institucional'),
('ABOUT', 'about_compliance_items', $$["Disposición de categorización del Servicio Nacional de Rehabilitación","Habilitación Municipal correspondiente, constancia de inscripción a la Inspección General de Justicia, AFIP, Ingresos Brutos","Contamos con servicio de catering el cual brinda menú estacional supervisado por nuestra Nutricionista","Constancia de limpieza de tanques en forma trimestral. Certificado de Potabilidad del agua","Plan de evacuación para emergencias con asignación de roles y certificado de capacitación de las personas, aprobado por Defensa Civil","Servicio de Seguridad e Higiene. Certificado de desinsectación y desinfección aprobado por APRA","Póliza de Seguros (Responsabilidad Civil Comprensiva) a través de La Meridional","Servicio Médico de Emergencias a Través de Emergencias SA"]$$, 'JSON', 'Lista de requisitos/certificaciones institucionales'),
('ABOUT', 'about_requirements_title', 'Requisitos de Inscripción', 'TEXT', 'Título de sección requisitos'),
('ABOUT', 'about_requirements_text', 'Para incorporarse a nuestro espacio es necesario concertar una entrevista de ingreso con nuestros profesionales.', 'RICHTEXT', 'Lista de requisitos de ingreso'),
('ABOUT', 'about_requirements_label', 'Los requisitos son:', 'TEXT', 'Texto que precede a la lista de requisitos'),
('ABOUT', 'about_requirements_items', $$["Mayor a 25 años","Fotocopia de DNI","Fotocopia de Certificado de Discapacidad"]$$, 'JSON', 'Lista visible de requisitos de inscripción'),
('ACTIVIDADES', 'activities_section_title', 'Actividades', 'TEXT', 'Título de la sección actividades'),
('GALERIA', 'gallery_section_title', 'Galería', 'TEXT', 'Título de la sección galería'),
('GALERIA', 'gallery_filter_labels', $$["Todas","Integración","Terapéutico","Ocupacional","Nuestras Manos","Deportivo","Terapia Canina"]$$, 'JSON', 'Lista de etiquetas visibles para filtros de galería'),
('EQUIPO', 'professionals_section_title', 'Profesionales', 'TEXT', 'Título de la sección profesionales'),
('EQUIPO', 'professionals_subtitle', 'Conocé a nuestro equipo interdisciplinario.', 'TEXT', 'Subtítulo de la sección profesionales'),
('CONTACTO', 'contact_title', 'Los esperamos', 'TEXT', 'Título de contacto'),
('CONTACTO', 'contact_text', 'Estas son nuestras vías de contacto', 'TEXT', 'Texto descriptivo de contacto'),
('CONTACTO', 'contact_body_text', 'Los invitamos a conocer nuestro espacio de trabajo concertando una cita, estaremos felices de recibirlos. Estamos en el barrio de Mataderos en la Ciudad Autónoma de Buenos Aires, con las puertas abiertas durante todo el año.', 'RICHTEXT', 'Párrafo descriptivo de contacto'),
('ENTREVISTA', 'interview_form_title', 'Solicitar entrevista', 'TEXT', 'Título visible del formulario de entrevista'),
('ENTREVISTA', 'interview_form_description', 'Completá tus datos y el equipo de Escala se va a contactar para coordinar una cita.', 'TEXT', 'Texto descriptivo del formulario de entrevista'),
('ENTREVISTA', 'interview_form_contact_name_label', 'Nombre de contacto', 'TEXT', 'Etiqueta del campo nombre de contacto'),
('ENTREVISTA', 'interview_form_patient_name_label', 'Nombre de la persona interesada', 'TEXT', 'Etiqueta del campo nombre de persona interesada'),
('ENTREVISTA', 'interview_form_phone_label', 'Teléfono', 'TEXT', 'Etiqueta del campo teléfono'),
('ENTREVISTA', 'interview_form_email_label', 'Email', 'TEXT', 'Etiqueta del campo email'),
('ENTREVISTA', 'interview_form_message_label', 'Mensaje', 'TEXT', 'Etiqueta del campo mensaje'),
('ENTREVISTA', 'interview_form_message_placeholder', 'Contanos brevemente qué necesitás consultar.', 'TEXT', 'Placeholder del campo mensaje'),
('ENTREVISTA', 'interview_form_submit_label', 'Enviar solicitud', 'TEXT', 'Texto del botón para enviar entrevista'),
('ENTREVISTA', 'interview_form_pending_label', 'Enviando...', 'TEXT', 'Texto del botón mientras se envía el formulario'),
('ENTREVISTA', 'interview_form_honeypot_label', 'Sitio web', 'TEXT', 'Etiqueta del campo oculto anti-spam')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_group = EXCLUDED.setting_group,
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.home_objectives (title, description, icon, order_index) VALUES
('Independencia', 'Lograr la máxima independencia personal', 'fa-check', 1),
('Integración', 'Promover la integración social, construyendo vínculos sociales que favorezcan el desenvolvimiento del concurrente en la comunidad, tendiendo a la búsqueda de la calidad de vida de cada sujeto', 'fa-check', 2),
('Habilidades', 'Facilitar la adquisición de hábitos para el logro de la autonomía. Favorecer el desarrollo de habilidades y destrezas teniendo en cuenta las potencialidades individuales de cada concurrente', 'fa-check', 3),
('Socialización / Comunicación', 'Fomentar la creación de redes sociales que favorezcan el desarrollo del joven y su familia en la comunidad. Generar espacios de intercambio y reflexión, ampliando el canal de la comunicación entre la familia y la Institución', 'fa-check', 4),
('Autoestima', 'Maximizar las capacidades de cada concurrente fomentando la participación y la autoestima', 'fa-check', 5),
('Estrategias', 'Brindar estrategias que permitan desarrollar habilidades ocupacionales y deportivas, pudiendo trasladar los conocimientos adquiridos a las distintas actividades de la vida diaria', 'fa-check', 6)
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  order_index = EXCLUDED.order_index,
  is_active = true;

INSERT INTO public.professionals (first_name, last_name, role, image_url, order_index) VALUES
('Andrea', 'Cook', 'Licenciada en Psicología Social', '/cook.jpg', 1),
('Camila', 'Pagano', 'Licenciada en Terapia Ocupacional', '/pagano.jpg', 2),
('Analía', 'Portela', 'Licenciada en Psicología', '/portela.jpg', 3),
('Carolina', 'Repetto', 'Licenciada en Nutrición', '/repetto.jpg', 4),
('Virginia', 'Castro', 'Licenciada en Psicomotricidad', '/castro.jpg', 5),
('Santiago', 'Sanguinetti', 'Profesor en Educación Física', '/sanguinetti.jpg', 6),
('Milagros', 'Viña', 'Profesora de Danzaterapia', '/vina.jpg', 7),
('Florencia', 'Vasile', 'Orientadora. Acompañante Terapéutica', '/vasile.jpg', 8),
('Darío', 'Palmieri', 'Profesor de Lectoescritura', '/palmieri.jpg', 9),
('Luciana', 'Verger', 'Profesora de Yoga', '/verger.jpg', 10)
ON CONFLICT (first_name, last_name, role) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  order_index = EXCLUDED.order_index,
  is_active = true;

INSERT INTO public.activities (title, description, category, image_url, order_index) VALUES
('Integración', 'La finalidad de estas actividades tienden a la socialización de los jóvenes en espacios internos y externos al centro de día, de esta manera se realizaran salidas a la comunidad, con fines culturales, recreativos y deportivos. Algunas de las actividades: Cine, teatro, museos, exposiciones, ferias, bailes, etc, Encuentros de intercambio deportivo y culturales con otras instituciones y/o entidades.', 'Integración', '', 1),
('Terapéuticas', 'Musicoterapia, Natación, Folclore, Expresión Corporal, Teatro y Psicomotricidad. Utilizaremos la música y/o sus elementos musicales (sonido, ritmo, melodía y armonía) como un proceso creado para facilitar y promover la comunicación, las relaciones intrapersonales, el movimiento, la expresión, la organización y otros objetivos terapéuticos relevantes.', 'Terapéuticas', '', 2),
('Terapia Asistida con Animales', 'La Terapia Asistida con Animales es una modalidad de tratamiento o abordaje terapéutico en que un animal, que cumple determinados requisitos, forma parte integral del proceso. Su propósito es el de fomentar la mejoría en el funcionamiento físico, social, emocional y/o cognitivo de los seres humanos.', 'Terapéuticas', '', 3),
('Deportivas', 'Nuestro enfoque se centra en que la persona con discapacidad conozca, desarrolle y disfrute de su propio cuerpo, de la relación con sus pares, docentes profesionales y con el medio que lo rodea. Algunas de las Actividades: Caminatas, Deportes individuales y de Conjunto, Circuitos, Vida en la Naturaleza.', 'Deporte', '', 4),
('Ocupacionales', 'El desempeño o realización de actividades de autocuidado y automantenimiento, productivas, educativas, lúdicas y de ocio, permiten al joven-adulto participar como un miembro que contribuye a su entorno personal, social, cultural y físico. Desde nuestro enfoque, la ocupación puede ser aplicada terapéuticamente como un medio que promueve el desarrollo, mantenimiento y recuperación de las capacidades, destrezas o aptitudes del concurrente.', 'Ocupacional', '', 5),
('Manos Que Hacen', 'Estamos orgullosos de lo que hacemos con nuestras manos, y queremos compartirlo con ustedes. Estos trabajos son producto de nuestros talleres ocupacionales, clases regulares y clases especiales. Clases de Cocina, Taller de Creación de Máscaras de Teatro, Taller de Pintura sobre Tela, Clases de Serigrafía, Taller de Decoración de Macetas.', 'Talleres', '', 6)
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  order_index = EXCLUDED.order_index,
  is_active = true;

INSERT INTO public.gallery_items (title, category, image_url, order_index) VALUES
('Actividades Deportivas', 'Deportivo', '/camina/2016/1.jpg', 1),
('Natación', 'Deportivo', '/camina/2016/2.jpg', 2),
('Taller', 'Ocupacional', '/camina/2016/3.jpg', 3),
('Arte', 'Nuestras Manos', '/camina/2016/4.jpg', 4),
('Terapia', 'Terapéutico', '/camina/2016/5.jpg', 5),
('Integración', 'Integración', '/camina/2016/6.jpg', 6),
('Canina', 'Terapia Canina', '/camina/2016/7.jpg', 7),
('Equipo', 'Todas', '/camina/2016/8.jpg', 8)
ON CONFLICT (image_url) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  order_index = EXCLUDED.order_index,
  is_active = true;

INSERT INTO public.events (title, slug, content, event_date, cover_image_url, is_published) VALUES
('Caminata & Kermesse Anual', 'caminata-kermesse', 'El evento consistirá en la realización de la edición de Escala/Camina. La misma tiene como principal objetivo canalizar el acompañamiento de la sociedad, al tiempo que sensibiliza y contribuye a una sociedad más justa, equitativa, solidaria e inclusiva.', 'Octubre', '/camina/camina_main.jpg', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  event_date = EXCLUDED.event_date,
  cover_image_url = EXCLUDED.cover_image_url,
  is_published = EXCLUDED.is_published;
