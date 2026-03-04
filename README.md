# Invitaciones - Sistema de Confirmación de Asistencia

Sistema web para gestionar invitaciones y confirmaciones de asistencia a eventos. Permite crear grupos de invitados, enviar formularios de confirmación personalizados mediante enlaces únicos, y consultar las respuestas en un dashboard administrativo.

## Características

- **Formularios personalizados** por grupo/familia con diseño mobile-first
- **Enlaces únicos** de un solo uso por grupo, configurables por rondas
- **Dashboard administrativo** con resumen en tiempo real
- **Confirmación de menú** (adulto/infantil) para menores de edad
- **Solicitud de boletos adicionales** con validación de capacidad
- **Restricciones alimentarias/alergias** por invitado
- **Edición de respuestas** durante el periodo activo
- **Múltiples rondas** de confirmación por evento

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** (estilos y diseño responsive)
- **Prisma 5** (ORM con PostgreSQL)
- **Supabase** (PostgreSQL gratuito en la nube)
- **Vercel** (hosting serverless gratuito)
- **GitHub Actions** (CI/CD)

## Configuración Local

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd Invitaciones
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura los valores:

```bash
cp .env.example .env
```

**Variables requeridas:**

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL (Supabase) |
| `JWT_SECRET` | Secret para tokens JWT (min 32 caracteres) |
| `ADMIN_USERNAME` | Usuario para el dashboard (default: `anfitrion`) |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña admin |
| `NEXT_PUBLIC_APP_URL` | URL base de la app |

### 3. Generar hash de contraseña

```bash
node scripts/hash-password.js "TuContraseñaSegura123!"
```

Copia el hash generado y pégalo en `ADMIN_PASSWORD_HASH` en el archivo `.env`.

**Credenciales por defecto:**
- Usuario: `anfitrion`
- Contraseña: `Inv1t@c10n3s#2026$Secure!`

### 4. Configurar base de datos

```bash
# Generar Prisma Client
npx prisma generate

# Aplicar schema a la base de datos
npx prisma db push

# (Opcional) Cargar datos de ejemplo
npx tsx prisma/seed.ts
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:3000`.

## Configuración de Supabase (Base de Datos Gratuita)

1. Crear una cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Ir a **Settings > Database** y copiar el **Connection string** (URI)
4. Pegar la connection string como `DATABASE_URL` en `.env`
5. Ejecutar `npx prisma db push` para crear las tablas

> **Tip:** Supabase free tier permite pausar el proyecto cuando no lo uses para ahorrar recursos.

## Deploy a Vercel

### Configuración inicial

1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar `vercel` en el directorio del proyecto y seguir las instrucciones
3. Configurar las variables de entorno en Vercel Dashboard > Settings > Environment Variables

### Deploy automático con GitHub Actions

Configurar los siguientes **secrets** en el repositorio de GitHub (Settings > Secrets > Actions):

| Secret | Descripción |
|--------|-------------|
| `VERCEL_TOKEN` | Token de API de Vercel (vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | ID de la organización en Vercel (en `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | ID del proyecto en Vercel (en `.vercel/project.json`) |
| `DATABASE_URL` | Connection string de Supabase |

El deploy se ejecuta automáticamente al hacer push a `main`.

### Migraciones manuales

Ejecutar el workflow **Database Migration** desde GitHub Actions para ejecutar migraciones sin hacer deploy.

## Flujo de Uso

1. **Login** en `{url}/login` con las credenciales de admin
2. **Crear evento** con fecha, hora, ubicación y descripción
3. **Crear grupos** y agregar invitados (adultos/menores)
4. **Crear ronda** definiendo fechas de apertura y cierre
5. **Abrir la ronda** → se generan enlaces únicos por grupo
6. **Copiar y compartir** los enlaces con cada grupo (WhatsApp, SMS, etc.)
7. **Invitados responden** desde el formulario personalizado
8. **Consultar respuestas** en el dashboard en tiempo real
9. **Cerrar ronda** y consultar resumen final
10. **Crear nuevas rondas** si es necesario

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Login/Logout
│   │   ├── events/             # CRUD Eventos
│   │   ├── groups/             # CRUD Grupos
│   │   ├── guests/             # CRUD Invitados
│   │   ├── invite/[token]/     # API pública para invitaciones
│   │   └── rounds/             # CRUD Rondas
│   ├── dashboard/              # Panel administrativo
│   │   ├── events/[id]/        # Detalle de evento (grupos, rondas, stats)
│   │   └── events/new/         # Crear evento
│   ├── invite/[token]/         # Formulario público de invitación
│   └── login/                  # Página de login
├── lib/
│   ├── auth.ts                 # Autenticación (JWT + bcrypt)
│   ├── db.ts                   # Prisma client singleton
│   ├── utils.ts                # Utilidades (cn, formatDate, etc.)
│   └── validations.ts          # Schemas de validación (Zod)
└── middleware.ts                # Protección de rutas
```
