# Requisitos de CicloViento

## Objetivo general

Desarrollar una aplicación web para ayudar a planificar rutas de ciclismo de carretera considerando punto de partida, fecha, distancia, desnivel acumulado, meteorología y viento, incluyendo la posibilidad futura de favorecer condiciones de viento adecuadas durante el regreso.

## Alcance

El alcance funcional se desarrollará de forma incremental. Este documento diferencia explícitamente el estado actual del alcance planificado.

## Implementado actualmente

- Estructura inicial del proyecto.
- Frontend inicial con React, TypeScript y Vite.
- Backend inicial con Node.js, Express y TypeScript.
- Clean Architecture inicial en el backend.
- Endpoint técnico `GET /health`, que devuelve `{ "status": "ok" }`.
- Infraestructura mínima de Prisma 7 para PostgreSQL: schema con el modelo User, cliente generado y proveedor en Infrastructure.
- Migración User aplicada y conexión local con Supabase PostgreSQL validada.
- Modelo User, entidad de dominio User, contrato UserRepository, adaptador PrismaUserRepository y caso de uso RegisterUser implementados.
- Endpoint de registro `POST /users/register` con email único, contraseña temporal generada por el backend y hash de contraseña.
- Campo `mustChangePassword` inicializado en `true` para el futuro cambio obligatorio de contraseña.
- Puerto EmailService y adaptador ResendEmailService integrados para el futuro envío de credenciales iniciales.

Login, autenticación, rutas ciclistas, integración meteorológica, mapas, GPX, IA y despliegue siguen pendientes.

## Planificado / pendiente

### Requisitos funcionales

- **RF-001 — Gestión de usuarios:** el registro inicial recibe nombre, apellidos y email; genera una contraseña temporal segura, almacena únicamente su hash y marca el cambio de contraseña como obligatorio. Resend está integrado mediante EmailService, pero la entrega real no se ha validado todavía con una dirección segura de prueba. Login, perfiles y preferencias siguen pendientes.
- **RF-002 — Planificación de rutas:** considerar punto de partida, fecha, distancia y desnivel acumulado para la futura planificación de rutas.
- **RF-003 — Meteorología:** consultar y presentar condiciones meteorológicas relevantes para una ruta planificada.
- **RF-004 — Viento:** considerar velocidad y dirección del viento, e informar de condiciones potencialmente peligrosas.
- **RF-005 — Optimización según viento:** estudiar rutas que puedan favorecer el viento durante el regreso.
- **RF-006 — Visualización mediante mapa:** mostrar las rutas en un mapa.
- **RF-007 — Descarga GPX:** permitir la descarga de rutas en formato GPX.
- **RF-008 — IA:** evaluar el uso futuro de IA como apoyo a recomendaciones y optimización.

### Requisitos no funcionales

- **RNF-001 — Lenguaje y stack:** el código principal se desarrollará con TypeScript; el frontend utilizará React y Vite, y el backend Node.js y Express.
- **RNF-002 — Arquitectura:** el backend debe mantener Clean Architecture y evitar dependencias tecnológicas en Domain.
- **RNF-003 — Configuración:** secretos y configuración sensible deben gestionarse mediante variables de entorno. La plantilla de `DATABASE_URL` está disponible, pero una conexión real sigue pendiente de configuración local.
- **RNF-004 — Calidad técnica:** el backend debe mantenerse compilable con TypeScript y verificarse después de cambios relevantes.

### Seguridad

La contraseña temporal se genera de forma segura en Infrastructure, se procesa mediante hashing y no se almacena en texto plano ni se devuelve por HTTP. Resend está encapsulado en Infrastructure; la autenticación, autorización y la validación de entrega real siguen pendientes. No existe login implementado en esta fase.

### Gestión de usuarios

El registro inicial está validado contra PostgreSQL. Inicio de sesión, perfiles y preferencias están pendientes.

### Planificación de rutas

La creación, consulta y selección de rutas están pendientes.

### Meteorología y viento

No hay integración con proveedores meteorológicos ni cálculo de condiciones de viento. Su incorporación se realizará en una fase posterior.

### Mapas y GPX

La visualización mediante mapas y la importación o descarga de GPX están pendientes.

### IA

No hay capacidades de IA implementadas. Su posible uso futuro se limita al apoyo a recomendaciones y optimización.

### Despliegue

No hay configuración de despliegue definida ni implementada.

## Criterios de aceptación del MVP

Los criterios funcionales del MVP están pendientes de implementación. Como base técnica ya comprobada, el backend debe compilar y responder al endpoint técnico `GET /health`.

## Funcionalidades fuera del alcance inicial

No se ha definido un alcance adicional fuera de las funcionalidades planificadas en este documento. Cualquier capacidad nueva deberá incorporarse primero como requisito explícito.

## Evolución futura

Las futuras fases podrán avanzar con login, perfiles y el resto de funcionalidades de usuarios, rutas, meteorología, viento, mapas, GPX e IA, manteniendo la separación arquitectónica actual.
