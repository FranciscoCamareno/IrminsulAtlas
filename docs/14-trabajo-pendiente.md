# Desglose de trabajo pendiente: historia antigua y Viajero

Base auditada: `02104fc`, 05/10/2026. Este documento es un plan ejecutable para el agente en la nube, acompañado por el [mapa del código y preparación del entorno](13-guia-tecnica-agente-nube.md). **Todas las tareas de implementación de abajo siguen pendientes**, aunque reutilizan capacidades que ya existen. Crear esta documentación no las completa.

## 1. Qué significa completar la tarea

Hay dos entregas: cerrar la primera parte de historia antigua y ampliar el atlas hasta un corte verificable del juego. El cierre técnico existente no aprueba el contenido. Para declarar cobertura completa deben existir inventario, denominador, fuentes, revisión y lista explícita de ausencias; añadir muchos nodos no basta.

«Hasta hoy» debe convertirse en una versión pública y fecha de corte verificadas al ejecutar la fase de cobertura. No usar la fecha de este documento ni la versión del proveedor como prueba de actualidad. El inventario debe abarcar historia principal, interludios, misiones de mundo y de personaje, encuentros y eventos temporales, y clasificar otras fuentes de lore como libros, objetos, armas, artefactos, perfiles y textos ambientales cuando correspondan. Registrar lo que no se pueda obtener.

## 2. Orden y dependencias

| ID   | Entrega                                      | Depende de                          | Quién puede cerrarla                               |
| ---- | -------------------------------------------- | ----------------------------------- | -------------------------------------------------- |
| N-00 | Entorno reproducible en nube                 | Checkout                            | Agente con herramientas y acceso a fuentes         |
| N-01 | Evidencia pendiente del corpus antiguo       | N-00                                | Agente prepara; humano aprueba en N-02             |
| N-02 | Resolución editorial y cierre del corpus     | N-01                                | Revisor humano con cambios preparados por agente   |
| N-03 | Revisión de spoilers del corpus antiguo      | N-01; coordinar con N-02            | Agente prepara, humano valida las asignaciones     |
| N-04 | Navegación regional y selector de capítulos  | N-00                                | Agente y verificación de navegador                 |
| N-05 | Filtros faltantes y recuperación de búsqueda | N-00                                | Agente                                             |
| N-06 | Densidad, agrupación y rendimiento           | N-04; medir otra vez tras N-11/N-12 | Agente; medición física en N-07                    |
| N-07 | Accesibilidad, compatibilidad y uso real     | Correcciones de N-03–N-06           | Agente automatiza; personas/dispositivos completan |
| N-08 | Inventario y corte público del juego         | N-00                                | Agente investiga y documenta cobertura             |
| N-09 | Entrada editorial del Viajero y publicación  | N-08                                | Agente                                             |
| N-10 | Progreso por actos y contenido opcional      | N-03, N-08, N-09                    | Agente implementa; revisión editorial de hitos     |
| N-11 | Primer arco completo del Viajero             | N-09, N-10; primera parte revisada  | Agente prepara y humano revisa                     |
| N-12 | Resto de arcos y fuentes complementarias     | N-11, inventario N-08               | Agente por lotes y revisión humana                 |
| N-13 | Impacto de actualizaciones y recuperación    | N-01; extender a N-09               | Agente                                             |
| N-14 | Aceptación final y operación documentada     | Tareas aplicables anteriores        | Agente + verificaciones humanas                    |

N-04, N-05, N-08 y el diseño de N-13 pueden avanzar mientras se revisa contenido. No hace falta suspender todo el trabajo por una aprobación editorial pendiente. No declarar la primera parte terminada hasta cerrar sus criterios; no declarar cobertura final mientras falten lotes del inventario. Este orden no autoriza desplegar ni ejecutar todas las fases en una sola entrega.

## N-00 — Reproducir la base en la nube

