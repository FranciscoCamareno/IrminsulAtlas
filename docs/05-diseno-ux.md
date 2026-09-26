# Diseño e interacción

## Experiencia central

Vista general de épocas → zoom a acontecimientos principales → detalle secundario → ficha → conexiones del evento.

La identidad visual es propia. Las referencias inspiran exploración temporal y relaciones; no son una plantilla a copiar ni especificaciones técnicas verificadas.

## Escala temporal

| Modelo | Ventaja | Riesgo |
| --- | --- | --- |
| Proporcional | Distancias representan duración | Huecos enormes y acumulación de eventos recientes |
| Narrativo | Lectura clara y tiempos desconocidos manejables | Distancias no indican duración |
| Comprimido por períodos | Equilibra contexto y legibilidad | Cambios de escala deben señalizarse |

Propuesta de MVP: épocas y orden narrativo con etiquetas temporales. Mostrar una leyenda indicando que la separación no es proporcional. No transformar una fecha desconocida en una fecha precisa solo para dibujarla.

## Niveles de detalle

- Lejano: épocas y grupos resumidos.
- Medio: eventos principales.
- Cercano: eventos secundarios y más etiquetas.
- La selección abre detalle completo sin requerir acercamiento extremo.

Los umbrales se ajustan con pruebas. Añadir estabilidad alrededor de los umbrales para evitar parpadeos al cambiar de nivel. Mantener como ancla el punto de interés durante zoom.

## Organización de pantalla

Escritorio actual: barra mínima, cronología de pantalla completa y ficha lateral al seleccionar. Menú y progreso bajo demanda. Búsqueda y filtros quedan pendientes. Este ajuste del 25 de septiembre sigue la referencia estructural del usuario; véase [09-cronologia-inmersiva.md](09-cronologia-inmersiva.md).
Móvil: controles compactos, ficha inferior o pantalla de detalle, gesto táctil y alternativa en lista.
Los controles esenciales nunca dependen únicamente de hover.

## Relaciones

Mostrar por defecto las del evento seleccionado para reducir ruido. Etiquetar tipo y dirección: anterioridad, participación, mención, consecuencia u otra categoría definida. No usar flechas causales para una simple asociación.

Cuando el destino quede fuera de vista, ofrecer “Ir al evento” y forma de volver. Cerrar una ficha conserva posición y filtros. No mostrar líneas o conteos que revelen eventos bloqueados.

## Interacción accesible

- Controles de ampliar, reducir y restablecer además de gestos.
- Navegación por teclado y restauración del foco al cerrar paneles.
- Vista en lista con idénticos filtros y selección.
- Respeto a movimiento reducido.
- Contraste adecuado y estados distinguibles sin depender solo del color.
- Mantener el zoom del navegador y evitar secuestrar el desplazamiento de página.
- No anunciar continuamente cada cambio de coordenadas a lectores de pantalla.

## Estados de interfaz

Inicio, carga, lista vacía, filtros sin resultados, evento seleccionado, evento bloqueado, ID inexistente, error de carga de detalle y contenido demo. Los errores deben permitir reintentar o volver sin perder el contexto.

## Sistema visual

La dirección visual se concreta en [styles.md](styles.md). El prototipo actual incorpora nodos, conexiones, zoom, agrupación por épocas, ficha y lista alternativa. La revisión visual en navegador sigue pendiente; véase [09-cronologia-inmersiva.md](09-cronologia-inmersiva.md).

## Enlaces y spoilers

Guardar selección y filtros compartibles. El progreso personal no debe ampliarse silenciosamente porque un enlace lo solicite. Un enlace bloqueado muestra aviso genérico y permite al usuario ajustar su progreso conscientemente.

Las páginas estáticas indexables pueden revelar nombres mediante metadatos. Adoptar por defecto metadatos neutros para contenido sensible y documentar las limitaciones de spoilers en recursos públicos.
