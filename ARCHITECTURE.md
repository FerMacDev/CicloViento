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
- **Infrastructure:** detalles técnicos de configuración y persistencia. PrismaUserRepository implementa UserRepository; PrismaClient, el adaptador PostgreSQL, el generador criptográfico de contraseñas, el hashing `scrypt`, SmtpEmailService, ResendEmailService y JwtTokenService permanecen en esta capa. SMTP de Gmail es el proveedor activo para la demostración; Resend se conserva como alternativa futura.
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
EmailService → SmtpEmailService → Gmail SMTP
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

El frontend usa React Router, un AuthProvider y un cliente HTTP centralizado. AuthProvider encapsula el token y el usuario público mediante auth-storage sobre localStorage, una decisión de MVP que evita dispersar el acceso al navegador; no se persisten contraseñas ni hashes. Al iniciar, valida la sesión con `GET /auth/me`, que ahora obtiene el usuario mediante UserRepository y devuelve exclusivamente `id`, nombre, apellidos, email y `mustChangePassword`.

ProtectedRoute redirige a login cuando no hay sesión y a cambio de contraseña cuando `mustChangePassword` está activo. ChangePasswordRoute permite únicamente esta operación hasta que se complete. El backend permite el origen local configurable mediante CORS, con `http://localhost:5173` como valor predeterminado de desarrollo.

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

La contraseña temporal se genera y se entrega a EmailService solo en memoria; User persiste únicamente passwordHash y mustChangePassword. El MVP intenta entregar el email antes de persistir el usuario, por lo que un fallo de SMTP devuelve un error controlado y no deja un usuario creado sin credenciales entregadas. SmtpEmailService recibe su configuración exclusivamente del entorno local y usa una contraseña de aplicación de Gmail, nunca la contraseña normal de la cuenta. ResendEmailService permanece desacoplado y disponible como alternativa futura con dominio propio. Si la persistencia fallase después de una entrega satisfactoria, el destinatario recibiría unas credenciales aún no activas; podrá reintentar el registro. Como evolución, el patrón outbox permitirá coordinar persistencia y reintentos de entrega de forma fiable.

El login permite autenticar una contraseña temporal y devuelve `mustChangePassword` como dato público de contexto. El cambio de contraseña puede hacerse tanto de forma obligatoria como voluntaria y exige siempre la contraseña actual. El guard `createMustChangePasswordGuard` es reutilizable para futuras rutas normales: consulta el usuario mediante UserRepository y devuelve `403` mientras `mustChangePassword` sea `true`; login, contexto mínimo y cambio de contraseña no se bloquean.

RoutePlan es el primer dominio ciclista. `POST /route-plans` aplica autenticación JWT, el guard de cambio obligatorio y CreateRoutePlanUseCase, que persiste la solicitud mediante RoutePlanRepository y PrismaRoutePlanRepository. El formulario protegido `/plan-route` almacena las preferencias y sus coordenadas geocodificadas.

La geocodificación sigue el flujo `startLocation → CreateRoutePlanUseCase → GeocodingService → NominatimGeocodingService → latitude/longitude → RoutePlan → PrismaRoutePlanRepository`. Application conoce solo el puerto GeocodingService; Nominatim, su caché en memoria y el límite de una solicitud por segundo pertenecen a Infrastructure y pueden sustituirse por otro proveedor.

La generación del recorrido sigue este flujo:

```text
POST /route-plans/:id/generate
  ↓
authentication middleware + must-change-password guard
  ↓
GenerateCyclingRouteController
  ↓
GenerateCyclingRouteUseCase
  ↓
RoutePlanRepository + RoutingService
  ↓
PrismaRoutePlanRepository + OpenRouteServiceRoutingService
  ↓
openrouteservice Directions v2
```

`RoutingService` es un puerto de Application y define el resultado propio `GeneratedRoute`; no expone tipos, URL ni clave de openrouteservice. `OpenRouteServiceRoutingService` es el adaptador de Infrastructure: solicita `cycling-road`, una ruta `round_trip` de cuatro puntos internos, seed determinista `1`, y evita ferries y steps. Solicita GeoJSON y centraliza la conversión de `[longitude, latitude]` de ORS a `{ latitude, longitude }` interna.

El round-trip de la API pública actual de ORS está limitado a 100 km. RoutePlan mantiene su rango de negocio de 10 a 300 km, mientras el caso de uso consulta el límite declarado por el proveedor configurado y devuelve un error funcional para trayectos mayores sin truncarlos. La geometría generada no se persiste en esta fase: RoutePlan sigue siendo la petición y GeneratedRoute se devuelve solamente al frontend. El frontend dibuja esa geometría real como una Polyline de Leaflet y ajusta el viewport; no llama a ORS ni conoce su API.

