# Revisión editorial de la muestra — resultados del 05/10/2026

Procedimiento: [docs/12](../12-procedimiento-revision-editorial.md). Datos: `content/editorial/genshin-evidence.json` (46 afirmaciones, 51 fuentes). Todo permanece **`pending`**: ninguna afirmación está aprobada editorialmente y este informe no equivale a esa aprobación.

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

## Ampliación de textos primarios (05/10/2026)

El usuario autorizó ampliar la selección de P1. De los 1.862 documentos de la tabla `Document` se eligieron por título los que podían tratar el lore antiguo, se descargaron (URL fijada al commit `b061b40…`), se buscaron en ellos 55 términos del dossier y se importaron **32 textos** con el importador P2 (candidato `9af75c4c…`, versión aceptada `675999db…`: 51 fuentes, 428 segmentos, sin errores):

| Obra (documentos)                                                                                                                                               | Respalda                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| La leyenda de Vennessa I–II; Genealogía de los Gunnhildr                                                                                                        | Revolución de Vennessa; rebelión contra Decarabian                                                                    |
| Lo ocurrido antes del sol y la luna; La serpiente y los dragones del reino de Tokoyo; Hidrología del reino de Byakuya; Luces y sombras; Crónicas de Sangonomiya | Conquista celestial, mundo humano, mundo elemental, Guerra de la Llama Funeraria (testimonio), Enkanomiya y Watatsumi |
| Informes de investigación: Mare Jivari y Bakunawa                                                                                                               | Mare Jivari                                                                                                           |
| La caída de Remuria I–III; Crónicas de Gurabad I–V (se cita la III); Crónicas del Monte Damavand I–III                                                          | Remuria; Gurabad                                                                                                      |
| Perinheri I–II                                                                                                                                                  | Tradición de Khaenri’ah                                                                                               |
| Historia general de Snezhnaya I–II; Letanías del Lejano Norte I–III                                                                                             | Hiperbórea; Koitar y Seutervoinen                                                                                     |

Se añadió el tipo de fuente `document` (lectura sin catálogo de libros) al esquema. Las huellas de los 32 archivos nuevos (SHA-256 y git blob SHA-1) se calcularon **al descargarlos**, porque la API de árboles de GitHub no estaba disponible para ese repositorio: es una confianza en el primer uso, anotada en el manifiesto, y el commit fijado hace inmutable la URL. No se importaron los libros sobre Natlan, Fontaine tardía ni Snezhnaya moderna que no respaldan afirmaciones del dossier.

## Resultado cuantitativo (`npm run content:evidence`)

- **46 afirmaciones** (30 datos explícitos, 4 testimonios, 10 interpretaciones, 2 cuestiones abiertas) y **51 fuentes** (20 importadas, 31 externas). Cero `reviewed`.
- **17 de 29** acontecimientos tienen afirmaciones; **13** tienen al menos una contrastada con texto del juego. Faltan afirmaciones en 12 (lista en la salida del comando).
- **37 apoyos contrastados** con fragmentos fijados por hash, en **27 de las 46** afirmaciones. Antes eran 4 apoyos de un único texto.
- Verificación contra la importación aceptada `675999db…`: 0 incidencias.

## Hallazgos (valoración crítica)

