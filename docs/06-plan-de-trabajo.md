# Plan de trabajo y validación

Estado al 05/10/2026: explorador de historia antigua implementado con 29 acontecimientos, búsqueda, filtros, progreso, lista, detalles diferidos y evidencias por afirmación. El [cierre técnico de la v1](validation/cierre-tecnico-v1.md) incorpora revisión individual de fichas y relaciones, respaldo de progreso en memoria y comprobación textual en `validate`. La aprobación del corpus y de la revelación sigue pendiente. La primera versión no está cerrada editorialmente ni cubre aún el viaje del Viajero.

La meta continúa siendo una cronología completa de historia antigua y del Viajero hasta un corte público comprobado del juego. Los 29 acontecimientos son el techo de esta primera parte, no del proyecto completo. Los registros fechados de abajo conservan los resultados históricos de cada iteración.

La continuación operativa se desglosa en [N-00 a N-14](14-trabajo-pendiente.md), con archivos, dependencias, validaciones y pendientes humanos. La [guía técnica para el agente en la nube](13-guia-tecnica-agente-nube.md) documenta el código base `02104fc` y cómo reconstruir las fuentes ignoradas por Git. Este desglose no completa ni aprueba ninguna fase de contenido.

## Fase 0 — Inspección y decisiones

- [x] Inspeccionar el repositorio y preservar trabajo existente.
- [x] Confirmar o registrar como provisionales stack, escala narrativa y alcance.
- [x] Definir estilo inicial, navegadores objetivo e idioma.
- [x] Mantener API y hosting como pendientes si aún no se eligen.

Entrega: decisiones documentadas y plan concreto de la primera iteración. Si no existe API, continuar con datos sintéticos; no bloquear el prototipo.

## Fase 1 — Base y modelo

- [x] Preparar Astro + React + TypeScript estricto.
- [x] Definir scripts reales de desarrollo, compilación y validación.
- [x] Crear esquemas para eventos, entidades, fuentes y relaciones.
- [x] Preparar fixtures identificados para los casos solicitados en esta etapa: incertidumbre, relaciones, spoilers y fuentes múltiples.
- [x] Implementar validación de IDs y referencias.
- [x] Generar página inicial y ruta de evento básica.
- [x] Comprobar hidratación, teclado, historial y reflujo a 320 px en navegador automatizado; informes de lectura y accesibilidad.
- [ ] Completar comprobación con lector de pantalla, teléfono físico y otros navegadores.

Entrega: proyecto ejecutable localmente y contenido validado. Actualizar README con los comandos que realmente existan.

## Fase 2 — Cronología

- [x] Layout inicial por épocas y orden narrativo.
- [x] Zoom, desplazamiento y restablecimiento con D3 y controles de teclado.
- [x] Tres niveles de detalle y agrupación inicial por épocas.
- [x] Selección y ficha contextual.
- [x] Relaciones del evento seleccionado.
- [x] Revisar lectura y navegación en escritorio y móvil emulado con los 29 acontecimientos.
- [ ] Validar gestos físicos y resolver los pendientes L-06/L-08 de la revisión de lectura.
- [ ] Ajustar umbrales, densidad y colisiones con un corpus representativo; la agrupación general por densidad sigue pendiente.

Entrega: explorar, abrir y volver sin perder contexto. Verificar eventos densos, simultáneos y desconocidos.

## Fase 3 — Exploración y accesibilidad

- [x] Búsqueda de texto y filtros por capítulo, región, personaje/lugar y principal/secundario.
- [ ] Completar filtros por facción y categoría del requisito original.
- [x] Aplicar reglas de spoilers a las superficies implementadas, con enlaces bloqueados neutros.
- [ ] Revisar y aprobar los hitos y la revelación de cada ficha; la política regional sigue provisional.
- [x] Enlaces directos e historial de selección, filtros y vista.
- [x] Teclado, vista de lista, movimiento reducido y móvil emulado.
- [x] Estados vacíos y errores de datos principales/detalles con reintento.
- [ ] Completar recuperación explícita de la búsqueda de texto ante fallo de su índice.

Entrega: flujo completo usable sin depender del ratón o de una API disponible.

## Fase 4 — Fuente real y contenido

