# Guía visual — Cronología interactiva de lore

> Archivo de destino: `docs/styles.md`.
> Estado: cronología inmersiva implementada como prototipo; revisión visual de navegador pendiente. Véanse `08-base-inicial.md` y `09-cronologia-inmersiva.md`.
> Ámbito inicial: Genshin Impact, con componentes adaptables a otros universos.

## 1. Propósito y relación con la documentación

Esta guía define el lenguaje visual del explorador: cronología, eventos, conexiones, filtros, búsqueda y lectura. Complementa `05-diseno-ux.md` y concreta sus decisiones visuales pendientes. Los requisitos funcionales, el modelo de datos y las reglas de spoilers se mantienen en los documentos correspondientes.

Enlazar este archivo desde README.md e incluir su lectura en AGENTS.md al incorporarlo al proyecto. Si existen contradicciones, respetar primero los requisitos de interacción y accesibilidad y registrar el ajuste visual necesario.

La referencia estética original es “Nexus — Next Generation Intelligence”, atribuida en el archivo recibido a Sourasith Phomhome (@madebysourasith), de Neuform. Se conserva su combinación de crema, carbón y tipografía sobria. Esta adaptación es una especificación nueva para el explorador. No depende de un HTML de referencia externo.

## 2. Dirección visual

### Ajuste solicitado el 25 de septiembre de 2026

La página principal pasa a ser exclusivamente barra superior y lienzo interactivo. El esquema propio del usuario define la estructura y la imagen de DARK orienta la exploración con conexiones. El tema inicial usa carbón con texto claro y acento verde grisáceo; existe alternativa crema. Menú, progreso y ficha se abren bajo demanda. El hero y los paneles permanentes de portada se retiran. Esta decisión prevalece sobre las indicaciones previas de usar superficies claras por defecto y abundante espacio de título en la portada.

Los tokens específicos `--atlas-*` se definen en `src/styles/timeline.css` para tema oscuro y claro. Las etiquetas mantienen tamaño fijo al ampliar, la ficha ocupa un lateral o una sección inferior en móvil y la vista general apila épocas en pantallas estrechas. No se agregaron fotografías, texturas ni animaciones ambientales.

Crear una experiencia de archivo histórico contemporáneo: fondo cálido, tinta oscura, fechas monoespaciadas y jerarquía clara. La cronología debe ser el elemento principal desde la primera pantalla.

- Usar superficies claras para navegación y lectura extensa.
- Reservar carbón para controles destacados, selección y bandas de énfasis.
- Mantener abundante espacio alrededor de títulos, con densidad controlada dentro del explorador.
- Dar identidad mediante composición, tipografía y geometría de conexiones.
- Incorporar imágenes de forma opcional; la experiencia debe funcionar completamente con texto.
- Evitar que fondos, texturas o decoración compitan con nodos y etiquetas.

## 3. Tokens de color

Los nombres describen su función. Una superficie oscura siempre utiliza su familia de texto claro.

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#F4F1EB` | Fondo general y lienzo |
| `surface` | `#FFFFFF` | Fichas, buscador y paneles claros |
| `surface-subtle` | `#E8E3DA` | Agrupaciones y secciones secundarias |
| `surface-inverse` | `#191C21` | Superficies oscuras y selección |
| `text-primary` | `#111827` | Texto principal sobre fondos claros |
| `text-secondary` | `#4B5563` | Metadatos sobre fondos claros |
| `text-inverse` | `#F4F1EB` | Texto principal sobre carbón |
| `text-inverse-secondary` | `#D5D0C8` | Metadatos sobre carbón |
| `action` | `#000000` | Botón principal sobre superficies claras |
| `on-action` | `#FFFFFF` | Texto del botón principal |
| `border-subtle` | `#D5CEC4` | Divisiones decorativas |
| `border-strong` | `#8F8880` | Límites funcionales sobre fondos claros |
| `focus` | `#245CC5` | Foco de teclado sobre fondos claros |
| `focus-inverse` | `#A8C7FF` | Foco de teclado sobre carbón |
| `connection` | `#736B62` | Conexiones visibles sobre crema |
| `connection-active` | `#111827` | Conexiones seleccionadas |
| `status-info` | `#245CC5` | Información acompañada de texto |
| `status-warning` | `#855800` | Incertidumbre o revisión |
| `status-error` | `#A12D35` | Error con explicación |
| `status-success` | `#246744` | Confirmación de una acción |

