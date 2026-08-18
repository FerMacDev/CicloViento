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
- Registro de usuario validado, con hash de contraseña y email único.

Todavía están pendientes login, autenticación, rutas, meteorología, mapas, GPX, IA y despliegue.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Arquitectura | Clean Architecture |
| Persistencia preparada | Prisma 7, PostgreSQL y Supabase como proveedor previsto |

La conexión local con Supabase PostgreSQL está validada. El único modelo definido es User, exclusivamente para el registro inicial.

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

## Arquitectura

El backend separa Presentation, Application, Domain e Infrastructure. El registro de usuario sigue este flujo sin exponer Prisma fuera de Infrastructure: ruta, controller, caso de uso, contrato de repositorio y adaptador Prisma. La arquitectura actual y la arquitectura objetivo están documentadas en `ARCHITECTURE.md`.

## Requisitos

Los requisitos, su estado y el alcance pendiente se describen en `REQUIREMENTS.md`.

## Desarrollo

CicloViento se desarrolla incrementalmente por fases. No se deben asumir ni presentar como disponibles funcionalidades que todavía no estén implementadas.
