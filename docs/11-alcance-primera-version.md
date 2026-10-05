# Alcance de la primera versión — Irminsul Atlas

Fecha: 5 de octubre de 2026. Estado: **propuesta para aprobación del usuario**. Las decisiones marcadas «propuesta» no se consideran tomadas hasta que el usuario las confirme. Parte de [01-requisitos](01-requisitos.md), [10-plan](10-plan-integracion-lore-y-pruebas.md) y del [borrador del dossier](validation/dossier-historia-antigua.md).

## 1. Punto de partida (se conserva)

- Historia antigua del dossier: 29 acontecimientos (21 principales, 8 complementarios), siete capítulos, 35 conexiones (30 asociaciones, 5 anterioridades expresas), 48 fichas de personajes/grupos y 34 lugares.
- Cronología interactiva, fichas, directorios de personajes y lugares, y lista alternativa.
- Límite narrativo: la llegada de los gemelos es el final del núcleo; el Cataclismo es cierre contextual explícito. Quedan fuera el viaje jugable y los cinco siglos posteriores.

## 2. Decisión sobre «30–50 eventos revisados»

El requisito original (RF/MVP) pide 30–50 eventos **revisados**. Observaciones objetivas sobre el estado actual:

- Hay 29, una cifra aparentemente cercana al mínimo, pero ninguno está revisado: todos son `provisional`.
- 8 de los 29 no son sucesos independientes: son apartados de lugares/personajes elevados a nodo. 13 de los 29 pertenecen a un único capítulo («trayectorias regionales»), que además se solapa con los demás.
- 23 de 29 tienen fecha desconocida y 6 aproximada; ninguno tiene fecha exacta. Aumentar el recuento sin fuentes añadiría posiciones, no información.
- Solo 5 de 35 conexiones son anterioridad respaldada por el texto.

**Propuesta:** no perseguir la cifra. Cerrar la v1 con **los 29 acontecimientos actuales como techo**, sin añadir nada hasta que la revisión editorial de los puntos 3–4 muestre qué fichas deben dividirse. El criterio «30–50» pasa a medirse como «corpus revisado completo con su alcance declarado», no como cantidad. Si el usuario prefiere mantenerlo, la forma honesta es dividir fichas agregadas con evidencia suficiente (punto 8), no inventar eventos. **Cambio registrado como propuesta, pendiente de aprobación.**

## 3. Lista de aceptación de la v1

Cada criterio es verificable; el estado es el de hoy.

| ID   | Criterio                                                                                                                                                  | Estado hoy                                                                                   | Punto |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----- |
| A-01 | `npm run validate` pasa en Node 24 desde un checkout limpio en Windows y Linux, con instrucciones claras                                                  | Cumplido en Linux; Windows simulado ([informe](validation/validacion-tecnica-2026-10-05.md)) | —     |
| A-02 | Los 29 acontecimientos y 7 capítulos se localizan y leen en lienzo y en lista, con el mismo conjunto                                                      | Parcial: pruebas automáticas; sin recorrido manual                                           | 2, 9  |
| A-03 | Muestra de 8–12 eventos contrastada con fuentes localizables; cada afirmación enlaza fragmento y límites                                                  | Pendiente                                                                                    | 3     |
| A-04 | Evidencias vinculadas a eventos (N:M); referencias rotas o incompletas se detectan en la carga                                                            | Pendiente (contratos P2 existen, sin conexión)                                               | 4     |
| A-05 | Política de spoilers aplicada a eventos, entidades, conexiones, fragmentos, búsqueda, conteos, metadatos y HTML inicial; enlace bloqueado = estado neutro | Pendiente (revelación 0 por defecto)                                                         | 5     |
| A-06 | Búsqueda por nombre/alias/términos y filtros por capítulo, región, personaje y tipo; vacíos y errores resueltos                                           | Parcial: solo búsqueda de nombre en directorios                                              | 6     |
| A-07 | Índice ligero separado de detalles; carga inicial medida y reducida; fallos de carga recuperables                                                         | Pendiente (el corpus completo se serializa en la isla)                                       | 7     |
| A-08 | Corpus completo revisado con el procedimiento de A-03; estado editorial por evento                                                                        | Pendiente                                                                                    | 8     |
| A-09 | Teclado, foco, Escape, 200 % de zoom, movimiento reducido, 320 px y un teléfono real sin bloqueos críticos                                                | Parcial: foco/Escape en pruebas; sin teléfono ni lector                                      | 10    |
| A-10 | Mediciones de rendimiento y sesión con participantes registradas, con limitaciones explícitas                                                             | Pendiente                                                                                    | 11    |
| A-11 | La posición visual no sugiere fechas ni simultaneidad; incertidumbre visible                                                                              | Cumplido por diseño; no verificado con lectores                                              | 9, 11 |
| A-12 | Los contenidos no aprobados siguen marcados `provisional`; README y límites describen lo construido                                                       | Cumplido                                                                                     | 8     |

## 4. Fuera de la v1 (para después)

- Nuevos períodos históricos (más allá del Cataclismo y el viaje jugable).
- Grafo de relaciones independiente (reevaluar React Flow solo entonces).
- Importación automática de fuentes a eventos sin revisión humana; resúmenes asistidos por IA sin aprobación.
- Traducciones españolas ausentes y rutas de encuentros incompletas (exclusiones conocidas de P1/P2), salvo como referencias externas.
- Despliegue o publicación: requiere instrucción explícita.

## 5. Dependencias externas a este repositorio

Los puntos 3, 8, 10 y 11 no pueden completarse solo con código: requieren acceso a textos primarios del juego y criterio editorial del usuario (3, 8), y personas, un teléfono real, lector de pantalla y varios navegadores (10, 11). Hasta entonces figuran como pendientes, no como aprobados.
