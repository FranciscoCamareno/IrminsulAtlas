# Irminsul Atlas

Explorador de lore con cronología interactiva a pantalla completa. La página muestra el **primer borrador de la historia antigua de Genshin Impact**, basado en los cuatro documentos aportados en `docs/`.

**Estado al 05/10/2026:** 29 acontecimientos (techo de la primera versión), siete capítulos, 35 conexiones, 48 fichas de personajes/grupos y 34 lugares, todo `provisional`. El contenido se muestra **según el progreso que elige el lector** (al entrar por primera vez se le pregunta; «Mostrar todo» lo abre entero). La asignación de hitos es **provisional**, hecha por el asistente y pendiente de revisión. Hay búsqueda, filtros, índice ligero con detalles bajo demanda y un registro de evidencias por afirmación (46 afirmaciones en 17 acontecimientos; **ninguna aprobada**; 37 apoyos contrastados con 20 textos primarios del juego). Alcance y criterios: [docs/11](docs/11-alcance-primera-version.md).

## Ejecutar localmente

Desde la raíz, con Node.js 24 LTS y npm 11:

```sh
npm ci
npm run dev
```

Astro sirve normalmente en `http://localhost:4321/`. En PowerShell usar `npm.cmd` cuando la política del sistema impida ejecutar `npm.ps1`.

