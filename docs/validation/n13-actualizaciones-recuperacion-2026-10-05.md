# N-13 — Actualizaciones, impacto y recuperación (2026-10-05)

## Informe de impacto editorial

`npm run content:impact -- <ID de candidato>` (código en `src/domain/impact.ts`, solo lectura) lee el candidato y los registros de evidencias (el antiguo y los de `content/editorial/corpora/`) y devuelve:

- `diff`: fuentes añadidas, cambiadas, ausentes y sin cambios respecto de la versión aceptada.
- `impact.affectedClaims`: afirmaciones cuyo fragmento cambió, cuyo segmento o fuente desapareció, o cuyo localizador se movió; con sus eventos y relaciones (vía `claimIds`).
- `impact.needsReview`: toda afirmación afectada, también la ya `reviewed`; el informe **no** modifica ningún registro ni reaprueba nada.
- `impact.snapshotChanged`: un commit distinto del proveedor es un aviso informativo; no invalida por sí solo ninguna afirmación (el hash de cada fragmento decide).

Ensayo real (candidato antiguo `c2564ae3…`, que carece de dos documentos): `removed` = 2 fuentes; 4 afirmaciones afectadas (`claim-enkanomiya-orobashi`, `claim-era-siete-sistema`, `claim-gnosis-fin-guerra`, …), 4 eventos afectados, 60 afirmaciones intactas. Hoy ninguna relación del corpus antiguo usa `claimIds`, por lo que `affectedRelations` queda vacío salvo que se rellenen.

Exclusiones (segmentos sin texto) siguen apareciendo en el informe de importación (`reportFor`), no en este; el impacto las ve como `segment-without-text`.

## Recuperación

No existe un comando `rollback`. El procedimiento (probado en `tests/import.test.ts`, «recovers a previous accepted version…»):

1. Las versiones `content/imported/animegame/versions/<hash>/sources.json` son inmutables y se conservan.
2. Para volver a una anterior, restaurar `accepted.json` con `{"schemaVersion":1,"version":"<hash previo>","previousVersion":…}` (el `previousVersion` del puntero actual da el hash).
3. Ejecutar `npm run content:validate` (comprueba el hash de la versión) y `npm run content:evidence` (comprueba que las evidencias son compatibles con ella).
4. Si el editorial se hizo contra la versión nueva, restaurar también su commit en Git: el editorial y las fuentes se recuperan por separado.

Un candidato rechazado (descarga parcial, esquema o evidencia rota) no toca el puntero: cubierto por las pruebas existentes de `importSnapshot`/`promoteCandidate`.

## Compatibilidad con un snapshot nuevo (diseño, no implementado)

El commit (`SNAPSHOT`) y la versión del adaptador siguen fijados en `scripts/import/shared.ts`, el manifiesto y `selection.json`. Cambiarlos exige: nuevo manifiesto con huellas verificadas, nueva versión de adaptador, `content:import` → `content:impact` → revisión humana de las afirmaciones listadas → `promote`. No se cambia el hash del manifiesto sin revisar. Las evidencias antiguas con otro `snapshotCommit` fallan `snapshot-changed` en `content:evidence` hasta reverificarse; no se reescriben en bloque.

## Pendiente

- Decidir si `content:evidence` debe tratar `snapshot-changed` como error o aviso al promover un snapshot nuevo (hoy: error).
- Un ensayo con un snapshot real posterior (no disponible en este entorno).
