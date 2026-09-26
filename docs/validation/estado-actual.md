# P0 — Auditoría del estado actual

> Actualización del 26/09/2026: Git ya está disponible y `origin` apunta a GitHub. El commit `2b27c63c1e51c36d6e4b83f9673509f15c4c88eb` es la base comprobada de P1; Git sustituye al ZIP como historial principal, conservando este último como respaldo. El formato del plan se corrige en P1. Véase [la entrega de cobertura](cobertura-fuentes.md). El resto de este informe conserva la evidencia histórica de P0.

Fecha: 25 de septiembre de 2026, Costa Rica. Carpeta auditada: `C:\IrminsulAtlas`. Alcance: inspección, comprobaciones existentes y documentación. No se implementaron P1–P7, no se adquirieron fuentes externas y no se desplegó el sitio.

## Resultado

Existe una base ejecutable que conviene conservar: Astro estático, React, TypeScript estricto, esquemas Zod, carga local validada, consultas con spoilers, cronología HTML/SVG con D3, ficha y lista. El recorrido actual funciona con **14 eventos sintéticos**, no con lore revisado. No hace falta reconstruir la base antes de estudiar las fuentes.

**Lint, tipos, las 36 pruebas y build pasan. `npm run validate` falla por un problema previo de formato en `docs/10-plan-integracion-lore-y-pruebas.md`.** Las comprobaciones posteriores se ejecutaron por separado porque el comando conjunto se detiene en Prettier. No se reformateó ese documento ni se corrigió código durante la auditoría.

La integración real sigue pendiente: no hay adquisición de snapshots, extractor, fuentes segmentadas, informe de cobertura, importación candidata, promoción/restauración, corpus revisado, búsqueda ni filtros del MVP. Las pruebas actuales no certifican hidratación en navegador, apariencia, gestos físicos o rendimiento interactivo.

## 1. Evidencia, entorno y conservación

Se leyeron `AGENTS.md`, `README.md`, los documentos `docs/01` a `docs/10` y `docs/styles.md`; se inspeccionaron configuración, dependencias instaladas, lockfile, fuentes, fixtures y pruebas.

| Elemento                  | Estado observado                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Sistema / CPU             | Windows `10.0.26200`; Intel Core i5-1155G7, 2,50 GHz                                     |
| Node / npm                | `24.21.0` / `11.19.0`, dentro de los rangos de `package.json`                            |
| Astro / integración React | `7.3.5` / `7.0.0`; salida `static`                                                       |
| React / React DOM         | `19.3.0`                                                                                 |
| TypeScript / Zod          | `6.0.3` / `4.6.5`; configuración `astro/tsconfigs/strictest`                             |
| D3                        | `d3-scale 4.0.2`, `d3-selection 3.0.0`, `d3-zoom 3.0.0`                                  |
| Pruebas                   | Vitest `5.0.1`, jsdom `30.1.1`                                                           |
| Calidad                   | ESLint `10.11.0`, typescript-eslint `8.70.1`, Prettier `3.9.9`, plugin Astro `1.1.0`     |
| Dependencias              | `npm ls --depth=0` correcto; versiones directas fijadas y `package-lock.json` conservado |

Se utilizó el árbol instalado. No se ejecutó una instalación limpia con `npm ci`, no se actualizaron paquetes y no se consultó el registro para atribuirles una condición de «última versión». La evidencia acredita funcionamiento en este entorno, no una matriz completa de plataformas.

**Límite de Git:** no existe `.git` en la carpeta y `git` no está disponible en PATH ni en las ubicaciones habituales inspeccionadas. No es posible determinar cambios sin confirmar, atribuir su autoría ni registrar el commit recuperable pedido por P0. No se inicializó un repositorio ni se descartaron archivos.

Como alternativa local se guardó `.validation/p0/estado-previo-2026-09-25.zip`, antes de editar la documentación, junto con `estado-previo-sha256.json`. Se comprobaron los **49 archivos** del ZIP contra sus hashes iniciales, sin diferencias. Incluye código, contenido, documentación, configuración y lockfile; excluye dependencias y salidas generadas. Para recuperar una versión, extraer primero a otra carpeta y comparar los archivos necesarios. Esta copia ignorada por las herramientas no sustituye un historial Git ni una copia externa.