**Trabajo:** seguir la guía 13: instalar con `npm ci`, ejecutar `validate:code`, reconstruir candidato, validar evidencia antes de promover y ejecutar `validate`; preparar Chromium y ejecutar la suite e2e. Registrar diferencias respecto de Windows y de los informes anteriores.

**Archivos:** `package.json`, `package-lock.json`, `scripts/import/README.md`, `tests/e2e/harness.ts`; informe nuevo en `docs/validation/`. Cambiar código solo si aparece un fallo reproducible del entorno compatible.

**Aceptación:** commit y versiones registrados; comandos reales y códigos de salida; importación compatible o bloqueo concreto identificado. Las 109/26 pruebas históricas sirven de referencia, no se escriben como resultado nuevo si no se ejecutaron. Un entorno sin red puede verificar código y fixtures, pero no cerrar evidencias textuales.

## N-01 — Completar evidencia de los 29 acontecimientos

**Trabajo:** descomponer los cuerpos en afirmaciones comprobables siguiendo docs/12, localizar fuentes, ampliar selección de misiones/diálogos cuando los libros no basten, conservar narradores, contradicciones y límites. Revisar también las 17 fichas que ya tienen afirmaciones: tener alguna no significa tener cubierto todo el cuerpo.

Las 12 fichas sin afirmaciones en la base auditada son:

| Evento                       | Apartado que alimenta su cuerpo |
| ---------------------------- | ------------------------------- |
| `evt-orden-lunar`            | `evt-orden-lunar`               |
| `evt-pilares-celestiales`    | `evt-pilares-celestiales`       |
| `evt-vindagnyr-khaenriah`    | `evt-vindagnyr-khaenriah`       |
| `evt-gnosis-guerra-arcontes` | `evt-gnosis-guerra-arcontes`    |
| `evt-fundacion-natlan`       | `evt-fundacion-natlan`          |
| `evt-formacion-snezhnaya`    | `evt-formacion-snezhnaya`       |
| `evt-ruina-tsurumi`          | `loc-tsurumi`                   |
| `evt-caida-ochkanatlan`      | `loc-ochkanatlan`               |
| `evt-sello-azhdaha`          | `per-azhdaha`                   |
| `evt-khaenriah-irmin`        | `evt-khaenriah-irmin`           |
| `evt-cataclismo`             | `evt-cataclismo`                |
| `evt-amrita-pari`            | `loc-vurukasha`                 |

**Archivos:** `content/editorial/genshin-evidence.json`, `scripts/import/selection.json`, `docs/validation/p1/snapshot-manifest.json`, `scripts/import/adapter.ts` si el formato real lo exige, `src/domain/schema.ts`, `src/domain/evidence-integrity.ts`. Consultar los cuatro documentos de prosa sin reescribirlos silenciosamente.

**Entrega:** matriz por evento y enunciado con fuente, localizador, fragmento/hash, clasificación, límites y estado. Las fuentes no encontradas deben producir un pendiente explícito. Toda propuesta nueva conserva revisión `pending`; `verified` solo significa que se contrastó el apoyo.

**Aceptación y pruebas:** reconstrucción determinista; candidato pasa `content:validate` y `content:evidence` antes de promover; `tests/import.test.ts` si cambia el adaptador, `tests/evidence.test.ts` y validación completa. La tabla debe permitir revisar las 29 fichas sin buscar de nuevo cada fuente. No cerrar la cobertura semántica solo porque desaparezcan los eventos sin afirmaciones.

## N-02 — Resolver discrepancias y aprobar el corpus

**Trabajo:** preparar decisiones con texto actual, evidencia, límites y corrección propuesta para los hallazgos de [revisión editorial](validation/revision-editorial-muestra.md). Prioridades: datación de Decarabian/Vennessa, orden Gurabad/Deshret y Enkanomiya/Watatsumi, referencia temporal de Remuria y afirmaciones todavía sostenidas solo por referencias secundarias. Son hallazgos del informe existente, no hechos resueltos en esta guía.

