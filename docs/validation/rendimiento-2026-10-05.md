# Rendimiento de la compilación de producción — 05/10/2026

Prueba: `tests/e2e/performance.e2e.ts` (`npm run build && npm run test:e2e`). Los números de este informe son los de una ejecución concreta; los JSON completos quedan en `.validation/e2e/performance.json` (ignorado por Git).

## Condiciones

| Elemento  | Valor                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Equipo    | Contenedor Linux, Intel Xeon 2,1 GHz, 4 CPU lógicas                                                                                                                                |
| Navegador | Chromium 141 sin interfaz; escritorio 1366 × 768; «teléfono» = 390 × 844 con la CPU **limitada ×4** (emulación)                                                                    |
| Red       | Servidor estático local con gzip, **sin limitación de red** (la latencia real de una red móvil no está incluida)                                                                   |
| Datos     | Corpus real (29 eventos) y un conjunto **sintético denso** de 290 eventos y 350 relaciones (títulos «Evento sintético»)                                                            |
| Medición  | Bytes transferidos por CDP (`encodedDataLength`); LCP/FCP/CLS y tareas largas con `PerformanceObserver`; fotogramas con `requestAnimationFrame` durante 80 pasos de zoom por rueda |

Una sola máquina y una sola ejecución: son órdenes de magnitud, no una distribución. No se mide un teléfono real.

## Resultados

| Métrica                                 | Corpus real, escritorio | Corpus real, «teléfono» (CPU ×4) | Sintético denso (10×), escritorio |
| --------------------------------------- | ----------------------- | -------------------------------- | --------------------------------- |
| Bytes transferidos al abrir             | 118 KB                  | 118 KB                           | —                                 |
| Primer contenido en pantalla            | 125 ms                  | 459 ms                           | 138 ms                            |
| Mayor elemento visible (LCP)            | 148 ms                  | 412 ms                           | 156 ms                            |
| Desplazamiento visual (CLS)             | 0,001                   | 0                                | 0,003                             |
| Tareas largas (> 50 ms)                 | 0                       | 2 (62 y 66 ms)                   | 0                                 |
| Abrir una ficha desde la lista          | 62 ms                   | 175 ms                           | 81 ms                             |
| Búsqueda hasta ver la lista actualizada | 24 ms                   | 69 ms                            | 28 ms                             |
| Fotogramas en zoom continuo (p50 / p95) | 16,7 / 16,7 ms (60 fps) | 16,7 / 16,8 ms                   | 16,7 / 16,8 ms                    |

## Carga inicial: antes y después de separar índice y detalles

Medido con la misma sonda sobre el commit anterior (`7ae8060`, todo el corpus dentro de la isla React) y sobre esta versión:

| Versión           | Bytes transferidos al abrir | Qué contiene                                                               |
| ----------------- | --------------------------- | -------------------------------------------------------------------------- |
| Antes (`7ae8060`) | 152 242 B                   | HTML de 386 KB (47 KB gzip) con todas las fichas serializadas + JS         |
| Ahora             | 117 908 B (**−22 %**)       | HTML de 10 KB (3,6 KB gzip), `index.json` de 44 KB (6,3 KB gzip), JS y CSS |

El índice contiene lo que necesitan la cronología, la búsqueda y los filtros; los textos extensos, las evidencias y el índice de texto completo (60 KB, 18 KB gzip) **no** se piden hasta que se abre una ficha o se busca (comprobado en la prueba). El mayor ahorro está en el HTML; el JS apenas varía (el ahorro se perdería si se llevara Zod al navegador, por lo que el cliente solo comprueba versión y forma y la validación completa ocurre al compilar). El primer contenido se mantiene en el mismo orden (~120 ms en ambas versiones, dentro del ruido de la medición): el beneficio es de volumen transferido y de que el HTML ya no contiene contenido de fichas.

## Límites encontrados y corregidos

- **Zoom con muchos eventos.** Con el conjunto sintético de 290 eventos, el zoom continuo caía a 2–3 fotogramas por segundo (p95 383 ms, máximo 550 ms), pero **solo cuando había pocos nodos en pantalla y decenas de conexiones largas**: el coste no estaba en los nodos sino en trazar y rasterizar caminos discontinuos de decenas de miles de píxeles. Corrección: por encima de 120 nodos solo se dibujan los nodos cercanos a la ventana y las conexiones con ambos extremos cerca o ligadas a la selección. Con el corpus real (29 eventos) no se aplica, de modo que todos los nodos siguen en el DOM y son alcanzables con Tab. Resultado tras el cambio: p95 = 16,8 ms.
- Con ~290 eventos el lienzo empieza en la vista de capítulos (el ajuste lo reduce por debajo del 10 %); no hay nodos pintados hasta acercar. Es coherente con el diseño pero conviene revisarlo si el corpus crece.
- El índice de texto completo crece con el corpus (60 KB hoy). Con 10× sería de ~600 KB sin comprimir; seguiría cargándose solo al buscar, pero sería el primer candidato a dividir por capítulo.

## Criterios propuestos (para tu aprobación)

Son umbrales iniciales, no normas: transferencia inicial ≤ 180 KB; CLS < 0,1; fotogramas p95 ≤ 33 ms en zoom continuo; abrir ficha y buscar < 300 ms con CPU ×4. La prueba solo hace fallar la compilación por transferencia inicial (> 180 KB) y CLS (> 0,1); el resto se registra.

## Pendiente

Medición en un teléfono físico y con red móvil real; ejecuciones repetidas (mediana de varias) en otra máquina; navegadores distintos de Chromium; y las sesiones con participantes ([protocolo](sesiones-usabilidad.md)).