- [x] Evaluar proveedor de archivos, fijar snapshot y registrar cobertura y exclusiones P1.
- [x] Implementar adaptador, snapshots, validación, diferencias y promoción local segura P2.
- [x] Vincular fuentes y fragmentos por hash a la muestra de afirmaciones editoriales.
- [x] Permitir estados y clasificación por evento/relación con decisión explícita de revisión.
- [ ] Completar y aprobar el corpus de los 29 acontecimientos; quedan 12 sin afirmaciones y ninguna aprobada.
- [x] Conservar build sin red y verificar fuentes/fragmentos en la validación completa, con candidato comprobable antes de promover.
- [ ] Identificar acontecimientos afectados por nuevos snapshots y ensayar su revisión/recuperación editorial P7.

Si no se identifica una API adecuada, registrar la limitación y usar contenido editorial manual verificado. No afirmar que existe integración.

## Fase 5 — Validación final y publicación solicitada

- [x] Medir corpus real y conjunto sintético denso en Chromium con condiciones documentadas.
- [ ] Repetir mediciones en teléfono físico, red móvil y otra máquina.
- [x] Revisar lectura y enlaces de los 29 acontecimientos en los tamaños documentados.
- [ ] Completar sesiones con participantes y las filas pendientes de la matriz de accesibilidad.
- [ ] Completar documentación operativa.
- [ ] Solo si el usuario pide publicar: configurar alojamiento y desplegar.
- [ ] Comprobar el resultado publicado y conservar una versión recuperable.

## Pruebas prioritarias

| Prueba | Resultado esperado |
| --- | --- |
| Referencia inexistente | Validación falla con identificación del archivo y campo |
| Fecha desconocida | Se presenta incertidumbre sin inventar valor |
| Relación cíclica narrativa | Permitida si no expresa anterioridad estricta imposible |
| Restricción temporal imposible | Error explicable o revisión editorial requerida |
| Evento bloqueado | No aparece en buscador, conteos, conexiones o títulos |
| Relación con revelación propia | Oculta aunque sus extremos estén visibles |
| URL bloqueada | Aviso neutro; no amplía progreso automáticamente |
| Zoom repetido | Conserva ancla y evita etiquetas ilegibles |
| Atrás/adelante | Recupera selección y filtros documentados |
| Teclado y móvil | Funciones esenciales disponibles |
| API incompleta o esquema cambiado | No sustituye snapshot válido ni publicación |
| Fuente modificada | Marca los eventos asociados para revisión |
| Almacenamiento local no disponible | Funciones esenciales siguen utilizables |

## Definición de terminado del MVP

RF-01 a RF-12 implementados, contenido revisado, casos difíciles comprobados, compilación válida, navegación accesible, sin secretos publicados y documentación ajustada a lo construido. La publicación no es obligatoria para considerar listo el prototipo local.

## Siguientes pasos desde el estado actual

1. **Cerrar la historia antigua:** completar las 12 fichas sin afirmaciones, resolver discrepancias y revisar los cuerpos completos, conexiones e hitos de revelación. Registrar decisiones humanas; ejecutar `validate` con la importación compatible.
2. **Comprobar la experiencia:** teléfono físico, lector de pantalla, otros navegadores y sesiones con personas. Resolver navegación entre hilos regionales y decidir agrupación por densidad según mediciones.
3. **Incorporar el Viajero por arcos:** crear un inventario verificable de historia principal y fuentes complementarias, distinguir acontecimiento y misión, y ampliar hitos por acto/misión y progreso opcional. Reutilizar el modelo y separar la nueva entrada del dossier antiguo; no convertir todas las fuentes en eventos automáticamente.
4. **Declarar cobertura y mantenerla:** fijar una versión pública como corte, registrar categorías incluidas/ausentes (misiones de mundo/personaje, eventos temporales, libros y otras fuentes) y separar fecha histórica, revelación y publicación. Implementar impacto de cambios y recuperación antes de afirmar que el atlas está actualizado hasta ese corte.

El corte del juego y la cobertura completa no están verificados en este cierre técnico. No se amplía el corpus ni se añade infraestructura anticipada para resolverlos.

## Registro de avances

### 2026-10-05 — Cierre técnico de la primera parte

