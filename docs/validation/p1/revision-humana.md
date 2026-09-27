# P1 — Registro de revisión humana

## Aprobación recibida

El usuario aprobó la revisión en esta conversación: **«aprobado la revision humana, pasa a p2»**. Aprobación global registrada el **27/09/2026**, al continuar P2 tras la interrupción. Revisor identificado: **usuario del proyecto**. No se inventan firmas, fechas de sesiones ni comprobaciones individuales adicionales.

Se acepta la muestra y sus límites documentados para construir el importador. La aprobación no convierte los dos textos ausentes en disponibles, no acredita rutas de encuentro que no estaban en la muestra y no aprueba todavía eventos, resúmenes o reglas editoriales de spoilers.

Snapshot: `b061b403c8afc7bca633cf4f201edc4a3baa75fe`. Evidencia: [matriz P1](../cobertura-fuentes.md), [muestra estructural](muestra-fuentes.json) y lector local `.validation/p1/revision-humana.html`.

| Caso            | Identidad                                         | Aprobación recibida / alcance P2                                                               |
| --------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Arconte         | MainQuest 352; Talk 35216                         | Aprobación global; incluido.                                                                   |
| Mundo           | MainQuest 10007                                   | Aprobación con ausencia conocida de 100072001; fuente completa excluida del conjunto aceptado. |
| Legendaria      | MainQuest 451                                     | Aprobación global; variantes 45105/45107 conservadas por separado.                             |
| Encuentro       | CoopChapter 101401; entrada 19001 y dos variantes | Aprobación de muestra parcial; capítulo y misión de entrada excluidos del conjunto aceptado.   |
| Evento antiguo  | MainQuest 41111                                   | Aprobación con ausencia conocida de 411110142; fuente completa excluida.                       |
| Evento reciente | MainQuest 40250                                   | Aprobación global; incluido.                                                                   |
| Ambiental       | Charles, NPC 1465                                 | Aprobación global; condiciones originales conservadas, sin inferir spoilers.                   |
| Libro           | Codex 50005001–50005007                           | Aprobación global; siete volúmenes con orden original preservado.                              |
| Carta           | Document 100214                                   | Aprobación global; incluida.                                                                   |
| Personaje       | Amber, FetterStory 10202                          | Aprobación global; condiciones originales conservadas.                                         |
| Arma            | Weapon 11501; Document 191501                     | Aprobación global; historia incluida.                                                          |
| Artefactos      | Conjunto 15001; cinco historias                   | Aprobación global; incluidas.                                                                  |

## Decisión aplicada

- P1 queda aceptada para avanzar a P2 con el subconjunto verificable y exclusiones explícitas de [selection.json](../../../scripts/import/selection.json).
- P2 excluye fuentes incompletas enteras, evitando cortar una conversación y perder contexto. Conserva sus datos en el candidato y motivos en el informe.
- Los dos hashes ausentes siguen sin fuente española alternativa verificada. Recuperarlos y completar las rutas Coop son ampliaciones pendientes, no requisitos satisfechos.
- La aprobación de cobertura se separa del estado editorial: las fuentes normalizadas siguen `draft` y `not-publishable` hasta la integración editorial posterior.
- El manifiesto y la evidencia JSON de P1 conservan el estado histórico `humanReview: pending` con el que se generaron. Esta acta posterior registra la aprobación; no se reescriben los resultados de la sonda para simular que ocurrió antes.

No autoriza despliegue ni creación automática de eventos.
