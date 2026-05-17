# Guía de Despliegue: Centro de Día Escala

Esta guía define el orden seguro para publicar la app con Supabase como fuente única de datos, auth admin manual y solicitudes de entrevista protegidas por Server Actions.

## Camino rápido de rollout

**Orden operativo exacto:** preparar Supabase → configurar variables → desplegar código → aplicar schema → correr seed una sola vez → crear admin manual → deshabilitar signup público → verificar → recién ahí conectar dominio.

| Orden | Acción | Stop point |
|-------|--------|------------|
| 1 | Crear proyecto Supabase y copiar URL/keys. | No ejecutar SQL todavía. |
| 2 | Configurar variables en Vercel/local. | No publicar sin `SUPABASE_SERVICE_ROLE_KEY` y `RATE_LIMIT_SECRET`. |
| 3 | Desplegar el código actualizado. | No navegar producción todavía: faltan tablas/datos/admin. |
| 4 | Ejecutar `supabase/schema.sql` en Supabase. | Requiere clearance del maintainer. |
| 5 | Ejecutar `supabase/seed.sql` **una sola vez**. | Requiere clearance del maintainer. |
| 6 | Crear manualmente el usuario admin y deshabilitar signup público. | Requiere clearance del maintainer. |
| 7 | Verificar Data API, RLS, Auth y rate limit. | Si falla algo, no conectar dominio. |
| 8 | Conectar dominio y correo. | Solo después de verificación completa. |

> **Fuera de scope para automatización:** aplicar schema, correr seed, crear usuarios Supabase Auth y verificar contra un proyecto real deben hacerse manualmente por un maintainer con acceso al dashboard.

## 1. Repositorio en GitHub

Vercel necesita leer el código desde un repositorio git.

1. Inicializar el repositorio local si todavía no existe (`git init`, `git add .`, `git commit`).
2. Crear un repositorio en GitHub usando GitHub CLI (`gh repo create`) o desde la web.
3. Pushear el código (`git push -u origin main`).

## 2. Supabase: proyecto y settings seguros

