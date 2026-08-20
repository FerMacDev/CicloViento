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
- SMTP de Gmail integrado como proveedor de correo transaccional para las credenciales iniciales; Resend se conserva como alternativa futura.
- Login mediante `POST /auth/login`, con JWT de acceso y respuesta segura del usuario.
- Middleware Bearer reutilizable y endpoint técnico protegido `GET /auth/me`.
- Cambio de contraseña mediante `POST /auth/change-password`, que actualiza el hash y desactiva `mustChangePassword`.
- Frontend de inicio, registro, login, cambio obligatorio de contraseña y dashboard autenticado mínimo.
- Geocodificación del punto de partida y mapa Leaflet/OpenStreetMap.
- Generación manual de un recorrido ciclista circular de carretera con openrouteservice.

Todavía están pendientes recuperación de contraseña, refresh tokens, optimización avanzada, integración Garmin/Strava e IA.

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Arquitectura | Clean Architecture |
| Persistencia | Prisma 7, PostgreSQL y Supabase como proveedor |

La conexión local con Supabase PostgreSQL está validada. El único modelo definido es User, exclusivamente para el registro inicial.

El endpoint `POST /users/register` recibe `firstName`, `lastName` y `email`. La contraseña temporal se genera en el backend, no se devuelve por HTTP y se entrega mediante SMTP cuando la configuración local sea válida. El usuario se persiste solo después de que el proveedor acepte el envío.

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

El envío de credenciales iniciales usa SMTP de Gmail para la demostración del TFM. Configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_APP_PASSWORD` y `EMAIL_FROM` únicamente en `backend/.env`. `SMTP_APP_PASSWORD` debe ser una contraseña de aplicación de Google, nunca la contraseña normal de Gmail. No incluyas estos valores en archivos versionados. `ResendEmailService` y `RESEND_API_KEY` se conservan como alternativa futura para un dominio propio verificado.

La autenticación requiere `JWT_SECRET` en `backend/.env`; no debe versionarse ni sustituirse por un valor generado automáticamente. `JWT_EXPIRES_IN` es opcional y su valor predeterminado es `15m`.

El frontend toma la URL pública del backend de `VITE_API_URL`. Copia `frontend/.env.example` a `frontend/.env` para ajustarla si el backend no usa `http://localhost:3000`.

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

## Despliegue

La aplicación está publicada en Render y disponible para su utilización:

