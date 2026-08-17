# Project

CicloViento es una aplicación web para planificar rutas de ciclismo de carretera teniendo en cuenta:

- Punto de partida.
- Fecha.
- Distancia.
- Desnivel acumulado.
- Condiciones meteorológicas.
- Velocidad y dirección del viento.
- Posible optimización de la ruta para favorecer el viento durante el regreso.

El objetivo es ayudar al ciclista a seleccionar una ruta adecuada y advertir de condiciones de viento potencialmente peligrosas.

## Language

El lenguaje principal del proyecto es TypeScript.

## Frontend

- React.
- TypeScript.
- Vite.

## Backend

- Node.js.
- Express.
- TypeScript.

## Database

La persistencia prevista utilizará Supabase, PostgreSQL y Prisma. Todavía no está implementada ni configurada.

## Architecture

El backend sigue Clean Architecture. Las dependencias deben respetar el sentido `Presentation → Application → Domain`.

Infrastructure contiene detalles tecnológicos e implementa los contratos definidos por las capas internas cuando corresponda. Domain debe permanecer independiente de Express, Prisma, Supabase, React, servicios HTTP, APIs externas y proveedores de IA.

## Development rules

1. Antes de cambios importantes, leer este archivo.
2. Antes de implementar funcionalidades, consultar `REQUIREMENTS.md`.
3. Antes de modificar arquitectura, consultar `ARCHITECTURE.md`.
4. No inventar requisitos que no estén definidos.
5. Implementar únicamente el alcance solicitado en cada tarea.
6. No introducir dependencias tecnológicas en Domain.
7. No colocar lógica de negocio en controllers.
8. No acceder directamente a Prisma ni a Supabase desde Domain.
9. Usar interfaces y repositorios para desacoplar infraestructura cuando el caso lo requiera.
10. Mantener secretos fuera del código fuente y usar variables de entorno para la configuración sensible.
11. No modificar archivos no relacionados con la tarea.
12. Mantener TypeScript compilable y ejecutar las comprobaciones apropiadas tras cambios importantes.
13. No hacer commit ni push salvo instrucción expresa del usuario.

## Documentation rules

- Actualizar `ARCHITECTURE.md` ante decisiones arquitectónicas importantes.
- Actualizar `REQUIREMENTS.md` si cambia un requisito.
- Actualizar `README.md` si cambia la instalación, ejecución o despliegue.
- No documentar como implementada una funcionalidad que todavía no existe.
- Diferenciar siempre entre lo implementado y lo planificado.

## Incremental development

El proyecto se desarrolla por fases. Codex debe implementar solamente el alcance solicitado en la tarea actual y esperar una nueva instrucción antes de avanzar a la fase siguiente.
