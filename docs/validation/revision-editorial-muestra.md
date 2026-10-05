# Revisión editorial de la muestra — resultados del 05/10/2026

Procedimiento: [docs/12](../12-procedimiento-revision-editorial.md). Datos: `content/editorial/genshin-evidence.json` (38 afirmaciones, 32 fuentes). Todo permanece **`pending`**: ninguna afirmación está aprobada editorialmente y este informe no equivale a esa aprobación.

## Muestra y criterio

Diez acontecimientos elegidos por variedad, más tres que entran por afirmaciones compartidas:

| Acontecimiento                                                    | Qué prueba del procedimiento                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `evt-revolucion-vennessa`                                         | Texto primario importado; límites entre lo que el texto dice y lo que se le atribuye |
| `evt-rebelion-decarabian`                                         | Dos revoluciones separadas; interpretación que afecta a dos eventos                  |
| `evt-hiperborea`                                                  | Fecha incierta y discrepancia declarada («treinta días» frente a diez años)          |
| `evt-mare-jivari`                                                 | Discrepancia temporal y narradores distintos                                         |
| `evt-enkanomiya-watatsumi`                                        | Proceso largo; cautela de cronología que toca a dos eventos                          |
| `evt-caida-guili` (+ `evt-caida-havria`, `evt-proteccion-chenyu`) | Conexión regional; una afirmación para tres eventos                                  |
| `evt-tres-dioses-sumeru` (+ `evt-caida-gurabad`)                  | Orden relativo frente a datación                                                     |
| `evt-remuria`                                                     | Proceso regional sin fecha                                                           |
| `evt-era-siete`                                                   | Proceso largo; testimonio con narrador                                               |
| `evt-llegada-gemelos`                                             | Límite del alcance; interrogante conservado                                          |

## Resultado cuantitativo (`npm run content:evidence`)

- 38 afirmaciones: 24 datos explícitos, 2 testimonios, 10 interpretaciones y 2 cuestiones abiertas. Cero `reviewed`.
- 13 de 29 acontecimientos tienen afirmaciones; 16 siguen sin ellas (lista en la salida del comando).
- **4 apoyos contrastados con texto primario**, todos con un único fragmento: la historia del arma _Aquila Favonia_ (`agd-document-191501-es`). Los demás apoyos son referencias «citadas», no contrastadas.
- Verificación contra la importación aceptada `216c2918…`: 0 incidencias (hash del fragmento y localizador coinciden).

## Hallazgos (valoración crítica)

1. **El respaldo independiente es mucho menor de lo que sugiere el número de enlaces.** El dossier cita casi exclusivamente una misma wiki comunitaria (Fandom) y un artículo de Game8; el dossier se redactó como síntesis de ellas. Registrarlas como `cited` da trazabilidad, no contraste: si la wiki se equivoca, el dossier la repite. Solo la historia de _Aquila Favonia_ es texto del juego.
2. **El subconjunto importado no cubre el lore antiguo.** La selección de P1 se eligió para probar formatos (misiones, libros, cartas, conjuntos), no para cubrir la historia antigua: una búsqueda de 34 términos del dossier (Decarabian, Vennessa, Khaenri’ah, Guili, Hiperbórea…) en los textos de los 23 candidatos solo encontró «Snezhnaya», «Chenyu», «Mil Vientos» y «Abismo», sin relación con las afirmaciones registradas. Además, la misión `10007`, la más cercana a Decarabian y Barbatos, está **excluida** del subconjunto aceptado por un texto ausente (P1-01), así que no se usa. Contrastar el resto con texto primario exige ampliar la selección con libros y misiones concretos, algo que pasa por la revisión de cobertura de P1 y por tu aprobación.
3. **Hay afirmaciones del dossier que el texto primario disponible no sostiene.** El fragmento de _Aquila Favonia_ respalda la tiranía de los nobles, la esclavización de forasteros, el derrocamiento y la fundación de la Orden de los Caballeros y la Iglesia. **No nombra a Vennessa**, ni dice que fuera «obligada a combatir», ni menciona a Barbatos ni aliados («caminar a la par de los dioses» es solo contexto). Esas partes dependen de la wiki y se mantienen como `pending` con sus límites visibles para el lector.
4. **Clasificar es una decisión editorial.** Marqué como `interpretation` las dataciones («hace unos 1.000 / 2.600 / 3.700 años») porque la fuente citada las presenta como reconstrucción; y como `unknown` solo dos interrogantes que el propio dossier declara abiertos. Es una propuesta que debe aprobarse, no un hecho.
5. **Fichas que reúnen varios sucesos** (candidatas a dividir, **sin ejecutar**: no hay evidencia verificada suficiente para justificar los nuevos IDs):
   - `evt-era-siete`: consolidación del sistema de siete naciones (≈2.000 años) y tradición de Khaenri’ah (otro tema, otro narrador).
   - `evt-tres-dioses-sumeru`: amistad de los tres, muerte de Nabu Malikata, crisis de Deshret y pacto de Apep.
   - `evt-enkanomiya-watatsumi`: Byakuyakoku/Helios y Orobashi/traslado, que el propio texto dice no ser contemporáneos.
   - `evt-caida-guili` incorpora Havria y Chenyu, que ya tienen ficha propia: hoy la afirmación `claim-guili-otros-dioses` enlaza los tres.
     Regla de división: conservar el ID actual para el suceso principal y sus enlaces, y crear IDs nuevos para lo que se separe.
6. **Coherencia temporal del corpus** (revisada sobre las 29 fichas): todos los acontecimientos con tiempo aproximado declaran `approximate` en su certeza; las cinco relaciones de anterioridad son dirigidas; la única con fechas comparables (Decarabian → Vennessa, −2.600 → −1.000) es coherente. Las cuatro primeras anterioridades (mundo elemental → conquista celestial → mundo humano → guerra de la Llama Funeraria) **no tienen respaldo registrado**: dependen solo de la afirmación del dossier.
7. **Posición visual:** el diseño ya avisa de que filas y distancias no expresan fechas ni simultaneidad, y 23 de 29 acontecimientos no tienen fecha. No se encontró ninguna colocación que sugiera una fecha concreta, pero el lector sí puede inferir orden por la posición horizontal dentro de cada capítulo; esa lectura solo está respaldada donde hay anterioridad expresa.

## Qué falta para completar el corpus (punto 8)

1. Decidir si se amplía la selección de P1 con textos primarios del lore antiguo (necesita tu aprobación y una revisión de cobertura).
2. Aplicar el procedimiento a los 16 acontecimientos sin afirmaciones.
3. Que una persona revise y marque `reviewed` (con responsable y fecha) las afirmaciones, y apruebe o corrija las asignaciones de revelación y las clasificaciones de este informe.
4. Dividir las fichas indicadas solo cuando exista evidencia que lo justifique.

Hasta entonces el corpus mantiene su estado `provisional` y sus límites son visibles en cada ficha.