Los colores de estado se usan sobre blanco o crema. Sobre carbón utilizar texto claro y una etiqueta explícita; no trasladar automáticamente el mismo color de texto.

`border-subtle` es decorativo: no usarlo como única señal de un control, selección o conexión importante. Los elementos interactivos deben distinguirse también por su contorno fuerte, forma o etiqueta.

### Categorías y épocas

La identidad inicial es mayoritariamente monocroma. Distinguir épocas por bandas, rótulos y posición; categorías por icono y etiqueta. Si posteriormente se añaden colores por región o facción, documentar el mapa de colores, mantenerlo estable y añadir siempre identificación textual. No asignar colores aleatorios por renderizado.

## 4. Tipografía

| Función | Familia | Tamaño orientativo | Peso / interlineado |
| --- | --- | --- | --- |
| Título de página | Inter | `clamp(2rem, 4vw, 4rem)` | 500 / 1.08 |
| Nombre de época | Inter | 24–32 px | 500 / 1.2 |
| Título de ficha | Inter | 24–32 px | 600 / 1.2 |
| Título de evento | Inter | 14–16 px | 600 / 1.35 |
| Cuerpo | Inter | 16 px | 400 / 1.6 |
| Controles | Inter | 14–16 px | 500 / 1.4 |
| Fecha y metadatos | JetBrains Mono | 12–14 px | 500 / 1.4 |

- Usar `rem` en la implementación para respetar preferencias de tamaño.
- Reservar mayúsculas y espaciado de letras para etiquetas cortas.
- Mantener el texto de lectura aproximadamente entre 55 y 75 caracteres por línea.
- No reducir etiquetas indefinidamente al alejarse: agrupar u ocultar según importancia.
- Mantener etiquetas y controles legibles independientemente de la transformación de zoom.
- Fallbacks: Inter → system-ui → sans-serif; JetBrains Mono → ui-monospace → monospace.
- Cargar las fuentes con una estrategia que permita mostrar texto de inmediato; limitar pesos a los usados.

## 5. Espaciado y formas

Escala de espacios: 4, 8, 12, 16, 24, 32, 48 y 64 px.

| Elemento | Regla |
| --- | --- |
| Tarjeta o panel | Radio de 16 px; padding de 24 px en escritorio y 16 px en móvil |
| Botón o campo | Radio de 8 px |
| Etiqueta | Radio de píldora; texto corto |
| Controles táctiles | Área interactiva mínima de proyecto: 44 × 44 px |
| Separación de controles | 8 px como punto de partida |
| Contorno | 1 px habitual; 2 px para selección |
| Sombra de panel | Suave y estática, por ejemplo `0 8px 28px rgb(17 24 39 / 10%)` |

El espaciado de sección de 80 px de la referencia no se aplica a cada bloque del explorador. Usar una composición más compacta para conservar espacio útil.

## 6. Composición de pantalla

### Escritorio: desde 1024 px como punto de partida

- Cabecera compacta con nombre del proyecto, búsqueda y acceso al progreso de spoilers.
- En el prototipo actual: marca centrada, menú y cambio a lista. Búsqueda y filtros siguen pendientes; progreso dentro del menú.
- Barra de filtros plegable; sus opciones no deben ocupar permanentemente toda la altura.
- Cronología como área principal, con límites visibles y controles de navegación agrupados.
- Ficha lateral de aproximadamente 360–440 px al seleccionar un evento, ajustada al espacio real disponible.
- Mantener el evento seleccionado visible al abrir la ficha; recalcular el área útil sin reiniciar el zoom.

### Tableta: entre 768 y 1023 px

- Filtros en panel desplegable.
- Ficha superpuesta o inferior cuando una columna lateral estreche demasiado la cronología.
- Mantener accesibles búsqueda, volver y controles de zoom.

### Móvil: menos de 768 px

- Cabecera y controles compactos con etiquetas comprensibles.
- Ficha como panel inferior con altura limitada, ampliable a vista de lectura.
- Botón de cierre visible y contenido desplazable sin bloquear el resto de controles.
- Ofrecer acceso directo a la vista en lista.
- Respetar áreas seguras del dispositivo y cambios de altura del navegador.