- Frontend: [https://cicloviento.onrender.com](https://cicloviento.onrender.com)
- API backend: [https://cicloviento-api.onrender.com](https://cicloviento-api.onrender.com)
- Health check: [https://cicloviento-api.onrender.com/health](https://cicloviento-api.onrender.com/health)

El frontend se publica como Static Site y el backend como Web Service. La API utiliza las variables de entorno configuradas exclusivamente en Render; no se incluyen secretos en el repositorio. El backend se ejecuta en una instancia Starter para permitir el envío SMTP de credenciales iniciales.

## Autenticación

```text
POST /auth/login
```

Recibe `email` y `password`. Con credenciales correctas devuelve un `accessToken` y los datos públicos del usuario, incluido `mustChangePassword`. No devuelve contraseñas ni hashes.

```text
GET /auth/me
Authorization: Bearer <accessToken>
```

Es un endpoint técnico protegido que comprueba el middleware JWT y devuelve únicamente datos públicos del usuario autenticado: identificador, nombre, apellidos, email y `mustChangePassword`. Tokens ausentes, inválidos o expirados devuelven `401`.

```text
POST /auth/change-password
Authorization: Bearer <accessToken>
```

Recibe `currentPassword` y `newPassword`; el usuario se obtiene exclusivamente del JWT. La nueva contraseña debe tener al menos 12 caracteres, una letra y un número, y ser distinta de la actual. Tras un cambio correcto se almacena un nuevo hash y `mustChangePassword` pasa a `false`. El JWT vigente no se reemplaza porque solo contiene identidad y expiración.

## Frontend

Las páginas disponibles son `/`, `/register`, `/login`, `/change-password` y `/dashboard`. Tras login, el frontend redirige a `/change-password` si `mustChangePassword` es `true`; en caso contrario abre el dashboard. La sesión se restaura con `GET /auth/me` al recargar y se elimina si el token deja de ser válido.

Para este MVP, el access token y datos públicos del usuario se guardan mediante un servicio encapsulado sobre `localStorage`. No se guardan contraseñas ni hashes. Una evolución futura podrá sustituirlo por cookies HttpOnly coordinadas con el backend.

La página protegida `/plan-route` guarda una solicitud de planificación con punto de partida, fecha, hora de salida, distancia, desnivel y preferencia de viento mediante `POST /route-plans`.

El backend geocodifica el punto de partida con Nominatim al guardar la planificación y persiste sus coordenadas. Para respetar el proveedor público, aplica una caché en memoria y limita las consultas a una por segundo; no hay autocomplete. La configuración opcional usa `NOMINATIM_BASE_URL` y `NOMINATIM_USER_AGENT` (por defecto `CicloViento/1.0`), sin secretos.
El botón **Generar recorrido** llama de forma explícita a `POST /route-plans/:id/generate`. El backend usa openrouteservice Directions v2 con perfil `cycling-road`, round-trip y respuesta GeoJSON; la clave `ORS_API_KEY` se configura exclusivamente en `backend/.env` y nunca se expone al frontend. La API pública de ORS limita los recorridos circulares a 100 km: no se genera ni trunca una ruta superior. El mapa muestra la polyline real devuelta y distingue la distancia solicitada de la generada. Al solicitar una ruta favorable al viento, el backend compara hasta tres candidatas antes de devolver una sola geometría seleccionada.

La consulta explícita `GET /route-plans/:id/weather` usa Open-Meteo Forecast API sin API key para este uso. Muestra condición general mediante iconos locales, temperatura, sensación térmica, probabilidad de precipitación, velocidad, rachas, dirección meteorológica y nivel de riesgo. La previsión se consulta para la hora de salida almacenada en RoutePlan: antes de `:30` se usa la hora actual y desde `:30` la siguiente hora, sin interpolar. Si la previsión aún no está disponible, devuelve `422` con un mensaje funcional claro. La interfaz atribuye los datos a Open-Meteo.

La ruta y el viento se muestran en el mismo mapa Leaflet. Cuando ya existe una previsión, una capa activable coloca siete flechas sobre puntos reales del recorrido para indicar hacia dónde sopla el viento: una dirección meteorológica del oeste (`270°`) se representa hacia el este (`90°`). Las flechas permanecen ancladas al mapa durante el zoom y el desplazamiento. No se muestran si no hay previsión disponible y no existe un segundo mapa meteorológico. Como mejora futura, el viento podrá variar por tramos según la duración estimada y los pronósticos horarios.

## Análisis del viento

`POST /route-plans/:id/wind-analysis` requiere Bearer JWT y analiza el recorrido generado. Tailwind es viento favorable en el avance; headwind es contrario y crosswind lateral. La dirección meteorológica indica de dónde viene el viento. Los porcentajes se calculan por distancia y la vuelta se aproxima como la segunda mitad de la distancia. `favorableWindScore` va de 0 a 100: cuanto mayor, más favorable es el regreso según cola y lateral.

Al activar **Ruta favorable al viento**, el backend compara hasta tres recorridos circulares reales con las semillas deterministas 1, 2 y 3. El margen ±20 % de distancia es preferente: si hay alternativas dentro de él, selecciona la de mejor viento para el regreso (`wind-optimized`); en empate prefiere la distancia más próxima y después la semilla menor. Si ninguna entra en el margen, devuelve la ruta real más cercana como `distance-fallback`, avisando de que no se considera optimizada por distancia. Si todavía no existe previsión para la fecha y hora solicitadas, se genera una única ruta circular normal y se marca como `weather-unavailable`, sin score ni análisis inventados; mapa y GPX siguen disponibles. Nunca se inventa una ruta; si ORS no devuelve ninguna geometría real, se muestra un error controlado. Favorabilidad no equivale a seguridad: la interfaz advierte ante riesgo alto o peligroso y no presenta esas condiciones como seguras. Aún no hay optimización avanzada ni IA.

## Descarga GPX

Cuando hay una ruta generada, el botón **Descargar GPX** solicita `GET /route-plans/:id/gpx` con la sesión autenticada. El backend devuelve un archivo GPX 1.1 con la geometría real de la ruta mostrada en el mapa, sin inventar elevaciones, datos personales ni secretos. Para una ruta favorable al viento, reutiliza la candidata seleccionada por la misma lógica de optimización. Como la geometría no se persiste, una descarga posterior puede regenerar la ruta; aunque las semillas son deterministas, el proveedor de rutas podría evolucionar. No hay aún otros formatos ni integración directa con Garmin o Strava.

## Arquitectura

El backend separa Presentation, Application, Domain e Infrastructure. El registro de usuario sigue este flujo sin exponer Prisma fuera de Infrastructure: ruta, controller, caso de uso, contrato de repositorio y adaptador Prisma. La arquitectura actual y la arquitectura objetivo están documentadas en `ARCHITECTURE.md`.

## Requisitos

Los requisitos, su estado y el alcance pendiente se describen en `REQUIREMENTS.md`.

## Desarrollo

CicloViento se desarrolla incrementalmente por fases. No se deben asumir ni presentar como disponibles funcionalidades que todavía no estén implementadas.
