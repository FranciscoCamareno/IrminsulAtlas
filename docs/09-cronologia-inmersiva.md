# Cronología como página principal

Fecha: 25 de septiembre de 2026. Solicitud: reemplazar la composición de portada/listado por la estructura de las referencias aportadas: barra superior, lienzo de nodos conectados y sidebar plegable para futuras secciones. El contenido queda como demostración.

## Decisiones de diseño

La vista inicial ocupa el viewport. Se retiran el hero, el aviso grande y el selector permanente de progreso de la portada. Se mantiene un rótulo discreto de demostración y la advertencia completa en el menú. La referencia propia define la composición; la imagen de DARK orienta la exploración espacial, sin reproducir sus fotografías, marca ni contenido.

El lienzo usa carbón, tinta clara y un acento verde grisáceo. La variante clara conserva crema. Se introduce esta excepción a la guía original de superficies claras porque el usuario solicitó dar todo el foco al mapa. No se descargan fuentes, imágenes ni recursos remotos. Los nodos son símbolos geométricos; no implican retratos ni lore real.

El menú contiene Cronología y rótulos de Personajes, Ubicaciones y Otros datos marcados como próximos. Estos últimos son decorativos, no funcionalidades implementadas. Progreso y tema están dentro del menú. La lista accesible permanece disponible desde el icono superior y desde `/lista/` sin JavaScript.

## Implementación

- `getVisibleTimeline` en aplicación filtra eventos y relaciones antes de entregar épocas y conteos al layout.
- `src/visualization/layout.ts` usa `d3-scale` para orden editorial y filas alternas. No modifica fechas ni dominio. Grupos vacíos/ocultos no llegan al lienzo.
- `src/visualization/viewport.ts` usa `d3-zoom` y `d3-selection` para gestos y estado de cámara. D3 solo registra listeners y su transform privado en la superficie; React recibe valores y dibuja HTML/SVG.
- `TimelineCanvas` proyecta posiciones a pantalla. Textos y áreas de interacción no se escalan junto con las conexiones. Zoom entre 1 % y 240 %: mapa (puntos, todas las conexiones, nombres de capítulo pulsables) por debajo de 45 %, títulos hasta 130 % y detalle desde ahí. El lienzo ya no cambia a tarjetas; las tarjetas de capítulos viven en la vista de lista. Son umbrales iniciales, sin histéresis todavía.
- `TimelineExplorer` integra menú modal nativo, tema, lista, selección y ficha. La ficha reduce el ancho del lienzo; ResizeObserver conserva su centro al cambiar tamaño. En móvil se coloca debajo y la vista general usa grupos apilados.
- El corpus amplía los fixtures de cinco a catorce eventos en cuatro épocas y diecisiete relaciones. Todos continúan como `demo`; trece eventos son visibles sin progreso. Se conservan los casos temporales iniciales, las fuentes y los bloqueos.

Versiones nuevas verificadas contra npm y compilación: `d3-scale` 4.0.2, `d3-zoom` 3.0.0, `d3-selection` 3.0.0; tipos compatibles en desarrollo. jsdom 30.1.1 se utiliza para pruebas DOM. Se conserva npm y el lockfile. Referencias: [D3 zoom](https://d3js.org/d3-zoom), [escalas](https://d3js.org/d3-scale/point), [selección](https://d3js.org/d3-selection/selecting).

## Navegación y controles

Arrastrar el fondo desplaza la cronología. La rueda amplía alrededor del puntero; Ctrl/Cmd + rueda y teclas mantienen el comportamiento del navegador. D3 admite gesto táctil sobre el fondo. Los botones permiten ampliar, alejar, ver todo y volver a la selección. Con foco en el lienzo, flechas desplazan, +/− amplían/reducen e Inicio ajusta la vista.

Las agrupaciones por época permiten entrar sin depender de rueda. Las relaciones dirigidas muestran flecha y las interpretativas se dibujan discontinuas; la ficha conserva explicación y tipo. Se resaltan las relaciones del nodo seleccionado y se mantienen sus vecinos al cambiar nivel.

Seleccionar escribe `/?id=…` en el historial. La ruta anterior `/evento/?id=…` sigue entrando al explorador. Un ID bloqueado muestra aviso neutro y la URL no concede progreso. Escape cierra la ficha y restaura foco al nodo o entrada de lista. El viewport no se serializa; atrás/adelante recupera selección y centra el destino, sin prometer recuperar cada posición previa de cámara. Recargar reinicia preferencias de memoria.

## Validación

Las pruebas de dominio previas se conservan y ajustan al corpus ampliado. Las nuevas pruebas comprueban:

- Spoilers antes del layout: ausencia de nodos, aristas y conteos bloqueados.
- Orden editorial y datos históricos sin mutaciones; conjunto vacío.
- Fit y niveles semánticos; vista general compacta a 320 px.
- React + D3 en jsdom: rueda, arrastre, límites, ancla de zoom, botones, grupos, selección, enlaces, eventos de historial, foco, lista, tema y progreso reversible.

Resultado final de `npm run validate`: formato y lint correctos, cero errores/advertencias de tipos, 36 pruebas correctas en cuatro archivos y cuatro páginas compiladas. La comprobación HTTP devuelve 200 en inicio, detalle y lista; el inicio contiene el lienzo nuevo y ya no renderiza el hero anterior.

Limitación: el inventario de control de navegador no tiene navegadores conectados. jsdom simula dimensiones y el límite del diálogo, no pinta CSS ni verifica gestos físicos. Pendiente revisar visualmente a 320/768/1440 px, pinch real, contraste final, legibilidad de conexiones y foco modal nativo. No se afirma verificación visual de navegador.

## Siguiente paso

Revisar la composición con el usuario y en un navegador conectado. Ajustar densidad, agrupación y colisiones con contenido representativo antes de cerrar la fase 2 completa. Búsqueda, filtros del MVP, grafo independiente y API real permanecen fuera de este cambio. No se publicó ni desplegó.
