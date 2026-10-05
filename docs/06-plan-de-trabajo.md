# Plan de trabajo y validación

Estado al 25 de septiembre de 2026: base implementada y prototipo de fase 2 con cronología a pantalla completa, gestos y ficha. Hay pruebas automatizadas de dominio, React/D3 en DOM simulado y HTTP. La revisión visual en navegador y el cierre de la fase 2 siguen pendientes. El MVP no está completo.

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
- [ ] Completar revisión visual y de interacción: hidratación, teclado, historial y móvil a 320 px.

Entrega: proyecto ejecutable localmente y contenido validado. Actualizar README con los comandos que realmente existan.

## Fase 2 — Cronología

- [x] Layout inicial por épocas y orden narrativo.
- [x] Zoom, desplazamiento y restablecimiento con D3 y controles de teclado.
- [x] Tres niveles de detalle y agrupación inicial por épocas.
- [x] Selección y ficha contextual.
- [x] Relaciones del evento seleccionado.
- [ ] Validar visualmente el prototipo en escritorio y móvil, incluidos gestos físicos.
- [ ] Ajustar umbrales, densidad y colisiones con un corpus representativo; la agrupación general por densidad sigue pendiente.

Entrega: explorar, abrir y volver sin perder contexto. Verificar eventos densos, simultáneos y desconocidos.

## Fase 3 — Exploración y accesibilidad

- [ ] Búsqueda y filtros.
- [ ] Reglas de spoilers en todas las superficies.
- [ ] Enlaces directos e historial.
- [ ] Móvil, teclado, vista de lista y movimiento reducido.
- [ ] Estados vacíos y de error.

Entrega: flujo completo usable sin depender del ratón o de una API disponible.

## Fase 4 — Fuente real y contenido

- [ ] Evaluar API real y registrar contrato, cobertura y condiciones.
- [ ] Implementar adaptador, snapshots y detección de cambios.
- [ ] Vincular fuentes importadas a eventos editoriales.
- [ ] Revisar 30–50 eventos para completar contenido del MVP.
- [ ] Mantener compilación reproducible y fallos seguros.

Si no se identifica una API adecuada, registrar la limitación y usar contenido editorial manual verificado. No afirmar que existe integración.

## Fase 5 — Validación final y publicación solicitada

- [ ] Medir rendimiento con datos y dispositivos representativos.
- [ ] Revisar coherencia visual y enlaces.
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

## Registro de avances

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