Los únicos archivos del proyecto editados por P0 son este informe, `README.md` y el registro de avances de `docs/06-plan-de-trabajo.md`. Se conserva íntegro el nuevo plan `docs/10`. Las comprobaciones regeneraron los directorios locales ignorados de Astro/build.

La comparación SHA-256 final confirmó 47 archivos previos sin cambios y únicamente las dos actualizaciones documentales indicadas, además del informe nuevo. En particular, `src/`, `tests/`, `content/`, las dependencias declaradas, el lockfile y `docs/10` conservan sus hashes iniciales.

## 2. Qué está implementado

### Recorrido efectivo de los datos

1. [local.ts](../../src/content/local.ts) lee `content/editorial/demo.json` y, mediante `localMissionProvider.loadMissions()`, `content/imported/demo-missions.json`.
2. [schema.ts](../../src/domain/schema.ts) valida estructura con Zod y deriva los tipos. [integrity.ts](../../src/domain/integrity.ts) comprueba IDs, referencias y reglas del conjunto. Un fallo aborta la carga; no hay escritura ni promoción de archivos.
3. [catalog.ts](../../src/application/catalog.ts) aplica [visibility.ts](../../src/domain/visibility.ts) para producir listas, fichas, relaciones y épocas permitidas por progreso.
4. Las páginas Astro cargan el dataset durante la compilación y lo entregan completo a una isla React con `client:load`.
5. [TimelineExplorer.tsx](../../src/components/explorer/TimelineExplorer.tsx) gestiona selección, progreso en memoria, menú, tema y ficha. [layout.ts](../../src/visualization/layout.ts) calcula posiciones desde las proyecciones permitidas; [viewport.ts](../../src/visualization/viewport.ts) conecta gestos D3. React dibuja los nodos HTML y conexiones SVG.

Las coordenadas dependen de épocas y orden editorial; no representan duración ni sustituyen fechas desconocidas. D3 gestiona escalas, listeners y su transformación interna, sin modificar los hijos DOM dibujados por React.

| Área / ruta real                      | Implementación observada                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/`                         | Universo, época, entidad, hito, evento, fuente, evidencia y relación. Tiempo exacto, aproximado, intervalo, relativo o desconocido; certeza y revelación separadas. |
| `content/editorial/demo.json`         | 1 universo, 4 épocas, 3 entidades, 2 hitos, 14 eventos y 17 relaciones.                                                                                             |
| `content/imported/demo-missions.json` | 2 misiones sintéticas del proveedor nominal `local-demo`, versión `demo-v1`: una con texto, otra con ausencia explícita y razón. Es un fixture escrito manualmente. |
| `/` y `/evento/?id=…`                 | Ambas cargan `TimelineExplorer`. Selección principal en `/?id=…`. Título y descripción genéricos; estados bloqueado/inexistente resueltos en cliente.               |
| `/lista/`                             | `DemoCatalog`, lista prerenderizada con progreso y ficha al activar JavaScript. Sin JS se puede leer la lista inicial, pero no abrir el detalle interactivo.        |
| `/404.html`                           | Página estática neutra para rutas inexistentes; un ID inválido en la ruta existente no genera un HTTP 404 propio.                                                   |
| `src/components/explorer/`            | Cronología, controles, menú modal nativo, ficha lateral/inferior, lista y tema. Personajes, Ubicaciones y Otros datos son rótulos de expansión futura.              |
| `src/styles/`                         | Tokens comunes y temas claro/oscuro; foco, áreas de controles, adaptación estrecha y reducción de movimiento.                                                       |
| `tests/`                              | Cuatro archivos, 36 pruebas: dominio/carga, consultas/HTML React, layout e interacción React/D3 simulada.                                                           |

Todos los registros del corpus tienen `editorialStatus: demo`; **no hay mezcla actual con datos reales** ni eventos aprobados de Genshin. Sin progreso se permiten 13 eventos; el hito A habilita el restante. El segundo hito demuestra requisitos independientes de relaciones/entidades. Una misión puede respaldar varios eventos y un evento puede tener evidencias de varias fuentes, incluidas contradictorias.

### Scripts efectivos

Existen `dev`, `build`, `preview`, `check`, `test`, `test:watch`, `lint`, `format`, `format:check` y `validate`. `check` ejecuta `astro check`; `test` ejecuta `vitest run`. `build` valida el contenido al cargar las páginas y genera desde archivos locales, sin descargar un proveedor.

No existen `content:import`, `content:validate`, `content:diff` ni `test:e2e`; tampoco `scripts/import/` ni `tests/e2e/`. La validación de contenido está integrada en el cargador y ejercitada en tests/build, pero no hay un comando independiente de validación/importación.

## 3. Comprobaciones ejecutadas

Comandos desde la raíz, usando `npm.cmd` en PowerShell. Para Astro se estableció `$env:ASTRO_TELEMETRY_DISABLED='1'` en la sesión; no se modificó la configuración global.

| Comando                               | Resultado observado                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node --version`, `npm.cmd --version` | `v24.21.0`, `11.19.0`                                                                                                                                                    |
| `npm.cmd ls --depth=0`                | Correcto, código 0                                                                                                                                                       |
| `npm.cmd run validate`                | **Falló**, código 1 en `prettier --check .`: únicamente `docs/10-plan-integracion-lore-y-pruebas.md` señalado. El encadenamiento `&&` no llegó a lint/tipos/tests/build. |
| `npm.cmd run lint`                    | Correcto, código 0                                                                                                                                                       |
| `npm.cmd run check`                   | Correcto, código 0: 24 archivos; 0 errores, 0 advertencias, 0 indicaciones                                                                                               |
| `npm.cmd test`                        | Correcto, código 0: **36/36 pruebas, 4/4 archivos**, 2,41 s en esta ejecución                                                                                            |
| `npm.cmd run build`                   | Correcto, código 0: 4 páginas; `/`, `/evento/`, `/lista/`, `/404.html`; build comunicado por Astro: 885 ms                                                               |

