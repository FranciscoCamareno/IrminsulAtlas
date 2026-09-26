# Irminsul Atlas

Prototipo de explorador de lore con **cronología interactiva a pantalla completa**, barra superior mínima y menú lateral plegable. El MVP completo sigue en desarrollo. Todo el contenido incluido es sintético; no son hechos de Genshin Impact.

## Ejecutar localmente

Requisitos: **Node.js 24 LTS y npm 11**. Verificado con Node 24.21.0 y npm 11.19.0. Usar npm como único gestor y conservar `package-lock.json`.

Desde la raíz del proyecto:

```sh
npm ci
npm run dev
```

Abrir `http://localhost:4321/` (Astro indica otra dirección si el puerto está ocupado). En PowerShell, usar `npm.cmd` si la política del sistema impide ejecutar `npm.ps1`; no es necesario cambiar dicha política.

| Comando                | Uso                                                        |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Desarrollo local                                           |
| `npm run build`        | Validar contenido y generar el sitio estático en `dist/`   |
| `npm run preview`      | Servir localmente la compilación existente                 |
| `npm run check`        | Tipos TypeScript/TSX y diagnósticos Astro                  |
| `npm test`             | Pruebas de dominio, carga, consultas y HTML inicial        |
| `npm run test:watch`   | Pruebas durante edición                                    |
| `npm run lint`         | ESLint para TypeScript, React y configuraciones JavaScript |
| `npm run format`       | Aplicar Prettier al código y documentación nueva           |
| `npm run format:check` | Comprobar formato sin editar                               |
| `npm run validate`     | Formato, lint, tipos, pruebas y compilación                |

No se requieren variables de entorno, credenciales, API ni servicios externos para ejecutar la aplicación después de instalar dependencias. La CLI de Astro puede escribir configuración fuera del proyecto; en un entorno restringido puede desactivarse su telemetría antes de ejecutar los comandos: PowerShell `$env:ASTRO_TELEMETRY_DISABLED='1'`; shells POSIX `export ASTRO_TELEMETRY_DISABLED=1`.

## Qué funciona

- JSON local → validación estructural → integridad del conjunto → consultas → página Astro e isla React.
- Catorce eventos ficticios en cuatro épocas, dos misiones fuente y diecisiete relaciones con ramificaciones y convergencias. Trece eventos están permitidos sin progreso.
- Lienzo HTML/SVG con orden editorial por épocas. Arrastre, rueda, gesto táctil de D3 y controles visibles para ampliar, alejar, ver todo y centrar la selección. Las coordenadas no son fechas.
- Tres niveles de zoom: grupos por época, acontecimientos principales y detalle con secundarios/fechas. Las etiquetas mantienen su tamaño de lectura. Progreso por hitos en el menú; nodos, grupos, conteos y relaciones se calculan después de filtrar spoilers.
- Selección y ficha contextual lateral (inferior en móvil), conexiones destacadas y acceso a eventos relacionados. Fuentes, evidencias y participantes conservan sus filtros.
- Selección compartible en `/?id=demo-event-01`; `/evento/?id=demo-event-01` sigue funcionando. El evento 05 demuestra el estado bloqueado. Metadatos neutros y estados de ID inexistente o bloqueado.
- Historial de selección, cierre con Escape y restauración de foco. Progreso, tema y viewport permanecen en memoria al navegar dentro del explorador; recargar o abrir otra pestaña reinicia preferencias. La URL nunca concede progreso.
- Vista de lista con el mismo progreso, accesible desde la barra superior. Ruta `/lista/` prerenderizada para lectura sin JavaScript. Menú con Personajes, Ubicaciones y Otros datos decorativos, marcados como próximos; tema carbón inicial y alternativa clara.

Los filtros de spoilers protegen la experiencia de lectura: el pequeño dataset completo se serializa como propiedades de la isla y sus archivos estáticos son inspeccionables. No es control de acceso. El contenido se presenta como texto escapado, sin HTML remoto ni MDX ejecutable.

## Estructura real

