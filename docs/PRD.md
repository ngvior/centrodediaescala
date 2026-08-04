# Product Requirements Document (PRD)
**Proyecto:** Centro de Día Escala
**Fecha:** 15 de Mayo de 2026
**Estado:** Prototipo Frontend Finalizado, Esperando Backend

## 1. Propósito y Objetivos
Modernizar la presencia web del "Centro de Día Escala" reemplazando un sitio legacy (basado en HTML estático y FTP) por una arquitectura moderna y administrable. 
El objetivo principal es permitir al cliente (directores del centro) **actualizar el 100% del contenido de manera autónoma a través de un panel de control (Backoffice)** sin requerir conocimientos de programación.
Simultáneamente, se debe **preservar la identidad y estructura de navegación exacta de la landing page original** para no alienar a los usuarios actuales.

## 2. Alcance del Proyecto
### Incluido:
- Clonado pixel-perfect de la estructura de la Single Page original (HTML/CSS legacy a Next.js/Tailwind).
- Panel de control protegido por login (`/admin`).
- ABM (Alta, Baja, Modificación) para gestionar Profesionales, Actividades y Galería de Imágenes.
- Interfaz dinámica para editar textos estructurales de la web (Configuración general).
- Sistema para recibir y gestionar solicitudes de entrevistas (Turnos) desde la web.

### Excluido en esta fase:
- Integración con pasarelas de pago.
- Sistema de usuarios/pacientes con perfiles en el frontend público.

## 3. Arquitectura y Stack Tecnológico
Se optó por una arquitectura moderna "Serverless/Headless" de bajo costo de mantenimiento.
- **Frontend (Web Pública y Panel de Admin):** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend / Base de Datos:** Supabase (PostgreSQL + Auth + Storage).
- **Hosting / Despliegue:** Vercel (Capa Gratuita Hobby).
- **Gestión de Dominio:** Modificación de registros DNS (`centrodediaescala.org`) para apuntar a Vercel.
- **Correos Institucionales:** Desacoplamiento del FTP antiguo usando Zoho Mail o Google Workspace.

## 4. Requerimientos Funcionales
### 4.1. Web Pública (Landing)
- **Top Content (Hero):** Debe mostrar el título principal, mensaje de bienvenida y un llamado a la acción. Fondo dinámico.
- **Institución:** Sección con información institucional, lista de objetivos (con íconos dinámicos) y listado de requisitos de admisión y detalles de instalaciones.
- **Actividades:** Presentación a dos columnas de los talleres y espacios recreativos y terapéuticos con título, descripción e ícono referencial.
- **Galería:** Sistema de visualización de fotos institucionales y de eventos con filtro por categorías (tipo Isotope).
- **Equipo (Profesionales):** Grilla visual mostrando foto (circular), nombre, apellido y cargo/especialidad de todo el staff activo.
- **Contacto:** Formulario funcional de "Solicitar Entrevista" y tarjetas informativas con dirección, teléfono y horarios.

### 4.2. Backoffice (`/admin`)
- **Autenticación:** El panel debe estar protegido y ser accesible únicamente mediante credenciales válidas.
- **Dashboard:** Debe mostrar indicadores principales (Turnos pendientes, Profesionales activos, Actividades configuradas).
- **Gestión de Contenido:** 
  - ABM de Profesionales.
  - ABM de Actividades y Talleres.
  - Edición de configuración general (textos de la web pública mapeados por sistema clave-valor).
- **Gestión de Entrevistas:** Visor simple tipo CRM para revisar quién llenó el formulario de contacto y en qué estado se encuentra (Pendiente, Contactado).

## 5. Diseño y UX/UI
- **Identidad Visual:** Clonación exacta de los colores originales del sitio legacy (Azul Escala `#1593D7`, Celeste `#49b5e7`, etc.).
- **Tipografías:** Lato (para textos generales) y Dosis (para titulares y headers en mayúsculas).
- **Estructura de Ruteo:** Arquitectura de *Route Groups* en Next.js. La web pública vive bajo `(public)` asegurando que la navegación por anclas (`#institucion`) funcione sin que el Header colisione con el layout exclusivo del Backoffice.

## 6. Modelo de Datos (Base de Datos)
Definido e implementado conceptualmente en `supabase/schema.sql` (Ver documento `CMS_ESTRUCTURA.md` para detalle de campos).
- `site_settings`: Para textos globales.
- `professionals`: Staff del centro.
- `activities`: Talleres dictados.
- `events`: Actividades especiales tipo Escala/Camina.
- `interview_requests`: Entrevistas solicitadas por la web.

## 7. Plan de Acción y Siguientes Pasos
1. **Infraestructura:** El propietario del proyecto debe crear una instancia en Supabase y proveer las claves API (`URL` y `Anon Key`).
2. **Setup BD:** Ejecutar script `schema.sql` en Supabase para montar estructura.
3. **Integración:** La capa `lib/api/index.ts` consume datos reales de Supabase como única fuente de contenido, sin mock-files intermedios de respaldo.
4. **Finalizar Backoffice:** Construir las vistas faltantes para el administrador en el panel `/admin`.
5. **Despliegue:** Subir repositorio a GitHub, deployar en Vercel y asociar el dominio `.org`.