# P1 — Cobertura de fuentes de lore

Fecha: 26 de septiembre de 2026, Costa Rica. Estado: **investigación técnica entregada; revisión humana y aceptación editorial pendientes**. No se implementó P2 ni se conectó contenido real a la aplicación.

## Resultado y decisión

La muestra permite continuar diseñando un adaptador propio en **TypeScript sobre Node**, conservando Astro/React y los contratos Zod existentes. No se necesita instalar Python ni adoptar un extractor completo para estos casos. La sonda de investigación usa JavaScript ESM y las APIs incluidas en Node; no es el importador de producción.

Se inspeccionaron las 12 categorías requeridas. Hay texto español trazable para todas, pero **dos conversaciones tienen referencias de texto ausentes** y el encuentro solo está cubierto parcialmente. Un texto resuelto no equivale a contenido aprobado ni demuestra que todo el diálogo mostrado en el juego esté incluido.

Entregables:

- [Manifiesto del snapshot](p1/snapshot-manifest.json): commit completo, versión declarada por el proveedor, inventario, tamaños, SHA-256 y Git blob SHA-1.
- [Evidencia de la muestra](p1/muestra-fuentes.json): IDs, localizadores, hashes de segmentos, hablantes, aristas, ausencias y condiciones. No contiene los cuerpos narrativos originales.
- [Sonda reproducible](../../scripts/research/p1-coverage.mjs): verifica archivos y reconstruye esa evidencia; trabaja fuera de `content/`, `src/` y `dist/`.
- [Registro de revisión humana](p1/revision-humana.md): los 12 casos siguen pendientes de revisión por una persona.

## Git como punto de recuperación

Se verificó `origin` contra `https://github.com/FranciscoCamareno/IrminsulAtlas.git`. El árbol estaba limpio y `main`, `origin/main` y la referencia remota consultada coincidían en **`2b27c63c1e51c36d6e4b83f9673509f15c4c88eb`**. Ese commit es la base recuperable de esta fase. El trabajo se prepara en `codex/p1-cobertura-fuentes`, sin reescribir `main`.

La copia `.validation/p0/estado-previo-2026-09-25.zip` y su manifiesto SHA-256 se conservan como respaldo adicional. No se usan como fuente de trabajo ni se añaden a Git. `.validation/` ya estaba excluido por `.gitignore`. La ausencia de Git registrada en P0 es un dato histórico, resuelto en esta fase.

No se añadió despliegue, GitHub Actions ni otra infraestructura. El terminal aislado presentó un fallo de inicialización del entorno antes de ejecutar comandos; las operaciones se pudieron ejecutar mediante el mecanismo de permisos del entorno. Esto no era un error del repositorio.

## Snapshot y alcance de adquisición

