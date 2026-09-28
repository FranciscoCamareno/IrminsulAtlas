# Modelo de datos y criterio editorial

> Contrato ejecutable inicial: [src/domain/schema.ts](../src/domain/schema.ts). Los tipos se infieren de Zod; las tablas de este documento son orientativas. Véase [la decisión de modelo](08-base-inicial.md): `Mission` es una variante de fuente, los intervalos tienen incertidumbre explícita y las restricciones relativas usan `before`/`after`.

## Contratos añadidos en P2

El importador define en `src/domain/schema.ts` `SnapshotManifest`, `SourceRecord`, `SourceSegment`, `ImportSelection`, `ImportedDataset`, `ImportCandidate`, `ImportReport`, `ImportDiff` y `AcceptedImport`, con tipos inferidos de Zod. Conserva texto, hashes, roles, condiciones, localizadores y ramas como material fuente. Los IDs no dependen del título ni del commit. Todo material normalizado permanece `draft` y `not-publishable`; su aceptación técnica no lo convierte en evento revisado ni concede visibilidad. El `Dataset` demo y las evidencias editoriales existentes permanecen compatibles. Véase [P2](validation/importador-p2.md).

## Principios

Una misión es material fuente; un evento es una unidad histórica editada. Una misión puede describir varios eventos y un evento puede tener varias fuentes.

Distinguir tiempo dentro de la historia, orden en que la obra revela información y fecha de publicación o parche. No usar fechas terrestres ficticias para acomodar un calendario narrativo.

## Entidades

| Entidad | Campos orientativos |
| --- | --- |
| Universo | id, nombre, idioma predeterminado, convenciones temporales |
| Época | id, universeId, nombre, orden editorial, límites si se conocen |
| Evento | id, universeId, slug, título, alias, resumen, contenido, eraId, tiempo, importancia, categorías, participantes, reglas de spoilers, estado editorial |
| Entidad narrativa | id, tipo personaje/lugar/facción, nombre, alias |
| Relación | id, origen, destino, tipo, dirección, explicación, evidencias, certeza y reglas de spoilers |
| Fuente | id, proveedor u obra, externalId opcional, misión/capítulo, localizador, idioma, URL si existe, fecha de consulta |
| Evidencia | sourceId, fragmento o localizador, afirmación respaldada y observaciones |
| Misión importada | providerId, externalId, idioma, título, texto disponible, requisitos y versión del snapshot |

No guardar coordenadas de pantalla en el evento. La importancia visual y el orden editorial sí son datos propios válidos, separados de la certeza histórica.

## Representación temporal

Usar una unión discriminada, validada mediante esquemas:

| kind | Datos | Presentación |
| --- | --- | --- |
| exact | valor y sistema temporal definidos | Fecha conocida |
| range | límite inferior y superior | Intervalo |
| approximate | referencia, etiqueta y margen si se conoce | “Aproximadamente…” |
| relative | IDs anteriores/posteriores y explicación | “Después de…” |
| unknown | etiqueta y época opcional | “Fecha desconocida” |

No exigir valores numéricos a eventos cuyo tiempo es desconocido. En modo narrativo, usar orden editorial y mostrar que la separación no representa duración.

Validar rangos invertidos, referencias inexistentes y ciclos imposibles en restricciones estrictas de anterioridad. Una relación narrativa general sí puede formar ciclos; no prohibir ciclos en todo el grafo.

## Ejemplo conceptual de evento

El siguiente ejemplo es sintético, no representa lore real ni el contrato de una API:

```json
{
  "id": "demo-event-001",
  "universeId": "demo",
  "slug": "fundacion-del-refugio",
  "title": "Fundación del refugio",
  "summary": "Acontecimiento ficticio para probar la interfaz.",
  "eraId": "demo-era-01",
  "time": {
    "kind": "unknown",
    "label": "Fecha desconocida"
  },
  "displayOrder": 10,
  "importance": "major",
  "entityIds": ["demo-faction-01"],
  "spoilerRequirements": ["demo-chapter-01"],
  "evidence": [
    {
      "sourceId": "demo-source-01",
      "locator": "Diálogo de demostración, fragmento 2"
    }
  ],
  "claimStatus": "interpretation",
  "editorialStatus": "demo"
}
```

Los IDs referenciados deben existir en los fixtures al implementar este ejemplo. Definir los esquemas ejecutables en la fase 1; este bloque no es un esquema completo.

## Spoilers

Modelar requisitos como hitos conocidos, no asumir que todas las misiones forman una secuencia lineal. Para el MVP puede configurarse una lista editorial de capítulos, conservando la posibilidad de misiones opcionales.

Un evento se muestra solo si se satisfacen todos sus requisitos. Una relación se muestra solo si ambos extremos y sus requisitos propios están permitidos. Las entidades pueden tener nombres o descripciones reveladores: aplicarles reglas equivalentes o etiquetas seguras.

El filtro se aplica a búsqueda, conteos, agrupación, sugerencias, imágenes y lectura. En páginas directas y metadatos, definir un modo seguro: no precargar en el título o descripción pública una revelación que se pretende ocultar en la interfaz.

No es confidencialidad: una publicación estática contiene archivos accesibles. No prometer que el filtro impide inspeccionarlos.

## Criterio editorial

- claimStatus distingue hecho respaldado, interpretación y teoría.
- editorialStatus distingue borrador, revisado y demostración.
- Atribuir testimonios a sus narradores; no convertir automáticamente un diálogo en verdad objetiva.
- Registrar contradicciones y cambios sin borrar silenciosamente el contexto anterior.
- Toda relación causal requiere evidencia; “menciona” no significa “causa”.
- Separar resumen propio de fragmentos citados.
- Conservar referencias a versiones de fuente para revisar cambios.
- No confundir traducción ausente con ausencia del evento.

## Validación mínima

IDs únicos; referencias válidas; slugs únicos por universo/idioma; rangos temporales válidos; requisitos de spoilers existentes; fuentes en contenido revisado; relaciones sin extremos inexistentes; distinción clara entre datos reales y demo.

## Borrador visible del dossier — 28/09/2026

El usuario autorizó mostrar el dossier íntegro como primer borrador, sin revisión factual nueva ni filtros de spoilers. Se añade `provisional` como estado visible distinto de `reviewed`; `draft` conserva su exclusión. Este permiso no se aplica a las fuentes importadas de P2.

Las entidades admiten `body` y `dossierSection`; los eventos añaden `narrativeThread`, `dossierSection` y `certainty`. Las épocas admiten descripción y sirven como capítulos narrativos que pueden solaparse históricamente. `DossierMapSchema` valida las anotaciones del JSON editorial; no se duplican interfaces de contratos. Textos y fuentes siguen en los documentos aportados. Véase [el informe](validation/dossier-historia-antigua.md).