La propiedad se verifica en el caso de uso. Una planificación inexistente y una planificación de otro usuario se devuelven ambas como 404, para no revelar su existencia.

La meteorología sigue el flujo `GET /route-plans/:id/weather → GetRouteWeatherUseCase → WeatherService → OpenMeteoWeatherService`. El adaptador solicita `weather_code`, `temperature_2m`, `apparent_temperature`, `precipitation_probability`, `wind_speed_10m`, `wind_direction_10m` y `wind_gusts_10m`, en km/h, con `timezone=auto` y sin enviar datos personales. Como RoutePlan no contiene hora, se selecciona provisionalmente 09:00 local. WindForecast no se persiste. La interfaz interpreta el código WMO localmente para representar condiciones como despejado, nublado, lluvia o tormenta. La dirección usa la convención meteorológica (0° Norte, 90° Este; indica de dónde viene el viento). WindRiskLevel usa el valor más desfavorable entre viento y rachas: <25 normal, 25–39 caution, 40–49 high y ≥50 dangerous.

El análisis de viento sigue `POST /route-plans/:id/wind-analysis → authentication middleware → must-change-password guard → AnalyzeRouteWindController → AnalyzePlannedRouteWindUseCase → RoutePlanRepository + RoutingService + WeatherService + WindRouteAnalyzer`. ORS y Open-Meteo permanecen como adaptadores de Infrastructure. WindRouteAnalyzer solo recibe GeneratedRoute y WindForecast: calcula bearing geográfico (0° Norte, 90° Este), distancia Haversine y convierte la dirección meteorológica (de dónde viene el viento) en desplazamiento del aire con `(windDirectionDegrees + 180) % 360`. El ángulo relativo normalizado determina componentes `windSpeed * cos(angle)` longitudinal y `abs(windSpeed * sin(angle))` lateral; <60° es tailwind, 60°–<120° crosswind y ≥120° headwind. Los porcentajes se ponderan por metros, no por segmentos. La segunda mitad de la distancia acumulada representa provisionalmente el regreso. `favorableWindScore` es `tailwindReturnPercent + crosswindReturnPercent * 0.5`, acotado entre 0 y 100. No se persiste ni se optimiza la ruta. El frontend sigue `PlanRoutePage → AuthContext.analyzeRouteWind → apiClient → endpoint` y presenta el resumen. Las pruebas usan node:test, fakes y controllers/middlewares aislados; no supertest.

Cuando `RoutePlan.favorableWind=true`, el mismo endpoint `POST /route-plans/:id/generate` delega en `GenerateWindOptimizedRouteUseCase`. Este caso de uso obtiene una única previsión y solicita como máximo tres candidatas secuenciales a `RoutingService` con las semillas deterministas 1, 2 y 3; no realiza una cuarta llamada para fallback. Cada ruta real se conserva y se marca según quede o no dentro de ±20 % de la distancia solicitada. Si existe alguna dentro del margen, se selecciona el mayor `favorableWindScore`; los empates se resuelven por menor diferencia de distancia y, finalmente, por menor semilla, con `selectionMode=wind-optimized`. Si ninguna cumple el margen pero hay rutas reales, se selecciona la de menor diferencia de distancia; los empates se resuelven por mejor score y menor semilla, con `selectionMode=distance-fallback`. Un fallo de ORS en una candidata no bloquea las restantes, pero si ninguna devuelve una ruta real se devuelve un error técnico controlado y nunca una geometría inventada. `riskLevel` sigue siendo independiente de la favorabilidad: una ruta con riesgo `dangerous` no se presenta como recomendable. La respuesta expone exclusivamente la ruta elegida y resúmenes seguros de candidatas, sin datos crudos de proveedores.

La descarga sigue `GET /route-plans/:id/gpx → authentication middleware → must-change-password guard → GenerateRouteGpxController → GenerateRouteGpxUseCase → GenerateCyclingRouteUseCase → GpxGenerator`. `XmlGpxGenerator` está en Application porque transforma exclusivamente `GeneratedRoute` y texto propio a GPX 1.1, sin conocer proveedores ni HTTP. El controller solo fija `Content-Type: application/gpx+xml; charset=utf-8` y `Content-Disposition: attachment`. El caso de uso reutiliza la generación normal u optimizada, por lo que la geometría exportada es la ruta seleccionada por el mismo flujo. Como las geometrías no se persisten, una descarga posterior regenera la ruta; las semillas son deterministas, aunque el proveedor podría cambiar sus resultados con el tiempo.

Por tanto, la futura persistencia o los servicios externos podrán sustituirse sin introducir sus dependencias en las reglas de dominio.
