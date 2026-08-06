-- Escala idempotent fixture data. Run only after supabase/schema.sql.

INSERT INTO public.site_settings (setting_group, setting_key, setting_value, setting_type, description) VALUES
('MARCA_NAV', 'brand_name', 'ESCALA', 'TEXT', 'Nombre visible en el encabezado y pie de página'),
('MARCA_NAV', 'brand_subtitle', 'Centro de Día', 'TEXT', 'Texto secundario visible junto a la marca'),
('MARCA_NAV', 'header_navigation', $$[{"label":"Inicio","href":"#top_content"},{"label":"Institucional","href":"#service"},{"label":"Actividades","href":"#work_outer"},{"label":"Galería","href":"#galeria"},{"label":"Profesionales","href":"#team"},{"label":"Contacto","href":"#contact"}]$$, 'JSON', 'Lista de enlaces del encabezado con label y href.'),
('MARCA_NAV', 'footer_copyright', 'Todos los derechos reservados', 'TEXT', 'Texto legal visible en el pie de página'),
('CONTACTO', 'contact_phone', '+54 11 4635-4207', 'TEXT', 'Teléfono principal de contacto'),
('CONTACTO', 'contact_address', 'José Enrique Rodó 5559, CABA', 'TEXT', 'Dirección de la institución.'),
('CONTACTO', 'contact_schedule', 'Lunes a Viernes de 9:30 a 16:30hs', 'TEXT', 'Horario de atención al público'),
('CONTACTO', 'contact_email', 'escalaelcentrodedia@gmail.com', 'TEXT', 'Email principal de contacto.'),
('CONTACTO', 'contact_address_label', 'Dirección', 'TEXT', 'Etiqueta visible de la tarjeta de dirección'),
('CONTACTO', 'contact_phone_label', 'Teléfono', 'TEXT', 'Etiqueta visible de la tarjeta de teléfono'),
('CONTACTO', 'contact_schedule_label', 'Horarios', 'TEXT', 'Etiqueta visible de la tarjeta de horarios'),
('CONTACTO', 'contact_email_label', 'Email', 'TEXT', 'Etiqueta visible de la tarjeta de email'),
('REDES', 'social_facebook', 'https://www.facebook.com/centrodediaescala', 'LINK', 'Enlace al perfil de Facebook'),
('REDES', 'social_instagram', 'https://www.instagram.com/centrodediaescala/', 'LINK', 'Enlace al perfil de Instagram'),
('REDES', 'social_linkedin', '', 'LINK', 'Enlace opcional al perfil de LinkedIn; vacío no se renderiza'),
('REDES', 'social_twitter', '', 'LINK', 'Enlace opcional al perfil de Twitter/X; vacío no se renderiza'),
('HOMEPAGE', 'home_hero_title', 'Escala Centro de Día', 'TEXT', 'Título principal del banner de inicio'),
('HOMEPAGE', 'home_hero_subtitle', 'Bienvenidos', 'TEXT', 'Subtítulo del banner de inicio'),
('HOMEPAGE', 'home_hero_text', 'Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual, los apoyos necesarios mediante actividades ocupacionales, deportivas, pedagógicas y terapéuticas, planificadas de acuerdo a las capacidades y necesidades de los mismos, con el objetivo de posibilitar el más adecuado desempeño en su vida cotidiana y alcanzar el máximo desarrollo de sus potencialidades, favoreciendo así su integración social.', 'RICHTEXT', 'Texto descriptivo debajo del título principal'),
('HOMEPAGE', 'home_hero_cta_label', 'Conocenos', 'TEXT', 'Texto visible del botón principal'),
('HOMEPAGE', 'home_hero_bg_image', '/a_escala.jpg', 'IMAGE_URL', 'Imagen de fondo del banner de inicio'),
('ABOUT', 'about_title', 'Nuestra Institución', 'TEXT', 'Título de la página de nosotros'),
('ABOUT', 'about_text', 'Es para **jóvenes y adultos de ambos sexos, mayores de 18 años**, con discapacidad intelectual de grado leve, moderado y severo sin dependencia, con o sin patología motora asociada, con o sin trastorno o patología sensorial; compensados psíquicamente. En todos los casos, con previa evaluación del equipo interdisciplinario de nuestra institución.', 'RICHTEXT', 'Texto introductorio destacado de la institución.'),
('ABOUT', 'about_objectives_title', 'Objetivos', 'TEXT', 'Título visible sobre la lista de objetivos institucionales'),
('ABOUT', 'about_facilities_title', 'Nuestras Instalaciones', 'TEXT', 'Título de la sección instalaciones'),
('ABOUT', 'about_facilities_text', 'Contamos con un espacio recreativo, tres salas de trabajo, un comedor/sum diario, baños adaptados y cocina equipada.', 'RICHTEXT', 'Descripción de instalaciones.'),
('ABOUT', 'about_compliance_title', 'Nuestro Centro cumple con:', 'TEXT', 'Título de la lista de cumplimiento institucional'),
('ABOUT', 'about_compliance_items', $$["Disposición de categorización del Servicio Nacional de Rehabilitación","Habilitación Municipal correspondiente, constancia de inscripción a la Inspección General de Justicia, AFIP, Ingresos Brutos","Contamos con servicio de catering el cual brinda menú estacional supervisado por nuestra Nutricionista","Constancia de limpieza de tanques en forma trimestral. Certificado de Potabilidad del agua","Plan de evacuación para emergencias con asignación de roles y certificado de capacitación de las personas, aprobado por Defensa Civil","Servicio de Seguridad e Higiene. Certificado de desinsectación y desinfección aprobado por APRA","Póliza de Seguros (Responsabilidad Civil Comprensiva) a través de La Meridional","Servicio Médico de Emergencias a Través de Emergencias SA"]$$, 'JSON', 'Lista de requisitos/certificaciones institucionales'),
('ABOUT', 'about_requirements_title', 'Requisitos de Inscripción', 'TEXT', 'Título de sección requisitos'),
('ABOUT', 'about_requirements_text', 'Para incorporarse a nuestro espacio es necesario concertar una entrevista de admisión con nuestros profesionales.', 'RICHTEXT', 'Texto introductorio de requisitos de ingreso.'),
('ABOUT', 'about_requirements_label', 'Los requisitos son:', 'TEXT', 'Texto que precede a la lista de requisitos'),
('ABOUT', 'about_requirements_items', $$["Mayor a 18 años","Fotocopia de DNI","Fotocopia de Certificado de Discapacidad"]$$, 'JSON', 'Lista visible de requisitos de inscripción.'),
('ACTIVIDADES', 'activities_section_title', 'Actividades', 'TEXT', 'Título de la sección actividades'),
('GALERIA', 'gallery_section_title', 'Galería', 'TEXT', 'Título de la sección galería'),
('GALERIA', 'gallery_all_filter_label', 'Todas', 'TEXT', 'Texto del filtro que muestra todas las fotos de la galería.'),
-- Kept as a fixture even though nothing reads it any more: the category backfill
-- in `supabase/migrations/20260805000000_gallery_categories.sql` derives its
-- rows from this array, so removing it here would make a fresh environment
-- bootstrap a gallery with no categories at all.
('GALERIA', 'gallery_filter_labels', $$["Todas","Deporte","Integración","Terapias Ocupacionales","Manos que Hacen"]$$, 'JSON', 'Lista de etiquetas visibles para filtros de galería.'),
('EQUIPO', 'professionals_section_title', 'Nuestros Profesionales', 'TEXT', 'Título de la sección profesionales.'),
('EQUIPO', 'professionals_subtitle', 'Estamos orgullosos de los profesionales que nos acompañan', 'TEXT', 'Subtítulo de la sección profesionales.'),
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
('Andrea', 'Cook', 'Licenciada en Trabajo Social', '/cook.jpg', 0),
('Camila', 'Pagano', 'Licenciada en Terapia Ocupacional', '/pagano.jpg', 1),
('Analía', 'Portela', 'Licenciada en Psicología', '/portela.jpg', 2),
('Carolina', 'Repetto', 'Licenciada en Nutrición', '/repetto.jpg', 3),
('Virginia', 'Castro', 'Licenciada en Psicomotricidad', '/castro.jpg', 4),
('Santiago', 'Sanguinetti', 'Profesor en Educación Física', '/sanguinetti.jpg', 5),
('Milagros', 'Viña', 'Profesora de Danzaterapia', '/vina.jpg', 6),
('Florencia', 'Vasile', 'Orientadora. Acompañante Terapéutica', '/vasile.jpg', 7),
('Darío', 'Palmieri', 'Profesor de Lectoescritura', '/palmieri.jpg', 8),
('Luciana', 'Verger', 'Profesora de Yoga', '/verger.jpg', 9)
ON CONFLICT (first_name, last_name, role) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  order_index = EXCLUDED.order_index,
  is_active = true;

