# Importación P2

Herramientas de Node fuera del cliente. Ver [comandos, contratos y validaciones](../../docs/validation/importador-p2.md).

- `content:acquire`: adquirir explícitamente el snapshot P1 fijado.
- `content:import`: verificar caché y generar un candidato sin red.
- `content:validate -- ID` / `content:diff -- ID`: revisar un candidato.
- `content:promote -- ID`: aceptar localmente solo fuentes completas.
- `content:validate`: comprobar la última versión local aceptada.
- `content:evidence -- ID`: verificar el registro editorial y sus fragmentos contra el candidato sin promoverlo. Ejecutar antes de `content:promote`.
- `content:evidence`: verificar contra la importación aceptada; forma parte de `npm run validate`.

Después de traer cambios con Git, regenerar la selección ampliada con `content:acquire` y `content:import` si faltan fuentes: los datos aceptados están ignorados por Git. La comprobación de un candidato no modifica `accepted.json`. `npm run validate:code` permite comprobar código y build sin material importado, pero no certifica evidencias.

La selección está en `selection.json`; los contratos, en `src/domain/schema.ts`. No crea eventos ni publica contenido.