- Rama `codex/cierre-tecnico-v1` desde `ddf148e`. Corregido progreso cuando acceder/escribir almacenamiento falla, incluida la prioridad del estado en memoria frente a un valor persistido anterior.
- Estados y clasificación por acontecimiento/relación desde los esquemas; revisión completa explícita con responsable, fecha y afirmaciones aprobadas. Las relaciones seleccionan afirmaciones por ID. Ninguna afirmación ni ficha real se aprobó.
- Importación ampliada sincronizada: candidato `9af75c4c…`, versión `675999db…`, 51 fuentes/428 segmentos, cuatro exclusiones existentes y versión anterior conservada. Comprobación del candidato antes de promover, sin incidencias.
- `validate` incluye las evidencias textuales; `validate:code` permite comprobar la base sin material importado. Las comprobaciones no descargan. Documentación operativa y alcance actualizado para conservar la meta del Viajero.
- Windows: formato, lint, tipos sin diagnósticos, 109 pruebas, ocho páginas y evidencias correctas; 26 pruebas de navegador en Edge/Chromium, incluidos dos casos de almacenamiento bloqueado. [Informe y límites](validation/cierre-tecnico-v1.md). No se certifica Linux para esta iteración, ni teléfono físico, lector de pantalla o participantes. Sin despliegue.

Añadir en cada iteración: fecha, fase, cambios, comprobaciones, limitaciones y siguiente paso. No rellenar avances hipotéticos.

### 2026-09-25 — Auditoría P0 del plan de integración

- Auditoría sin cambios de implementación: [estado actual, matriz RF-01–RF-12 y archivos afectados por futuras fases](validation/estado-actual.md). Esta P0 corresponde al plan 10, no sustituye las fases originales ni las cierra.
- Confirmados Astro/React/TypeScript, dominio Zod, carga local y cronología con 14 eventos demo. No hay importador, proveedor real, fragmentos verificables, búsqueda ni filtros del MVP.
- Lint, tipos, 36 pruebas y build correctos. `npm run validate` falla previamente en formato de `10-plan-integracion-lore-y-pruebas.md`, conservado sin reformatear. Revisión de navegador/móvil y rendimiento interactivo pendientes.
- Sin Git disponible ni `.git`: no se pudo registrar un commit. Copia local previa en `.validation/p0/estado-previo-2026-09-25.zip`, verificada mediante SHA-256 para los 49 archivos inspeccionados.
- Siguiente incremento recomendado: P1, muestra acotada de cobertura con snapshot identificado y revisión humana explícita. Antes de modificar implementación, recuperar la validación conjunta y establecer el punto Git cuando esté disponible. No se ejecutaron P1–P7 ni se desplegó.

### 2026-09-24 — Base inicial

- Núcleo Zod con tipos inferidos, validación estructural e integridad transversal, reglas de visibilidad y consultas filtradas.
- Carga local de editorial y misiones normalizadas separadas, cinco eventos sintéticos, interfaz mínima con progreso y detalle por ID. Sin API real ni despliegue.
- 25 pruebas correctas; lint y formato correctos; tipos sin errores ni advertencias; compilación de tres páginas y arranque de servidor verificados; respuestas HTTP 200 en inicio y ruta de detalle.
- La prueba de HTML verifica ausencia de títulos bloqueados en contenido renderizado y escape de texto. No certifica hidratación ni interacción real.
- Limitación: herramienta de navegador sin navegadores disponibles. Matriz manual pendiente y versiones en [08-base-inicial.md](08-base-inicial.md).
- Próximo paso: completar esa comprobación visual e iniciar el layout por épocas. Spoilers y navegación tienen una base funcional; su integración con cronología, búsqueda y filtros mantiene la fase 3 pendiente. Casos densos y simultáneos se abordarán con el layout.

### 2026-09-25 — Cronología como protagonista

- Rediseño solicitado a partir del esquema propio y la referencia de DARK: barra mínima, lienzo completo, menú plegable y ficha al seleccionar. Tema carbón con alternativa clara; secciones futuras decorativas.
- Layout separado, conexiones SVG, nodos HTML, pan/zoom D3, agrupaciones por época, tres niveles y lista accesible. Corpus ampliado a catorce eventos ficticios con diecisiete relaciones.
- Pruebas de React/D3 en jsdom para gestos, ancla, controles, selección, enlaces, progreso y viewport estrecho. Tipos, build y HTTP se verifican con el flujo de validación. Evidencia y límites en [09-cronologia-inmersiva.md](09-cronologia-inmersiva.md).
- El entorno continúa sin navegador conectado: no se certifica revisión visual ni gestos físicos. Próximo paso: revisar composición y calibrar con contenido representativo. No se desplegó.

