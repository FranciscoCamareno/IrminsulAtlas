# Guía técnica para continuar con un agente en la nube

Estado documentado: 05/10/2026, código base `02104fc80d0ef8d54e0ea20500991894195c44e3`, integrado en `main`. Esta guía describe código existente; las ampliaciones se especifican como pendientes en [14 — Trabajo pendiente](14-trabajo-pendiente.md). No certifica cuál es la última versión pública de Genshin Impact.

## 1. Objetivo y orden de lectura

La meta es una cronología que reúna la historia antigua y los acontecimientos del Viajero, con fuentes verificables y cobertura declarada hasta un corte público del juego. La primera parte tiene un techo aprobado de 29 acontecimientos; ese límite no corresponde al atlas completo.

Leer primero `AGENTS.md`, `README.md`, esta guía y el desglose 14. Antes de implementar, leer también todos los documentos de `docs/`, incluido `styles.md`, como indica `AGENTS.md`. Para resolver contradicciones entre propuestas antiguas y estado actual, consultar el código, [plan 06](06-plan-de-trabajo.md), [alcance 11](11-alcance-primera-version.md), [procedimiento 12](12-procedimiento-revision-editorial.md) y los informes fechados. Las casillas históricas de los planes no son una auditoría actual.

**No usar los prompts P0–P2 del plan 10 para reconstruir lo que ya funciona.** Seleccionar una tarea del documento 14 y ejecutar solo su alcance. No aprobar contenido generado por IA, inventar fuentes ni sustituir comprobaciones manuales por resultados supuestos.

## 2. Estado de partida verificable

| Área                       | Implementado                                                                                                               | Pendiente                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Corpus antiguo             | 29 eventos, 7 capítulos, 35 relaciones y 82 entidades; visible como provisional                                            | Revisión completa y aprobación humana; 12 eventos sin afirmaciones                              |
| Evidencias                 | 46 afirmaciones en 17 eventos; 37 apoyos contrastados; registro de 51 fuentes, de las cuales 20 son referencias importadas | Ninguna afirmación aprobada; cubrir todas las proposiciones relevantes, no solo contar fichas   |
| Importación local          | 51 fuentes aceptadas y 428 segmentos en la reconstrucción registrada                                                       | No confundir este conjunto con las 51 entradas del registro editorial: son conjuntos diferentes |
| Exploración                | Lienzo, lista, fichas, entidades, búsqueda, filtros, URL e historial                                                       | Facción/categoría, reintento explícito del índice de búsqueda, navegación regional y densidad   |
| Spoilers                   | Filtrado técnico y almacenamiento con respaldo en memoria                                                                  | Hitos regionales provisionales; progreso por acto y contenido opcional                          |
| Viajero y cobertura actual | Base reutilizable                                                                                                          | Corpus, catálogo de cobertura, corte público verificado y mantenimiento                         |

La última ejecución documentada del código base pasó `validate` con 109 pruebas y `test:e2e` con 26 pruebas en Windows/Edge Chromium. Son resultados del [cierre técnico](validation/cierre-tecnico-v1.md), no una ejecución en el entorno del siguiente agente. Este debe registrar sus propios resultados.

## 3. Preparar un checkout en la nube

Ejecutar desde la raíz. Usar Node 24 y npm 11 según `package.json`; `package-lock.json` fija las dependencias. No actualizar versiones para resolver problemas de instalación sin investigar la causa.

```sh
git status --short --branch
git rev-parse HEAD
node --version
npm --version
npm ci
npm run validate:code
```

Trabajar en una rama de la tarea desde el `main` actualizado. Conservar modificaciones existentes; no hacer `reset --hard` ni limpiezas generales. El ZIP P0, si existe localmente, es un respaldo y no una entrada del proyecto.

`validate:code` ejecuta formato, lint, tipos, pruebas y build. El build usa el dossier y los JSON editoriales versionados: no descarga datos ni necesita el snapshot importado. `validate` añade `content:evidence` y exige reconstruir la importación compatible.

### Reconstruir las fuentes

Los directorios `.validation/` y `content/imported/animegame/` están ignorados. Un clon nuevo no tiene fuentes aceptadas, caché, capturas ni informes JSON generados localmente.

```sh
npm run content:acquire
npm run content:import
```

La segunda orden imprime `candidate`. Sustituir `ID_DEL_CANDIDATO` por ese valor; no copiar un ID histórico sin comprobar que se generó en este entorno:

```sh
npm run content:validate -- ID_DEL_CANDIDATO
npm run content:diff -- ID_DEL_CANDIDATO
npm run content:evidence -- ID_DEL_CANDIDATO
npm run content:promote -- ID_DEL_CANDIDATO
npm run content:validate
npm run validate
```

Promover solo después de revisar el informe y pasar evidencias. `content:promote` valida la importación, pero **no ejecuta por sí mismo la revisión editorial ni el comando de evidencias**. En un clon nuevo todas las fuentes pueden aparecer como añadidas: no hay versión aceptada anterior contra la que comparar.

Si no hay red o el proveedor no responde, seguir con código y fixtures identificados; registrar que no se ejecutó la comprobación textual. No cambiar `verified`, hashes o el script `validate` para ocultar la falta de datos. La instalación con `npm ci` sí necesita acceso a paquetes o una caché disponible.

El snapshot fijado es `b061b403c8afc7bca633cf4f201edc4a3baa75fe`. La versión declarada por ese proveedor no acredita la versión pública del juego. La adquisición actual verifica los archivos seleccionados; no es una descarga de todo Genshin.

### Navegador

```sh
npm run build
npx playwright-core install chromium
npm run test:e2e
```

También se puede usar un ejecutable Chromium ya disponible, definiendo `E2E_CHROMIUM_PATH` con su ruta real. No asumir que `/opt/pw-browsers/chromium` existe. En Linux, si faltan bibliotecas del sistema, registrarlo y preparar las dependencias del navegador según el entorno. En PowerShell puede usarse `npm.cmd` si la política bloquea `npm.ps1`.

`tests/e2e/harness.ts` sirve `dist/` en un puerto libre y lanza **Chromium**. Instalar Firefox o WebKit no hace que la suite los pruebe: adaptar el arnés es una tarea pendiente. Capturas y métricas quedan en `.validation/e2e/`; resumir resultados y límites en `docs/validation/` para que sobrevivan al entorno efímero.

## 4. Recorrido del contenido hasta la pantalla

### Importación, fuera del navegador

1. `docs/validation/p1/snapshot-manifest.json` fija procedencia, rutas y huellas. `scripts/import/selection.json` delimita fuentes y exclusiones.
2. `scripts/import/acquire.ts` obtiene y verifica archivos en `.validation/p1/raw/`.
3. `scripts/import/adapter.ts` normaliza documentos y conversaciones en fuentes y segmentos; conserva condiciones, ramas, textos ausentes y localizadores.
4. `scripts/import/pipeline.ts` genera candidatos, informes, diferencias y versiones aceptadas. `readAccepted`, `compareImports` y `promoteCandidate` son puntos de entrada importantes.
5. `scripts/import/cli.ts` conecta los scripts npm. Los candidatos viven en `.validation/p2/candidates/`; el almacén aceptado, en `content/imported/animegame/`.
6. `scripts/import/shared.ts` contiene el snapshot y adaptador fijados, hashes, JSON estable y lectura de números opacos sin pérdida de precisión. No convertir identificadores numéricos grandes a `Number` indiscriminadamente.

Una fuente aceptada técnicamente permanece material importado `draft`/`not-publishable`. No se convierte en un evento por importarla. El atlas actual publica prosa editorial y localizadores, no todos los diálogos del proveedor.

### Ensamblado editorial y compilación

1. `src/content/dossier.ts`: `loadDossierDocuments` carga cuatro Markdown expresamente enumerados en `dossierFiles`.
2. `extractDossierSections` reconoce encabezados de nivel 2/3 con `—` e ID entre acentos graves (`evt-`, `loc-`, `per-`) y ciertas tablas de personajes. Otro encabezado termina la sección. Cambiar ese formato puede romper extracción y enlaces.
3. `loadDossierContent` une prosa con `genshin-dossier.json`, aplica `genshin-evidence.json` y `genshin-revelation.json`, valida revisiones y devuelve `Dataset`.
4. `src/content/atlas-data.ts`, mediante `buildAtlasData`, proyecta índice ligero, detalles y búsqueda. Excluye eventos `draft` de los archivos de detalle y del índice; las reglas de visibilidad también controlan relaciones y extremos.
5. `src/pages/data/` genera `/data/index.json`, `/data/search.json`, `/data/events/[id].json`, `/data/entities/[id].json` y `/data/documents/[id].json` en el build.