| Ruta                                        | Responsabilidad                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/domain/schema.ts`                      | Contratos Zod y tipos inferidos de todas las entidades                             |
| `src/domain/integrity.ts`                   | IDs, referencias, universos, sistemas temporales y ciclos de anterioridad estricta |
| `src/domain/visibility.ts`                  | Reglas puras de progreso y publicación editorial                                   |
| `src/content/local.ts`                      | Lectura JSON, validación y contrato mínimo `MissionProvider`                       |
| `src/application/catalog.ts`                | Consultas y proyecciones visibles para la interfaz                                 |
| `content/editorial/demo.json`               | Contenido editorial sintético                                                      |
| `content/imported/demo-missions.json`       | Fuentes normalizadas sintéticas, separadas del editorial                           |
| `src/components/DemoCatalog.tsx`            | Lista, progreso y detalle interactivo                                              |
| `src/layouts/`, `src/pages/`, `src/styles/` | Layout, rutas, tokens y estilos                                                    |
| `tests/`                                    | Pruebas del recorrido actual                                                       |

Los comandos deben ejecutarse desde la raíz: el cargador resuelve allí `content/`. Los fixtures son compartidos por aplicación y pruebas. `src/visualization/layout.ts` proyecta las consultas permitidas; `viewport.ts` conecta los gestos de D3. React es el único propietario de los nodos y atributos dibujados. La interfaz principal vive en `src/components/explorer/` y sus estilos en `src/styles/timeline.css`.

## Contenido y futura API

Editar el JSON editorial y ejecutar `npm run validate`. Un error identifica el archivo y el campo; la carga falla en lugar de descartar registros. Una misión es una fuente y puede respaldar varios eventos. Ninguna misión se convierte automáticamente en evento.

Los esquemas son la única definición de contratos; los tipos se infieren con `z.infer`. El esquema rechaza campos extra, fechas inválidas y fuentes con URL no HTTP(S). La integridad global comprueba referencias, duplicados y ciclos estrictos; no existe un motor de razonamiento temporal completo.

`MissionProvider.loadMissions()` devuelve misiones normalizadas. La implementación inicial lee el archivo local. Un futuro adaptador transformará respuestas verificadas de un proveedor a ese contrato, fuera del cliente. El cargador vuelve a validar su salida. El archivo importado actual es una **excepción manual de demostración**; no representa una importación real. No se genera ni sobrescribe contenido editorial al cargar.

Todavía no hay proveedor, endpoints, credenciales, snapshots remotos, reintentos ni publicación. La promoción de una compilación candidata sobre una versión publicada corresponde a una fase posterior.

## Manejar la cronología

- Arrastrar el fondo para desplazarse; rueda o botones +/− para zoom.
- «Ver toda la cronología» agrupa por épocas; pulsar una época la explora. En pantallas estrechas, la vista general apila los grupos para conservar legibilidad.
- Pulsar un nodo para abrir la ficha; Escape o «Cerrar detalle» la cierra. Los enlaces relacionados centran el destino.
- Con el foco en el lienzo: flechas para desplazarse, +/− para zoom e Inicio para ver todo. Los atajos Ctrl/Cmd del navegador se conservan.
- Abrir el menú para cambiar tema o progreso; el icono de lista alterna las dos vistas.

## Comprobaciones y límites

Auditoría P0 del 25 de septiembre: [estado real, RF-01–RF-12 y brechas de integración](docs/validation/estado-actual.md). Lint, tipos, 36 pruebas y build pasan; `npm run validate` se detiene por formato previo en `docs/10-plan-integracion-lore-y-pruebas.md`. No se ha iniciado la integración de fuentes reales. El informe distingue estas comprobaciones de las validaciones históricas siguientes.

Verificación del 25 de septiembre de 2026: pruebas de dominio y de interacción en DOM simulado, lint, tipos y compilación. La página principal responde HTTP 200 con el nuevo lienzo, sin el bloque de presentación anterior. Los resultados detallados están en [09-cronologia-inmersiva.md](docs/09-cronologia-inmersiva.md).

El entorno sigue sin navegador conectado. Las pruebas DOM ejercitan React y D3, incluidos rueda, arrastre, ancla de zoom, selección, enlaces, agrupación, progreso y coordenadas de vista general a 320 px. No certifican apariencia, CSS, foco modal nativo ni gestos físicos en móvil; esa revisión visual permanece pendiente.

La agrupación actual es por época y los umbrales de zoom son iniciales. Faltan ajuste con contenido real, agrupación por densidad, resolución general de colisiones, búsqueda y filtros del MVP. No existe un grafo independiente ni API real. No se ha desplegado el sitio.

## Documentación

1. [Requisitos y alcance](docs/01-requisitos.md).
2. [Arquitectura propuesta](docs/02-arquitectura.md).
3. [Modelo de datos y criterio editorial](docs/03-modelo-de-datos.md).
4. [Integración futura de API](docs/04-integracion-api.md).
5. [Diseño e interacción](docs/05-diseno-ux.md).
6. [Plan y estado de avance](docs/06-plan-de-trabajo.md).
7. [Referencias y decisiones](docs/07-referencias-y-decisiones.md).
8. [Guía visual](docs/styles.md).
9. [Decisiones y validación de esta implementación](docs/08-base-inicial.md).
10. [Instrucciones de trabajo](AGENTS.md).

11. [Rediseño de la cronología y validaciones](docs/09-cronologia-inmersiva.md).
12. [Plan de integración de lore y pruebas](docs/10-plan-integracion-lore-y-pruebas.md).
13. [Auditoría P0 del estado actual](docs/validation/estado-actual.md).