### 2026-09-26 — GitHub y cobertura P1

- Git es el punto de recuperación principal. Árbol inicial limpio; `main`, `origin/main` y GitHub coinciden en `2b27c63c1e51c36d6e4b83f9673509f15c4c88eb`. Trabajo en `codex/p1-cobertura-fuentes`; ZIP de P0 conservado como respaldo local.
- Snapshot AnimeGameData `b061b403c8afc7bca633cf4f201edc4a3baa75fe`, versión de datos declarada por el proveedor 7.1.0. Muestra de 12 categorías, manifiesto de 100 archivos y sonda reproducible sin instalar extractores. Originales fuera del sitio y de Git.
- [Cobertura P1](validation/cobertura-fuentes.md): dos hashes de diálogo ausentes en español, formato Coop distinto y encuentro parcialmente cubierto. Recomendación para P2: TypeScript, con campos verificados por versión y originales preservados.
- [Revisión humana](validation/p1/revision-humana.md) pendiente en los 12 casos; P1 no cierra su puerta editorial ni autoriza marcar datos como revisados. El próximo paso es validar el subconjunto y sus exclusiones antes de solicitar P2.
- Se corrigen las referencias de archivo y el formato pendiente del plan 10. No se cambian UI, dominio, fixtures ni dependencias; no se implementa P2 ni se despliega.
- `npm run validate` completo correcto: formato, lint, tipos sin diagnósticos en 25 archivos, 36 pruebas y build de 4 páginas. La sonda `--check` reproduce sin red la evidencia de 100 archivos verificados; no sustituye la revisión humana ni las futuras pruebas de P2.

### 2026-09-27 — P2: importación reproducible

- Revisión humana P1 aprobada por el usuario en la conversación; [acta y límites](validation/p1/revision-humana.md). Rama `codex/p2-importador-reproducible` desde `897ceded7cd0dacbb3c4d9da66c9021c41262f0f`; ZIP P0 conservado.
- [Importador P2](validation/importador-p2.md) en TypeScript/Node, contratos Zod, adquisición separada, normalización sin red, informes, diferencias y promoción local con versiones inmutables. Sin dependencias nuevas.
- 100 archivos del snapshot P1 verificados; 23 fuentes procesadas, 4 excluidas explícitamente y 19 fuentes con 396 segmentos aceptadas localmente. Fuentes `draft` y `not-publishable`; UI y editorial siguen usando demostración.
- Dos ejecuciones reales con red deshabilitada produjeron el mismo candidato byte por byte. Pruebas de fallo conservan el puntero y los datos de la última versión válida.
- `npm run validate` correcto: formato, lint, tipos sin diagnósticos en 32 archivos, 60 pruebas (24 nuevas) y 4 páginas compiladas. Promoción, validación local y comparación posterior correctas.
- Próximo paso: P3, muestra editorial de 8–12 eventos con evidencia, incertidumbre y revisión. No se implementó P3 ni se desplegó.

### 2026-09-27 — Vista previa temporal antes de P3

- Solicitud explícita del usuario: ver el sitio con el contenido actual del juego, sin completar aún la integración editorial ni su validación.
- Proyección visual separada de las 19 fuentes P2: títulos, fragmentos, cuatro grupos y conexiones ilustrativas. Inicio, ficha y lista usan la vista previa; los originales demo y la importación aceptada se conservan.
- Interruptor `lorePreviewEnabled` en `src/content/preview.ts` para restaurar la demo. No se generan archivos editoriales ni se declara P3 completada. Comprobación limitada a formato y compilación; no se certifica cronología, relaciones históricas ni nueva revisión editorial. Sin despliegue.

### 2026-09-28 — Borrador de historia antigua desde el dossier