Revisar por separado cuerpos de eventos, 35 relaciones, fichas de personajes/grupos y lugares. La aprobación de un evento no prueba una causalidad ni aprueba la prosa de sus entidades. Decidir con evidencia si dividir procesos agregados; conservar IDs y enlaces existentes y documentar cualquier cambio del alcance de 29.

**Archivos:** `genshin-evidence.json`, `genshin-dossier.json`, documentos narrativos `docs/00_…` a `03_…`, `src/content/dossier.ts`, `src/domain/evidence-integrity.ts`; acta de decisiones en `docs/validation/`.

**Brecha de código a evaluar:** eventos y relaciones ya tienen revisión individual. Las entidades del dossier se generan como `provisional` sin un mecanismo equivalente de decisión individual en el mapa. Si se necesita aprobarlas individualmente, añadir anotaciones validadas y trazabilidad en `schema.ts`/`dossier.ts`, con pruebas de exclusión y revisión. No forzar todas a `reviewed` mediante el valor común `scope`.

**Aceptación:** persona responsable y fecha reales; correcciones materiales revisables; afirmaciones y fichas aprobadas por separado; `claimIds` de relaciones existentes, relevantes y suficientes para su enunciado; contradicciones conservadas. El agente entrega el paquete completo para revisión y continúa tareas independientes. No puede inventar la aprobación humana que exige docs/12.

**Pruebas:** `tests/dossier-review.test.ts`, `tests/dossier.test.ts`, `tests/evidence.test.ts`, `validate` y lectura e2e si cambia prosa, enlaces o estructura.

## N-03 — Aprobar revelación y spoilers del lore antiguo

**Trabajo:** revisar el primer punto del juego que permite conocer cada cuerpo completo, personaje, lugar y relación. Mantener etiquetas de progreso que no revelen títulos sensibles. Auditar fuentes citadas y afirmaciones compartidas. Documentar excepciones y su justificación; no inferir revelación de antigüedad histórica.

**Archivos:** `content/editorial/genshin-revelation.json`, `src/content/dossier.ts` (`applyRevelation`), `src/content/atlas-data.ts`, `src/domain/visibility.ts`, `src/application/atlas.ts`, `src/components/DossierText.tsx`, `DossierReader.tsx` y `src/layouts/BaseLayout.astro`.

**Aceptación:** matriz evento/entidad/relación → hito → fuente de revelación → revisión. Si una ficha mezcla varias revelaciones, proteger el cuerpo entero o proponer división justificada. Registrar requisitos propios de relaciones cuando los extremos no basten; ampliar el mapa si el contrato actual no permite expresarlos. Marcar el mapa como revisado solo después de la revisión efectiva.

**Pruebas:** reducir progreso con ficha abierta, URL directa, nombres/alias, conteos, opciones de filtros, sugerencias, títulos de fuentes, fragmentos, enlaces del cuerpo, HTML inicial y metadatos; documento completo solo con «Mostrar todo». Ver `tests/atlas.test.ts` y `tests/e2e/spoilers.e2e.ts`.

## N-04 — Resolver L-06 y L-08 de navegación

**Trabajo:** hacer alcanzables las filas de un capítulo sin una búsqueda a ciegas mediante arrastres; comparar ajuste a la extensión del capítulo con acceso directo a hilos. Evitar que «Ir a capítulo» cubra nodos/control de selección. Conservar selección, contexto, teclado y movimiento reducido.

**Archivos:** `src/visualization/layout.ts`, `viewport.ts`, `src/components/explorer/TimelineCanvas.tsx`, `TimelineExplorer.tsx`, `src/styles/timeline.css`.

**Aceptación:** desde el selector se descubren y alcanzan todos los hilos regionales, también a 320 px; selección visible con ficha abierta; control no tapa el objetivo; no reaparece el clic perdido en bordes ya corregido (L-05). Documentar la interacción elegida y capturas.

**Pruebas:** `tests/timeline-interaction.test.ts`, `tests/e2e/timeline.e2e.ts`, `reading.e2e.ts`; repetir navegación con teclado, toque emulado, resize e historial.

## N-05 — Completar búsqueda y filtros