Los puntos de corte son iniciales: ajustarlos según el contenido. Las fichas y listas deben funcionar a 320 px de ancho sin desplazamiento horizontal de texto; el lienzo conserva su desplazamiento interno intencionado.

## 7. Cronología y zoom semántico

La posición horizontal representa orden narrativo por épocas en la primera versión. Mostrar una leyenda breve: “Orden narrativo; las distancias no representan duración”. Las fechas exactas, aproximadas y desconocidas mantienen sus etiquetas propias.

| Nivel | Información visible | Presentación |
| --- | --- | --- |
| General | Épocas y grupos | Rótulos grandes, bandas suaves y conteos permitidos por spoilers |
| Intermedio | Eventos principales | Marcadores, títulos breves y fechas |
| Detallado | Eventos secundarios y relaciones relevantes | Más etiquetas y acceso a fichas completas |

- Fijar umbrales mediante pruebas con datos reales; evitar saltos de nivel repetidos cerca de un umbral.
- Conservar el punto de interés al ampliar o reducir.
- Calcular posiciones para evitar solapamiento de etiquetas y tarjetas.
- Mantener visible una selección aunque su representación pase a formar parte de un grupo.
- No mostrar todo el texto del evento dentro del lienzo: usar la ficha.
- Proporcionar ampliar, reducir, restablecer y volver al evento seleccionado.
- Mantener operativos el zoom del navegador y la navegación de página.

## 8. Eventos y estados

Marcador normal: círculo pequeño con contorno oscuro. Los eventos principales tienen mayor tamaño visual o etiqueta persistente; no usar tamaño como indicador de certeza histórica.

| Estado | Representación |
| --- | --- |
| Normal | Marcador con contorno fuerte, título legible y fecha cuando corresponda |
| Hover | Cambio de fondo o borde sin mover el nodo |
| Foco | Anillo visible separado del marcador o control |
| Seleccionado | Doble contorno o anillo; etiqueta destacada y estado accesible |
| Relacionado | Contorno reforzado y conexión destacada |
| Agrupado | Marcador con conteo y nombre de agrupación; acción para acercar |
| Fecha incierta | Etiqueta explícita “Aprox.” o “Fecha desconocida” |
| Interpretación o teoría | Insignia textual; no confundirla con el estado de selección |
| Demostración | Etiqueta “Datos de demostración” claramente visible |

El marcador puede ser pequeño visualmente, pero su área interactiva debe alcanzar el mínimo táctil sin superponerse con la de otros nodos. Si no hay espacio, agrupar.

Un evento bloqueado por spoilers se omite del lienzo, conexiones, conteos y resultados. No colocar siluetas o candados en posiciones que delaten su existencia.

## 9. Conexiones

- Mostrar prioritariamente las relaciones del evento seleccionado.
- Línea normal de 1.5 px y activa de 2–2.5 px como valores iniciales, manteniendo grosor visual al hacer zoom.
- Usar curvas suaves cuando ayuden a separar líneas; evitar cruces sobre texto.
- Flechas únicamente para relaciones dirigidas; su significado depende del tipo de relación.
- Una relación inferida puede representarse discontinua, siempre con etiqueta textual y leyenda.
- Mostrar etiquetas completas al seleccionar la relación o en una lista dentro de la ficha.
- Para destinos fuera de vista, ofrecer “Ir al evento” con posibilidad de regresar.
- Evitar animaciones continuas de partículas o circulación por líneas.

La relación solo se dibuja si sus dos extremos y sus requisitos propios están permitidos por el progreso del visitante.

## 10. Componentes

### Ficha de evento

Orden: época y fecha → título → etiquetas editoriales → resumen → contenido → participantes → relaciones → fuentes.

Usar superficie blanca con texto oscuro para lectura. Las fuentes deben poder localizarse y abrirse; no ocultarlas como decoración de bajo contraste. Mostrar explícitamente la incertidumbre y el carácter interpretativo cuando proceda.

### Buscador

Campo con etiqueta accesible, botón para limpiar y resultados navegables por teclado. Cada resultado muestra título, época y una breve referencia contextual autorizada. No mostrar fragmentos o sugerencias de contenido bloqueado.

### Filtros

Agrupar por época, región, personaje, facción y categoría. Mostrar filtros activos y “Limpiar filtros”. Evitar una fila interminable de píldoras; permitir panel plegable. Diferenciar claramente filtro seleccionado, hover y foco.