El fallo de formato ya estaba presente antes de cualquier edición de P0. No indica un fallo de ejecución de la aplicación; sí impide declarar verde la comprobación conjunta. Los tiempos anteriores son una ejecución de herramientas, no medidas de experiencia de usuario.

Al terminar, se aplicó Prettier solo al informe nuevo y se repitió `npm.cmd run format:check`: sigue señalando únicamente el plan 10. Los cambios documentales de P0 no añadieron fallos de formato. No se repitieron tests/build después porque no cambió ningún archivo de implementación, contenido o configuración.

### Cobertura y límites de las pruebas

- [content.test.ts](../../tests/content.test.ts): 15 casos; contratos temporales, campos extra, URLs peligrosas, fuente sin texto, adaptador incompleto, IDs/referencias, universos, evidencia, ciclos y separación de revelación/historia.
- [catalog.test.ts](../../tests/catalog.test.ts): 10 casos; progreso, estados neutros, relaciones, participantes/fuentes/evidencias ocultos, referencias temporales, borradores, orden y escape de texto en HTML React.
- [timeline.test.ts](../../tests/timeline.test.ts): 4 casos; filtrado previo al layout, conteos, posiciones sin mutación histórica, vacío y ajuste/niveles.
- [timeline-interaction.test.ts](../../tests/timeline-interaction.test.ts): 7 casos; botones, rueda, arrastre, ancla y límites, grupos, selección, enlaces, foco, progreso reversible, lista, tema, teclado y vista general a 320 px.

`jsdom` no pinta CSS. Las dimensiones, `ResizeObserver` y la presentación modal se simulan; el historial se prueba mediante `replaceState` y eventos `popstate`, no mediante navegación real del navegador. Se usa `createRoot`, no una hidratación real de Astro. Las pruebas de HTML de `catalog.test.ts` renderizan `DemoCatalog`, incluso en modo detalle; la ruta `/evento/` actual utiliza `TimelineExplorer`. Por ello esas pruebas no acreditan por sí solas el HTML/hidratación de la ruta actual.

Respecto de la matriz del plan 10: hay cobertura parcial de DOM-01 a DOM-04, SEC-01, SPO-01/02/04/05/06 y flujos UI de navegación/teclado. Faltan los escenarios reales de importación IMP-01 a IMP-08, fragmentos SPO-03, búsqueda/filtros, promoción/restauración OPS-02 y las comprobaciones E2E/manuales. El test de adaptador incompleto solo demuestra rechazo de entrada en memoria y una carga local posterior correcta; **no demuestra rollback de una publicación**.