Puede entregarse en dos commits independientes.

**N-05a, reintento:** conectar el callback que hoy se descarta en `useAsync` para `source.search()`. Mostrar acción de reintento y explicar el alcance de los resultados cuando solo están disponibles metadatos. Conservar consulta, selección, filtros y progreso durante el error.

**N-05b, facción y categoría:** definir categorías editoriales útiles y grupos que realmente correspondan a facciones. El esquema admite `faction`, pero el cargador trata todos los `per-` como personajes y asigna categorías antiguas fijas. Añadir la anotación necesaria, proyección, opciones, filtrado y parámetros de URL sin romper enlaces previos. No equiparar «principal/secundario» con categoría.

**Archivos:** `src/domain/schema.ts`, `src/content/dossier.ts`, `atlas-data.ts`, `src/application/atlas.ts`, `data-source.ts`, `src/components/explorer/SearchPanel.tsx`, `TimelineExplorer.tsx`, `url-state.ts`, `useAsync.ts` y anotaciones editoriales.

**Aceptación:** falla una petición del índice y el reintento funciona sin recargar; los filtros combinan criterios, se limpian, sobreviven a recarga/atrás/adelante y ofrecen solo opciones permitidas. Lista y lienzo coinciden. Valores desconocidos de URL tienen tratamiento explícito y seguro.

**Pruebas:** `tests/atlas.test.ts` y pruebas de navegador de búsqueda, reducción de progreso y navegación; validar contratos si cambian campos.

## N-06 — Agrupación por densidad y rendimiento

**Trabajo:** medir con el corpus real y una muestra sintética densa identificada. El recorte por viewport y las tarjetas de capítulos existen; falta agrupación general por densidad. Implementar agrupaciones solo con elementos permitidos, acceso a sus miembros, ancla estable y tratamiento de la selección. Calibrar umbrales con medidas, conservando lista accesible.

**Archivos:** `src/visualization/layout.ts`, `viewport.ts`, `TimelineCanvas.tsx`, `src/styles/timeline.css`, `tests/e2e/synthetic.ts`, `performance.e2e.ts`.

**Aceptación:** agrupaciones y conteos no filtran spoilers; un elemento seleccionado sigue localizable al cambiar zoom/filtros; no hay solapes que impidan interacción. Registrar tamaño inicial, tiempos de búsqueda/apertura, trazas de gestos y condiciones de medición. Investigar tareas mayores de 50 ms y comparar con los presupuestos propuestos del plan 10. No prometer rendimiento a partir del recuento de nodos.

**Pruebas:** layout e interacción, agrupaciones con contenido bloqueado, zoom repetido y lista equivalente. Repetir la medición cuando crezcan los arcos del Viajero; no añadir Canvas/WebGL o un motor de grafos sin necesidad demostrada.

## N-07 — Cerrar validación de experiencia

**Trabajo automatizable:** adaptar el arnés para una segunda familia de navegador y comprobar compatibilidad; repetir teclado, foco, contraste, texto ampliado, movimiento reducido y 320 px. Revisar visualmente trazos SVG y capas, que axe no certifica completamente.

**Trabajo con medios externos:** teléfono físico (gestos, orientación, barras del navegador, cierre del panel), lector de pantalla, rendimiento en otra máquina/red móvil y sesiones reales del protocolo existente. L-09, la primera visita vacía hasta elegir progreso, necesita observación con personas.

**Archivos:** `tests/e2e/harness.ts`, suites e2e, `docs/validation/accesibilidad-compatibilidad.md`, `sesiones-usabilidad.md`, informes nuevos de rendimiento/lectura y componentes que fallen.

**Aceptación:** matriz con navegador/versión/dispositivo/commit, resultado y evidencia; problemas críticos/altos corregidos y repetidos. No inventar participantes ni registrar emulación como teléfono real. Si el agente no dispone del medio, dejar una tarea manual concreta y continuar las demás; ese criterio permanece pendiente.

## N-08 — Inventario completo y corte público

