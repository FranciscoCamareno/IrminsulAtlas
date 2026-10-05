# Validación técnica recuperada — 05/10/2026

Fecha: 5 de octubre de 2026. Commit base: `7ae8060dae8c8bffa750996a7591a4cf596264d6` (rama `claude/sleepy-ritchie-7esvu5`), más los cambios de configuración descritos abajo. Este informe es **nuevo**: no sustituye ni reinterpreta los resultados de [P0](estado-actual.md), [P2](importador-p2.md) ni del [dossier](dossier-historia-antigua.md), que siguen siendo registros históricos de sus fechas y entornos (Windows, Node 24.21.0).

## Entorno de esta ejecución

| Elemento     | Valor                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| Sistema      | Linux 6.18 (contenedor remoto), checkout con LF                                     |
| Node, npm    | `24.21.0` y `11.19.0` (tarball oficial verificado con SHA-256); dentro de `engines` |
| Dependencias | `npm ci` desde `package-lock.json`, sin cambios en `package.json` ni en el lockfile |
| Telemetría   | `ASTRO_TELEMETRY_DISABLED=1`                                                        |

## Resultado de `npm run validate`

Código de salida 0.

| Paso        | Resultado                                                            |
| ----------- | -------------------------------------------------------------------- |
| Formato     | Prettier: todos los archivos coinciden                               |
| Lint        | ESLint sin diagnósticos                                              |
| Tipos       | `astro check`: 37 archivos, 0 errores, 0 advertencias, 0 sugerencias |
| Pruebas     | Vitest: 6 archivos, 71 pruebas aprobadas (24 del importador)         |
| Compilación | `astro build`: 8 páginas estáticas                                   |

## Problemas de entorno frente a errores reales

No apareció ningún error real de código: no se modificó `src/`, `scripts/`, `tests/` ni `content/`.

1. **Finales de línea (causa de configuración, ya corregida).** Con `core.autocrlf=true` (valor habitual en Windows) Git entrega los archivos con CRLF y Prettier, que exige LF, falla. Reproducido aquí con un clon `-c core.autocrlf=true`: 79 archivos con CRLF y Prettier señalaba 60. El repositorio guarda LF (`git ls-files --eol`: 94 archivos `i/lf`), así que no era un defecto del contenido.
   - `.gitattributes`: `* text=auto eol=lf`; se conserva `tests/fixtures/import/raw/** -text`, que tiene prioridad y mantiene los bytes exactos de los fixtures.
   - `.prettierrc.json`: `endOfLine: "lf"` explícito. `.editorconfig` nuevo con `end_of_line = lf`.
   - Comprobación tras el cambio: un clon con `core.autocrlf=true` produce 0 archivos con CRLF, `prettier --check` pasa y los fixtures protegidos son idénticos byte a byte a los del repositorio.
2. **Versión de Node.** El contenedor traía Node 22.22.0, fuera de `engines` (`>=24 <25`). Las 71 pruebas también pasan con Node 22, pero la validación oficial se hizo con Node 24 para respetar el contrato del proyecto.
3. **Carpetas temporales del importador (limitación de entorno, no de código).** `tests/import.test.ts` crea sus casos en `.validation/p2/tests/` dentro del repositorio, no en la carpeta temporal del sistema. En el entorno Windows con sandbox anterior esa escritura estaba restringida; aquí el directorio es escribible y las 24 pruebas del importador pasan. Si vuelve a fallar con `EPERM`/`EACCES`, ejecutar fuera del sandbox o conceder escritura a `.validation/`; un fallo de aserción en esas pruebas sí debe tratarse como error real.

## Repetir la validación

```sh
node -v          # v24.x; npm -v: 11.x
npm ci
npm run validate
```

- En PowerShell usar `npm.cmd` si `npm.ps1` está bloqueado. Opcional: `$env:ASTRO_TELEMETRY_DISABLED='1'`.
- **Checkouts de Windows ya existentes** conservan CRLF hasta renormalizarse. Con el árbol limpio: `git add --renormalize .` y comprobar que `git status` no muestra cambios (los archivos ya son LF en el repositorio), o bien `git rm --cache -r . && git reset --hard` tras guardar cambios locales. No aplicar `prettier --write` a los fixtures de `tests/fixtures/import/raw/`.
- Solo el importador: `npx vitest run tests/import.test.ts`.

## Límites

Se validó en Linux con Node 24. No se repitió en Windows real; el comportamiento con `core.autocrlf=true` se comprobó mediante simulación de checkout. Esto no acredita navegadores, accesibilidad, gestos táctiles ni rendimiento.

## Actualización posterior (mismo día, tras la entrega de la primera versión)

Misma máquina y herramientas (Node 24.21.0, npm 11.19.0). `npm run validate` sigue terminando con código 0 con los cambios de spoilers, búsqueda, índice ligero, evidencias y cronología:

| Paso        | Resultado                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Formato     | Prettier: todos los archivos coinciden                                                                           |
| Lint        | ESLint sin diagnósticos                                                                                          |
| Tipos       | `astro check`: 0 errores, 0 advertencias, 0 sugerencias                                                          |
| Pruebas     | Vitest: 8 archivos, **101** pruebas aprobadas                                                                    |
| Compilación | `astro build`: 8 páginas y 117 archivos de datos estáticos (índice, texto, 29 eventos, 82 fichas y 4 documentos) |

Aparte, `npm run test:e2e` (5 archivos, **24** pruebas de navegador en Chromium 141) pasa en dos ejecuciones consecutivas; no forma parte de `validate` porque necesita un navegador (véase el README). Los resultados de la sección anterior se conservan como estaban en su momento: el recuento de 71 pruebas era el del commit `7ae8060`.