-- Descriptions use E'' escape strings with explicit \r\n because that is what
-- production holds: the admin panel edits them in a textarea, and HTML
-- normalizes textarea line breaks to CRLF. Escaping keeps the CR faithful
-- without putting raw CR bytes in a git-tracked file.
INSERT INTO public.activities (title, description, category, icon, image_url, order_index) VALUES
('Integración', E'La finalidad de estas actividades tienden a la socialización de los jóvenes en espacios internos y externos al centro de día, de esta manera se realizaran salidas a la comunidad, con fines culturales, recreativos y deportivos.\r\n\r\n**Algunas de las actividades: Cine, teatro, museos, exposiciones, ferias, bailes, etc, Encuentros de intercambio deportivo y culturales con otras instituciones y/o entidades.**', 'Integración', 'thumbs-up', NULL, 0),
('Terapéuticas', E'**Musicoterapia, Natación, Folclore, Expresión Corporal, Teatro, Psicomotricidad, Karaoke, Estimulación Cognitiva y Asamblea de Convivencia.**\r\nUtilizaremos la música y/o sus elementos musicales (sonido, ritmo, melodía y armonía) como un proceso creado para facilitar y promover la comunicación, las relaciones intrapersonales, el movimiento, la expresión, la organización y otros objetivos terapéuticos relevantes; para así satisfacer las necesidades físicas, emocionales, mentales, sociales y cognitivas de la persona con discapacidad.', 'Terapéuticas', 'music', NULL, 1),
('Deportivas', E'Nuestro enfoque se centra en que la persona con discapacidad conozca, desarrolle y disfrute de su propio cuerpo, de la relación con sus pares, docentes profesionales y con el medio que lo rodea.\r\n**Algunas de las Actividades: Caminatas, Deportes individuales y de Conjunto, Circuitos, Vida en la Naturaleza.**', 'Deporte', 'heart', NULL, 3),
('Ocupacionales', E'El desempeño o realización de actividades de autocuidado y automantenimiento, productivas, educativas, lúdicas y de ocio, permiten al joven-adulto participar como un miembro que contribuye a su entorno personal, social, cultural y físico.\r\n\r\nDesde nuestro enfoque, la ocupación puede ser aplicada terapéuticamente como un medio que promueve el desarrollo, mantenimiento y recuperación de las capacidades, destrezas o aptitudes del concurrente.\r\n\r\n**Algunas de las actividades que desarrollaremos: Taller de cocina, Arteterapia, Armado de juegos, ESI, Actividades Básicas de la Vida Diaria y Actividades Instrumentales de la Vida Diaria.**', 'Ocupacional', 'shop', NULL, 4),
('Manos Que Hacen', E'Estamos orgullosos de lo que hacemos con nuestras manos, y queremos compartirlo con ustedes. Estos trabajos son producto de nuestros talleres ocupacionales, clases regulares y clases especiales.\r\n\r\n**Clases de Cocina**\r\n**Taller de Creación de Máscaras de Teatro**\r\n**Taller de Pintura sobre Tela**\r\n**Taller de Decoración de Macetas**', 'Talleres', 'pencil', NULL, 5)
ON CONFLICT (title) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  image_url = EXCLUDED.image_url,
  order_index = EXCLUDED.order_index,
  is_active = true;