**Trabajo:** verificar mediante fuentes oficiales la última versión pública al ejecutar la tarea y su fecha; distinguirla del snapshot técnico. Enumerar capítulos/actos/interludios y fuentes opcionales publicadas hasta el corte, incluidas temporales ya no jugables. Un hueco en español no significa que el contenido no exista.

**Entrega propuesta, aún no implementada:** registro versionado de cobertura, con esquema en `src/domain/schema.ts`, datos en `content/editorial/` e informe legible. Registrar por unidad: ID estable, categoría, arco, versión/fecha pública cuando estén acreditadas, referencia de esa publicación, IDs fuente, disponibilidad de idioma, estado de importación, eventos relacionados, revisión y motivo de exclusión/pendiente. Definir estados separados de los de aprobación editorial y validarlos; no confundir «no contiene un evento histórico» con «no revisado».

**Archivos:** esquema nuevo, archivo de cobertura nuevo, `scripts/research/` o comando de informe nuevo si aporta reproducibilidad, docs del alcance. Ninguna de esas rutas nuevas se considera existente hasta implementarla.

**Aceptación:** denominador auditable por categoría/arco, numerador de unidades examinadas y eventos revisados, ausencias explicadas y enlaces de comprobación. La selección actual de P1 es una muestra, no ese inventario. No declarar «todos los datos» si quedan categorías sin evaluar.

**Pruebas:** IDs únicos, relaciones a fuentes/eventos válidas, versión/corte coherentes y estados incompletos visibles en el informe. Se puede preparar el inventario mientras N-02 espera revisión humana.

## N-09 — Entrada del Viajero y metadatos de publicación

**Trabajo:** añadir una entrada editorial separada de los cuatro documentos antiguos y una composición que valide el dataset conjunto antes de generar archivos estáticos. Elegir y documentar un formato sencillo Markdown/JSON; evitar reescribir la arquitectura. Ampliar publicación/cobertura con contratos comprobados en N-08, manteniendo separados tiempo histórico, revelación, publicación y orden visual.

**Archivos:** `src/domain/schema.ts`, cargador nuevo en `src/content/`, punto de composición, `src/pages/data/`, `src/content/atlas-data.ts`, `src/domain/integrity.ts`, `evidence-integrity.ts`, `scripts/import/cli.ts` y contenido nuevo en `content/editorial/`.

**Atención:** hoy las rutas llaman directamente a `loadDossierContent`, y `content:evidence` obtiene los eventos solo de `genshin-dossier.json`. Actualizar ambos caminos: de otro modo podría verse contenido que el verificador no cubre, o rechazarse evidencia del Viajero como evento inexistente. Validar IDs compartidos y reutilizar entidades; no crear dos identidades para la misma persona por aparecer en dos corpus.

**Aceptación:** fixture sintético recorre carga → validación → índice → ficha/lista/búsqueda → evidencia. El corpus antiguo mantiene IDs/URLs y estado. Los nuevos borradores no se publican por accidente en documentos completos, búsqueda o detalles. El build sigue sin red y sin dependencias de archivos locales ignorados.

**Pruebas:** contratos/composición, IDs duplicados entre corpus, referencias cruzadas, borradores, evento respaldado por varias misiones y misión que describe varios acontecimientos; `validate` y e2e.

## N-10 — Progreso por actos y misiones opcionales

**Trabajo:** sustituir la única escalera regional por una representación que combine progreso de historia principal con requisitos opcionales independientes. Definir cómo se expresan requisitos conjuntos y, solo si el contenido lo necesita, alternativas; revisar dependencias y ciclos. No conceder automáticamente una misión opcional por completar una región.

**Archivos:** `RevelationMapSchema` y esquemas afectados, datos de revelación, aplicación de requisitos en los cargadores, `src/application/progress.ts`, `src/domain/visibility.ts`, `src/application/atlas.ts`, `ProgressDialog.tsx`, `DossierReader.tsx`, proyecciones y suites de spoilers.

