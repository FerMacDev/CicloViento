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

Todavía están pendientes usuarios, autenticación, Supabase, Prisma, rutas, meteorología, mapas, GPX, IA y despliegue.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Arquitectura | Clean Architecture |
| Persistencia prevista | Supabase, PostgreSQL, Prisma |

La persistencia prevista no está configurada todavía.

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

El backend separa Presentation, Application, Domain e Infrastructure. La arquitectura actual y la arquitectura objetivo están documentadas en `ARCHITECTURE.md`.

## Requisitos

Los requisitos, su estado y el alcance pendiente se describen en `REQUIREMENTS.md`.

## Desarrollo

CicloViento se desarrolla incrementalmente por fases. No se deben asumir ni presentar como disponibles funcionalidades que todavía no estén implementadas.
