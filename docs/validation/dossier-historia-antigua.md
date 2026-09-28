# Cronología del dossier de historia antigua

Fecha: 28/09/2026. Rama: `codex/cronologia-dossier`. Base: `d68840a8f832e7c4f64f19cff1e74d8208b8853d`.

## Alcance autorizado

El usuario pidió sustituir la información temporal por la historia de los documentos 01, 02 y 03; después añadió la guía 00 y confirmó: traslado fiel como primer borrador, sin contraste externo por ahora, contenido visible y acontecimientos como nodos con personajes/lugares en fichas relacionadas.

Esta instrucción habilita el borrador visible. No aprueba factual ni editorialmente el contenido y no cierra las puertas de P3–P7 del plan original. No se publica ni despliega. Los originales del usuario se incorporan sin reformatear y el ZIP P0 se conserva.

## Resultado

- 21 acontecimientos con los IDs originales de la cronología.
- Ocho episodios complementarios tomados íntegramente de apartados de lugares/personajes: Gurabad, Havria, Chenyu, Tsurumi, Azhdaha, Ochkanatlan, Mare Jivari y Amrita/Pari.
- Siete capítulos de lectura, 35 conexiones, 48 personajes/grupos y 34 lugares.
- Fichas con texto completo, incertidumbre y enlaces originales; directorios de personajes y lugares con búsqueda por nombre.
- Relaciones evento → entidad → eventos, URLs compartibles, historial, cierre con Escape y retorno de foco.
- Lectura completa de los cuatro documentos en rutas estáticas y lista prerenderizada.

Los capítulos no son intervalos históricos disjuntos. Las trayectorias regionales abarcan procesos que se solapan con otras etapas. El layout asigna filas por hilo regional dentro de cada capítulo; no afirma sincronización entre filas. Las fechas aproximadas son relativas al presente narrativo del juego.

## Decisiones de implementación

| Archivo                                                       | Cambio                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `content/editorial/genshin-dossier.json`                      | Anotaciones explícitas de capítulos, eventos, tiempos, vínculos y conexiones; sin copias de cuerpos |
| `src/content/dossier.ts`                                      | Carga de los cuatro documentos y extracción de encabezados/tablas por ID; valida el conjunto        |
| `src/domain/schema.ts`                                        | Estado `provisional`, fichas con cuerpo, hilo narrativo, procedencia y certeza; contratos inferidos |
| `src/application/catalog.ts`                                  | Consultas de entidades, asociaciones inversas y disponibilidad honesta de referencias               |
| `src/visualization/layout.ts`                                 | Distribución extensible por capítulos e hilos; demo anterior conservada para regresión              |
| `src/components/explorer/`                                    | Vista general adaptable, selector de capítulo, fichas y directorios                                 |
| `src/components/DossierText.tsx`                              | Markdown acotado, tablas, enlaces y escape de HTML                                                  |
| `src/components/DemoCatalog.tsx`, páginas y layout            | Lectura del nuevo corpus y etiquetas de borrador                                                    |
| `tests/dossier.test.ts`, `tests/timeline-interaction.test.ts` | Fidelidad, límites temporales, seguridad, ampliación y navegación                                   |

Los cuerpos se conservan completos, normalizando solo saltos de línea para lectura. No se generan resúmenes narrativos nuevos: la lista usa el primer párrafo del apartado. Los cinco miembros de los Pecadores y las diez figuras complementarias mantienen sus IDs de tabla. Las fichas agrupadas de varios personajes conservan la agrupación del original.

`provisional` identifica el borrador que el usuario autorizó mostrar; no sustituye `draft` ni `reviewed`. Las consultas siguen ocultando los `draft` existentes. El dossier tiene requisitos vacíos y ningún hito. El orden de revelación queda sin asignar (valor neutral 0); no se deduce del orden del documento.

Las conexiones se anotan con explicación y apartado de procedencia. Se usa anterioridad únicamente para secuencias expresas; las demás son asociaciones, especialmente las fichas que abarcan procesos largos. Todas permanecen interpretativas. No se afirma causalidad nueva ni simultaneidad por proximidad visual.