- Solicitud confirmada: trasladar fielmente los documentos 00–03, mostrar todo el contenido y usar acontecimientos como nodos con fichas relacionadas de personajes/lugares.
- 29 acontecimientos, siete capítulos narrativos, 35 conexiones, 48 fichas de personajes/grupos y 34 lugares. Textos y IDs conservados; tiempo incierto, orden regional y cierre contextual explícitos.
- Estado `provisional` separado de revisión editorial; la importación P2 y los fixtures demo permanecen independientes. No se completan automáticamente P3–P7 del plan 10.
- Carga local validada, directorios, documentos estáticos, conexiones, lista y navegación evento/entidad con historial y foco. [Informe de validación](validation/dossier-historia-antigua.md).
- Pruebas ampliadas a 71; capturas locales de escritorio y viewports de 320/390 px. Gestos físicos, contraste externo de fuentes y filtros de spoilers pendientes. Sin despliegue.

### 2026-09-28 — Ajuste del zoom de la cronología

- Rama local codex/ajuste-zoom-cronologia desde f2c5cdb; ajuste solicitado del umbral de tarjetas del 48 % al 10 %. La línea permanece visible al 10 % y las tarjetas aparecen por debajo.
- Se conservan pan, zoom interactivo, selección de capítulos y ajuste de toda la extensión. En pantallas estrechas, el ajuste puede quedar por debajo del 10 % y mostrar tarjetas.
- Pruebas existentes actualizadas para comprobar el límite, la vista completa en escritorio y el paso entre tarjetas y línea con los botones en móvil. Validación conjunta correcta: formato, lint, tipos sin diagnósticos, 71 pruebas y compilación de ocho páginas.
- Siguiente paso: revisar la comodidad de lectura del conjunto a zoom lejano. Sin cambios de contenido ni despliegue.

### 2026-09-28 — Legibilidad y descubrimiento al cambiar el zoom

- Rama codex/legibilidad-zoom desde 6ed8d9d. Círculos, etiquetas y rótulos de capítulo escalan proporcionalmente por debajo del 60 % para conservar su separación; desde ese nivel mantienen el tamaño de lectura.
- Los ocho acontecimientos secundarios aparecen desde el 45 % en vez de esperar al 115 %. Las fechas conservan el umbral del 115 % y las tarjetas el 10 %. Selección, conexiones y navegación conservan sus reglas.
- Validación completa correcta: formato, lint, tipos sin diagnósticos, 71 pruebas y ocho páginas compiladas. Edge local: sin intersecciones entre las cajas de nodos/etiquetas al 16 %, 44 %, 46 %, 60 % y 116 % en escritorio; también al 16 % en un viewport móvil de 390 px. Al 44 % hay 21 nodos y al 46 % hay 29, sin fechas hasta el detalle.
- Evidencia local en .validation/zoom/. La vista lejana sirve para apreciar la estructura; para leer textos se acerca la vista, y el título completo también está disponible al posar el cursor sobre el nodo. No se certifican gestos táctiles físicos.
- Siguiente paso: valoración del usuario sobre el tamaño y el umbral elegidos. Sin cambios al contenido, dependencias ni despliegue.

### 2026-10-05 — Validación técnica recuperada y alcance de la v1

- Rama `claude/sleepy-ritchie-7esvu5` desde 7ae8060. Causa del fallo de `npm run validate` en Windows: CRLF por `core.autocrlf` frente a Prettier (LF). Reproducido con un clon simulado (60 archivos señalados) y corregido con `.gitattributes` (`eol=lf`, fixtures `-text` intactos), `endOfLine: lf` y `.editorconfig`. Sin cambios en código, contenido ni dependencias.
- Nueva ejecución en Node 24.21.0 / npm 11.19.0 (Linux): formato, lint, tipos (0 diagnósticos), 71 pruebas y 8 páginas compiladas, código 0. Informe nuevo: [validación técnica](validation/validacion-tecnica-2026-10-05.md); los informes anteriores no se modifican.
- [Alcance de la v1](11-alcance-primera-version.md): lista de aceptación y propuesta de no perseguir 30–50 eventos (pendiente de aprobación). Puntos 2–11 del plan de cierre sin iniciar; 3, 8, 10 y 11 requieren fuentes primarias, personas y dispositivos reales.
- Limitación: no se ejecutó en Windows real. Sin despliegue.