1. **El dossier se confirma en lo esencial, pero con diferencias que importan.** Antes casi todo era «citado»; ahora la mayoría de las afirmaciones de la muestra tienen un texto del juego. Esos textos no coinciden siempre con el dossier ni con la wiki.
2. **Discrepancia de datación en Decarabian (la más importante).** _Genealogía de los Gunnhildr_ sitúa la guerra de Decarabian y Andrius «hace tres mil años»; el dossier dice «unos 2.600» (reconstrucción de la wiki). La cifra del juego es redonda y aproximada, pero hay que decidir cuál se muestra y cómo. Afecta también a «entre ambas ~un milenio y medio». Queda registrada como apoyo `contradicts` para que el lector la vea.
3. **Vennessa.** Ahora hay texto primario que confirma la ayuda de Barbatos (_La leyenda de Vennessa II_), que fue prisionera de un tirano y «la primera caballera»; _Aquila Favonia_ confirma el derrocamiento y la fundación de la Orden. **Sigue sin sostenerse «obligada a combatir»**, y ningún texto la fecha («hace mil años» es solo de la wiki).
4. **Remuria.** El texto de Fontaine confirma a Remo, la serenata contra el destino y el relevo por la «noble navegante»; no nombra a Egeria, Phobos, Boethius ni Scylla. Además dice que la tragedia fue «hace apenas un siglo» **respecto a su fecha de escritura**, que no conocemos. El dossier no data Remuria; el dato queda anotado como hallazgo sin incorporarlo.
5. **Dos tensiones de orden relativo por revisar.** (a) _Crónicas de Gurabad_ muestra a Deshret «sin responder» mientras Gurabad se descompone; el dossier coloca la caída de Gurabad antes de la crisis de Deshret, y el fragmento no aclara si esa crisis ya había comenzado. (b) Una nota de _Hidrología del reino de Byakuya_ sitúa el regreso de los habitantes a la superficie «con la caída de Watatsumi», lo que choca con la idea de que su salida es anterior. Ambas son `context` con límites y esperan una decisión editorial.
6. **Koitar y Seutervoinen:** el texto primario las muestra como esposos (letanía XI) y menciona la «nave de bronce» de Seutervoinen, pero **no** que Koitar esté vinculada a los ángeles ni que Seutervoinen sea una «viajera estelar que ocupó un cuerpo»: esas partes siguen respaldadas solo por la wiki.
7. **Mare Jivari:** el informe del juego confirma que «según la versión predominante solo existe desde hace cinco siglos» y recoge la leyenda de una orquesta «hace miles de años» con la hipótesis de una disrupción temporal: respalda de forma directa la discrepancia que el dossier ya conservaba. No nombra a Tenoch ni a Sanhaj.
8. **Lo que el libro de Enkanomiya cubre.** _Lo ocurrido antes del sol y la luna_ respalda Primordial, cuatro sombras, cuarenta años, «Fanes», los cuatrocientos años de la preparación para los humanos y Abraxas/Helios. **No** enumera las cuatro autoridades (vida, muerte, tiempo, espacio) ni nombra a Nibelung: esas afirmaciones del dossier siguen citadas.
9. **Narradores.** Casi todos los textos tienen narrador propio (Enkanomiya, un historiador de Fontaine, un cronista del shogunato). Se registran como contrastados con ese límite, no como hechos neutrales.
10. **Siguen sin respaldo primario** Sumeru más allá de Gurabad (Deshret, Apep), Natlan (fundación, Ochkanatlan), Nibelung y las tres lunas, los pilares, Vindagnyr, Khaenri’ah, el Cataclismo y la llegada de los gemelos. No se encontraron textos relevantes en los documentos revisados por título; podrían estar en misiones y diálogos (otra vía de importación).
11. **Fichas que reúnen varios sucesos** (candidatas a dividir, **sin ejecutar**): `evt-era-siete` (sistema de siete naciones y tradición de Khaenri’ah), `evt-tres-dioses-sumeru`, `evt-enkanomiya-watatsumi` (el libro mismo habla de tres épocas: oscuridad, Hijo del Sol, Watatsumi) y `evt-caida-guili` (Havria y Chenyu ya tienen ficha). La división necesita tu decisión y ahora hay evidencia primaria para sostenerla en Enkanomiya.
12. **Coherencia temporal del corpus:** todos los tiempos aproximados declaran `approximate`; las cinco anterioridades son dirigidas; la de Decarabian → Vennessa (−2.600 → −1.000) es coherente con las cifras de la wiki pero ahora hay que revisarla con la cifra del juego. Las cuatro primeras anterioridades cósmicas siguen sin afirmación propia (el libro de Enkanomiya las respalda en parte).

## Qué falta para completar el corpus (punto 8)

1. Decidir qué cifra de Decarabian y qué tensiones de orden (puntos 2 y 5) se presentan, y si se incorpora el dato de Remuria.
2. Aplicar el procedimiento a los 12 acontecimientos sin afirmaciones; para varios hará falta importar misiones o diálogos, no solo libros.
3. Que una persona revise y marque `reviewed` (con responsable y fecha) las afirmaciones, y apruebe o corrija las asignaciones de revelación y las clasificaciones de este informe.
4. Dividir las fichas indicadas solo cuando exista evidencia que lo justifique.

Hasta entonces el corpus mantiene su estado `provisional` y sus límites son visibles en cada ficha.