1. Ingresar a [Supabase](https://supabase.com/) y crear un **New Project**.
2. Elegir una contraseña segura y una región cercana (por ejemplo, São Paulo).
3. En **Project Settings → API**, copiar:
   - `Project URL`
   - `anon / public key` o publishable key
   - `service_role` o secret key

### Settings requeridos en Supabase

| Área | Setting | Valor esperado |
|------|---------|----------------|
| Data API | Data API | ON |
| Data API | Automatically expose new tables | OFF |
| Database / RLS | Automatic RLS for new tables | ON |
| Auth | Public signup | Disabled |

> Aunque el proyecto use **Automatically expose new tables OFF**, `supabase/schema.sql` ya incluye los `GRANT` explícitos necesarios para las tablas públicas. Esto es distinto de RLS: los grants habilitan el acceso a la Data API y las policies deciden qué filas se pueden leer.

## 3. Variables de entorno

Configurar estas variables antes del deploy en Vercel (**Settings → Environment Variables**) y en cualquier entorno local de verificación.

| Variable | Alcance | Se expone al browser | Uso |
|----------|---------|----------------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Público | Sí | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público | Sí | Key pública para lecturas permitidas por RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor | No | Server Actions/admin CRUD e inserts protegidos. |
| `ADMIN_EMAIL` | Servidor | No | Allowlist del único admin operativo. |
| `RATE_LIMIT_SECRET` | Servidor | No | HMAC estable para hashear IPs de rate limit. |
| `INTERVIEW_RATE_LIMIT_MAX` | Servidor | No | Límite de solicitudes por ventana; default recomendado: `3`. |
| `INTERVIEW_RATE_LIMIT_WINDOW_MINUTES` | Servidor | No | Ventana de rate limit; default recomendado: `60`. |

**Nunca** crear `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` ni `NEXT_PUBLIC_RATE_LIMIT_SECRET`. Esas variables quedarían dentro del bundle del navegador.

## 4. Hosting frontend en Vercel

1. Ingresar a [Vercel](https://vercel.com/) e iniciar sesión con GitHub.
2. Hacer clic en **Add New... → Project** e importar el repositorio.
3. Cargar todas las variables de la sección anterior.
4. Ejecutar el deploy.
5. Al finalizar, Vercel entregará una URL temporal (por ejemplo, `escala-web.vercel.app`).

**Stop point:** no usar la URL pública todavía si el schema, seed y admin no fueron preparados.

## 5. Base de datos: schema y seed

Ejecutar estos pasos solo después de tener el código/env listos.

| Orden | Archivo | Cuándo ejecutarlo | Resultado esperado |
|-------|---------|-------------------|--------------------|
| 1 | `supabase/schema.sql` | Una vez por ambiente, después del deploy/env. | Crea tablas, índices, GRANTs, RLS policies y RPC de rate limit. |
| 2 | `supabase/seed.sql` | Una sola vez después del schema. | Carga contenido inicial idempotente para sitio público y CMS. |

### Checklist SQL

- [ ] Abrir **Supabase → SQL Editor**.
- [ ] Pegar y ejecutar `supabase/schema.sql` completo.
- [ ] Confirmar que no hubo errores.
- [ ] Pegar y ejecutar `supabase/seed.sql` completo **una sola vez**.
- [ ] Confirmar que las tablas públicas tienen datos (`site_settings`, `professionals`, `activities`, `home_objectives`, `gallery_items`, `events`).
- [ ] Confirmar que `interview_requests` e `interview_rate_limits` no tienen grants/policies públicas de escritura.

## 6. Admin Auth

El admin se crea manualmente en Supabase Auth; no hay signup público.

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | Ir a **Authentication → Users**. | Acceso al listado de usuarios. |
| 2 | Crear usuario manual con email igual a `ADMIN_EMAIL`. | Existe un único admin allowlisted. |
| 3 | Definir contraseña segura y entregarla por canal seguro. | El admin puede iniciar sesión. |
| 4 | Ir a **Authentication → Providers / Sign in settings**. | Configuración de registro público. |
| 5 | Deshabilitar signup público. | Nadie puede auto-registrarse. |

**Stop point:** si existe un usuario autenticado cuyo email no coincide con `ADMIN_EMAIL`, debe ser rechazado por `/admin` y por Server Actions.

## 7. Verificación obligatoria antes de conectar dominio

### Verificación local automatizada

Ejecutar antes de pedir clearance para verificación real:

```bash
npm run test
npm run lint
npx tsc --noEmit
```

### Verificación manual contra Supabase real

Estos checks requieren acceso al proyecto real y clearance explícito del maintainer.

| Área | Check | Evidencia esperada |
|------|-------|--------------------|
| Public reads | La home carga datos desde Supabase. | Página renderiza settings, profesionales, objetivos y galería de DB. |
| Public RLS | `anon` puede hacer `SELECT` de tablas públicas activas. | Respuestas OK para contenido público. |
| Interview RLS | `anon` no puede insertar directo en `interview_requests`. | Supabase devuelve permiso/RLS denegado. |
| Admin login | `ADMIN_EMAIL` inicia sesión. | Acceso a `/admin/dashboard`. |
| Non-admin rejection | Otro usuario autenticado intenta entrar. | Redirect/rechazo sin ejecutar mutaciones. |
| Admin CRUD | Crear/editar/borrar profesional desde admin. | DB cambia y `/admin` + home revalidan. |
| Honeypot | Envío con `company_website` poblado. | No inserta entrevista y no consume cupo útil. |
| Rate limit | Repetir envíos desde misma IP. | Al superar el límite, no inserta y muestra error seguro. |
| Missing env | Quitar una env requerida en entorno controlado. | Falla explícita; no usa mocks runtime. |

**Stop point:** si cualquiera de estos checks falla, no conectar dominio ni difundir la URL.

## 8. Conexión de dominio (`centrodediaescala.org`)

1. En el dashboard de Vercel, ir a **Settings → Domains**.
2. Agregar `centrodediaescala.org`.
3. Vercel indicará los registros DNS requeridos (normalmente un registro **A** apuntando a `76.76.21.21` y/o un **CNAME**).
4. Ingresar al panel del proveedor del dominio (NIC.ar, Hostinger, etc.).
5. En **Zonas DNS**, eliminar registros A/CNAME conflictivos y agregar los provistos por Vercel.
6. Esperar propagación DNS (puede tardar de minutos a 24 horas).

## 9. Configuración de correos institucionales (opcional)

Al cambiar DNS en el dominio, los correos del FTP/hosting anterior pueden dejar de funcionar si no se migran los registros MX/TXT.

1. Crear cuenta en un proveedor de correo (Zoho Mail, Google Workspace, etc.).
2. El proveedor entregará registros **MX** y **TXT** para SPF/DKIM.
3. Agregar esos registros en el mismo panel DNS del dominio.
4. Verificar recepción y envío.

## Rollback operativo

| Momento | Acción segura |
|---------|---------------|
| Antes de conectar dominio | Revertir deploy en Vercel o redeployar commit anterior. |
| Después de schema/seed pero antes de tráfico público | Mantener dominio sin apuntar, corregir SQL/código y repetir verificación. |
| Después de tráfico público | Pausar difusión, revertir deploy, revisar logs Supabase/Vercel y restaurar datos solo si el maintainer lo autoriza. |

No borrar tablas ni usuarios en producción sin backup y aprobación explícita.
