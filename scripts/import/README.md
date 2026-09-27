# Importación P2

Herramientas de Node fuera del cliente. Ver [comandos, contratos y validaciones](../../docs/validation/importador-p2.md).

- `content:acquire`: adquirir explícitamente el snapshot P1 fijado.
- `content:import`: verificar caché y generar un candidato sin red.
- `content:validate -- ID` / `content:diff -- ID`: revisar un candidato.
- `content:promote -- ID`: aceptar localmente solo fuentes completas.
- `content:validate`: comprobar la última versión local aceptada.

La selección está en `selection.json`; los contratos, en `src/domain/schema.ts`. No crea eventos ni publica contenido.