**Migración:** conservar interpretación documentada de `none` y `all`; para `upto` regional antiguo decidir un mapeo conservador o solicitar nueva elección sin desbloquear más contenido. Versionar el formato persistido cuando cambie. Un hito desconocido no debe conceder acceso; conservar respaldo en memoria si localStorage falla.

**Aceptación:** dos lectores en el mismo acto pero con misiones opcionales distintas reciben contenido distinto correctamente. Reducir progreso invalida fichas, fuentes, relaciones, resultados y conteos visibles. Etiquetas seguras y enlaces neutros; ninguna URL concede progreso. Pruebas de migración, almacenamiento corrupto/bloqueado y condiciones combinadas.

## N-11 — Primer arco del Viajero: Mondstadt

**Trabajo:** usar el inventario para delimitar el arco y sus fuentes verificadas; importar diálogos y sus ramas, seleccionar acontecimientos, redactar resúmenes trazables y enlazar personas/lugares existentes. Distinguir sucesos vividos por el Viajero de historia antigua revelada durante una misión: esta última amplía evidencia/revelación del evento antiguo cuando corresponde, sin duplicarlo por cada relato.

**Archivos:** contenido nuevo de N-09, registro de evidencias, selección/manifiesto del importador, hitos de N-10, inventario N-08; esquema/adaptador solo si existe una brecha real.

**Aceptación:** todas las unidades del arco delimitado tienen estado explícito; cada evento tiene cuerpo, fuentes/afirmaciones, incertidumbre y reglas de spoilers. Evitar deducir fechas de IDs de misión o de parches. Completar revisión humana antes de declarar el arco aprobado. Una entrega provisional debe decirlo expresamente.

**Pruebas:** recorrido extremo a extremo del arco en línea/lista, enlaces a historia antigua, consulta por personajes, progreso parcial y evidencia de varias fuentes. Revisar lenguaje de portada y guía para que ya no describa todo el sitio como exclusivo de historia antigua.

## N-12 — Ampliar por lotes hasta el corte

**Trabajo:** repetir N-11 con cada arco/acto/interludio confirmado en N-08, en lotes pequeños con commits y revisión propia. Incorporar en lotes diferenciados misiones de mundo, historias de personajes, encuentros, eventos temporales y otras fuentes del inventario. No suponer que terminar las misiones de Arconte completa el lore.

**Orden:** seguir dependencias narrativas y de revelación verificadas; incluir todos los arcos posteriores a Mondstadt que existan en el corte, sin fijar aquí un final basado en recuerdos o en el snapshot disponible. La disponibilidad temporal de un evento y su tiempo dentro del mundo son datos diferentes.

**Aceptación por lote:** fuentes obtenidas o ausencias declaradas; cobertura actualizada; IDs y referencias válidos; corpus provisional/revisado identificado; spoilers y relaciones contrastados; validación técnica y lectura del lote. Los huecos de traducción o archivos incompletos permanecen visibles en la cobertura.

**Aceptación del conjunto:** reconciliar el inventario con todo lo importado y editado; eliminar duplicaciones de acontecimientos; revisar contradicciones entre fuentes antiguas/nuevas sin borrar su contexto; volver a medir densidad y rendimiento con el corpus real completo.

## N-13 — Actualizaciones, impacto y recuperación (P7)

**Trabajo:** completar la cadena fuente/segmento modificado → afirmaciones → eventos → relaciones afectadas. El diff actual de fuentes y el fallo por hash son útiles, pero falta un informe editorial de impacto y un ensayo completo de recuperación. Mantener decisiones previas como historial; un cambio de texto exige revisión, no una aprobación automática.

**Archivos:** `scripts/import/pipeline.ts` (`compareImports`, `promoteCandidate`), `cli.ts`, `shared.ts`, adquisición/adaptador, `src/domain/schema.ts`, `evidence-integrity.ts`, registros editoriales y documentación operativa.

