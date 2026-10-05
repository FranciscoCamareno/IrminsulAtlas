# N-09 — Composición de corpus adicionales (2026-10-05)

## Decisión de formato

Cada corpus nuevo (p. ej. la historia del Viajero) es **un archivo JSON** en `content/editorial/corpora/<id>.json` validado por `CorpusFileSchema` (`src/domain/schema.ts`). Se eligió JSON frente a Markdown porque eventos, relaciones, hitos y evidencias ya son contratos Zod; el prosa largo de cada evento va en `body`. Los cuatro documentos antiguos y su mapa (`genshin-dossier.json`, `genshin-revelation.json`, `genshin-evidence.json`) no se tocan.

Contenido de un archivo: `milestones` (se añaden **tras** la escalera base), `eras`, `entities`, `events`, `relations` y `evidence` (un `EvidenceRegistry` propio, con las mismas reglas que el antiguo). Las entidades ya existentes se reutilizan por ID desde `entityIds`; redefinirlas es un error de «ID duplicado».

## Composición

`src/content/corpora.ts`:

- `composeCorpora(base, corpora)` (pura) y `loadAtlasContent()` (base + archivos). Las rutas `src/pages/data/*` usan ya `loadAtlasContent()`.
- Un elemento `draft` **nunca se publica**: tampoco las relaciones que lo tocan ni las afirmaciones que solo hablan de él; una afirmación compartida conserva únicamente los eventos publicados.
- Todo el dataset se vuelve a validar (`DatasetSchema` + `findIntegrityIssues`): IDs duplicados entre corpus, referencias inexistentes, etc. detienen la construcción.
- `npm run content:evidence` incorpora los eventos y registros de todos los corpus (hoy: ninguno, 0 archivos).

## Qué falta (no declarado como hecho)

- Todavía no existe ningún corpus real del Viajero: la infraestructura se prueba con un fixture sintético identificado como demostración (`tests/corpora.test.ts`).
- Los metadatos de publicación por unidad (versión/fecha) siguen en el registro de cobertura (`genshin-coverage.json`) y no se copian a los eventos.
- Los hitos por acto del Viajero requieren N-10 (formato de progreso).
