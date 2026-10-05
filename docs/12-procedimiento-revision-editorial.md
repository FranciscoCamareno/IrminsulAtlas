# Procedimiento de revisión editorial por afirmaciones

Fecha: 5 de octubre de 2026. Complementa el [plan 10](10-plan-integracion-lore-y-pruebas.md) y el [alcance de la v1](11-alcance-primera-version.md). Aplica a cualquier acontecimiento; la [primera muestra](validation/revision-editorial-muestra.md) lo ejercita con 10 acontecimientos.

## Unidades y archivos

| Unidad                 | Dónde vive                                       | Qué es                                                                                                           |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Texto del dossier      | `docs/0*.md`                                     | Prosa original; no se reescribe en la revisión.                                                                  |
| Anotaciones de eventos | `content/editorial/genshin-dossier.json`         | IDs, capítulo, tiempo, certeza, conexiones y decisiones de revisión por evento/relación.                         |
| Registro de evidencias | `content/editorial/genshin-evidence.json`        | **Fuentes** y **afirmaciones**, con su revisión individual.                                                      |
| Material primario      | `content/imported/animegame/` (ignorado por Git) | Importación aceptada (P2). Se enlaza por ID de fuente, segmento y hash; sus cuerpos no se copian al repositorio. |
| Revelación (spoilers)  | `content/editorial/genshin-revelation.json`      | Hito en que cada ficha se abre. Provisional.                                                                     |

Una **afirmación** es un enunciado concreto del texto (`claims[]`). Puede afectar a varios acontecimientos (`eventIds`) y una **fuente** puede respaldar varias afirmaciones, de modo que la relación es N:M. Las afirmaciones no sustituyen la ficha: se muestran en «Afirmaciones y respaldo».

## Pasos

1. **Elegir** el acontecimiento. Para la muestra se cubren: fecha incierta, proceso largo, discrepancia entre fuentes y conexiones regionales.
2. **Descomponer** el cuerpo en enunciados atómicos, con las palabras del dossier. Una afirmación no añade hechos: si el dossier no lo dice, no se registra.
3. **Clasificar** cada una (`kind`):
   - `explicit`: dato que una fuente afirma de forma directa.
   - `testimony`: lo cuenta un narrador o tradición dentro del mundo; hay que distinguir quién habla.
   - `interpretation`: lectura, cautela o reconstrucción (fechas aproximadas, «no es la misma revolución que…»). Nunca se presenta como dato.
   - `unknown`: cuestión que las fuentes dejan abierta o en la que discrepan. No necesita fuente y no se resuelve inventando una.
4. **Localizar** respaldo, preferentemente un texto primario. Cada apoyo (`support`) indica `stance` (`supports`, `contradicts`, `context`), `locator` y, sobre todo, `limits`: qué **no** dice la fuente.
5. **Fijar el fragmento** si la fuente está importada: ID de segmento y SHA-256 de su texto (`fragment`). Si una importación posterior cambia el texto, la verificación falla en vez de aprobar en silencio.
6. **Marcar la verificación** (`verification`):
   - `verified`: se leyó el fragmento y se comparó con la afirmación. Solo es válido con fragmento fijado (fuente importada) o con fuente externa que tenga `accessedAt`.
   - `cited`: es la fuente que cita el dossier, pero no se ha vuelto a leer. Es trazabilidad, **no** contraste.
7. **Estado de revisión** (`review.status`): `pending` hasta que una persona lo apruebe. `reviewed` exige `reviewer` y `date`, y, para datos explícitos y testimonios, al menos un apoyo `verified`. Quien propone no aprueba: el asistente deja todo en `pending`.
8. **Comprobar** con las dos barreras:
   - Siempre, al compilar y en las pruebas: referencias rotas o incompletas detienen la carga (evento o fuente inexistente, dato sin fuente, fragmento sin hash, revisión sin responsable…).
   - Con una importación aceptada: `npm run content:evidence` compara cada fragmento fijado con su texto y su hash. Sin importación aceptada **no** da por válido nada: termina con error y lo explica.
9. **Decidir la división** de la ficha solo si mejora la explicación y existe evidencia suficiente. Se conserva el ID original para el suceso principal y todos los enlaces existentes; los sucesos nuevos reciben IDs nuevos y la ficha original los enlaza.

## Decisión sobre la ficha completa

Aprobar una afirmación no aprueba automáticamente el cuerpo de su acontecimiento. Tras revisar el texto completo, la persona responsable puede anotar en `genshin-dossier.json`:

- `editorialStatus`: `draft` (oculto), `provisional` (borrador visible) o `reviewed`.
- `claimStatus`: `fact`, `interpretation` o `theory`; describe la ficha, no su aprobación.
- `review`: `reviewer`, `date` (AAAA-MM-DD) y `note` opcional.

Sin anotación, el estado sigue siendo `provisional` y la clasificación `interpretation`. `reviewed` requiere responsable y fecha, al menos una afirmación asociada y todas sus afirmaciones registradas en `reviewed`. Los controles de las afirmaciones siguen exigiendo respaldo contrastado para datos explícitos y testimonios. La completitud semántica del cuerpo corresponde a la persona revisora: el código no puede demostrar que cada oración fue registrada.

Las relaciones se aprueban por separado, con los mismos campos y una lista explícita `claimIds`. Sus afirmaciones deben existir, estar revisadas, estar vinculadas a sus extremos y cubrir ambos acontecimientos. Esa cobertura no demuestra por sí sola anterioridad o causalidad: la persona revisora debe comprobar el enunciado de la relación. La aprobación del evento no aprueba sus conexiones ni la asignación de spoilers. El asistente conserva los estados reales pendientes; las decisiones aprobadas de las pruebas son fixtures sintéticos.

## Reproducir

```sh
npm run content:acquire    # una vez; descarga y verifica el snapshot fijado
npm run content:import     # genera el candidato (muestra su ID)
npm run content:evidence -- ID_DEL_CANDIDATO # comprobar antes de promover
npm run content:promote -- ID_DEL_CANDIDATO
npm run content:evidence   # verifica los fragmentos fijados
npm run validate           # código, compilación y comprobación de fragmentos
```

En un checkout sin material importado, `npm run validate:code` permite comprobar la base; no certifica los fragmentos. `npm run validate` falla si faltan las fuentes o cambiaron. Ninguno descarga datos de forma implícita.

## Qué cuenta como «respaldado» para el lector

- «Texto del juego · Contrastada con el fragmento»: se comprobó contra el texto importado y se conservan sus límites.
- «Fuente secundaria · Citada, sin contrastar»: la cita el dossier; no se ha comprobado de forma independiente.
- «Interpretación» y «Cuestión abierta» se distinguen siempre de «Dato explícito» y «Testimonio».
- Una afirmación que afecta a varios acontecimientos solo se muestra cuando todos ellos están abiertos con el progreso del lector.