**Brecha:** snapshot y versión del adaptador están fijados en código/contratos. Diseñar su evolución a partir de un nuevo snapshot real y documentar compatibilidad; no cambiar solo el hash del manifiesto suponiendo que todo lo demás se adapta. Un snapshot nuevo no debe invalidar silenciosamente las evidencias antiguas ni sustituir sus hashes en bloque.

**Aceptación:** candidato rechazado por descarga parcial, esquema incompatible o evidencia rota deja intacta la versión válida. Informe distingue añadidos, cambios, ausencias y exclusiones; identifica afectados y decisiones pendientes. Recuperar una versión previa y su editorial compatible reproduce el resultado validado. La reversión tiene procedimiento y prueba; no inventar un comando `rollback` que todavía no existe.

**Pruebas:** fixtures con segmento cambiado, fuente retirada, respuesta parcial, afirmación compartida, relación afectada y actualización sin cambios; determinismo y conservación del puntero aceptado. La publicación del sitio continúa separada de la promoción local de fuentes.

## N-14 — Aceptación final y documentación operativa

**Trabajo:** reconciliar RF-01–RF-12, A-01–A-12 y esta lista con evidencia actual. Actualizar README, alcance, modelo, integración, estilos y plan para distinguir especificación histórica de comportamiento construido. Documentar reconstrucción desde cero, adquisición, revisión, actualización y recuperación en Windows/Linux.

**Aceptación de la primera parte:** corpus antiguo revisado, decisiones de spoilers aprobadas, requisitos funcionales pendientes resueltos, validaciones reales y matriz de experiencia sin bloqueos críticos/altos. Si falta revisión humana/dispositivo, declarar entrega técnica parcial.

**Aceptación de la meta completa:** inventario hasta corte público verificado, todos los lotes del alcance con revisión y evidencia, categorías ausentes visibles, mantenimiento probado y rendimiento del conjunto medido. Una exclusión acordada cambia el alcance declarado; no convierte una cobertura parcial en «todo el juego».

**Publicación opcional:** solo con solicitud explícita del usuario: elegir hosting, preparar salida candidata, desplegar, comprobar rutas/archivos/metadatos y conservar versión recuperable. El grafo independiente, cuentas, base de datos, traducciones adicionales y edición web siguen fuera del trabajo necesario salvo requisito nuevo.

## 3. Prompt para iniciar el trabajo en la nube

Copiar este bloque junto con acceso al repositorio y a la rama que contenga esta documentación:

```text
Trabaja en IrminsulAtlas. Lee AGENTS.md, README.md y docs/, en especial
docs/13-guia-tecnica-agente-nube.md y docs/14-trabajo-pendiente.md.
La meta final incluye el lore antiguo y el recorrido del Viajero hasta un
corte público del juego comprobado, con cobertura y fuentes verificables.

Ejecuta N-00 y prepara N-01. Comprueba primero el código y estado Git real;
la base documentada es 02104fc y puede haber cambiado. Usa una rama de fase.
Reconstruye los datos importados: no vienen en Git. No reconstruyas las
funcionalidades ya implementadas ni actualices dependencias sin necesidad.

Para N-01 entrega afirmaciones y evidencias de las 12 fichas identificadas,
revisa los huecos de las otras 17 y prepara las decisiones de N-02. Amplía
la selección de fuentes solo con archivos e IDs verificados. Mantén pending
las propuestas de IA; no inventes aprobaciones, fechas, fuentes ni resultados.
Si falta una fuente, registra el hueco y continúa lo que sí sea comprobable.

Ejecuta las validaciones aplicables, actualiza README y el plan con evidencia
y entrega commits acotados, decisiones y pendientes humanos concretos.
No despliegues ni implementes el resto de fases en esta entrega.
```

Para continuar, sustituir «N-00 y prepara N-01» por una tarea habilitada y acotar los lotes. Cada entrega debe incluir: commit base/final, archivos, comportamiento o contenido cambiado, comandos y resultados, criterios cumplidos/pendientes y siguiente tarea. Adjuntar la decisión humana cuando una tarea dependa de ella; no atribuírsela al agente.
