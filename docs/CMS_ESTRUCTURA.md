# Modelo de Datos y CMS: Centro de Día Escala

Para garantizar que el 100% de la web sea administrable sin tocar código, se propone una base de datos relacional (PostgreSQL vía Supabase) que alimentará de forma dinámica tanto los listados (profesionales, actividades) como los textos estáticos del sitio (información de contacto, títulos, secciones).

## 1. Esquema de Entidades Principales (Listados)

### `professionals` (Equipo)
Gestión del staff del centro.
- `id` (uuid, primary key)
- `first_name` (text)
- `last_name` (text)
- `role` (text) - *Ej: Psicólogo, Terapista Ocupacional*
- `bio` (text, nullable)
- `image_url` (text, nullable) - *Ruta en Supabase Storage*
- `is_active` (boolean, default: true) - *Permite ocultar sin borrar registro histórico*
- `order_index` (integer, default: 0) - *Para ordenar manualmente cómo aparecen en la web*
- `created_at` (timestamp)

### `activities` (Talleres y Actividades)
Gestión de las actividades diarias.
- `id` (uuid, primary key)
- `title` (text) - *Ej: Taller de Cocina*
- `description` (text)
- `image_url` (text, nullable)
- `schedule_info` (text, nullable) - *Ej: Lunes y Miércoles 10hs*
- `is_active` (boolean, default: true)
- `created_at` (timestamp)

### `events` (Caminatas, Kermesse, Novedades)
Gestión de eventos especiales.
- `id` (uuid, primary key)
- `title` (text)
- `slug` (text, unique) - *Para la URL, ej: caminata-2026*
- `content` (text) - *Soporta Markdown o HTML rico del CMS*
- `event_date` (date, nullable)
- `cover_image_url` (text, nullable)
- `is_published` (boolean, default: false)
- `created_at` (timestamp)

### `interview_requests` (Turnos / Contacto)
Registro de solicitudes de entrevistas generadas desde la web.
- `id` (uuid, primary key)
- `contact_name` (text)
- `patient_name` (text, nullable)
- `phone` (text)
- `email` (text, nullable)
- `message` (text)
- `status` (enum: 'PENDING', 'CONTACTED', 'CONFIRMED', 'REJECTED') - *Estado para el Backoffice*
- `notes` (text, nullable) - *Anotaciones internas del administrador*
- `created_at` (timestamp)

---

## 2. Esquema de Contenido Dinámico (Textos e Imágenes de Páginas)

Para evitar hardcodear textos como la Misión, Visión o el teléfono de contacto, utilizamos un modelo de pares Clave-Valor (Key-Value) agrupados por sección.

### `site_settings` (Configuración General y Textos)
Almacena todas las variables de texto, enlaces e imágenes estructurales de la web.
- `id` (uuid, primary key)
- `group` (text) - *Agrupador para el CMS: 'CONTACTO', 'HOMEPAGE', 'GENERAL', 'REDES'*
- `key` (text, unique) - *Ej: 'contact_phone', 'home_hero_title', 'about_vision_text'*
- `value` (text) - *El contenido en sí*
- `type` (enum: 'TEXT', 'IMAGE_URL', 'LINK', 'RICHTEXT') - *Para renderizar el input correcto en el Backoffice*
- `description` (text) - *Ayuda para el usuario del CMS. Ej: "Texto principal del banner superior"*
- `updated_at` (timestamp)

#### Ejemplo de registros en `site_settings`:
| group | key | value | type |
|-------|-----|-------|------|
| CONTACTO | `contact_phone` | `+54 11 4635-4207` | TEXT |
| CONTACTO | `contact_address` | `José Enrique Rodó 5559, CABA` | TEXT |
| REDES | `social_facebook` | `https://facebook.com/...` | LINK |
| REDES | `social_linkedin` | `` | LINK |
| REDES | `social_twitter` | `` | LINK |
| HOMEPAGE | `home_hero_title` | `Bienvenidos a Escala` | TEXT |
| HOMEPAGE | `home_hero_bg_image` | `/storage/v1/object/.../banner.jpg` | IMAGE_URL |
| ABOUT | `about_mission` | `Somos una institución que tiene como finalidad...` | RICHTEXT |

#### Redes sociales públicas

Los enlaces sociales soportados por el pie de página público son:

- `social_facebook`
- `social_linkedin`
- `social_twitter` (también acepta URLs de X cuando el dominio es `x.com`)

Estos campos son opcionales: si el valor está vacío, mal formado, usa protocolos inseguros o no coincide con el dominio esperado de la plataforma, el enlace no se muestra. Google+ está deprecado y no se renderiza por defecto; si se define una plataforma de reemplazo debe configurarse con una de las claves soportadas.

---

## 3. Storage (Archivos)
Se crearán los siguientes buckets en Supabase Storage:
- `staff_images`: Fotos de perfil de profesionales.
- `activity_images`: Fotos ilustrativas de los talleres.
- `event_images`: Fotos y galerías de eventos (Escala/Camina).
- `site_assets`: Logos, banners de la página principal y assets estáticos subidos desde el CMS.