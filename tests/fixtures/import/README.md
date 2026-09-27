# Fixtures sintéticos de importación

Todos los títulos, textos, IDs y condiciones de `raw/` son demostración. Imitan únicamente los campos del formato observado en P1; no son lore ni archivos del proveedor. El manifiesto de prueba se construye con `contentOrigin: synthetic`, commit de ceros y hashes calculados sobre estos bytes. Nunca se descargan desde el proveedor.

La misión tiene una elección con dos ramas, texto en Medium, un terminador `0`, un hablante desconocido y un entero opaco de 64 bits. El documento tiene dos fragmentos (uno con HTML que debe permanecer texto). El encuentro tiene otro formato, condiciones y dos finales. Las pruebas mutan copias temporales, no estos originales.

La regla de .gitattributes desactiva la conversion de finales de linea en raw/ para conservar sus bytes y hashes al hacer checkout en Windows. Prettier tambien excluye estos originales sinteticos.
