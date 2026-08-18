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
- **Application:** casos de uso y abstracciones de aplicación. Incluye RegisterUserUseCase, LoginUserUseCase, ChangePasswordUseCase, PasswordPolicy, PasswordGenerator, PasswordHasher, TokenService, EmailService e IdGenerator.
- **Infrastructure:** detalles técnicos de configuración y persistencia. PrismaUserRepository implementa UserRepository; PrismaClient, el adaptador PostgreSQL, el generador criptográfico de contraseñas, el hashing `scrypt`, ResendEmailService y JwtTokenService permanecen en esta capa.
- **Presentation:** adaptación HTTP con Express, rutas, controllers y middleware. Incluye `POST /users/register`, `POST /auth/login`, `POST /auth/change-password`, el middleware Bearer, el guard de cambio obligatorio, `GET /auth/me` y el health check.
- **main.ts:** punto de composición y arranque del servidor.

El flujo técnico de health check es:

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
PasswordGenerator → PasswordHasher
  ↓
User + UserRepository
  ↓
PrismaUserRepository
  ↓
PrismaClient / PostgreSQL / Supabase
  ↓
EmailService → ResendEmailService → Resend API
```

El flujo de login implementado es:

```text
POST /auth/login
  ↓
route → controller
  ↓
LoginUserUseCase
  ↓
UserRepository + PasswordHasher + TokenService
  ↓
PrismaUserRepository + ScryptPasswordHasher + JwtTokenService
```

`TokenService` solo recibe y devuelve el identificador del usuario. JwtTokenService firma un JWT con el claim estándar `sub`; `password`, `passwordHash` y `mustChangePassword` no se incluyen. El middleware de autenticación delega la validación criptográfica en TokenService y deja el `userId` autenticado disponible para el endpoint técnico `GET /auth/me`.

El flujo de cambio de contraseña implementado es:

```text
POST /auth/change-password + Bearer token
  ↓
authentication middleware
  ↓
ChangePasswordController
  ↓
ChangePasswordUseCase
  ↓
UserRepository + PasswordHasher + PasswordPolicy
  ↓
PrismaUserRepository + ScryptPasswordHasher
```

El controlador toma `userId` exclusivamente del contexto creado por el middleware JWT, nunca del body. Tras verificar la contraseña actual, ChangePasswordUseCase valida la nueva contraseña, genera su hash, actualiza el usuario y establece `mustChangePassword=false`. No emite otro JWT: el existente mantiene validez porque solo contiene `sub`, `iat` y `exp`.

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

La contraseña temporal se genera y se entrega a EmailService solo en memoria; User persiste únicamente passwordHash y mustChangePassword. El MVP intenta entregar el email antes de persistir el usuario, por lo que un fallo de Resend devuelve un error controlado y no deja un usuario creado sin credenciales entregadas. Si la persistencia fallase después de una entrega satisfactoria, el destinatario recibiría unas credenciales aún no activas; podrá reintentar el registro. Como evolución, el patrón outbox permitirá coordinar persistencia y reintentos de entrega de forma fiable.

El login permite autenticar una contraseña temporal y devuelve `mustChangePassword` como dato público de contexto. El cambio de contraseña puede hacerse tanto de forma obligatoria como voluntaria y exige siempre la contraseña actual. El guard `createMustChangePasswordGuard` es reutilizable para futuras rutas normales: consulta el usuario mediante UserRepository y devuelve `403` mientras `mustChangePassword` sea `true`; login, contexto mínimo y cambio de contraseña no se bloquean.

Por tanto, la futura persistencia o los servicios externos podrán sustituirse sin introducir sus dependencias en las reglas de dominio.