### 2026-10-05 — Primera versión: lectura, spoilers, búsqueda, evidencias, accesibilidad y rendimiento

- Aceptado por el usuario el alcance de la v1 (techo de 29 acontecimientos). Rama `claude/sleepy-ritchie-7esvu5`.
- **Spoilers (P4):** política de progreso con hitos provisionales (`genshin-revelation.json`), diálogo en la primera visita, filtrado antes de búsqueda, sugerencias, conteos, conexiones y referencias en el texto; enlaces bloqueados neutros; HTML inicial sin títulos ni textos; documentos completos del dossier solo con «Mostrar todo».
- **Búsqueda, filtros y estado:** búsqueda por nombre, participantes, región y texto completo diferido; filtros por capítulo, región, personaje o lugar y tipo; estado en la dirección; vacíos, filtros inexistentes y fallos con reintento.
- **Índice ligero (P4/P5):** `/data/index.json` + detalles y texto bajo demanda; carga inicial 152 KB → 118 KB (−22 %).
- **Evidencias (P3):** registro de afirmaciones N:M con fragmentos fijados por hash, detección de referencias rotas/incompletas y `npm run content:evidence`; muestra de 10 eventos, **todo `pending`**; 4 apoyos contrastados con texto primario. Informe y hallazgos críticos en `docs/validation/revision-editorial-muestra.md`.
- **Cronología (P5):** corregido el clic perdido en nodos cercanos a los bordes (alta); conexiones largas solo al seleccionar; recorte por viewport en corpus densos (p95 de 383 ms a 16,8 ms con 290 eventos sintéticos).
- **Pruebas:** 101 pruebas unitarias/de integración (`validate`) y 24 de navegador (`test:e2e`): lectura de los 29 eventos en tres tamaños, solapes de 15 % a 240 %, táctil emulado, axe (0 infracciones en 14 análisis), teclado, movimiento reducido, reflujo al 200 %/400 %, spoilers en el HTML construido y rendimiento.
- **Pendiente y límites:** aprobación editorial de afirmaciones, revelación y clasificaciones; respaldo primario para 16 eventos (exige ampliar la selección de P1); lector de pantalla, teléfono real, Firefox/WebKit y sesiones con participantes. Sin despliegue.

### 2026-10-05 — Ampliación de textos primarios del lore antiguo

- Por instrucción del usuario se amplió la selección de P1: 32 documentos de `Readable/ES` (libros y crónicas sobre Vennessa, Decarabian, Enkanomiya, Mare Jivari, Remuria, Gurabad, Khaenri’ah, Hiperbórea y el orden celestial), importados con P2 (candidato `9af75c4c…`, versión aceptada `675999db…`: 51 fuentes, sin errores). Nuevo tipo de fuente `document`. Las huellas de los archivos nuevos se calcularon al descargarlos (sin inventario Git independiente), anotado en el manifiesto.
- Registro de evidencias: 46 afirmaciones, 51 fuentes, 37 apoyos contrastados con fragmento fijado en 27 afirmaciones y 13 de 29 acontecimientos; todo sigue `pending`. Hallazgos críticos (cifra de Decarabian «tres mil años» frente a 2.600, tensiones de orden en Gurabad/Deshret y Watatsumi, partes del dossier sin respaldo primario) en `docs/validation/revision-editorial-muestra.md`.
- Pendiente: decisiones editoriales sobre esos hallazgos, 12 acontecimientos sin afirmaciones (varios exigen importar misiones o diálogos), aprobación humana.

### 2026-10-05 — N-00 reproducida y N-01 preparada

