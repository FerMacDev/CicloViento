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
- Puerto EmailService y adaptador ResendEmailService integrados; el envío real de credenciales iniciales ya fue validado de forma controlada.
- Login backend mediante email y contraseña, con JWT de acceso, middleware Bearer reutilizable y endpoint técnico `GET /auth/me`.
- Cambio de contraseña autenticado, con verificación de la contraseña actual, nuevo hash y transición de `mustChangePassword` a `false`.
- Frontend de registro, login, cambio obligatorio de contraseña, dashboard mínimo y cierre de sesión local.
- Solicitud RoutePlan persistida con preferencias de ruta y formulario protegido `/plan-route`; no incluye generación real de recorridos.
- Geocodificación del punto de partida, persistencia de latitude/longitude y mapa con marcador del punto de salida.
- Generación explícita de un recorrido ciclista circular real mediante openrouteservice, perfil `cycling-road` y geometría GeoJSON.
- Visualización del recorrido generado mediante una polyline de Leaflet/OpenStreetMap.
- Consulta meteorológica de viento mediante Open-Meteo: velocidad, dirección, rachas y clasificación inicial de riesgo.
- Selección básica de ruta favorable al viento: hasta tres candidatas deterministas, comparación de favorabilidad del regreso y ruta seleccionada.

La generación circular pública actual está limitada a 100 km; RoutePlan sigue aceptando preferencias de hasta 300 km para futuras estrategias de routing.

## Planificado / pendiente

### Requisitos funcionales

- **RF-001 — Gestión de usuarios:** el registro inicial recibe nombre, apellidos y email; genera una contraseña temporal segura, almacena únicamente su hash y marca el cambio de contraseña como obligatorio. El login backend valida email y contraseña y emite un JWT de acceso. El frontend ofrece registro, login y cambio de contraseña obligatorio, y bloquea el dashboard mientras `mustChangePassword` sea `true`. El cambio de contraseña autenticado exige la contraseña actual, aplica una política mínima de 12 caracteres con letra y número, y desactiva `mustChangePassword`. Recuperación de contraseña, perfiles y preferencias siguen pendientes.
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
- **RNF-003 — Configuración:** secretos y configuración sensible deben gestionarse mediante variables de entorno. La conexión local con PostgreSQL/Supabase se configura exclusivamente con `DATABASE_URL` no versionada.
- **RNF-004 — Calidad técnica:** el backend debe mantenerse compilable con TypeScript y verificarse después de cambios relevantes.

### Seguridad

La contraseña temporal se genera de forma segura en Infrastructure, se procesa mediante hashing y no se almacena en texto plano ni se devuelve por HTTP. La autenticación utiliza JWT firmado con `JWT_SECRET`, configurado exclusivamente en el entorno local. El cambio de contraseña exige la actual y almacena solamente el nuevo hash. El frontend encapsula el token en localStorage como decisión de MVP y no almacena contraseñas. No existen todavía recuperación de contraseña, refresh tokens ni autorización por roles.

### Gestión de usuarios

El registro inicial y el login backend están implementados. El cambio de contraseña autenticado está preparado; recuperación de contraseña, perfiles y preferencias están pendientes.

### Planificación de rutas

La solicitud de planificación, geocodificación y generación de un único recorrido circular de carretera están implementadas. La distancia generada por el proveedor es aproximada y se muestra separada de la solicitada. La selección de alternativas y la optimización de desnivel siguen pendientes.

### Meteorología y viento

La previsión de viento se consulta explícitamente para el punto de salida. Está implementado el análisis de una ruta real por segmentos: bearing, tailwind/headwind/crosswind, porcentajes ponderados por distancia, análisis del regreso, favorableWindScore y advertencias por riesgo. Si se solicita una ruta favorable al viento, se generan hasta tres alternativas circulares deterministas, se comparan con una única previsión y se selecciona la de mejor favorabilidad para el regreso. Siguen pendientes optimización avanzada, hora de salida configurable y meteorología por múltiples puntos u horas.

### Mapas y GPX

El mapa visualiza el punto de partida y la geometría del recorrido generado. La importación o descarga de GPX siguen pendientes.

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
