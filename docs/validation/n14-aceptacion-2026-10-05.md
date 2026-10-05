# N-14 — Aceptación (estado a 2026-10-05)

**Veredicto: entrega técnica parcial.** No se cumple ni la primera parte (faltan revisiones humanas) ni la meta completa (no existe el recorrido del Viajero).

## Primera parte (lore antiguo)

| Criterio                                          | Estado                                                                                                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corpus antiguo revisado                           | **No.** 29 eventos `provisional`; 64 afirmaciones `pending`; 4 eventos sin afirmaciones (necesitan misiones/diálogos).                                   |
| Decisiones de spoilers aprobadas                  | **No.** Matriz n03 generada; mapa `provisional`.                                                                                                         |
| Requisitos funcionales pendientes resueltos       | **Sí, los técnicos** (L-06/L-08 selector de hilo, reintento, categoría/facción, agrupación por densidad). Decisiones editoriales D-01…D-12 sin resolver. |
| Validaciones reales                               | `npm run validate` (135 pruebas) y `test:e2e` (27) en verde en Chromium 141.                                                                             |
| Matriz de experiencia sin bloqueos críticos/altos | **Parcial.** Sin bloqueos conocidos en Chromium; Firefox/WebKit, móvil físico, lector de pantalla y sesiones con personas pendientes.                    |

## Meta completa

| Criterio                                   | Estado                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Inventario hasta corte público verificado  | **Parcial.** Inventario de 430 unidades del snapshot; corte 7.1 sin acreditación oficial.                                   |
| Lotes con revisión y evidencia (N-11/N-12) | **No iniciado.**                                                                                                            |
| Mantenimiento probado (N-13)               | Sí: informe de impacto y recuperación probados con fixtures y un candidato real antiguo; sin ensayo con snapshot posterior. |
| Rendimiento del conjunto medido            | Solo del corpus antiguo; no hay corpus completo.                                                                            |

## Tareas humanas concretas

1. Resolver D-01…D-12 ([n02](n02-paquete-decisiones-2026-10-05.md)) y revisar/aprobar las afirmaciones.
2. Revisar la matriz de revelación [n03](n03-matriz-revelacion-2026-10-05.md): aprobar o corregir hitos, y decidir si las fichas de región se dividen o reciben `entityOverrides`.
3. Confirmar en el aviso oficial la versión pública y su fecha (`genshin-coverage.json`, `publicCutoff`).
4. Probar en Firefox, Safari, teléfono real y con lector de pantalla; sesiones de usabilidad (L-09).
5. Decidir el alcance y el orden de N-11/N-12 (ver preguntas en la entrega).

## Operación (reconstrucción, actualización, recuperación)

Node 24 + `npm ci`; datos importados locales: `content:acquire` → `content:import` → `content:promote <ID>`; `content:validate`, `content:evidence`, `content:coverage`, `content:impact <ID>`; recuperación en [n13](n13-actualizaciones-recuperacion-2026-10-05.md). Los comandos son los mismos en Windows y Linux (Node ≥ 24); no se probó en Windows.