| Comando                    | Uso                                                                               |
| -------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`              | Desarrollo local                                                                  |
| `npm run build`            | Validar contenido y generar el sitio en `dist/`                                   |
| `npm run preview`          | Servir la compilación local                                                       |
| `npm run check`            | TypeScript y Astro                                                                |
| `npm test`                 | Pruebas de dominio, contenido e interacción                                       |
| `npm run lint`             | ESLint                                                                            |
| `npm run format:check`     | Comprobar formato                                                                 |
| `npm run validate`         | Formato, lint, tipos, pruebas y build                                             |
| `npm run test:e2e`         | Pruebas de navegador (requiere `npm run build` y un Chromium; ver abajo)          |
| `npm run content:evidence` | Verifica los fragmentos del registro de evidencias contra la importación aceptada |

**Finales de línea:** el repositorio guarda LF y `.gitattributes` fuerza `eol=lf`, de modo que `npm run validate` pasa también en Windows con `core.autocrlf=true`; los fixtures de `tests/fixtures/import/raw/` conservan sus bytes exactos. En un checkout de Windows anterior al cambio, renormalizar con `git add --renormalize .`. Resultados y pasos completos en [validación técnica del 05/10/2026](docs/validation/validacion-tecnica-2026-10-05.md). Alcance y criterios de la primera versión (propuesta): [docs/11](docs/11-alcance-primera-version.md).

Se conservan las dependencias instaladas y `package-lock.json`. La compilación del dossier no requiere red, credenciales ni el snapshot P2. Puede desactivarse la telemetría de Astro con `$env:ASTRO_TELEMETRY_DISABLED='1'` en PowerShell.

## Pruebas de navegador

Lectura de los 29 eventos, cronología (solapes, zoom, táctil), accesibilidad (axe, teclado, movimiento reducido, reflujo al 200 %/400 %), spoilers en el HTML construido y rendimiento (incluye un conjunto sintético denso). No forman parte de `validate` porque necesitan un navegador:

```sh
npm run build
npm run test:e2e
```

Playwright usa su propio Chromium si está instalado (`npx playwright-core install chromium`); si no, apuntar `E2E_CHROMIUM_PATH` a cualquier Chromium/Chrome (en el contenedor en la nube hay uno en `/opt/pw-browsers/chromium`). Los informes JSON quedan en `.validation/e2e/` (ignorado por Git). Resultados registrados: [lectura](docs/validation/revision-lectura-2026-10-05.md), [accesibilidad](docs/validation/accesibilidad-compatibilidad.md), [rendimiento](docs/validation/rendimiento-2026-10-05.md) y [sesiones de usabilidad](docs/validation/sesiones-usabilidad.md) (pendientes).

## Explorar la historia

- **Progreso y spoilers:** la primera visita pide «¿Hasta dónde has llegado?» (por región de la historia principal). Mientras no se elige, no se muestra nada; el botón de la barra lo cambia en cualquier momento y se guarda solo en este navegador. Lo que el progreso no permite no aparece en la cronología, la lista, los directorios, la búsqueda, las sugerencias, los conteos ni las conexiones; un enlace directo a algo bloqueado muestra un estado neutro sin título. Es protección de la experiencia, **no control de acceso**: los archivos estáticos (`/data/…`) siguen siendo públicos.
- **Búsqueda y filtros** (lupa): por nombre, participantes, región o ámbito y, con el índice de texto completo (que se carga solo al buscar), por el contenido. Filtros por capítulo, región, personaje o lugar y tipo; lista y cronología muestran el mismo conjunto. Todo queda en la dirección (`?q=…&capitulo=…&region=…&con=…&tipo=…&vista=lista`), así que recargar y atrás/adelante lo restauran.
- **Afirmaciones y respaldo:** cada ficha distingue datos explícitos, testimonios, interpretaciones y cuestiones abiertas, y qué las respalda («Contrastada con el fragmento» o «Citada, sin contrastar»). Método: [docs/12](docs/12-procedimiento-revision-editorial.md).
- La cronología recorre siete capítulos: mundo elemental, orden celestial, rupturas antiguas, trayectorias regionales, mundo de los Siete, umbral de los gemelos y cierre del Cataclismo.
- La línea permanece visible desde el 10 % de zoom; por debajo aparecen las tarjetas de capítulos. Pulsar una tarjeta acerca el lienzo. Arrastrar desplaza; rueda y botones amplían. «Ver toda la cronología» ajusta la extensión al espacio disponible y el selector permite saltar entre capítulos.
- Los recorridos regionales se distribuyen en filas. **La posición, las filas y las distancias no prueban fechas, duraciones ni simultaneidad.** Algunas fichas abarcan procesos largos que se solapan con otros capítulos.
- Al alejarse, círculos, textos y rótulos de capítulos reducen su tamaño de forma proporcional hasta el 60 %; por encima conservan su tamaño de lectura. Los episodios complementarios aparecen desde el 45 % y se ocultan al bajar de ese nivel, salvo los seleccionados o conectados a la selección. Las fechas aparecen desde el 115 %. Seleccionar un nodo abre el texto completo, incertidumbre, personajes/lugares y fuentes. Las conexiones discontinuas son interpretaciones de lectura del dossier; una flecha indica anterioridad solo cuando el texto la expresa. Sin selección solo se dibujan las anterioridades y las conexiones dentro de un capítulo; al seleccionar un evento aparecen todas las suyas.
- Las fichas de personajes y lugares enlazan los acontecimientos asociados. El menú ofrece sus directorios, búsqueda por nombre, guía y cambio de tema.
- La vista de lista (`/lista/` redirige a `/?vista=lista`) permite explorar los mismos acontecimientos sin manejar el lienzo. Los documentos completos en `/dossier/guia/`, `/dossier/historia/`, `/dossier/lugares/` y `/dossier/personajes/` abarcan toda la historia: **se leen solo tras elegir «Mostrar todo»** y requieren JavaScript.
- Enlaces: `/?id=evt-hiperborea`, `/?entity=per-koitar` y `/?id=evt-hiperborea&entity=per-koitar`. La ruta `/evento/?id=…` sigue funcionando. Atrás/adelante recupera selección; Escape vuelve de una entidad al evento o cierra el detalle.
- Con foco en el lienzo: flechas, +/− e Inicio. El zoom del navegador conserva sus atajos. Tema y vista se reinician al recargar.

El núcleo termina con la llegada de los gemelos; el Cataclismo es un cierre contextual explícito. El viaje jugable y los cinco siglos posteriores no se añaden. «Hace 500 años» se refiere al presente narrativo del juego, nunca a una fecha terrestre.

## Contenido y ampliación

Los textos originales permanecen en:

1. [Guía y límites](docs/00_guia_de_lectura.md).
2. [Historia](docs/01_historia_cronologica.md).
3. [Regiones y lugares](docs/02_regiones_y_locaciones.md).
4. [Personajes](docs/03_personajes_fundamentales.md).

`content/editorial/genshin-dossier.json` contiene únicamente anotaciones: capítulos, orden de lectura, hilos regionales, tiempos, referencias a entidades y relaciones. `src/content/dossier.ts` carga los apartados por sus IDs, sin reescribir sus cuerpos. Los ocho episodios complementarios reutilizan apartados de lugares/personajes y se identifican como secundarios.

Para ampliar, conservar IDs existentes, añadir el texto y su ID en el documento correspondiente, y anotar el nuevo evento en el JSON. Añadir un capítulo no requiere cambiar componentes. Un evento de la cronología sin anotaciones, una sección ausente, un ID duplicado, una referencia rota o un ciclo de anterioridad hace fallar la carga.

Los contratos y tipos inferidos viven en `src/domain/schema.ts`. El estado `provisional` significa **borrador visible autorizado**, distinto de `reviewed`; los `draft` anteriores siguen ocultos. El orden de revelación vive en `content/editorial/genshin-revelation.json`: una escalera de hitos por región de la historia principal y el hito de cada acontecimiento, asignado con criterio conservador y **provisional** (nunca deducido del orden histórico). Las fichas de personajes y lugares se abren con el último de sus acontecimientos o con el acontecimiento que es su propio texto. Las referencias externas del dossier se conservan como «citadas, sin contrastar»; el registro `content/editorial/genshin-evidence.json` enlaza fuentes y afirmaciones y fija los fragmentos importados por ID de segmento y hash.

El lector admite Markdown de texto, énfasis, listas, tablas y enlaces HTTP(S); React escapa HTML. No ejecuta MDX ni HTML del dossier. El navegador carga `/data/index.json` (44 KB, 6 KB gzip) y pide los detalles (`/data/events/…`, `/data/entities/…`) y el índice de texto (`/data/search.json`) solo cuando hacen falta; los archivos se generan al compilar desde el contenido editorial y se validan con los esquemas.

## Estructura

| Ruta                                                                                   | Responsabilidad                                                                                            |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/domain/schema.ts`, `integrity.ts`, `visibility.ts`                                | Contratos, integridad y visibilidad                                                                        |
| `src/content/dossier.ts`                                                               | Lectura local del dossier y referencias                                                                    |
| `content/editorial/genshin-dossier.json`                                               | Anotaciones editoriales del primer borrador                                                                |
| `src/application/catalog.ts`, `atlas.ts`, `progress.ts`, `search.ts`, `data-source.ts` | Consultas; visibilidad, filtros y ensamblado de fichas sobre el índice; progreso; búsqueda; carga de datos |
| `src/content/atlas-data.ts`, `src/pages/data/`                                         | Proyección a archivos estáticos (índice, detalles, texto)                                                  |
| `src/domain/evidence-integrity.ts`                                                     | Referencias rotas o incompletas y verificación contra la importación                                       |
| `content/editorial/genshin-revelation.json`, `genshin-evidence.json`                   | Revelación (provisional) y registro de evidencias                                                          |
| `src/visualization/`                                                                   | Posiciones narrativas y gestos D3                                                                          |
| `src/components/explorer/`                                                             | Lienzo, capítulos, menú y navegación                                                                       |
| `src/components/DossierText.tsx`                                                       | Presentación segura del texto                                                                              |
| `src/pages/dossier/`                                                                   | Lectura completa de los documentos                                                                         |
| `tests/`                                                                               | Dominio, importación, dossier, spoilers, evidencias, layout y navegación                                   |
| `tests/e2e/`                                                                           | Pruebas de navegador (`npm run test:e2e`)                                                                  |