No se ejecutaron pruebas visuales en navegador, hidratación, móvil físico/pinch, lector de pantalla, zoom de navegador al 200 %, medición de contraste renderizado, sesiones con participantes ni una instalación limpia. No se certifica ninguna de ellas a partir de jsdom. Las comprobaciones HTTP documentadas en las iteraciones 08/09 son antecedentes, no ejecuciones nuevas de P0.

### Inspección de la salida de producción y línea base de tamaño

Se inspeccionó `dist/` recién generado con Node, `node:zlib.gzipSync` y jsdom sin ejecutar scripts. No se usó servidor, navegador, limitación de CPU ni simulación de red. Los bytes gzip son compresión local calculada, no tráfico medido ni configuración de compresión de un hosting.

| Artefacto                             | Bytes sin comprimir | Bytes gzip |
| ------------------------------------- | ------------------: | ---------: |
| `dist/index.html`                     |              51 976 |      7 372 |
| `dist/evento/index.html`              |              51 976 |      7 372 |
| `dist/lista/index.html`               |              47 998 |      6 008 |
| `dist/404.html`                       |               1 132 |        623 |
| 5 archivos JS de `dist/_astro/`, suma |             295 151 |     94 242 |
| 1 archivo CSS de `dist/_astro/`       |              18 534 |      4 525 |

La suma JS comprende todos los archivos emitidos, sin deduplicar cargas por ruta ni medir la ruta crítica. No existe aún el índice independiente de 30–50 eventos para compararlo con el objetivo de 250 KB del plan. Estos datos son una línea base de artefactos con 14 eventos demo; **LCP, CLS, p95 de búsqueda/ficha y tareas de gestos siguen sin medir**, al igual que el caso de 500 eventos densos.

En los tres HTML con isla, el título del evento bloqueado `demo-event-05` está ausente del texto del documento y presente en el atributo `props` serializado. Los títulos de página son genéricos. Esto confirma el límite documentado de los spoilers como protección de lectura, no confidencialidad; no equivale a haber comprobado ausencia de destellos durante hidratación. También muestra por qué no se debe incorporar un corpus extenso o borradores al cliente sin separar antes los artefactos de publicación.

## 4. Matriz RF-01 a RF-12

«Implementado comprobado» se limita al fixture y a las pruebas ejecutadas. «Parcial» identifica comportamiento existente con partes del criterio pendientes; no significa certificación del MVP. La revisión física/visual no realizada se señala como no verificable en esta auditoría.

