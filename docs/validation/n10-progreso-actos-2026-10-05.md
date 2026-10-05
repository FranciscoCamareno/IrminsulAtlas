# N-10 — Progreso por actos y misiones opcionales (2026-10-05)

## Diseño

- Cada hito tiene `track`: `main` (escalera ordenada de historia principal; por defecto, así el corpus antiguo no cambia) u `optional` (misión opcional/encuentro, concedido uno a uno).
- La elección persistida es `none`, `upto` (hito principal + lista `optional`) o `all`. Alcanzar una región o acto **no concede** ningún opcional.
- Requisitos conjuntos: `spoilerRequirements` ya era una conjunción (todos los hitos listados), por lo que «acto X **y** misión Y» se expresa sin cambiar el contrato. No se ha añadido lógica de alternativas («o»): ningún contenido real la necesita todavía.
- Un ID desconocido, o un hito principal pasado como opcional, no concede nada. Un hito opcional no es válido como punto de la escalera.

## Migración

- Clave de almacenamiento `irminsul-atlas:progress:v2`. Si no existe, se lee `…:v1` tal cual (nunca contuvo opcionales, así que concede exactamente lo mismo que antes); la siguiente elección escribe v2. No se borra v1.
- `none` y `all` conservan su interpretación. Almacenamiento corrupto = «sin decidir»; si `localStorage` falla, la elección vive en memoria.

## Interfaz

`ProgressDialog` muestra un grupo «Misiones opcionales que has completado» solo si existen hitos opcionales; está desactivado salvo en «Historia principal hasta…». Hoy no hay ninguno publicado (el corpus antiguo solo usa la escalera), por lo que ese grupo no aparece en el sitio real.

## Pruebas

`tests/progress-optional.test.ts` (dos lectores en el mismo acto con y sin la misión opcional; IDs desconocidos; formato persistido), `tests/progress.test.ts` (migración v1→v2), e2e existentes en v2.

## Limitaciones

- Faltan pruebas de «reducir progreso» con un opcional concreto en la interfaz (no hay opcionales reales que mostrar) y la revisión de dependencias/ciclos entre hitos: no existe aún `requires` entre hitos; se añadirá si el corpus lo necesita.
- `DossierReader` y las proyecciones usan el mismo `Progress` (conjunto de IDs), por lo que no requieren cambios.