-- Mirrors the `gallery_filter_labels` setting above, minus the `Todas`
-- catch-all, which is a UI affordance and never a category row. Hardcoded on
-- purpose: seed.sql IS the fixture source and already hardcodes that labels
-- array, so both copies are reviewed side by side. The live migration derives
-- the same rows from the setting instead, because there the array may have been
-- edited by an admin.
INSERT INTO public.gallery_categories (name, order_index) VALUES
('Deporte', 0),
('Integración', 1),
('Terapias Ocupacionales', 2),
('Manos que Hacen', 3)
ON CONFLICT (lower(name)) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_active = true;

INSERT INTO public.gallery_items (title, category, image_url, order_index, is_active) VALUES
('Actividades Deportivas', 'Deporte', '/galeria/1.jpg', 1, true),
('Natación', 'Deporte', '/galeria/2.jpg', 2, true),
('Actividades con la Comunidad', 'Integración', '/galeria/3.jpg', 3, true),
('Salidas Recreativas', 'Integración', '/galeria/4.jpg', 4, true),
('Taller de Artesanías', 'Terapias Ocupacionales', '/galeria/5.jpg', 5, true),
('Taller de Creaciones en Papel', 'Manos que Hacen', '/galeria/6.jpg', 6, true),
('Creatividad', 'Manos que Hacen', '/galeria/7.jpg', 7, true),
('Tecnología', 'Terapias Ocupacionales', '/galeria/8.jpg', 8, true),
('Taller de Creación de Máscaras de Teatro', 'Terapias Ocupacionales', '/galeria/9.jpg', 9, true),
('Cocina', 'Terapias Ocupacionales', '/galeria/10.jpg', 10, true),
('Música', 'Terapias Ocupacionales', '/galeria/11.jpg', 11, true),
('Expresión Corporal y Teatro', 'Terapias Ocupacionales', '/galeria/12.jpg', 12, true),
('Participación en Ferias', 'Integración', '/galeria/13.jpg', 13, true),
('Serigrafía', 'Terapias Ocupacionales', '/galeria/14.jpg', 14, true),
('Taller de Pintura Sobre Tela', 'Manos que Hacen', '/galeria/15.jpg', 15, true),
('Deporte al Aire Libre', 'Deporte', '/galeria/16.jpg', 16, true)
ON CONFLICT (image_url) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active;

-- Binds the fixtures above to their category record by the same trimmed,
-- case-insensitive text match the migration uses. Runs after the items so a
-- re-seeded row is re-bound; unmatched text simply stays unbound.
UPDATE public.gallery_items gi
SET category_id = gc.id
FROM public.gallery_categories gc
WHERE gi.category IS NOT NULL
  AND lower(trim(gi.category)) = lower(trim(gc.name));

INSERT INTO public.events (title, slug, content, event_date, cover_image_url, is_published) VALUES
('Caminata & Kermesse Anual', 'caminata-kermesse', 'El evento consistirá en la realización de la edición de Escala/Camina. La misma tiene como principal objetivo canalizar el acompañamiento de la sociedad, al tiempo que sensibiliza y contribuye a una sociedad más justa, equitativa, solidaria e inclusiva.', 'Octubre', '/camina/camina_main.jpg', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  event_date = EXCLUDED.event_date,
  cover_image_url = EXCLUDED.cover_image_url,
  is_published = EXCLUDED.is_published;