| ID                         | Estado                                  | Evidencia concreta                                                                                                                    | Brecha para cerrar el requisito                                                                                                                                                   |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-01 Navegación temporal  | Implementado comprobado en DOM simulado | `viewport.ts`, `TimelineCanvas.tsx`, tests de rueda/arrastre, ancla, límites, botones y teclado                                       | Confirmar gestos reales y zoom propio del navegador en escritorio/móvil.                                                                                                          |
| RF-02 Detalle progresivo   | Parcial                                 | `detailLevel()` y lienzo: épocas <48 %, principales hasta 115 %, detalle desde 115 %; selección conservada                            | Sin histéresis. La reacción real al resize/panel y estabilidad cerca de umbrales no están verificadas.                                                                            |
| RF-03 Agrupación           | Parcial                                 | `layoutTimeline()` y botones de época; prueba de grupos a 320 px                                                                      | Agrupa por época, no por densidad; filas alternas sin resolución general de colisiones.                                                                                           |
| RF-04 Ficha                | Parcial                                 | `getEventById()` y `Detail`: título, resumen, cuerpo, tiempo, participantes, fuentes y posturas                                       | Sin lector de fragmentos originales ni navegación a segmentos verificables; las fuentes actuales carecen de URL real.                                                             |
| RF-05 Relaciones           | Implementado comprobado con demo        | `getVisibleRelations()`, SVG, selección y ficha con tipo/dirección; navegación a relacionados en tests                                | Verificar legibilidad y vuelta al contexto con distancias/densidad representativas. No se necesita un grafo independiente para este requisito.                                    |
| RF-06 Búsqueda             | Ausente                                 | No existe buscador, índice ni consulta de búsqueda; `aliases` solo se almacena                                                        | Implementar búsqueda autorizada por título/alias/texto y selección del resultado en P4.                                                                                           |
| RF-07 Filtros              | Ausente                                 | Sin controles ni consultas por época/región/personaje/facción/categoría                                                               | El progreso de spoilers no sustituye estos filtros. Faltan limpiar filtros, estado vacío y equivalencia lista/lienzo.                                                             |
| RF-08 Spoilers             | Parcial                                 | Reglas compartidas antes de consultas/layout; tests de títulos, conteos, evidencias, relaciones y URL que no concede progreso         | Aún no hay búsqueda ni fragmentos; corpus completo en props. Falta E2E sobre HTML/hidratación y política de publicación aprobada.                                                 |
| RF-09 Enlaces              | Parcial                                 | IDs estables en query, `pushState`/`popstate`, estados neutros; preferencias reiniciadas al recargar según README                     | Historial real/recarga sin E2E. No hay páginas individuales prerenderizadas; cámara anterior no se restaura, se centra el destino. Dos componentes mantienen navegación distinta. |
| RF-10 Móvil                | Parcial; uso físico no verificable      | CSS con ficha inferior ≤640 px, controles y D3 táctil; grupos probados con ancho simulado de 320 px                                   | Pendientes CSS/renderizado real, pinch, alturas pequeñas, orientación y dispositivos. Ficha sin modo ampliado de lectura.                                                         |
| RF-11 Lista accesible      | Implementado comprobado para la demo    | Lista del explorador y `/lista/` comparten consultas; test de 13 eventos y exclusión del bloqueado; lista prerenderizada              | Completar teclado/lector de pantalla real y equivalencia cuando existan filtros/búsqueda. Detalle sin JS no implementado.                                                         |
| RF-12 Integridad editorial | Parcial                                 | Todos los fixtures etiquetados demo; esquemas de incertidumbre; evidencia obligatoria en evento `reviewed`; validación de referencias | Sin corpus revisado, trazabilidad por segmento, revisión humana registrada ni selección de publicación exclusiva de aprobados. Véanse A3/A4.                                      |

## 5. Brechas para incorporar fuentes y archivos afectados

Son ajustes recomendados para fases posteriores, **no cambios aplicados**. A1–A4 deben resolverse antes de presentar una integración real como revisada/publicable; las carencias de funciones posteriores no son fallos nuevos introducidos por P0.

