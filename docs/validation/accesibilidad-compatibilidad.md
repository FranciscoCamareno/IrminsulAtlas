# Accesibilidad y compatibilidad — resultados al 05/10/2026

Entorno: Chromium 141 (Linux, sin interfaz), Playwright 1.63, axe-core 4.13 con las reglas WCAG 2.0/2.1/2.2 A y AA. Pruebas: `tests/e2e/accessibility.e2e.ts`, `tests/e2e/timeline.e2e.ts`, `tests/e2e/spoilers.e2e.ts` (`npm run test:e2e`). Una prueba no ejecutada figura como **pendiente**, nunca como aprobada.

## Matriz

| Verificación                                                                                                     | Resultado                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| axe automático: cronología, búsqueda abierta, lista, ficha con afirmaciones, ficha de personaje (oscuro y claro) | 0 infracciones en 14 análisis (hasta 28 reglas superadas por página).                                                                                                            |
| axe: diálogo de progreso (primera visita), menú, documento del dossier abierto y bloqueado                       | 0 infracciones.                                                                                                                                                                  |
| Teclado: Tab llega a los controles principales con foco visible                                                  | Cumple en 14 pasos consecutivos de la lista.                                                                                                                                     |
| Teclado: abrir una ficha con Enter, Escape la cierra y el foco vuelve al elemento de la lista                    | Cumple. El menú también devuelve el foco a su botón.                                                                                                                             |
| Teclado: mover y ampliar la cronología (flechas, +, Inicio)                                                      | Cumple.                                                                                                                                                                          |
| Movimiento reducido (`prefers-reduced-motion`)                                                                   | Cumple: ningún elemento del atlas conserva transiciones o animaciones.                                                                                                           |
| Reflujo a 320 px y 390 px                                                                                        | Sin desplazamiento horizontal en cronología, lista, ficha y documento; controles visibles y ≥ 24 × 24 px.                                                                        |
| Zoom del navegador al 200 % (683 × 384) y 400 % (342 × 192)                                                      | Sin desplazamiento horizontal; controles principales dentro de la ventana.                                                                                                       |
| Táctil (emulado): toque en nodo, arrastre con un dedo, pellizco                                                  | Cumple en Chromium emulado.                                                                                                                                                      |
| Enlaces bloqueados y progreso reducido sin filtrar contenido                                                     | Cumple (`spoilers.e2e.ts`).                                                                                                                                                      |
| **Lector de pantalla (NVDA/VoiceOver)**                                                                          | **Pendiente.** axe no puede juzgar si el orden de lectura, los nombres de los nodos («Abrir …») y los avisos de estado resultan comprensibles.                                   |
| **Teléfono real** (gestos, teclado virtual, rendimiento)                                                         | **Pendiente.** La emulación no certifica gestos ni fluidez del dispositivo.                                                                                                      |
| **Firefox y Safari/WebKit**                                                                                      | **Pendiente.** Este entorno solo dispone de Chromium. `:focus-visible` y `overflow: clip` (usados en el arreglo L-05) son estándar y están soportados, pero no se han ejecutado. |
| Contraste de texto sobre el lienzo y estados de selección                                                        | Parcial: axe evalúa el contraste de los elementos HTML; no valora los trazos SVG ni las capas superpuestas. Revisión visual pendiente.                                           |
| Navegador del usuario y segunda familia de navegador (plan 10, §6)                                               | **Pendiente.** Hay que acordar cuáles son.                                                                                                                                       |

## Hallazgos corregidos durante esta ronda

- El foco por ratón recentraba el lienzo y hacía perder el clic en nodos cercanos a los bordes (también afecta al toque). Corregido (L-05 en [la revisión de lectura](revision-lectura-2026-10-05.md)); la navegación con Tab sigue recentrando el nodo enfocado.
- Cabecera de ficha enfocada con aro engañoso: resuelto.

## Sin bloqueos críticos detectados

No se detectó ningún bloqueo para encontrar, abrir o leer contenido con las pruebas ejecutables aquí. La ausencia de bloqueos **no** queda certificada hasta cerrar las filas pendientes, que requieren personas, dispositivos y otros navegadores.

## Repetir

```sh
npm run build
npm run test:e2e   # E2E_CHROMIUM_PATH=/ruta/a/chrome si Playwright no tiene su navegador
```

Informes JSON con todos los hallazgos de axe: `.validation/e2e/accessibility.json`.

## Repetición N-07 (2026-10-05, rama `claude/sleepy-ritchie-7esvu5`)

| Prueba                                                                                                                                                                            | Resultado                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suite e2e completa tras N-04…N-10 (27 pruebas: axe en tema oscuro/claro y diálogos, teclado y foco, movimiento reducido, reflujo a 320/390 px, spoilers, rendimiento, agrupación) | Cumple, Chromium 141                                                                                                                                                                                                                              |
| Segunda familia de navegador (Firefox/WebKit)                                                                                                                                     | **Pendiente.** Solo hay Chromium en `/opt/pw-browsers`; la guía del entorno prohíbe `playwright install`. Tarea manual: ejecutar `npm run test:e2e` con un lanzador de Firefox y WebKit (el arnés de `tests/e2e/harness.ts` solo lanza Chromium). |
| Revisión visual de trazos SVG y capas (capturas a 1366×768 y móvil)                                                                                                               | Capas, conectores discontinuos, columnas de capítulo y etiquetas se pintan sin solapes ni recortes visibles. Observaciones abajo.                                                                                                                 |
| Teléfono físico (gestos, orientación, barras del navegador), lector de pantalla, red móvil, sesiones con personas (L-09)                                                          | **Pendiente, tarea humana.** El toque emulado de Chromium no sustituye un dispositivo real.                                                                                                                                                       |

Observaciones de la revisión visual (no corregidas; sin impacto crítico):

1. En escritorio, el encuadre inicial de la cronología completa se muestra al 15 %: las etiquetas de los nodos son ilegibles hasta acercar. Es coherente con el diseño de «ver el conjunto», pero la primera impresión depende del selector de capítulo; conviene validarlo con personas.
2. En 390 px, el título «IRMINSUL ATLAS» queda pegado al botón de progreso (sin margen visible). Es estético; los objetivos táctiles son ≥ 24 px.