### Botones

Principal: negro con texto blanco sobre superficies claras. Secundario: fondo claro, texto oscuro y contorno fuerte. En superficies oscuras: botón claro con texto oscuro o contorno claro, según jerarquía. Cada botón con icono necesita nombre accesible; añadir tooltip cuando ayude, sin depender de él en móvil.

### Spoilers

Selector de progreso con explicación breve y acciones explícitas. Un enlace directo bloqueado muestra un aviso neutro, sin título, imagen ni resumen del evento. Nunca ampliar el progreso automáticamente por recibir una URL.

### Estados vacíos y errores

Sin resultados: explicación y acción para limpiar filtros. Error de detalle: reintentar y volver. Evento inexistente: navegación de regreso. Usar mensajes cortos y evitar detalles técnicos de API en la interfaz pública.

## 11. Movimiento y efectos

- Hover y cambios de estado: aproximadamente 120–180 ms.
- Apertura de paneles: aproximadamente 180–240 ms.
- Navegación programática hacia un evento: transición corta y cancelable por interacción.
- Gestos directos de zoom y arrastre: respuesta inmediata, sin retraso decorativo.
- Respetar `prefers-reduced-motion`: desactivar desplazamientos animados y usar cambios inmediatos o fundidos discretos.
- Evitar entradas escalonadas que retrasen la lectura, movimiento ambiental permanente y desplazamiento vertical del nodo en hover.
- La primera versión usa HTML/SVG y CSS. Canvas, WebGL o Three.js requieren una necesidad visual o de rendimiento demostrada antes de incorporarse.

## 12. Accesibilidad y contraste

Objetivos de diseño: contraste de texto normal de al menos 4.5:1, texto grande de 3:1 y señales funcionales de interfaz de 3:1 respecto a fondos adyacentes. Verificar las combinaciones finales, especialmente si se añade opacidad, imagen o degradado.

- Foco visible: contorno de 2 px y separación de 3 px como punto inicial.
- No depender solo de color, forma o posición para comunicar información.
- Navegación completa mediante teclado y vista alternativa en lista.
- Al cerrar una ficha, restaurar el foco al disparador cuando siga disponible.
- Si una ficha funciona como diálogo modal, gestionar foco y cierre como tal; si es un panel lateral no modal, permitir continuar navegando.
- No anunciar cada cambio de coordenadas al lector de pantalla.
- Mantener texto seleccionable y controles accesibles al ampliar la página.

Los filtros de spoilers protegen la experiencia de lectura; no hacen confidenciales los archivos de un sitio estático. Usar metadatos neutros para páginas sensibles conforme a la política del proyecto.

## 13. Aplicación técnica

Convertir los tokens en variables CSS compartidas por componentes React y páginas Astro. Separar estilos base, controles, explorador y ficha; evitar valores visuales repetidos sin nombre.

Los datos del evento contienen importancia, tiempo y referencias. El layout calcula coordenadas, agrupación y conexiones según viewport y filtros. Los ajustes visuales no deben modificar el contenido histórico.

Usar D3 para escalas y gestos con una responsabilidad DOM explícita. No aplicar escalado indiscriminado a todo el contenedor si reduce texto, controles o áreas táctiles. Limitar elementos visibles y separar el contenido extenso de los metadatos del lienzo.

## 14. Criterios de revisión visual

- [ ] El primer viewport permite comenzar a explorar la cronología.
- [ ] Crema, carbón, tipografías y radios se aplican de forma consistente.
- [ ] Todas las superficies oscuras utilizan texto claro.
- [ ] Etiquetas legibles en los tres niveles de zoom.
- [ ] Agrupación sin solapamientos que bloqueen interacción.
- [ ] Selección, foco, hover e incertidumbre se distinguen claramente.
- [ ] Conexiones visibles sin tapar títulos ni introducir causalidad falsa.
- [ ] Lectura cómoda en móvil y al ampliar texto.
- [ ] Flujo completo por teclado y mediante lista.
- [ ] Spoilers ausentes también de conteos, relaciones y resultados.
- [ ] Movimiento reducido respetado y ninguna animación decorativa permanente.
- [ ] Contraste revisado en estados normales, activos y de foco.

Estos criterios deberán comprobarse en la interfaz implementada; la documentación por sí sola no certifica su cumplimiento.