Los documentos completos tienen su propia ruta de generación. Auditarla al introducir borradores nuevos: excluir un evento del índice no demuestra que su texto esté excluido del documento completo. Los JSON estáticos son públicos por diseño; los spoilers protegen la experiencia, no la confidencialidad.

### Aplicación y vista

| Archivo                                               | Responsabilidad / punto de entrada                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `src/pages/index.astro`                               | Monta `TimelineExplorer` con hidratación `client:load`                                                                |
| `src/application/data-source.ts`                      | `AtlasSource`; `createFetchSource` carga JSON y cachea promesas, retirando fallos; `createMemorySource` sirve pruebas |
| `src/application/progress.ts`                         | `ProgressChoice`, `progressSet`, lectura/escritura y suscripción; escalera `none` / `upto` / `all`                    |
| `src/domain/visibility.ts`                            | Requisitos de progreso y visibilidad de eventos/relaciones                                                            |
| `src/application/atlas.ts`                            | `visibleView`, disponibilidad neutra, ensamblado de fichas, opciones de filtros y resultados                          |
| `src/application/search.ts`                           | Normalización común de texto y búsqueda por tokens                                                                    |
| `src/components/explorer/url-state.ts`                | `parseUrl` / `buildUrl`: selección, entidad, vista y filtros                                                          |
| `src/components/explorer/useAsync.ts`                 | Estados de carga y reintento                                                                                          |
| `src/components/explorer/TimelineExplorer.tsx`        | Coordina progreso, consultas, URL, búsqueda, lienzo y detalles                                                        |
| `src/components/explorer/SearchPanel.tsx`             | Controles de consulta/filtros y estado del texto completo                                                             |
| `src/components/explorer/ProgressDialog.tsx`          | Selector de progreso y etiquetas seguras                                                                              |
| `src/visualization/layout.ts`                         | `layoutTimeline`, disposición por hilos, niveles y ajuste del viewport                                                |
| `src/visualization/viewport.ts`                       | Operaciones de viewport independientes del contenido                                                                  |
| `src/components/explorer/TimelineCanvas.tsx`          | Integra gestos D3 y representación React del lienzo                                                                   |
| `src/components/DossierText.tsx`                      | Subconjunto seguro de Markdown y enlaces; no ejecuta MDX/HTML remoto                                                  |
| `src/components/DossierReader.tsx`                    | Documento completo habilitado únicamente con «Mostrar todo»                                                           |
| `src/styles/timeline.css`, `tokens.css`, `global.css` | Temas, controles, composición y estilos base                                                                          |

`src/application/catalog.ts` conserva consultas sobre el dataset completo y resolución de evidencia, reutilizada por la proyección. `src/content/local.ts`, `preview.ts` y `DemoCatalog.tsx` conservan demo/vista previa; **no son el cargador principal del atlas actual**. Cambiar allí el contenido no incorpora automáticamente el Viajero a las rutas `/data/`.

## 5. Contratos y límites que deben conservarse

La fuente de verdad es `src/domain/schema.ts`; derivar tipos de Zod y actualizar proyecciones, consumidores y fixtures cuando se amplíen contratos estrictos. Los nombres nuevos sugeridos en el documento 14 todavía no son contratos implementados.

| Contrato                                              | Significado y precaución                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `HistoricalTimeSchema`                                | Tiempo exacto, aproximado, intervalo, relativo o desconocido. No convertir orden de lectura en fecha |
| `EventSchema` / `RelationSchema`                      | Contenido, clasificación y estado editorial separados; IDs estables                                  |
| `DossierMapSchema`                                    | Anotaciones sobre los cuatro documentos; `review` por evento/relación y `claimIds` en relaciones     |
| `ClaimSchema` / `EvidenceRegistrySchema`              | Afirmaciones N:M, respaldo y revisión; aprobar una afirmación no aprueba el cuerpo completo          |
| `RevelationMapSchema`                                 | Lista ordenada de hitos; cada evento se asigna hoy a **un** hito                                     |
| `AtlasIndexSchema` y esquemas de detalle              | Archivos estáticos separados por responsabilidad; mantener ligero el índice                          |
| Contratos `Import*`, `SourceRecord` y `SourceSegment` | Procedencia y material fuente; no equivalen a eventos                                                |

