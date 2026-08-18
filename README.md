# CicloViento

Aplicación web en fase inicial para planificar rutas de ciclismo de carretera considerando características de la ruta, meteorología y viento.

## Objetivo

Ayudar a seleccionar una ruta adecuada desde un punto de partida, para una fecha y unas preferencias de distancia y desnivel, con especial atención a las condiciones de viento y a su posible impacto en el regreso.

## Estado actual

El proyecto está en una fase técnica inicial. Actualmente están preparados:

- Frontend inicial con React, TypeScript y Vite.
- Backend inicial con Node.js, Express y TypeScript.
- Clean Architecture inicial en el backend.
- Endpoint técnico `GET /health`.
- Conexión local validada con Supabase PostgreSQL mediante Prisma.
- Modelo User y migración aplicados.
- Registro de usuario con contraseña temporal generada por el backend, hash `scrypt`, email único y `mustChangePassword=true`.
- Resend integrado como proveedor de correo transaccional para las credenciales iniciales.
- Login mediante `POST /auth/login`, con JWT de acceso y respuesta segura del usuario.
- Middleware Bearer reutilizable y endpoint técnico protegido `GET /auth/me`.

Todavía están pendientes cambio y recuperación de contraseña, refresh tokens, frontend de login, rutas, meteorología, mapas, GPX, IA y despliegue.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Arquitectura | Clean Architecture |
| Persistencia | Prisma 7, PostgreSQL y Supabase como proveedor |

La conexión local con Supabase PostgreSQL está validada. El único modelo definido es User, exclusivamente para el registro inicial.

El endpoint `POST /users/register` recibe `firstName`, `lastName` y `email`. La contraseña temporal se genera en el backend, no se devuelve por HTTP y se entrega mediante Resend cuando la configuración local sea válida.

## Estructura del proyecto

```text
CicloViento/
├── frontend/                 # Aplicación React con Vite
├── backend/
│   └── src/
│       ├── domain/           # Código independiente de tecnologías
│       ├── application/      # Casos de uso
│       ├── infrastructure/   # Configuración y futuros adaptadores técnicos
│       ├── presentation/     # Express, rutas y controllers
│       └── main.ts           # Arranque del backend
├── docs/                     # Documentación adicional
├── AGENTS.md                 # Reglas permanentes para el desarrollo
├── ARCHITECTURE.md           # Arquitectura actual y objetivo
├── REQUIREMENTS.md           # Requisitos y estado de implementación
└── .env.example              # Variables de entorno de referencia
```

## Instalación

Instala las dependencias de cada aplicación por separado:

```bash
cd frontend
npm install
```

```bash
cd backend
npm install
```

## Ejecución

En una terminal, inicia el frontend:

```bash
cd frontend
npm run dev
```

En otra terminal, inicia el backend:

```bash
cd backend
npm run dev
```

Para compilar el backend:

```bash
cd backend
npm run build
```

### Configuración local de base de datos

Prisma toma `DATABASE_URL` desde `backend/.env`. Copia `backend/.env.example` a `backend/.env` y completa la URL de conexión real de PostgreSQL/Supabase solo en tu entorno local. El archivo `.env` está ignorado por Git.

El envío de credenciales usa el SDK oficial de Resend y requiere también `RESEND_API_KEY` y `EMAIL_FROM` en `backend/.env`. El remitente debe pertenecer a un dominio verificado en Resend. No incluyas estos valores en archivos versionados.

La autenticación requiere `JWT_SECRET` en `backend/.env`; no debe versionarse ni sustituirse por un valor generado automáticamente. `JWT_EXPIRES_IN` es opcional y su valor predeterminado es `15m`.

Una vez configurada la conexión, genera el cliente y aplica la migración pendiente:

```bash
cd backend
npm run prisma:generate
npx prisma migrate deploy
```

## Health check

El único endpoint disponible en esta fase es técnico:

```text
GET /health
```

Respuesta:

```json
{
  "status": "ok"
}
```

## Autenticación

```text
POST /auth/login
```

Recibe `email` y `password`. Con credenciales correctas devuelve un `accessToken` y los datos públicos del usuario, incluido `mustChangePassword`. No devuelve contraseñas ni hashes. Mientras este indicador sea `true`, una fase posterior deberá restringir el acceso normal hasta completar el cambio de contraseña.

```text
GET /auth/me
Authorization: Bearer <accessToken>
```

Es un endpoint técnico protegido que comprueba el middleware JWT y devuelve únicamente el identificador autenticado. Tokens ausentes, inválidos o expirados devuelven `401`.

## Arquitectura

El backend separa Presentation, Application, Domain e Infrastructure. El registro de usuario sigue este flujo sin exponer Prisma fuera de Infrastructure: ruta, controller, caso de uso, contrato de repositorio y adaptador Prisma. La arquitectura actual y la arquitectura objetivo están documentadas en `ARCHITECTURE.md`.

## Requisitos

Los requisitos, su estado y el alcance pendiente se describen en `REQUIREMENTS.md`.

## Desarrollo

CicloViento se desarrolla incrementalmente por fases. No se deben asumir ni presentar como disponibles funcionalidades que todavía no estén implementadas.
