# Guía de Despliegue: Centro de Día Escala

Esta guía define el orden seguro para publicar la app con Supabase como fuente única de datos, auth admin manual y solicitudes de entrevista protegidas por Server Actions.

## Camino rápido de rollout

**Orden operativo exacto:** preparar Supabase → configurar variables → desplegar código → aplicar schema → importar el export de datos reales → crear admin manual → deshabilitar signup público → verificar → recién ahí conectar dominio.

| Orden | Acción | Stop point |
|-------|--------|------------|
| 1 | Crear proyecto Supabase y copiar URL/keys. | No ejecutar SQL todavía. |
| 2 | Configurar variables en Vercel/local. | No publicar sin `SUPABASE_SERVICE_ROLE_KEY` y `RATE_LIMIT_SECRET`. |
| 3 | Desplegar el código actualizado. | No navegar producción todavía: faltan tablas/datos/admin. |
| 4 | Ejecutar `supabase/schema.sql` en Supabase. | Requiere clearance del maintainer. |
| 5 | Importar el export de datos de la base productiva (`pg_dump --data-only` o dump de Supabase). | Requiere clearance del maintainer. **Nunca** ejecutar `supabase/seed.sql` acá. |
| 6 | Crear manualmente el usuario admin y deshabilitar signup público. | Requiere clearance del maintainer. |
| 7 | Verificar Data API, RLS, Auth y rate limit. | Si falla algo, no conectar dominio. |
| 8 | Conectar dominio y correo. | Solo después de verificación completa. |

> **Fuera de scope para automatización:** aplicar schema, generar e importar el export de datos, crear usuarios Supabase Auth y verificar contra un proyecto real deben hacerse manualmente por un maintainer con acceso al dashboard.

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

**Stop point:** no usar la URL pública todavía si el schema, los datos y el admin no fueron preparados.

## 5. Base de datos: schema y datos

Ejecutar estos pasos solo después de tener el código/env listos.

La estructura se crea con `supabase/schema.sql`. El contenido **no** se crea con `supabase/seed.sql`: la base productiva es la única fuente de verdad del contenido, porque el cliente edita textos, profesionales, actividades y galería desde el panel admin. Poblar un ambiente nuevo requiere un **export de datos reales** de la base productiva.

| Orden | Archivo | Cuándo ejecutarlo | Resultado esperado |
|-------|---------|-------------------|--------------------|
| 1 | `supabase/schema.sql` | Una vez por ambiente, después del deploy/env. Es idempotente: **también se re-ejecuta** cuando el repositorio agrega columnas a una tabla existente (ver más abajo). | Crea tablas, índices, GRANTs, RLS policies y RPC de rate limit. |
| 2 | Export de datos (`pg_dump --data-only` o dump de Supabase) | Una sola vez después del schema, sobre un ambiente vacío. | Carga el contenido real y vigente del sitio público y del CMS. |

> **Guardrail: nunca ejecutar `supabase/seed.sql` contra una base que ya tiene contenido real.** Dos motivos concretos: (1) el archivo abre con un `DELETE FROM public.gallery_items;` que borra todas las fotos cargadas desde el panel; (2) el resto de sus bloques usa `ON CONFLICT ... DO UPDATE`, así que sobrescribe silenciosamente las ediciones del cliente con los textos viejos del repositorio.
>
> `seed.sql` conserva un único uso legítimo: **bootstrapear un ambiente de desarrollo nuevo y vacío**, donde no hay contenido real que perder.

### Cambios de esquema sobre una base que ya existe

Todas las tablas de `schema.sql` se crean con `CREATE TABLE IF NOT EXISTS`. La consecuencia es contraintuitiva y hay que tenerla presente: **una columna agregada adentro de un bloque `CREATE TABLE` nunca llega a una base que ya está andando**, porque la sentencia entera se saltea. El cambio se ve en un ambiente nuevo y en ninguno de los existentes.

Por eso, toda columna agregada después del release inicial se declara **dos veces**:

1. Dentro del `CREATE TABLE` correspondiente → sirve a los ambientes nuevos.
2. Como `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en la sección de cambios, después de los `CREATE` → sirve a las bases vivas, y es no-op una vez aplicada.

Las dos tienen que quedar sincronizadas. Con solo el `ALTER`, un ambiente nuevo nunca recibe la columna. Con solo el `CREATE`, el import del `pg_dump --data-only` falla sobre el proyecto nuevo porque la columna del dump no existe en la tabla destino.

Para aplicar un cambio de este tipo a un ambiente existente basta con **re-ejecutar `schema.sql` completo**: es idempotente de punta a punta y no toca contenido.

> **Orden obligatorio: primero el SQL, después el deploy.** El código lee las columnas nuevas por nombre, así que si se despliega antes de aplicar el `ALTER`, la lectura falla y la página que la usa se cae (`column ... does not exist`). Aplicar el schema primero no rompe nada: la base tolera columnas que todavía nadie lee.

### Checklist SQL

- [ ] Abrir **Supabase → SQL Editor**.
- [ ] Pegar y ejecutar `supabase/schema.sql` completo.
- [ ] Confirmar que no hubo errores.
- [ ] Confirmar que las tablas públicas están vacías antes de importar datos.
- [ ] Generar el export de datos de la base productiva (`pg_dump --data-only` o dump de Supabase) e importarlo **una sola vez**.
- [ ] Confirmar que las tablas públicas tienen datos (`site_settings`, `professionals`, `activities`, `home_objectives`, `gallery_items`, `events`).
- [ ] Confirmar que el contenido importado coincide con el sitio productivo (textos, galería y profesionales).
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
| Después de schema/import de datos pero antes de tráfico público | Mantener dominio sin apuntar, corregir SQL/código y repetir verificación. |
| Después de tráfico público | Pausar difusión, revertir deploy, revisar logs Supabase/Vercel y restaurar datos solo si el maintainer lo autoriza. |

No borrar tablas ni usuarios en producción sin backup y aprobación explícita.