Proveedor: [DimbreathBot/AnimeGameData](https://github.com/DimbreathBot/AnimeGameData). Snapshot fijado: [`b061b403c8afc7bca633cf4f201edc4a3baa75fe`](https://github.com/DimbreathBot/AnimeGameData/commit/b061b403c8afc7bca633cf4f201edc4a3baa75fe), fechado por Git el 22 de septiembre de 2026, con mensaje de cambio del README.

El commit de datos precedente [`9587d1afbd9ab0419cdd00dc05ecd114b9e3fe99`](https://github.com/DimbreathBot/AnimeGameData/commit/9587d1afbd9ab0419cdd00dc05ecd114b9e3fe99) declara `CNRELWin7.1.0_R48145775_S48131320_D48145775`. Esta cadena se registra como declaración del proveedor; no se convierte en fecha histórica de ningún acontecimiento.

Se adquirieron **100 archivos, 106 693 778 bytes**, aproximadamente 101,75 MiB, en `.validation/p1/raw/`. La mayor parte corresponde a los dos diccionarios españoles y tablas de identificación necesarias para resolver referencias. También se inspeccionaron inventarios Git, sin clonar todo el repositorio. Se comprobaron tamaño, SHA-256 y Git blob SHA-1 de cada archivo contra el inventario fijado.

La adquisición se limitó a español y a archivos individuales de las muestras. No se descargaron las tablas completas `DialogExcelConfigData.json` ni `TalkExcelConfigData_0/1.json`, ni todos los libros, conversaciones, idiomas o recursos del juego. Los originales quedan en caché local ignorada; el repositorio versiona el manifiesto, los resultados estructurales y la sonda. Las referencias externas se consultaron como datos, sin ejecutar su código.

## Matriz de las 12 categorías

**Disponible** significa que los textos seleccionados se pudieron localizar y resolver técnicamente. **Parcial** indica una ausencia o un recorrido incompleto conocido. Ninguna fila acredita revisión humana ni cobertura total de la categoría. Los conteos de diálogos son registros por archivo: un mismo ID puede reaparecer en variantes distintas.

Los localizadores completos y hashes están en `p1/muestra-fuentes.json`. Las rutas de esta tabla son relativas a la raíz del snapshot fijado.

| Categoría                 | Muestra e identidad                                                              | Evidencia comprobada                                                                                                                              | Estado técnico / límite                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Misión de Arconte         | `MainQuest 352`, «Vista panorámica»; capítulo `1001`                             | `BinOutput/Quest/352.json` → `Talk/Quest/35216.json`; 5/5 textos, todos en Medium. Capítulo con estilo `CHAPTER_STYLE_TYPE_AQ` y `luaPath` AQ352. | Disponible en esta muestra. `MainQuest.type` está ausente: no clasificar todos los registros sin tipo como Arconte.                                                |
| Misión del mundo          | `MainQuest 10007`, «Cuentos del Tiempo y el Viento»                              | 15 conversaciones referenciadas; 96/97 textos. `100072001` apunta al hash ausente `1811400490`.                                                   | Parcial. No presentar la misión como texto completo; no rellenar ni omitir silenciosamente el segmento.                                                            |
| Misión legendaria         | `MainQuest 451`, «Territorio de lobos»; tipo `LQ`                                | 5 archivos de conversación, 48/48 registros resueltos. Los archivos 45105 y 45107 conservan variantes con IDs coincidentes.                       | Disponible en los archivos seleccionados; revisar condiciones y variantes antes de consolidar.                                                                     |
| Encuentro ramificado      | Bárbara, `CoopChapter 101401`; entrada `MainQuest 19001`                         | Grafo de 24 puntos y 5 finales; bifurcación `10140101 → 10140102 / 10140105`. Entrada: 12/12 textos; dos archivos Coop adicionales: 15/15.        | Parcial. No se extrajeron todas las conversaciones de las cinco rutas. Se conservaron opciones y condiciones; falta verificar raíces/condiciones del formato Coop. |
| Evento temporal antiguo   | `MainQuest 41111`, «Estrella desconocida», dentro de «Estrellas que no regresan» | 8 conversaciones, 135/136 textos; falta hash `4073544202` del diálogo `411110142`. Actividad `2001`, `NEW_ACTIVITY_ASTER`.                        | Parcial. Retención de una muestra antigua, no garantía de conservar todos los eventos retirados.                                                                   |
| Evento reciente           | `MainQuest 40250`, «Alas blancas que atraviesan la neblina»; actividad `2051`    | 11 conversaciones, 298/298 textos. `activityId` enlaza con «Alargéntea en pos de la luna» en `NewActivityExcelConfigData`.                        | Disponible en esta muestra. La noticia oficial sitúa el inicio del evento el 24/09/2026; no se dedujo antigüedad por el número del ID.                             |
| Diálogo ambiental         | Charles, NPC `1465`                                                              | `Talk/NpcGroup/1465.json` → 7 archivos `Talk/Npc/`, 30/30 registros resueltos; ramas de menú y condiciones de misión en el grupo.                 | Disponible en el grupo seleccionado. Las condiciones de acceso siguen necesitando traducción editorial a spoilers.                                                 |
| Libro de varios volúmenes | «La princesa jabalí», siete volúmenes; Codex `50005001`–`50005007`               | Material/Document `100202`–`100207` y `100610`; Document → Localization → siete archivos `Readable/ES`. Orden desde `BooksCodex.sortOrder`.       | Disponible, 7/7 volúmenes. El VI usa `Book159_ES.txt`: los nombres no se calculan a partir del número de volumen.                                                  |
| Carta                     | Document `100214`, «Carta de la Orden del Abismo»                                | Localization `200037` → `Readable/ES/DilucLetter_ES.txt`; original preservado y hash registrado.                                                  | Disponible en esta muestra; no se dedujo identidad por el nombre del archivo solamente.                                                                            |
| Historia de personaje     | Amber, avatar `10000021`, FetterStory `10202`                                    | `storyContextTextMapHash=3805665624`, resuelto únicamente en Medium; 1394 caracteres. Se preservan condiciones de apertura/finalización.          | Disponible como texto de origen; no equivale a aprobar su visibilidad ni sus condiciones.                                                                          |
| Historia de arma          | Aquila Favonia, Weapon `11501`                                                   | `storyId=191501` → Document → Localization `291501` → `Readable/ES/Weapon11501_ES.txt`.                                                           | Disponible. Se usa el `storyId` explícito, no una fórmula supuesta.                                                                                                |
| Conjunto de artefactos    | Conjunto `15001`, registro Codex `30107504`                                      | Piezas `75410/20/30/40/50` → storyId `185011`–`185015` → cinco archivos `Relic15001_1…5_ES.txt`.                                                  | Disponible, 5/5 piezas. No confundir copias por rareza/nivel con nuevas historias.                                                                                 |

Para el evento reciente se contrastó la [presentación oficial del 22/09/2026](https://genshin.hoyoverse.com/m/es/news/detail/166267). El extracto indexado del sitio oficial contiene el inicio del 24/09/2026; la página cargada directamente depende de JavaScript y no entregó cuerpo de texto a la herramienta. El evento antiguo tiene testimonios contemporáneos de noviembre de 2020, por ejemplo [este registro de HoYoLAB](https://www.hoyolab.com/article/87589), que es una publicación comunitaria, no aprobación editorial ni una fuente de diálogo. Ninguna de estas fechas se incorporó a la cronología ficticia de la aplicación.

Se inspeccionó además `BinOutput/CodexQuest/1000.json` como contraste estructural: **282 referencias de texto resueltas**, 154 en el mapa principal y 128 en Medium. Es una prueba adicional de formato, no una categoría aprobada ni una extracción de todo CodexQuest.

## TextMap, localizadores y formatos observados

### Resolución de español

- `TextMap/TextMapES.json`: **599 448** claves.
- `TextMap/TextMap_MediumES.json`: **231 889** claves.
- Intersección de claves: **0**. Conflictos entre mapas: **0**, para este snapshot concreto.
- Las dos referencias ausentes se buscaron en ambos diccionarios, sin sustituir idioma ni devolver el ID como diálogo. Son alcanzables desde la raíz declarada de sus respectivas conversaciones.
- Medium es necesario: sin él se perderían los cinco textos del ejemplo de Arconte y la historia de Amber seleccionada, entre otros. La ausencia de colisiones actual no autoriza sobrescritura silenciosa en futuros snapshots.

No se afirma que los dos hashes ausentes sean traducciones ausentes en todos los idiomas: esta prueba solo adquirió ES. Tampoco se clasificaron como nodos vacíos/de control por conveniencia.

### Correspondencias comprobadas, limitadas a este snapshot

| Estructura                   | Campos observados                                                                         | Tratamiento necesario en P2                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quest                        | `id`, `DLLABGGCEBM` (conversaciones); `NNEHBCLEGHG` (raíz en cada entrada)                | Conservar ID de misión y referencias explícitas; comprobar raíces, condiciones y vínculos antes de emitir segmentos.                                                                   |
| Talk de Quest/Npc            | `PCIAMAFDDAA`; dentro: `id`, `LKECPJIFFEE`, `KBPOBGFGLKN`, `GLJCECCOEDP`                  | Texto por hash, rol por ID/tipo, opciones como aristas. `0` aparece como terminador: no fabricar un diálogo con ID 0.                                                                  |
| Talk/Coop                    | `PFALHAKIILD`; dentro: `OIFGMOHKPOI`, `OACNIBLFFDI`, `LFGCLNLPAPB`, `KMLAFCBMFEI`         | Es otro formato, con `_id`/`_type` en el rol. El orden del array no demuestra la raíz ni el orden de todas las rutas.                                                                  |
| CoopPoint                    | `chapterId`, `id`, `acceptQuest`, `postPointList`, `type`                                 | Mantener bifurcaciones y finales. No concatenar las alternativas como hechos simultáneos.                                                                                              |
| CodexQuest                   | Objetos `textId` y `DFKLAEHPOBE`; `itemType`, `JIJKODHIEED`, `DCBDMJAPBOK`, `EDJPJDLLBOJ` | Resolver solo referencias textuales identificadas; conservar `SingleDialog`/`MultiDialog`, roles y enlaces originales.                                                                 |
| Document/Localization        | `questIDList` → Localization `id` → `esPath`                                              | En estas muestras, `questIDList` enlaza IDs de localización, no eventos históricos. No construir filenames mediante aritmética ni asumir un único fragmento para todos los documentos. |
| FetterStory/Weapon/Reliquary | Hash de texto o `storyId`, condiciones y referencias                                      | Distinguir historia larga de descripción del objeto y preservar versión/localizador.                                                                                                   |

Los originales contienen enteros de recursos mayores que `Number.MAX_SAFE_INTEGER`. La sonda conserva los bytes y solo resuelve campos textuales seguros identificados; **no constituye una normalización fiel de todos los enteros del dump**. El adaptador de P2 deberá preservar campos opacos sin pérdida o usar lectura numérica exacta cuando los necesite. Nunca reemplazar recursivamente todos los números por textos.

La identidad de un segmento debe incluir su contexto de fuente/variante además del ID original. Un índice de array sirve aquí como localizador de inspección dentro de un archivo fijado por hash, no como identidad editorial estable entre versiones. La sonda conserva `id`, ruta y pointer; no genera IDs históricos ni aprueba evidencias.

## Comparación de extractores y elección de lenguaje

Se consultó código en commits concretos sin instalarlo ni ejecutarlo:

| Referencia                                                                                                                                                        | Resultado de la inspección                                                                                                                                                                                                                                                                            | Decisión                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| JettyCoffee, [`6d9301d269694005494efdb06c87879dc5449111`](https://github.com/JettyCoffee/genshin-impact-extractors/tree/6d9301d269694005494efdb06c87879dc5449111) | `text_parser.py` carga solo el mapa principal; sus nombres ofuscados en `field_maps.py` difieren de los observados. `story_extractor.py` resulta útil para entender Document → Localization → Readable, pero toma solo la primera localización. El cargador de misiones omite filenames no numéricos. | Referencia de lectura; no adoptarlo sin adaptación y pruebas. No se ha certificado compatibilidad.       |
| Hoyo-story-extractor, [`1084418749cdf2fb20bcc9a4594f5cecf18f3d3a`](https://github.com/3aKHP/hoyo-story-extractor/tree/1084418749cdf2fb20bcc9a4594f5cecf18f3d3a)   | `base.py` combina mapas mediante sobrescritura, sustituye enteros recursivamente y continúa tras JSON corrupto; los campos Codex fijados allí difieren del snapshot.                                                                                                                                  | No cumple por sí solo las reglas de errores, identidad y conflictos del plan. No se reutilizó su código. |

El recorrido de prueba completo se pudo realizar con Node, sin dependencias nuevas: adquisición HTTP explícita, lectura JSON, resolución acotada, hashing y recorrido de grafos. **P2 se recomienda en TypeScript**, con esquemas en `src/domain/schema.ts` y adquisición/normalización separadas de dominio/UI. No se observó una ventaja concreta que justifique añadir Python al entorno actual. Esta elección no elimina las limitaciones de precisión numérica ni la necesidad de validar cada versión.

## Reproducción y revisión

Desde la raíz, con Node 24 y las dependencias habituales instaladas:

```sh
node scripts/research/p1-coverage.mjs --download
node scripts/research/p1-coverage.mjs --check
npm run validate
```

`--download` adquiere únicamente los archivos faltantes enumerados en el manifiesto, mediante URLs del commit fijado. Un archivo existente con hash incorrecto causa error, sin reemplazo automático. Sin esa opción, la sonda funciona con la caché local y no consulta la red. `--check` compara los resultados con `p1/muestra-fuentes.json`; no actualiza los esperados para hacer pasar diferencias.

Salidas locales ignoradas:

- `.validation/p1/results.json`: resultado reproducido, sin fecha variable.
- `.validation/p1/revision-humana.html`: textos originales seleccionados, escapados como texto y con sus localizadores para revisión. Contiene spoilers; no forma parte del sitio ni del bundle.
- `.validation/p1/raw/`: originales sin modificar.

El HTML local ayuda a inspeccionar texto y conexiones; no demuestra las condiciones reales del juego, la raíz de cada variante Coop ni que las ramas no muestreadas sean completas. El registro de revisión permite anotar esas comprobaciones sin inventar participantes, firmas o aprobaciones.

## Incidencias y puerta hacia P2

| ID    | Incidencia                                                            | Tratamiento requerido                                                                                                                                                       |
| ----- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Mundo: diálogo `100072001`, hash `1811400490`, ausente en ES          | Mantener como ausente. Revisar si pertenece a una variante sin publicar; excluir el segmento del primer conjunto publicable o conseguir una fuente alternativa verificable. |
| P1-02 | Evento antiguo: diálogo `411110142`, hash `4073544202`, ausente en ES | Mismo criterio; la misión no puede etiquetarse como extracción completa.                                                                                                    |
| P1-03 | Encuentro con variantes Coop y rutas no muestreadas completamente     | Conservar grafo y condiciones. Limitar el primer incremento a segmentos cuya raíz/contexto se verifiquen; no publicar las cinco rutas como si estuvieran revisadas.         |
| P1-04 | Campos ofuscados distintos y enteros opacos de 64 bits                | Adaptación explícita a este snapshot, fallos ante formato desconocido y preservación del original.                                                                          |
| P1-05 | Revisión humana no realizada en ninguno de los 12 casos               | Completar el registro adjunto. La inspección automatizada no otorga estado editorial `reviewed`.                                                                            |

La propuesta para el primer incremento es conservar las fuentes incompletas con estado explícito y **excluir de publicación los dos segmentos ausentes y las rutas de encuentro aún no verificadas**. No se aplica ninguna exclusión silenciosa ni se modifica contenido editorial en P1. Los textos técnicamente disponibles de Arconte, legendaria, evento reciente, ambiental, libros, carta, personaje, arma y artefactos forman una base candidata, sujeta a revisión humana y reglas de spoilers.

P1 entrega la evidencia técnica solicitada, pero **su puerta editorial no está cerrada**. El próximo paso es revisar los 12 casos y acordar el subconjunto verificable con sus exclusiones. Después podrá solicitarse P2 con el snapshot y los campos ya identificados. No se implementaron importación productiva, promoción/restauración, búsqueda, carga de detalle ni publicación.

## Validaciones de esta entrega

Resultados del 26/09/2026:

| Comprobación                                    | Resultado                                                                                                              |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `node scripts/research/p1-coverage.mjs --check` | Correcta sin red: 100 archivos, 106 693 778 bytes y sus hashes verificados; resultado igual a la evidencia versionada. |
| `npm run validate`                              | Correcto: formato, lint, tipos, pruebas y build completados.                                                           |
| `astro check`                                   | 25 archivos; 0 errores, advertencias o sugerencias.                                                                    |
| `vitest run`                                    | 36 pruebas correctas en 4 archivos. No son pruebas del futuro importador.                                              |
| `astro build`                                   | 4 páginas estáticas generadas. No se desplegó el resultado.                                                            |

La primera validación de esta entrega detectó ocho referencias a APIs globales de Node no declaradas para ESLint en la nueva sonda. Se corrigieron mediante importaciones explícitas y acceso a `globalThis`; la repetición completa pasó. El fallo de formato del plan 10 registrado en P0 también está resuelto.

Se mantiene la separación entre fuentes investigadas y fixtures demo que usa el sitio. No se modificaron UI, dominio, contenido ni dependencias. No se ejecutaron pruebas nuevas de navegador, usabilidad o rendimiento: sus límites anteriores siguen vigentes. La revisión humana de fuentes continúa pendiente.
