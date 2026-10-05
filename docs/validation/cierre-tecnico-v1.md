# Cierre técnico de la primera parte — 05/10/2026

Alcance autorizado: corregir los pendientes técnicos identificados en la auditoría, sincronizar las fuentes locales y actualizar el plan. Base Git: `ddf148ec10e3019a52601e82792d028415655fa2`; rama `codex/cierre-tecnico-v1`. Se conservan los documentos originales, IDs, 29 acontecimientos, siete capítulos y 35 relaciones. El ZIP de P0 se mantiene como respaldo adicional.

## Comportamiento cambiado

- El progreso elegido permanece en memoria si obtener `localStorage` falla, no existe o rechaza escrituras. Un valor persistido anterior no puede anular una elección nueva; reducir el progreso vuelve a bloquear el contenido. Cuando escribir funciona, se mantiene la persistencia habitual.
- Los esquemas son la fuente de verdad de estados y decisiones de revisión. Las anotaciones de acontecimientos y relaciones admiten `editorialStatus`, `claimStatus` y responsable/fecha en `review`. Sin anotación se conservan `provisional` e `interpretation`. Las relaciones seleccionan afirmaciones con `claimIds`.
- Una ficha marcada `reviewed` sin decisión explícita, sin afirmaciones o con afirmaciones pendientes/discutidas detiene la carga. Las relaciones requieren afirmaciones revisadas que cubran ambos extremos. La comprobación estructural del registro sigue exigiendo respaldo contrastado para afirmaciones explícitas/testimonios y responsable/fecha. La cobertura semántica del cuerpo y el significado de una relación siguen requiriendo revisión humana.
- `content:evidence -- ID` verifica un candidato sin promoverlo ni cambiar el puntero aceptado. `validate` incluye la verificación de fragmentos contra el aceptado; `validate:code` conserva formato, lint, tipos, pruebas y build sin requerir datos importados. Ninguna de esas comprobaciones descarga.
- README y los planes distinguen lo implementado, las comprobaciones pendientes y la ampliación posterior del Viajero hasta un corte público comprobado del juego.

## Sincronización local reproducida

La fusión de Git había traído el registro ampliado, pero la importación local seguía en 19 fuentes. La adquisición verificó los 132 archivos del snapshot `b061b403c8afc7bca633cf4f201edc4a3baa75fe`, sin cambiar la selección ni el manifiesto.

| Dato                        | Resultado                                                          |
| --------------------------- | ------------------------------------------------------------------ |
| Candidato                   | `9af75c4c60264a4860404b69099b624530287b50d1bfc23f09614adeb52f01ad` |
| Fuentes                     | 55 procesadas; 51 aceptadas; 4 exclusiones existentes              |
| Segmentos aceptados         | 428                                                                |
| Diferencias                 | 32 fuentes añadidas; 19 sin cambios; ninguna eliminada/modificada  |
| Evidencias del candidato    | 46 afirmaciones, 37 apoyos contrastados; ninguna incidencia        |
| Versión aceptada            | `675999dbc9719c5fce045f96b50a895a953c00b10256e1eb1a602e5481cea7ea` |
| Versión anterior conservada | `216c2918914f40d1f4031ba47cca4d5628ed8a064498ac729fa452df783bc253` |

Se verificó el candidato antes de promoverlo. `content:validate` confirmó la versión aceptada y las 51 fuentes. Las exclusiones por textos españoles ausentes y cobertura incompleta de encuentros permanecen; no se omiten silenciosamente ni se declaran resueltas. Los datos adquiridos y normalizados continúan ignorados por Git, fuera del cliente y de `public/`.

## Validación de esta iteración

Entorno: Windows, Node 24.21.0 y npm 11.19.0. Navegador disponible: Edge 154.0.4258.53 (Chromium), usado sin interfaz por Playwright. Esta iteración no se ejecutó en Linux.

`npm run validate` terminó con código 0: formato, lint, tipos en 65 archivos sin diagnósticos, 109 pruebas correctas en 10 archivos, ocho páginas compiladas y registro de evidencias válido contra la importación aceptada (sin incidencias). La compilación genera además los JSON estáticos de índice, detalles, búsqueda y documentos.

`npm run test:e2e`, con `E2E_CHROMIUM_PATH` apuntando a Edge, terminó con código 0: **26 pruebas en cinco archivos**, 92,21 segundos. Incluye lectura de los 29 acontecimientos, navegación/zoom y táctil emulado, accesibilidad automatizada y teclado, superficies de spoilers y rendimiento con corpus sintético denso. Los dos casos nuevos de acceso/escritura de almacenamiento bloqueado pasaron. Artefactos JSON en `.validation/e2e/`, ignorados por Git. Se verifican pruebas automatizadas en Chromium; no se certifican lectores de pantalla, gestos físicos ni sesiones humanas.

- Pruebas específicas iniciales: 25 correctas en progreso, revisión del dossier, dossier y evidencias.
- Las pruebas nuevas de revisión son decisiones y fuentes **sintéticas** identificadas: no aprueban ninguna afirmación ni ficha real.
- La suite de navegador incorpora dos casos de almacenamiento bloqueado: fallo al acceder y fallo al escribir; apertura, reducción de progreso y lectura del dossier en memoria.

## Pendientes que este cierre no aprueba

Todos los acontecimientos reales siguen `provisional`; las 46 afirmaciones siguen sin revisión aprobada. 17 de 29 acontecimientos tienen afirmaciones; 12 no tienen ninguna. Las asignaciones de revelación siguen provisionales y regionales. Continúan las discrepancias recogidas en la revisión editorial.

Quedan pendientes teléfono físico, lector de pantalla, Firefox/WebKit y participantes, agrupación por densidad, navegación entre hilos regionales, filtros por facción/categoría y recuperación explícita del índice de búsqueda. P7 no completa aún el impacto de nuevos snapshots y la recuperación editorial. La meta del Viajero está registrada como siguiente ampliación; no se incorporaron nuevos arcos ni se certificó cobertura del juego hasta hoy.

No se cambiaron dependencias ni lockfile; no se publicó ni desplegó.

## Repetir

Preparar las fuentes siguiendo README (adquirir, importar, verificar candidato y promover) si no existe una versión aceptada compatible. Después:

```powershell
npm.cmd run validate
$env:E2E_CHROMIUM_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm.cmd run test:e2e
```

La ruta del navegador corresponde a este equipo; en otro equipo usar un Chromium disponible. `validate` genera `dist/` antes de la suite e2e.