Las referencias externas se identifican por hash de URL; la fecha de investigación del dossier no se convierte en fecha de acceso durante esta integración. No se consultaron ni descargaron las fuentes. Se distingue el texto local disponible de una referencia externa sin contrastar.

La carga no depende del snapshot P2 ni modifica `content/imported/`. El antiguo `preview.ts` queda como antecedente sin alimentar las rutas. La demo sigue siendo fixture independiente de regresión.

## Validación automatizada

`npm run validate`: formato, lint, tipos, pruebas y compilación. Resultado final: correcto (código 0). Astro comprobó 37 archivos sin errores, advertencias ni sugerencias; se generaron ocho páginas estáticas.

- 71 pruebas en seis archivos: 60 de regresión y 11 de dossier/navegación.
- Cobertura textual por cada ID original; todos los cuerpos de eventos y fichas coinciden con el apartado seleccionado.
- Integridad, referencias, conservación de incertidumbre, Mare Jivari discutido, años narrativos, estados provisionales y ausencia de mezcla con demo/importación.
- Secciones que contienen tablas, fichas complementarias e IDs duplicados.
- HTML no ejecutable, enlaces inseguros rechazados y tablas legibles.
- Extensión con un capítulo adicional sin modificar el layout y conservación de datos históricos.
- Vista general móvil, equivalencia de lista, selección, entidades, Escape, foco, historial, directorios e IDs inexistentes. Las pruebas de gestos D3 anteriores siguen pasando.

Durante el cierre faltaban herramientas en el árbol de dependencias local. Se restauró con npm ci, manteniendo package.json y package-lock.json sin cambios. Fue necesario detener el servidor de capturas para liberar un módulo nativo de Windows; la validación completa posterior pasó.

## Comprobación visual local

Los conectores de navegador y Computer Use no pudieron iniciar: `windows sandbox failed: helper_unknown_error: setup refresh had errors`. Se utilizó Edge instalado en modo headless mediante CLI, perfil aislado en `.validation/dossier/edge-profile/` y servidor local `127.0.0.1:4322`.

Capturas inspeccionadas:

- Vista general a 1440 × 1000: siete capítulos legibles.
- Evento de Sumeru a 1440 × 1000: selección, recorridos regionales, conexiones y ficha.
- Vista general con viewport efectivo 320 × 740: siete capítulos en zona desplazable; ancho del documento 320 px.
- Mare Jivari con viewport efectivo 390 × 844: nodo, controles y ficha inferior; ancho del documento 390 px.

Edge headless impone un ancho mínimo a su ventana. Las primeras capturas pequeñas se descartaron como evidencia móvil. Las definitivas usan un iframe local con dimensiones explícitas; el informe DOM confirma `innerWidth === scrollWidth` en 320 y 390. Los artefactos están en `.validation/dossier/`, fuera de Git.

Se comprobó hidratación mediante las capturas de enlaces directos que abren eventos, pero no se certifica una batería E2E de interacción en navegador. Los flujos automatizados de clics y foco se prueban en jsdom. No se probaron pinch físico, dispositivo móvil real, lector de pantalla, otras familias de navegador ni sesiones con personas.

## Ampliación y pendientes

Para ampliar: añadir textos con IDs estables al dossier, completar anotaciones del nuevo evento y ejecutar `npm run validate`. Nuevas fichas con ID se incorporan al directorio; nuevas relaciones/participantes se anotan explícitamente. Ninguna coordenada se guarda como fecha.

Pendiente: contraste externo y revisión editorial, política de spoilers, filtros completos de eventos, índice separado de detalles, agrupación por densidad y mediciones de rendimiento. Las 29 fichas incluyen procesos compuestos del documento original; su división en eventos atómicos requiere edición posterior, sin convertir el orden de lectura en cronología demostrada.

Siguiente paso: revisión del borrador en la página y correcciones editoriales concretas; después, contrastar fuentes y definir spoilers. No se agregan episodios modernos ni fuentes nuevas silenciosamente.