| Hallazgo                                               | Evidencia / implicación                                                                                                                                                                                                                                                                                                                                       | Fase y archivos que habría que modificar o añadir                                                                                                                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1. Entrada limitada a misiones                        | `MissionProvider` devuelve `Mission[]`; el proveedor local valida `MissionSchema`. `SourceSchema` conoce también `document`, pero la entrada actual no carga documentos ni las demás clases del plan.                                                                                                                                                         | P1 determina cobertura; P2 amplía `src/content/local.ts` y `src/domain/schema.ts`, con adaptador fuera del dominio en `scripts/import/` u otra capa explícita. Mantener las dos carpetas `content/` existentes.                                     |
| A2. Sin adquisición/versionado verificable             | `snapshotVersion` es una cadena obligatoria por misión; `demo-v1` no es un snapshot remoto. No hay commit, manifiesto, hashes de originales, resolución TextMap/Medium, ramas, diff, candidatos ni promoción.                                                                                                                                                 | P1: manifiesto y `docs/validation/cobertura-fuentes.md`. P2: importador, contratos Zod del manifiesto/reporte, fixtures de entrada y scripts de `package.json`. No descargar durante build.                                                         |
| A3. Evidencia sin segmentos originales                 | `EvidenceSchema` tiene fuente, localizador libre, afirmación, postura y requisitos. No identifica un segmento estable, versión/hash, hablante, rama o revisión. `Mission.text` es un bloque; además el esquema de texto aplica `trim()`, por lo que no conserva por sí solo bytes originales.                                                                 | P2/P3: `schema.ts`, `integrity.ts`, fuentes normalizadas, evidencias editoriales y pruebas. Separar original conservado de presentación; no convertir misiones automáticamente en eventos.                                                          |
| A4. Aprobación insuficiente como puerta de publicación | `reviewed` solo exige evidencia no vacía en eventos. La integridad prohíbe dependencia real→demo, pero permite reviewed→draft. Las fuentes draft se ocultan en consultas, pudiendo dejar una ficha revisada sin evidencia visible. Solo `causes` exige evidencia en relaciones; `precedes` factual puede carecer de ella. No hay registro de revisión humana. | P3: definir reglas de cierre de dependencias y afirmaciones temporales/causales en `schema.ts`/`integrity.ts`; validar el conjunto publicable en la carga/build y probar esas combinaciones. No aprobar datos ni resúmenes automáticamente.         |
| A5. Dataset completo en el cliente                     | Las tres páginas con isla pasan `dataset` íntegro, incluidos cuerpos y fuentes. `isVisible` excluye draft de resultados, pero no de la serialización. Demo y reviewed son visibles por la misma regla, sin modo de publicación explícito.                                                                                                                     | P3/P4: `local.ts`, `catalog.ts`, `visibility.ts`, páginas y componentes. Generar salida solo aprobada, demo explícita e índice/detalles separados. Mantener neutrales los enlaces bloqueados y aplicar spoilers antes de proyectar cada superficie. |
| A6. Disponibilidad de fuentes y textos de demo         | `visibleEvidence()` etiqueta un `document` como «Texto disponible» aunque ese esquema no almacena texto. `Detail` muestra metadatos/evidencia, no `Mission.text`. «Hecho (ficticio en esta demo)», marcas y metadatos están fijados para demostración.                                                                                                        | P3/P4: `catalog.ts`, `DemoCatalog.tsx`, `TimelineExplorer.tsx`, `TimelineCanvas.tsx`, `BaseLayout.astro`. Mostrar disponibilidad real, abrir solo fragmentos autorizados y derivar etiquetas del modo editorial.                                    |
| A7. Búsqueda y filtros inexistentes                    | Tener `aliases`, `categories` y referencias a entidades no implementa consultas/controles.                                                                                                                                                                                                                                                                    | P4: consultas en aplicación, UI reutilizada y pruebas de resultados/conteos/estado vacío sin spoilers.                                                                                                                                              |
| A8. Escalado del lienzo pendiente                      | `renderedNodes` filtra por nivel/importancia/selección, no por viewport. Todos los nodos elegibles y aristas se proyectan en cada cambio. Filas alternas y umbrales fijos no resuelven un corpus denso.                                                                                                                                                       | P5/P6: `layout.ts`, `TimelineCanvas.tsx`, medición y pruebas de densidad/colisiones/ancla. Mantener HTML/SVG hasta que medidas justifiquen otro motor.                                                                                              |
| A9. Navegación duplicada                               | `DemoCatalog` intercepta `/evento/` dentro de su propia isla y «Volver a la lista» apunta a `/`; al recargar esas URLs se carga el explorador. La selección por historial centra el destino, no guarda la cámara anterior.                                                                                                                                    | P4/P5: definir recorrido y estado esperado en ambas listas, `DemoCatalog.tsx`, `TimelineExplorer.tsx`, rutas y E2E de atrás/adelante/recarga.                                                                                                       |
| A10. Pruebas de integración/operación ausentes         | Sin snapshot real ni pruebas de conflictos, campos cambiados, traducciones, ramas, determinismo o recuperación. Sin navegador E2E, sesiones ni métricas de uso.                                                                                                                                                                                               | P2: pruebas de importación. P4–P7: tests de build/E2E, rendimiento y operación. Añadir scripts solo al implementar su responsabilidad.                                                                                                              |

No se detectó una integración de AnimeGameData u otro proveedor en el código. Las descripciones y enlaces externos del plan 10 son antecedentes/propuestas; no se verificó su actualidad ni su compatibilidad en P0. No se instalaron extractores, no se inventaron endpoints y no se eligió un commit de proveedor.

## 6. Revisión frente a `styles.md`

Se aplica el ajuste visual vigente del 25 de septiembre: barra mínima, lienzo protagonista, tema carbón inicial y alternativa crema, menú/ficha bajo demanda. No corresponde restaurar el hero ni tratar el tema oscuro como incumplimiento de la guía anterior.

Por inspección y pruebas existen tokens `--atlas-*`, etiquetas HTML cuyo tamaño no se escala con la cámara, controles principales de `2.75rem`, nodos interactivos de `3.5rem`, foco visible, alternativa de lista, leyenda de distancias no temporales y CSS para `prefers-reduced-motion`. No hay imágenes o fuentes web externas ni animaciones ambientales.

