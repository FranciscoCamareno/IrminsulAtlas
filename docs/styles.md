# Guía visual — «Cuaderno de viaje de Teyvat»

> Estado: primer corte implementado el 05/10/2026 (formas, colores y efectos). Sustituye a la guía anterior («Nexus», carbón y crema sobrios), que el usuario dejó de seguir.
> Referencias aportadas por el usuario: el portafolio de Howard Le (papel cuadriculado, cinta adhesiva, sellos, botones tipo píldora con sombra sólida, títulos en serif cursiva), una plantilla de presentación de Genshin Impact (cielo pastel, tarjetas redondeadas con borde decorado) y una interfaz con estética de pegatinas pastel y vidrio.

## 1. Alcance

Solo cambia la **presentación**: estructura, navegación, datos, textos e interacciones siguen iguales. La piel vive en `src/styles/skin.css`, importada después de `timeline.css`; los tokens base están en `src/styles/tokens.css` y los de cada tema en la cabecera de `timeline.css`. Todavía no hay imágenes: la identidad sale de color, forma, textura (CSS) y tipografía del sistema.

## 2. Temas

| Tema | Clase | Uso |
| --- | --- | --- |
| Día (por defecto) | `.atlas-shell.atlas-light` | Papel crema `#fff6e6`, panel `#fffdf7`, tinta cacao `#3f2f22`, secundario `#6b4f38`, acento de texto verde azulado `#0b6e7a`. |
| Noche | `.atlas-shell` | Cielo índigo `#1d1838`, panel `#271f4a`, texto `#fbf1ff`, secundario `#cdbfe8`, acento melocotón `#ffc27a`. |

El botón del menú alterna entre ambos. No se transiciona el color de fondo, para que el cambio de tema no deje un instante de contraste insuficiente.

## 3. Paleta de pegatinas

`--sun #ffb25b` (borde `#e08a2e`), `--sky #7cc4ff`, `--mint #7fdcb9`, `--rose #ff8fa8`, `--lilac #b7a2ff`, `--butter #ffd96b`. Sobre cualquiera de ellos el texto es tinta oscura (`#3f2f22` o `#2a1b4d`): contraste entre 5,9:1 y 11:1. Se usan como relleno, nunca como color de texto sobre fondo claro.

Significado estable:

- Nodo principal: sol; nodo menor: cielo; nodo seleccionado y conexiones activas: rosa; grupos de densidad: lila.
- Etiquetas de capítulo, cintas y chips rotan la paleta por posición. Es decoración: cada uno lleva su texto (número, nombre o etiqueta), así que el color nunca es la única señal.

## 4. Formas y efectos

- **Botones tipo píldora** con borde de 2 px y sombra sólida desplazada (`0 3px 0`); al pasar el ratón suben 2 px y al pulsar bajan.
- **Tarjetas** (capítulos, lista, diálogos) con radio de 1,3–1,75 rem, borde kraft y sombra sólida más una difusa. Los capítulos se inclinan ±0,7° y llevan una tira de cinta adhesiva punteada.
- **Nodos**: círculo con borde blanco grueso y destello de cuatro puntas recortado con `clip-path`; el seleccionado flota suavemente. La escala del *hover* usa la propiedad `scale`, que se suma al `transform` del lienzo sin romper el posicionamiento.
- **Conexiones** con trazo redondeado; las inferidas son de puntos; las activas, rosas con brillo.
- **Costuras**: bordes discontinuos de 2–3 px en barra superior, ficha lateral, menú y búsqueda.
- **Lienzo**: papel cuadriculado de 28 px con tres luces pastel (cielo, rosa, mantequilla). El patrón queda fijo mientras el contenido se desplaza.
- **Vidrio**: barra superior, controles de zoom y pies del lienzo con `backdrop-filter: blur`.

Todas las animaciones y transiciones se anulan con `prefers-reduced-motion: reduce`.

## 5. Tipografía

Solo fuentes del sistema, para no añadir peso a la primera carga (límite de 180 kB en `tests/e2e/performance.e2e.ts`):

- Títulos: serif cursiva en negrita (`--font-display`: Iowan Old Style, Palatino, Georgia…).
- Texto y controles: sans redondeada (`--font-body`: ui-rounded, SF Pro Rounded, Nunito, Segoe UI…).

Si más adelante se incorporan fuentes web, hay que medir su impacto en ese límite.

## 6. Accesibilidad

Contrastes de texto comprobados (AA): tinta cacao sobre crema 11,9:1; secundario 7:1; acento verde azulado 5,6:1; en Noche, texto 13,9:1, secundario 8,8:1 y acento 9,6:1. El foco es un anillo de 3 px (azul en Día, mantequilla en Noche). Los objetivos táctiles siguen siendo de al menos 2,75 rem. Lo verifican axe (`tests/e2e/accessibility.e2e.ts`, ambos temas) y las pruebas de reflujo a 320 y 390 px.

## 7. Pendiente

- Imágenes y arte de personajes (las referencias usan ilustración; el atlas aún no tiene imágenes con licencia).
- Revisión visual con personas y en Firefox o Safari.
- Iconos propios (los actuales son de trazo fino y podrían redondearse).