`findRegistryIssues` comprueba estructura; `findDossierReviewIssues` exige decisión explícita y afirmaciones revisadas para aprobar fichas/relaciones; `verifyAgainstImport` contrasta snapshot, localizadores, segmentos y hashes. Estos controles **no prueban** que cada frase del cuerpo esté respaldada ni que dos afirmaciones demuestren una causalidad.

Limitaciones concretas para ampliar:

- `dossierFiles` es una lista fija; `loadDossierContent` asigna categorías de historia antigua y deriva entidades `per-` como personajes, incluidos grupos. No existe aún un cargador editorial independiente del Viajero.
- `applyRevelation` usa el rango de una escalera y el último hito de los eventos de una entidad, salvo excepción. No representa progreso opcional independiente.
- `progressSet` concede todos los hitos anteriores al elegido. Insertar misiones opcionales en esa lista las concedería indebidamente.
- `regions` se deriva de `narrativeThread` separando por `/`. No es un catálogo geográfico independiente.
- El dominio admite facciones y categorías, pero faltan su modelado editorial práctico y filtros completos en la aplicación.
- El índice de búsqueda falla de forma recuperable en la capa de datos, pero el explorador descarta el callback de reintento de `useAsync` para esa carga.
- `layoutDossier` organiza filas por hilo; centrar un capítulo usa `focusY: 210`, lo que explica el pendiente de acceso a las otras filas.
- Las restricciones de una afirmación reúnen los hitos de sus eventos; al añadir fuentes reveladoras o progreso opcional hay que revisar también títulos de fuentes, fragmentos y enlaces.
- Snapshot/versión del proveedor, publicación del juego, revelación de información y fecha histórica son dimensiones diferentes. Falta el inventario verificable de publicación/cobertura.

## 6. Validar según el cambio

| Cambio                | Pruebas de referencia                                                                     | Resultado que importa                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Evidencias y revisión | `tests/evidence.test.ts`, `dossier-review.test.ts`, `dossier.test.ts`                     | IDs/fragmentos válidos, pendientes no aprobados, borradores excluidos de proyecciones |
| Importación           | `tests/import.test.ts`, `tests/fixtures/import/`                                          | Datos incompletos explícitos, determinismo, fallo no reemplaza versión válida         |
| Spoilers/progreso     | `tests/atlas.test.ts`, `catalog.test.ts`, `progress.test.ts`, `tests/e2e/spoilers.e2e.ts` | Reducir progreso elimina revelaciones de todas las superficies; URL bloqueada neutra  |
| Layout/interacción    | `tests/timeline.test.ts`, `timeline-interaction.test.ts`, `tests/e2e/timeline.e2e.ts`     | Ancla, selección, teclado, zoom y densidad                                            |
| Lectura               | `tests/e2e/reading.e2e.ts`                                                                | Fichas y enlaces alcanzables, equivalencia lista/lienzo                               |
| Accesibilidad         | `tests/e2e/accessibility.e2e.ts`                                                          | Axe, foco, teclado, reflujo y movimiento reducido; no sustituye lector humano         |
| Rendimiento           | `tests/e2e/performance.e2e.ts`, `synthetic.ts`                                            | Medir producción y corpus representativo, declarar equipo/red y límites               |

Para cambios de aplicación: `npm run validate` con fuentes preparadas y `npm run test:e2e` si afectan navegación, representación o spoilers. Si faltan medios, ejecutar lo disponible y dejar el resto pendiente con causa concreta. Para documentación sola: formato, enlaces locales y revisión del diff; no atribuir nuevas ejecuciones a informes históricos.

## 7. Entrega entre agentes

Cada tarea debe dejar commit base, rama, alcance, decisiones, archivos, comandos con resultados, pendientes humanos y siguiente tarea habilitada. Enlazar un informe versionado si hay mediciones. Un log dentro de `.validation/` se pierde al cambiar de máquina si no se exporta expresamente.

Git transporta código, Markdown, configuración y registros editoriales; no transporta la importación aceptada ignorada. Reconstruirla con manifiesto/selección y verificarla. No añadir el corpus bruto ni el ZIP P0 al repositorio para evitar esa preparación.

La publicación del sitio es opcional y requiere instrucción explícita. Una rama o un commit no equivalen a despliegue. La siguiente tarea recomendada es **N-00 y después N-01**, definidas en el documento 14.