- **N-00:** reproducción en la nube con Node 24.21.0/npm 11.19.0: `npm ci`, `validate:code` (109 pruebas), reconstrucción determinista de la importación (candidato `9af75c4c…`), `validate` y `test:e2e` (26 pruebas), todo con código 0. Informe: [n00](validation/n00-reproduccion-nube-2026-10-05.md).
- **N-01:** se revisaron 1.824 documentos legibles (libros, historias de armas y artefactos) buscando los 12 apartados sin afirmaciones; se importaron 10 más (candidato `31df5180…` → versión aceptada `6b752f0f…`: 61 fuentes). El registro pasa a 64 afirmaciones, 63 fuentes (32 importadas) y 59 apoyos contrastados; 25 de 29 acontecimientos tienen afirmaciones. Siguen sin ninguna `evt-ruina-tsurumi`, `evt-sello-azhdaha`, `evt-cataclismo` y `evt-amrita-pari`: sus textos no están en documentos sino en misiones y diálogos. Matriz: [n01](validation/n01-matriz-evidencia-2026-10-05.md). Todo sigue `pending`.
- **N-02 (preparación):** 12 decisiones editoriales y 3 estructurales con evidencia, límites y propuesta en [n02](validation/n02-paquete-decisiones-2026-10-05.md); la más importante, la cifra «tres mil años» del juego frente a 2.600 para Decarabian. Sin aprobar.
- Pendiente: importar misiones y diálogos para los 4 eventos restantes y los huecos de la matriz; decisiones y aprobación humanas; N-03 en adelante. Sin despliegue.

### 2026-10-05 — N-03 a N-10 y N-13 (entrega técnica parcial)

- **N-04/N-05/N-06:** selector «Ir a región o hilo» y capítulo; reintento de búsqueda; filtros de categoría y facción (propuesta editorial `pending`); agrupación por densidad en cronologías muy cargadas (el corpus real no la activa al encuadre completo). `validate` y 27 pruebas e2e en verde.
- **N-03:** matriz provisional [n03](validation/n03-matriz-revelacion-2026-10-05.md): 16 de 29 eventos y 57 de 82 fichas exigen Natlan (criterio conservador); fichas de región arrastradas por `evt-cataclismo`. Sin fuentes de revelación ni aprobación. El mapa sigue `provisional`. Nuevo `relationOverrides` (vacío) para requisitos propios de relaciones.
- **N-07:** repetición e2e en Chromium y revisión visual; Firefox/WebKit, teléfono real, lector de pantalla y personas **pendientes** ([accesibilidad](validation/accesibilidad-compatibilidad.md)).
- **N-08:** registro de cobertura `content/editorial/genshin-coverage.json` (430 unidades del snapshot; 51 de Archonte), esquema, informe [n08](validation/n08-inventario-cobertura-2026-10-05.md) y `npm run content:coverage`. Corte público 7.1 (23/09/2026) **solo por fuentes secundarias**: la página oficial estaba bloqueada; confirmación humana pendiente. Ninguna unidad examinada.
- **N-09:** composición de corpus adicionales ([n09](validation/n09-composicion-corpus-2026-10-05.md)); sin corpus real del Viajero todavía.
- **N-10:** hitos `main`/`optional`, formato de progreso v2 con migración ([n10](validation/n10-progreso-actos-2026-10-05.md)).
- **N-13:** `npm run content:impact` y procedimiento de recuperación probado ([n13](validation/n13-actualizaciones-recuperacion-2026-10-05.md)).
- **No hecho:** N-11 y N-12 (contenido del Viajero), N-01 restante (4 eventos), N-02 (decisiones humanas). Por tanto la meta completa del documento 14 **no** está cumplida. Sin despliegue.

### 2026-10-05 — Recorrido del Viajero, revelación por actos y rediseño visual

- **N-11/N-12:** 49 actos de la Misión de Arconte, hasta la 7.0 (corte con una versión de margen elegido por el usuario). Detalle en [n11-n12](validation/n11-n12-viajero-2026-10-05.md). Todo `pending`; las afirmaciones son `cited`.
- **N-03 (decisión del usuario B):** `entityOverrides` para Liyue, Sumeru y Fontaine. Mondstadt e Inazuma **no** se rebajaron porque su texto menciona el Cataclismo y la muerte de Makoto; proponer división del texto.
- **Decisiones C del usuario:** versión pública 7.1 confirmada; D-01…D-12 aprobadas y pruebas manuales hechas según el usuario. Esta documentación no tiene constancia propia de esas pruebas, y los registros de revisión individual siguen sin rellenar.
- **Rediseño visual** «Cuaderno de viaje» con tema Día por defecto ([guía](styles.md)).
- **Pendiente:** revisión humana de los actos; misiones de mundo, historias de personajes, encuentros y eventos; las 4 fichas antiguas sin afirmaciones (puede ayudar la nueva importación de misiones).

