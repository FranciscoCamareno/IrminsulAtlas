# N-00 — Reproducción de la base en el entorno en la nube

Fecha: 05/10/2026. Seguido: [guía 13](../13-guia-tecnica-agente-nube.md). Estos son los **resultados de esta ejecución**; las 109/26 pruebas de [cierre-tecnico-v1](cierre-tecnico-v1.md) (Windows/Edge) son una referencia aparte.

## Entorno

| Elemento   | Valor                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------ |
| Commit     | `a5fbd4b` (`main`), rama de trabajo `claude/sleepy-ritchie-7esvu5`                         |
| Sistema    | Linux (contenedor), Intel Xeon 2,1 GHz, 4 CPU                                              |
| Node / npm | 24.21.0 / 11.19.0 (tarball oficial; el entorno traía Node 22, fuera de `engines`)          |
| Navegador  | Chromium 141 preinstalado (`/opt/pw-browsers/chromium`, vía `E2E_CHROMIUM_PATH` implícito) |

## Comandos y códigos de salida

| Comando                                                                                     | Salida | Resultado                                                                                                            |
| ------------------------------------------------------------------------------------------- | -----: | -------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                                                                    |      0 | Instalación limpia desde `package-lock.json`                                                                         |
| `npm run validate:code`                                                                     |      0 | Formato, lint, tipos (0 diagnósticos), **109 pruebas** en 10 archivos, 8 páginas                                     |
| `npm run content:acquire`                                                                   |      0 | 100 archivos verificados por hash (141 con las ampliaciones posteriores)                                             |
| `npm run content:import`                                                                    |      0 | Candidato `9af75c4c…` (51 fuentes, 428 segmentos), idéntico al de la ejecución anterior: reconstrucción determinista |
| `content:validate`, `content:diff`, `content:evidence`, `content:promote` con ese candidato |      0 | Versión aceptada `675999db…`; evidencia válida antes de promover                                                     |
| `npm run validate`                                                                          |      0 | `validate:code` + `content:evidence`                                                                                 |
| `npm run build` + `npm run test:e2e`                                                        |      0 | **26 pruebas** en 5 archivos (Chromium 141 en Linux)                                                                 |

## Diferencias respecto de los informes anteriores

- Mismos recuentos (109 y 26) que el cierre técnico en Windows; no se detectó ningún fallo del entorno compatible.
- La instalación del navegador no hizo falta: se usa el Chromium del contenedor. `npx playwright-core install chromium` sigue siendo la vía en otras máquinas.
- La API de árboles de GitHub no está disponible para el repositorio del proveedor desde este entorno: las huellas de archivos nuevos que se añadan al importador se calculan al descargarlos (confianza en el primer uso, anotada en el manifiesto). Los 100 archivos originales conservan su inventario de P1.
- Límite: la reconstrucción se hizo sobre una caché ya presente (`.validation/`); un clon completamente nuevo tardó ~20 s en descargar los 100 archivos originales en la primera ocasión (informe anterior).
