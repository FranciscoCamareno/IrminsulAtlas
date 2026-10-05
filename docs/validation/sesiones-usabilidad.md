# Sesiones de usabilidad — protocolo y hoja de resultados

Estado al 05/10/2026: **no se ha realizado ninguna sesión.** Este documento prepara el protocolo del [plan 10, §6](../10-plan-integracion-lore-y-pruebas.md) con el estado real del producto; los resultados siguen **pendientes** y no deben rellenarse con estimaciones. Las invitaciones y contactos los organiza el usuario.

## Antes de empezar

1. `npm run build && npm run preview` (o el sitio publicado, si el usuario lo decide). Anotar commit (`git rev-parse HEAD`), equipo, navegador y versión, tamaño de pantalla.
2. Cada participante empieza **sin progreso guardado** (ventana privada). Pedirle que elija su progreso real; así se observa el diálogo de la primera visita. Ajustar el contenido de la sesión a ese progreso para no exponer spoilers.
3. No explicar qué botón pulsar. Sin analítica externa. 20–30 minutos por sesión; ideal: 5 participantes, mezclando personas familiarizadas con Genshin y poco familiarizadas con la cronología.

## Tareas

| #   | Tarea                                                                          | Observar                                                                             | Criterio inicial                 |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------- |
| T1  | Encontrar un acontecimiento por tema o personaje                               | ¿Usa la lupa, la lista o el lienzo? ¿Entiende los filtros?                           | 4/5 sin ayuda en < 90 s          |
| T2  | Abrir una ficha y decir qué respalda una afirmación y qué es interpretación    | ¿Distingue «Dato explícito» de «Interpretación»? ¿Entiende «Citada, sin contrastar»? | 4/5 en < 60 s                    |
| T3  | Acercarse a un capítulo y volver a la vista general                            | ¿Descubre el zoom, «Ver toda la cronología» y «Ir a capítulo»?                       | 4/5 sin perderse                 |
| T4  | Seguir una relación hacia otro acontecimiento y volver                         | ¿Conserva la orientación y la selección? ¿Usa atrás o Escape?                        | 4/5 sin reiniciar la exploración |
| T5  | Cambiar el progreso y abrir un enlace bloqueado                                | ¿Entiende el aviso y recupera el control? Cero revelaciones.                         | 0 revelaciones accidentales      |
| T6  | Explicar qué significa «Fecha desconocida» y por qué los nodos están separados | ¿Interpreta la distancia como duración?                                              | 4/5 explican ambas ideas         |
| T7  | Repetir T1 y T2 en el teléfono (o con la lista)                                | ¿Hay controles imposibles de pulsar? ¿Se corta algún texto?                          | Flujo completo sin bloqueos      |

Tras cada tarea: «¿Qué tan fácil fue, del 1 al 7?» y «¿Qué esperabas que ocurriera?». Objetivo orientativo: mediana ≥ 5/7 sin bloquear una incidencia grave por una buena media. Con cinco personas no se presentan porcentajes como evidencia estadística: se guardan éxitos, errores y observaciones.

## Hoja de resultados (una fila por participante y tarea)

| Participante (anónimo) | Tarea | Resultado (sin ayuda / con ayuda / fallo) | Tiempo | Errores | Facilidad (1–7) | Observación | Severidad |
| ---------------------- | ----- | ----------------------------------------- | ------ | ------- | --------------- | ----------- | --------- |
| _pendiente_            |       |                                           |        |         |                 |             |           |

Severidad: crítica (spoiler accidental, evidencia atribuida al evento equivocado, contenido perdido o texto importado ejecutado: bloquea la entrega), alta (impide completar una tarea con móvil o teclado), media (confusión recuperable), baja (cosmético). Repetir las tareas que fallen tras corregirlas.

## Hipótesis de dificultad a observar (de la revisión técnica)

- T3/T4: el capítulo «Trayectorias regionales» exige arrastrar hasta cinco veces para llegar a todas sus filas (L-06).
- T1/T5: la primera visita vacía de contenido hasta elegir progreso (L-09).
- T2: el vocabulario de «Afirmaciones y respaldo» es nuevo para el lector.
- T6: la maraña de conexiones a bajo zoom puede leerse como causalidad (L-07).
