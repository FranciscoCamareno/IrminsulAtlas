# P2 — Importador reproducible

Fecha: 27/09/2026, Costa Rica. Base Git: `897ceded7cd0dacbb3c4d9da66c9021c41262f0f`. Rama: `codex/p2-importador-reproducible`. El árbol estaba limpio antes de P2; el ZIP de P0 se conserva.

## Alcance y decisiones

El usuario [aprobó la revisión humana de P1](p1/revision-humana.md) y autorizó P2. Se implementa un adaptador en TypeScript para el snapshot `b061b403c8afc7bca633cf4f201edc4a3baa75fe`, con adquisición explícita, normalización sin red, informe, comparación y aceptación local de candidatos. No se crean eventos ni se conecta el material a la UI.

Los contratos Zod y tipos inferidos permanecen en [schema.ts](../../src/domain/schema.ts). `SourceRecord` y `SourceSegment` son contratos de material importado: conservan variantes, textos, localizadores y condiciones. No sustituyen por anticipación el `Dataset` editorial ni el cargador demo `MissionProvider`. La conexión con evidencias/eventos corresponde a P3.

Se usa Node 24 instalado, sin dependencias nuevas ni cambios del lockfile. La CLI ejecuta TypeScript con sintaxis borrable y extensiones explícitas; `astro check` realiza la comprobación de tipos. Se contrastó con la [documentación de Node 24](https://nodejs.org/docs/latest-v24.x/api/typescript.html). El reviver de JSON conserva enteros opacos fuera del rango seguro como cadenas decimales exactas, mediante el token original de [JSON.parse](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse); no se redondean ni se convierten indiscriminadamente números en textos de lore. Los bytes originales siguen en caché con sus hashes.

## Archivos y responsabilidades

| Ruta                                             | Responsabilidad                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `src/domain/schema.ts`                           | Manifiesto, selección, fuentes/segmentos, candidato, informes y puntero aceptado; tipos inferidos. |
| `src/domain/import-integrity.ts`                 | IDs únicos, localizadores, raíces, ramas, traducciones y exclusiones; sin filesystem.              |
| `scripts/import/shared.ts`                       | JSON exacto, serialización estable, hashes, errores localizados y rutas acotadas.                  |
| `scripts/import/acquire.ts`                      | Descarga separada y verificación de tamaño, SHA-256 y Git blob SHA-1.                              |
| `scripts/import/adapter.ts`                      | Campos concretos de Quest, Talk, Coop, Document/Localization y FetterStory; vínculos a catálogos.  |
| `scripts/import/pipeline.ts`                     | Candidatos inmutables, validación, comparación y promoción local.                                  |
| `scripts/import/cli.ts`                          | Comandos desde la raíz; ubicaciones fijas y errores con salida distinta de cero.                   |
| `scripts/import/selection.json`                  | Muestra explícita y exclusiones; no depende de títulos traducidos.                                 |
| `tests/import.test.ts`, `tests/fixtures/import/` | Casos sintéticos sin red, separados del contenido real y del sitio.                                |

## Recorrido operativo

Desde la raíz, con Node 24 y npm 11:

```sh
npm run content:acquire
npm run content:import
npm run content:validate -- ID_DEL_CANDIDATO
npm run content:diff -- ID_DEL_CANDIDATO
npm run content:promote -- ID_DEL_CANDIDATO
npm run content:validate
npm run validate
```

En PowerShell puede usarse `npm.cmd`. Sustituir `ID_DEL_CANDIDATO` por el SHA-256 mostrado por `content:import`.

1. **Adquirir:** solo `content:acquire` consulta URLs públicas del commit fijado y archivos del manifiesto P1. Descarga faltantes; verifica cada descarga antes de guardarla. Un archivo existente corrupto falla, sin reemplazo silencioso. No se ejecuta al compilar.
2. **Importar:** verifica los 100 archivos locales antes de transformar. Lee todos los JSON enumerados para detectar corrupción, incluso si una tabla se conserva solo como evidencia. Un commit real distinto requiere revisar el adaptador; no se usa una rama cambiante ni se intenta otro idioma.
3. **Revisar:** candidato en `.validation/p2/candidates/<hash>/candidate.json`, con `report.json`, `report.md` y `diff.json`. Las incidencias identifican categoría, archivo, campo, ID y motivo. Un candidato con errores no se puede promover; las exclusiones explícitas generan advertencias.
4. **Comparar:** distingue fuentes añadidas, modificadas, ausentes del subconjunto y sin cambios, por IDs estables. Una diferencia puede incluir cambios de procedencia además de texto; no significa eliminación histórica ni modifica eventos editoriales.
5. **Promover localmente:** exige un ID explícito y vuelve a validar esquema, integridad y hashes. Escribe la versión completa en `content/imported/animegame/versions/<hash>/sources.json`, y solo después cambia `accepted.json` mediante rename. Conserva `previousVersion` y los directorios anteriores.
6. **Validar aceptado:** `content:validate` sin ID comprueba el puntero, el hash del contenido y su integridad. Una repetición idéntica de promoción es idempotente.

Los candidatos y salidas reales generadas están ignorados por Git. Los originales de P1 siguen en `.validation/p1/raw/`. Ninguno vive en `public/` ni se importa desde la aplicación. Se versionan código, selección, manifiesto P1, fixtures sintéticos y evidencia de validación sin cuerpos narrativos.

## Identidad, texto y ramas

Los IDs incorporan proveedor, tipo, ID externo e idioma; no incluyen commit, título ni índice de array. Los segmentos de misión añaden archivo/variante de conversación e ID de diálogo. Así, variantes con el mismo ID original no se fusionan. Los documentos usan el ID de Document y Localization. El índice de array se conserva únicamente como localizador y `sourceOrder`, nunca como fecha histórica.

Se conservan texto original sin recortar, hash, diccionario que lo resuelve, archivo y pointer. Las elecciones son aristas hacia segmentos, la raíz viene de la referencia de misión y el terminador 0 se representa sin crear un segmento ficticio. El rol y su ID se mantienen aunque no se conozca un nombre. No se ejecuta HTML, Markdown o instrucciones del contenido.

Los contextos originales de misión, personaje y encuentro mantienen condiciones. Libros conservan `BooksCodex.sortOrder`; armas y artefactos conservan los registros que apuntan a `storyId`. Se recorren todas las localizaciones de un documento, sin construir nombres por aritmética ni asumir un único fragmento. Las cinco piezas y los siete volúmenes son fuentes separadas.

La aprobación de P1 no determina visibilidad por spoilers. Todas las fuentes de P2 son `draft` y `publication: not-publishable`. El build continúa utilizando exclusivamente los fixtures demo actuales.

## Subconjunto inicial y límites

Se procesan **23 registros de fuente** de la muestra P1. **19 fuentes y 396 segmentos** forman el subconjunto técnicamente aceptable. No equivalen a 19 eventos históricos.

| Exclusión            | Motivo                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| `agd-quest-10007-es` | Hash español 1811400490 ausente.                                                |
| `agd-quest-41111-es` | Hash español 4073544202 ausente.                                                |
| `agd-coop-101401-es` | Solo dos variantes seleccionadas; raíces y recorridos completos sin certificar. |
| `agd-quest-19001-es` | Fragmento de entrada del encuentro excluido; se mantiene junto a su contexto.   |

Se excluye cada fuente incompleta entera, conservándola en el candidato y en el informe. No se omiten silenciosamente dos frases para declarar completas las misiones. Ningún segmento sin texto llega al conjunto aceptado. Conseguir una fuente alternativa española y ampliar Coop sigue pendiente.

El adaptador cubre la selección P1, no el corpus entero. CodexQuest se verifica como archivo de la muestra, pero no se emite como una fuente adicional: su prueba P1 fue estructural. No se implementan condiciones de acceso del juego, extracción de todas las rutas ni reglas editoriales de spoilers. No se añaden reintentos automáticos ni tareas programadas; una descarga fallida se vuelve a solicitar explícitamente.

## Protección de la versión válida

La importación no cambia `accepted.json`. La promoción se serializa con `promotion.lock`, comprueba la versión previa y escribe primero la nueva versión completa. Si falla antes del cambio del puntero, el conjunto anterior permanece seleccionable. No se borra ninguna versión para efectuar el cambio.

Un bloqueo abandonado por cierre abrupto requiere comprobar que no hay otra promoción ejecutándose antes de retirar únicamente ese archivo. No se elimina automáticamente. La estrategia se probó en el filesystem local de Windows; no constituye una certificación ante pérdida de energía o almacenamiento remoto. Restauración operativa completa y actualizaciones entre snapshots reales corresponden a P7.

## Evidencia de validación

Resultados del 27/09/2026, con [evidencia estructurada](p2/resultados.json):

| Comprobación                                          | Resultado                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run validate`                                    | Formato, lint, tipos, pruebas y build correctos.                                                      |
| `astro check`                                         | 32 archivos; 0 errores, advertencias o sugerencias.                                                   |
| `vitest run`                                          | 60 pruebas en 5 archivos: 36 anteriores y 24 nuevas de P2.                                            |
| `astro build`                                         | 4 páginas estáticas. No se desplegó.                                                                  |
| Muestra real, dos importaciones con red deshabilitada | Candidato idéntico byte por byte; 100 archivos verificados; no cambió el estado aceptado al importar. |
| Promoción local y `content:validate`                  | 19 fuentes, 396 segmentos, ninguna traducción ausente en el subconjunto aceptado.                     |
| `content:diff` tras promover                          | 19 fuentes sin cambios; 0 añadidas, modificadas o retiradas.                                          |

Candidato: `17833f345e40fa245e464c66c2dd0f55b6164adfe8b4de480d2c2ae7ea10c460` (1 609 846 bytes). Versión local aceptada: `216c2918914f40d1f4031ba47cca4d5628ed8a064498ac729fa452df783bc253` (963 614 bytes). Son artefactos de importación, no tamaños del bundle del sitio.

Las pruebas nuevas ejercitan Medium, colisiones iguales y distintas, JSON truncado, checksum incorrecto, archivo ausente, cambio de campos, commit desconocido, referencias/raíces rotas, IDs duplicados, variantes con el mismo ID original, enteros de 64 bits, texto con HTML, documentos multifragmento, ramas Coop, exclusiones, determinismo, descargas interrumpidas, diferencias y preservación de versiones durante errores y bloqueos de promoción. Las pruebas de errores se ejecutan sobre fixtures sintéticos sin red y no alteran los originales P1.

No se repitieron pruebas visuales ni de gestos físicos: P2 no cambia la interfaz. La aceptación técnica local está completada; P3 sigue pendiente.

Siguiente fase: P3, seleccionar y redactar 8–12 eventos con evidencias verificables, incertidumbre y revisión editorial. La aprobación de cobertura P1 no aprueba automáticamente esos futuros textos. No se ejecuta P3 ni se despliega en esta entrega.

## Ampliación del 05/10/2026 (registro posterior; no modifica lo anterior)

Con autorización del usuario se añadieron 32 archivos `Readable/ES` y 32 documentos a `scripts/import/selection.json` (kind `book` si están en `BooksCodex`, `document` si no; este último tipo es nuevo). El manifiesto pasa a 132 archivos; las huellas de los nuevos se calcularon al descargarlos desde la URL fijada al commit. El candidato resultante (`9af75c4c…`) se aceptó localmente como `675999db…` (51 fuentes, 428 segmentos, 2 textos sin resolver ya conocidos). Los resultados de este informe sobre el candidato anterior (`216c2918…`) siguen siendo los de su fecha.
