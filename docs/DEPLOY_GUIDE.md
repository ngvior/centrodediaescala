# Guía de Despliegue (Master Plan): Centro de Día Escala

Esta guía detalla el paso a paso exacto para llevar el proyecto desde el entorno de desarrollo local hasta producción, incluyendo hosting, base de datos, conexión de dominio y correos.

## PASO 1: Repositorio en GitHub
Vercel necesita leer el código de un repositorio git.
1. Inicializar el repositorio local (`git init`, `git add .`, `git commit`).
2. Crear un repositorio en GitHub usando GitHub CLI (`gh repo create`) o desde la web.
3. Pushear el código (`git push -u origin main`).

## PASO 2: Backend y Base de Datos (Supabase)
Aquí se levanta la infraestructura para el Backoffice y la DB.
1. Ingresar a [Supabase](https://supabase.com/) y crear un **New Project**.
2. Elegir contraseña segura y región cercana (ej. São Paulo).
3. Ir a **SQL Editor**, pegar el contenido de `supabase/schema.sql` y ejecutar (**Run**). Esto creará las tablas, roles (RLS) y datos iniciales.
4. Ir a **Project Settings -> API** y copiar dos datos clave:
   - `Project URL`
   - `anon / public key`

## PASO 3: Hosting Frontend (Vercel)
Aquí se publica la web para el acceso público.
1. Ingresar a [Vercel](https://vercel.com/) e iniciar sesión con GitHub.
2. Hacer clic en **Add New... -> Project** e importar el repositorio de GitHub.
3. **CRÍTICO:** Antes de presionar Deploy, abrir la sección **Environment Variables** y agregar:
   - `NEXT_PUBLIC_SUPABASE_URL`: [Pegar URL de Supabase]
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Pegar Key de Supabase]
4. Presionar **Deploy**. Al finalizar, Vercel entregará una URL temporal (ej. `escala-web.vercel.app`).

## PASO 4: Conexión de Dominio (`centrodediaescala.org`)
1. En el dashboard de Vercel, ir a **Settings -> Domains**.
2. Agregar `centrodediaescala.org`.
3. Vercel indicará los registros DNS requeridos (generalmente un **Registro A** apuntando a una IP como `76.76.21.21` y/o un **CNAME**).
4. Ingresar al panel del proveedor del dominio (NIC.ar, Hostinger, etc.).
5. En la sección de "Zonas DNS", eliminar los registros A/CNAME conflictivos y agregar los provistos por Vercel.
6. Esperar la propagación (puede tardar de unos minutos a 24 horas).

## PASO 5: Configuración de Correos Institucionales (Opcional)
Al cambiar los DNS en el Paso 4, los correos del FTP anterior dejarán de funcionar.
1. Crear cuenta en un proveedor de correo (Zoho Mail para capa gratuita, o Google Workspace).
2. El proveedor entregará registros **MX** y **TXT** (para SPF/DKIM).
3. Agregar estos registros en el mismo panel de DNS utilizado en el Paso 4.
4. Verificar la recepción/envío de correos.