# Requisitos y alcance

## Propósito

Explorar historia con una vista general que revele detalle al acercarse. El sitio debe permitir responder qué ocurrió, cuándo o en qué orden, quién participó, con qué se relaciona y qué fuentes lo respaldan.

## Requisitos funcionales iniciales

| ID | Requisito | Criterio de aceptación |
| --- | --- | --- |
| RF-01 | Navegación temporal | Desplazar, ampliar, reducir y restablecer la vista mediante controles visibles; zoom interno independiente del navegador. |
| RF-02 | Detalle progresivo | Tres niveles: épocas, eventos principales y secundarios; al cambiar de nivel se conserva el contexto. |
| RF-03 | Agrupación | Los eventos densos se agrupan; seleccionar un grupo permite explorar sus elementos. |
| RF-04 | Ficha de evento | Título, resumen, explicación, tiempo o incertidumbre, participantes y fuentes. |
| RF-05 | Relaciones | Al seleccionar un evento se resaltan conexiones con tipo y dirección cuando corresponda. |
| RF-06 | Búsqueda | Encuentra títulos, alias y texto autorizado por spoilers; seleccionar resultado abre y sitúa el evento. |
| RF-07 | Filtros | Época, región, personaje, facción y categoría; incluye limpiar filtros y estado sin resultados. |
| RF-08 | Spoilers | Un selector de progreso oculta eventos, títulos, imágenes, relaciones y resultados no habilitados. |
| RF-09 | Enlaces | Cada evento tiene URL estable; recarga y atrás/adelante conservan estados documentados. |
| RF-10 | Móvil | Navegación táctil y fichas legibles sin depender del hover. |
| RF-11 | Lista accesible | El mismo contenido y restricciones pueden explorarse sin usar el lienzo. |
| RF-12 | Integridad editorial | Los eventos incluyen fuentes o etiqueta explícita de demostración; incertidumbre visible. |

## Requisitos opcionales o posteriores

- Preferencias y progreso en localStorage; funcionamiento correcto si el almacenamiento no está disponible.
- Recorridos guiados por nación, personaje o arco.
- Grafo libre independiente.
- Comparación de interpretaciones o versiones editoriales.
- Más idiomas y universos, sin acoplar el modelo a nombres propios de Genshin.
- Panel de edición y colaboración si posteriormente se necesitan.

## Requisitos no funcionales

| Área | Condición |
| --- | --- |
| Rendimiento | Cargar resúmenes e índice antes que diálogos extensos; limitar elementos dibujados a la vista y un margen. |
| Accesibilidad | Teclado, foco visible, etiquetas, contraste, información no dependiente solo del color y movimiento reducido. |
| Fiabilidad | Fallos de API no rompen la última publicación válida. |
| Mantenibilidad | Tipos y esquemas, IDs estables, módulos independientes y contenido separado del diseño. |
| SEO y navegación | Páginas estáticas de eventos con títulos y enlaces estables; tratamiento de spoilers documentado. |
| Privacidad | Sin cuentas ni analítica de terceros por defecto; preferencias opcionales solo locales. |
| Compatibilidad | Verificar navegadores objetivo y tamaños reales al implementar. |
| Seguridad | Secretos fuera del cliente y contenido remoto tratado como no confiable. |

Las metas cuantitativas de rendimiento se fijarán al medir el prototipo con un dispositivo y conjunto de datos representativos. No prometer fluidez basándose únicamente en el número total de eventos.

## MVP y límites

El MVP completo contiene 30–50 eventos revisados en varias épocas, tres niveles de detalle y RF-01 a RF-12. Durante construcción se usan fixtures sintéticos menores.

No incluye registro, comentarios, contribuciones abiertas, edición web, sincronización entre dispositivos ni actualizaciones en tiempo real.

## Casos difíciles obligatorios

1. Evento con fecha desconocida.
2. Evento con rango aproximado.
3. Eventos simultáneos.
4. Relación entre épocas lejanas.
5. Evento oculto por spoilers.
6. Misión que describe varios acontecimientos.
7. Evento respaldado por más de una misión.
8. Filtros sin resultados.
9. Enlace directo inexistente o bloqueado.
10. Fuentes contradictorias.

## Condiciones para introducir una base de datos

Reevaluar si se incorporan cuentas, progreso sincronizado, comentarios, aportes de usuarios o edición colaborativa en línea. Cientos o miles de eventos por sí solos no obligan a usar una base de datos.
