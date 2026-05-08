-- Create professionals table
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create activities table
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  schedule_info TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create events table
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  event_date TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create interview requests table
CREATE TABLE interview_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  patient_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create site settings table
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_group TEXT NOT NULL,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'TEXT' CHECK (setting_type IN ('TEXT', 'IMAGE_URL', 'LINK', 'RICHTEXT')),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) Policies
-- For a public website, we want anyone to read, but only authenticated users to write

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for professionals" ON professionals FOR SELECT USING (true);
CREATE POLICY "Auth write access for professionals" ON professionals FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Auth write access for activities" ON activities FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
CREATE POLICY "Auth write access for events" ON events FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Auth write access for site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Interview requests can be inserted by anyone (the public form), but only read by authenticated admins
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert access for interview_requests" ON interview_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth read/write access for interview_requests" ON interview_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth update access for interview_requests" ON interview_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete access for interview_requests" ON interview_requests FOR DELETE USING (auth.role() = 'authenticated');

-- Insert initial mock data into site_settings
INSERT INTO site_settings (setting_group, setting_key, setting_value, setting_type, description) VALUES
('CONTACTO', 'contact_phone', '+54 11 4635-4207', 'TEXT', 'Teléfono principal de contacto'),
('CONTACTO', 'contact_address', 'José Enrique Rodó 5557, CABA', 'TEXT', 'Dirección de la institución'),
('CONTACTO', 'contact_schedule', 'Lunes a Viernes de 9:30 a 16:30hs', 'TEXT', 'Horario de atención al público'),
('REDES', 'social_facebook', 'https://www.facebook.com/centrodediaescala', 'LINK', 'Enlace al perfil de Facebook'),
('HOMEPAGE', 'home_hero_title', 'Escala Centro de Día', 'TEXT', 'Título principal del banner de inicio'),
('HOMEPAGE', 'home_hero_subtitle', 'Bienvenidos', 'TEXT', 'Subtítulo del banner de inicio'),
('HOMEPAGE', 'home_hero_text', 'Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual...', 'RICHTEXT', 'Texto descriptivo debajo del título principal'),
('HOMEPAGE', 'home_hero_bg_image', '/a_escala.jpg', 'IMAGE_URL', 'Imagen de fondo del banner de inicio'),
('ABOUT', 'about_title', 'Nuestra Institución', 'TEXT', 'Título de la página de nosotros'),
('ABOUT', 'about_text', 'Es para jóvenes y adultos de ambos sexos, mayores de 25 años...', 'RICHTEXT', 'Texto descriptivo de la institución'),
('ABOUT', 'about_facilities_title', 'Nuestras Instalaciones', 'TEXT', 'Título de la sección instalaciones'),
('ABOUT', 'about_facilities_text', 'Contamos con un espacio recreativo, tres salas de trabajo, un comedor diario, baños especiales y cocina equipada.', 'RICHTEXT', 'Descripción de instalaciones'),
('ABOUT', 'about_requirements_title', 'Requisitos de Inscripción', 'TEXT', 'Título de sección requisitos'),
('ABOUT', 'about_requirements_text', 'Para incorporarse a nuestro espacio es necesario concertar una entrevista...', 'RICHTEXT', 'Lista de requisitos de ingreso'),
('CONTACTO', 'contact_title', 'Contacto', 'TEXT', 'Título de la página de contacto'),
('CONTACTO', 'contact_text', 'Comunicate con nosotros para solicitar una entrevista de ingreso o por cualquier consulta.', 'TEXT', 'Texto descriptivo de contacto');

-- Insert initial mock data into professionals
INSERT INTO professionals (first_name, last_name, role, image_url, order_index) VALUES
('Mariana', 'De Leo', 'Directora', '/deleo.jpg', 1),
('Silvia', 'Arraygada', 'Coordinadora', '/arraygada.jpg', 2),
('Laura', 'Buffa', 'Psicóloga', '/buffa.jpg', 3),
('Romina', 'Castro', 'Trabajadora Social', '/castro.jpg', 4),
('Martín', 'Dinca', 'Terapista Ocupacional', '/dinca.jpg', 5);

-- Insert initial mock data into activities
INSERT INTO activities (title, description, category, image_url) VALUES
('Integración', 'Salidas a la comunidad, con fines culturales, recreativos y deportivos. Cine, teatro, museos.', 'Integración', '/camina/camina1.jpg'),
('Terapéuticas', 'Musicoterapia, Natación, Folclore, Expresión Corporal, Teatro y Psicomotricidad.', 'Terapéuticas', '/camina/camina2.jpg'),
('Deportivas', 'Nuestro enfoque se centra en que la persona conozca, desarrolle y disfrute de su propio cuerpo.', 'Deporte', '/camina/camina3.jpg'),
('Terapia Asistida con Animales', 'Modalidad de tratamiento o abordaje con animales para mejorar el estado físico y emocional.', 'Terapéuticas', '/camina/camina4.jpg'),
('Ocupacionales', 'Desempeño o realización de actividades de autocuidado, productivas, lúdicas y de ocio.', 'Ocupacional', '/cook.jpg'),
('Manos Que Hacen', 'Trabajos producto de nuestros talleres ocupacionales, clases regulares y clases especiales.', 'Talleres', '/assesore.jpg');

-- Insert initial mock data into events
INSERT INTO events (title, slug, content, event_date, cover_image_url, is_published) VALUES
('Caminata & Kermesse Anual', 'caminata-kermesse', 'El evento consistirá en la realización de la edición de Escala/Camina. La misma tiene como principal objetivo canalizar el acompañamiento de la sociedad, al tiempo que sensibiliza y contribuye a una sociedad más justa, equitativa, solidaria e inclusiva.', 'Octubre', '/camina/camina_main.jpg', true);
