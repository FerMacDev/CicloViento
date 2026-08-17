# Arquitectura de CicloViento

## Arquitectura actual

El repositorio contiene un frontend React y un backend Node.js con Express. La estructura activa del backend es:

```text
backend/src/
├── domain/
├── application/
├── infrastructure/
├── presentation/
└── main.ts
```

### Capas actuales

- **Domain:** entidades y reglas que no dependen de tecnologías externas. `HealthCheck` es un ejemplo técnico, no una entidad de negocio de CicloViento.
- **Application:** casos de uso que coordinan el dominio. `CheckHealthUseCase` es el ejemplo actual.
- **Infrastructure:** detalles técnicos de configuración. Actualmente solo contiene la lectura de configuración para el arranque.
- **Presentation:** adaptación HTTP con Express, rutas y controllers.
- **main.ts:** punto de composición y arranque del servidor.

El único flujo HTTP implementado es:

```text
GET /health
  ↓
route
  ↓
controller
  ↓
use case
  ↓
domain
  ↓
response
```

La respuesta actual es:

```json
{
  "status": "ok"
}
```

No existen aún módulos de usuarios, autenticación, Prisma, Supabase, rutas, meteorología, mapas, GPX o IA.

## Arquitectura objetivo

La arquitectura objetivo se construirá progresivamente. No está implementada todavía.

```text
Frontend
  ↓
REST API
  ↓
Presentation
  ↓
Application
  ↓
Domain
  ↑
Infrastructure
  ↓
Prisma
  ↓
PostgreSQL
  ↓
Supabase
```

En esta arquitectura objetivo, Infrastructure también alojará adaptadores para servicios externos de meteorología, routing, email e IA cuando dichos requisitos se implementen.

### Responsabilidades objetivo

- **Domain:** entidades, value objects, interfaces de repositorio y reglas de dominio.
- **Application:** casos de uso y coordinación de lógica de aplicación.
- **Infrastructure:** Prisma, PostgreSQL, Supabase, servicios externos, email, meteorología, routing e IA.
- **Presentation:** Express, controllers, routes, middlewares y adaptación HTTP.

## Reglas de dependencia

Las dependencias deben dirigirse hacia el núcleo:

```text
Presentation → Application → Domain
```

Domain no debe depender de Infrastructure. En particular, Domain no puede importar Express, Prisma, Supabase, clientes HTTP ni proveedores externos.

Infrastructure implementará los contratos definidos por Domain o Application cuando sea necesario. Este diseño sigue el principio de inversión de dependencias: las capas de alto nivel dependen de abstracciones, y los detalles tecnológicos se conectan desde los bordes de la aplicación.

Por tanto, la futura persistencia o los servicios externos podrán sustituirse sin introducir sus dependencias en las reglas de dominio.
