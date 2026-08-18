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

- **Domain:** entidades y reglas que no dependen de tecnologías externas. Incluye User y su contrato UserRepository. `HealthCheck` sigue siendo solo un ejemplo técnico.
- **Application:** casos de uso y abstracciones de aplicación. Incluye RegisterUserUseCase, PasswordHasher e IdGenerator.
- **Infrastructure:** detalles técnicos de configuración y persistencia. PrismaUserRepository implementa UserRepository; PrismaClient, el adaptador PostgreSQL, el generador de identificadores y el hashing `scrypt` permanecen en esta capa.
- **Presentation:** adaptación HTTP con Express, rutas y controllers. Incluye `POST /users/register` además del health check.
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

Existe un flujo de registro inicial y el modelo Prisma User. La migración está aplicada y la conexión local con Supabase/PostgreSQL, incluida la persistencia real del registro, ha sido validada. Login, autenticación, rutas, meteorología, mapas, GPX e IA siguen sin implementarse.

El flujo de registro preparado es:

```text
POST /users/register
  ↓
route
  ↓
controller
  ↓
RegisterUserUseCase
  ↓
User + UserRepository
  ↓
PrismaUserRepository
  ↓
PrismaClient / PostgreSQL / Supabase
```

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

Infrastructure implementará los contratos definidos por Domain o Application cuando sea necesario. PrismaUserRepository implementa UserRepository, mientras que ScryptPasswordHasher e CryptoIdGenerator implementan contratos de Application. PrismaClient y su adaptador PostgreSQL quedan encapsulados en Infrastructure; Application y Domain no los importan. Este diseño sigue el principio de inversión de dependencias: las capas de alto nivel dependen de abstracciones, y los detalles tecnológicos se conectan desde los bordes de la aplicación.

Por tanto, la futura persistencia o los servicios externos podrán sustituirse sin introducir sus dependencias en las reglas de dominio.