Ajustes pendientes, principalmente en `src/styles/timeline.css` y el lienzo:

- El cuerpo de ficha usa `0.8125rem` y metadatos/ayudas bajan a `0.5625rem`–`0.6875rem` (13 y 9–11 px con raíz de 16 px), por debajo de los valores orientativos de la guía. Debe comprobarse y mejorar la lectura con contenido extenso.
- Los nodos no relacionados se atenúan con `opacity: 0.38`; conexiones con `0.3`. Revisar contraste efectivo en ambos temas, incluidos estos estados; no se certifica contraste por la presencia de tokens.
- Los trazos interpretativos son discontinuos y la ficha muestra su tipo, pero falta una leyenda explícita del trazo. No hay solución general de cruces/colisiones entre etiquetas y conexiones.
- No hay histéresis en niveles ni agrupación por densidad. La ficha inferior se activa a 640 px y ocupa el 50 %; falta comprobar el tramo 641–767 px, alturas reducidas y lectura ampliada.
- `touch-action: none` reserva el lienzo para gestos propios. Los atajos Ctrl/Cmd se respetan por código/pruebas; la convivencia con el zoom nativo y pinch debe comprobarse físicamente.

No se marcan las casillas de revisión visual de `styles.md` como aprobadas. Faltan navegador, teclado completo, lector de pantalla, contraste, zoom de página al 200 % y móvil real.

## 7. Ajustes de lectura del plan y siguiente paso

`docs/08-base-inicial.md` y `docs/09-cronologia-inmersiva.md` son registros históricos: sus resultados corresponden a sus iteraciones. El plan 10 se elaboró sobre un ZIP documental; su afirmación de no disponer de aplicación no describe este workspace. Su destino recomendado y prompt P0 mencionan `docs/08-plan-integracion-lore-y-pruebas.md`, pero el archivo real es `docs/10-plan-integracion-lore-y-pruebas.md`. Se conserva el original del usuario y este informe registra la diferencia.

No se reordenan P1–P7: la base y parte de P5 ya existen, pero P1 sigue siendo el próximo incremento necesario para descubrir los contratos de fuentes. La «Fase 0» del plan original 06 y esta «P0» del plan de integración son hitos distintos. Tampoco corresponde cerrar las fases originales de cronología/accesibilidad por contar con pruebas simuladas.

**Próximo paso recomendado, cuando se solicite: P1, prueba acotada de cobertura de fuentes.** No conectar todavía el corpus a la UI. Antes de nuevas modificaciones de implementación, resolver el formato del plan con un cambio limitado y revisable para recuperar `npm run validate` completo; establecer también un punto Git cuando el entorno disponga de Git, conservando la copia local mientras tanto.

Criterios de aceptación de P1:

1. Fijar un commit completo del proveedor elegido y registrar procedencia, fecha, idioma, inventario y hashes de los archivos necesarios; sin descarga masiva por defecto.
2. Identificar con IDs/localizadores reales la muestra de las 12 categorías del plan: Arconte, mundo, legendaria, encuentro ramificado, evento antiguo, evento reciente, diálogo ambiental, libro de varios volúmenes, carta, historia de personaje, arma y piezas de un conjunto de artefactos.
3. Documentar TextMap/Medium, conflictos, traducciones ausentes, orden, hablantes y ramas. Clasificar cada categoría como disponible, parcial, ausente o desconocida, con evidencia; no declarar cobertura total.
4. Entregar `docs/validation/cobertura-fuentes.md`, el manifiesto y la decisión TypeScript/Python basada en la prueba. La preferencia actual por TypeScript es una hipótesis razonable por el stack instalado, no una compatibilidad verificada con el proveedor.
5. Registrar qué muestras verificó una persona y cuáles siguen pendientes. Una revisión humana no realizada no habilita publicación de segmentos ni aprobación editorial.

La auditoría técnica de P0 queda entregada con las limitaciones registradas: comprobación conjunta pendiente por formato previo, punto Git no disponible y verificación visual/interactiva de navegador no realizada. Ninguna fase posterior se declara implementada o aprobada mediante este informe.