Los fixtures demo permanecen en `content/editorial/demo.json` y `content/imported/demo-missions.json`, usados por pruebas. La antigua proyección `src/content/preview.ts` se conserva como antecedente y ya no alimenta las páginas: cambiar su interruptor no cambia el sitio actual.

## Importador P2

El [importador P2](docs/validation/importador-p2.md) permanece separado del dossier y del cliente. Trabaja con la muestra [aprobada en P1](docs/validation/p1/revision-humana.md): 23 fuentes procesadas, 19 aceptadas y 396 segmentos. Ninguna misión se convierte automáticamente en evento.

```sh
npm run content:acquire
npm run content:import
npm run content:validate -- ID_DEL_CANDIDATO
npm run content:diff -- ID_DEL_CANDIDATO
npm run content:promote -- ID_DEL_CANDIDATO
npm run content:validate
```

Solo `content:acquire` descarga. Las demás órdenes trabajan localmente; la promoción exige validación y conserva versiones anteriores. Candidatos en `.validation/p2/`; fuentes normalizadas en `content/imported/animegame/`, ignoradas por Git. Su aceptación técnica no equivale a revisión editorial del dossier.

## Git, validación y límites

Repositorio: [FranciscoCamareno/IrminsulAtlas](https://github.com/FranciscoCamareno/IrminsulAtlas). Esta fase parte de `d68840a8f832e7c4f64f19cff1e74d8208b8853d`, en `codex/cronologia-dossier`. El ZIP de P0 permanece en `.validation/p0/` como respaldo adicional; no se usa ni se versiona.

La [validación de este borrador](docs/validation/dossier-historia-antigua.md) registra pruebas, compilación, capturas de escritorio y viewports estrechos. Las pruebas de DOM y las capturas no certifican gestos táctiles físicos, lector de pantalla, todos los navegadores ni usabilidad con participantes.

Pendiente: contraste de fuentes, aprobación editorial, spoilers por progreso, búsqueda/filtros completos de acontecimientos, carga de detalle separada y mediciones de rendimiento. No se publicó ni desplegó.

## Documentación de arquitectura y planes

- [Requisitos](docs/01-requisitos.md), [arquitectura](docs/02-arquitectura.md), [modelo](docs/03-modelo-de-datos.md), [integración](docs/04-integracion-api.md).
- [UX](docs/05-diseno-ux.md), [estilos](docs/styles.md), [decisiones](docs/07-referencias-y-decisiones.md).
- [Plan general](docs/06-plan-de-trabajo.md) y [plan de integración](docs/10-plan-integracion-lore-y-pruebas.md).
- Antecedentes: [base inicial](docs/08-base-inicial.md), [cronología inmersiva](docs/09-cronologia-inmersiva.md), [P0](docs/validation/estado-actual.md), [P1](docs/validation/cobertura-fuentes.md) y [P2](docs/validation/importador-p2.md).
