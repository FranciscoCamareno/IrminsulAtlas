# Referencias y decisiones pendientes

## Referencias visuales aportadas

- [DARK — Netflix](https://dark.netflix.io/en)
- [Cosmere Reading Order](https://17thshard.github.io/reading-order/#/)
- [Histography](https://histography.io/)

Sirven de inspiración para la experiencia. No se verificó aquí el funcionamiento completo de DARK ni Cosmere, cuyas interfaces requieren JavaScript. No inferir su stack a partir de su apariencia.

## Documentación técnica

- [Astro: islas](https://docs.astro.build/en/concepts/islands/)
- [Astro: colecciones](https://docs.astro.build/en/guides/content-collections/)
- [Astro: estructura](https://docs.astro.build/en/basics/project-structure/)
- [D3: zoom](https://d3js.org/d3-zoom)
- [D3: escalas](https://d3js.org/d3-scale)
- [MiniSearch](https://lucaong.github.io/minisearch/)
- [React Flow: nodos propios](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow: rendimiento](https://reactflow.dev/learn/advanced-use/performance)
- [Vite: compilación](https://vite.dev/guide/build)

Estos enlaces respaldan las capacidades generales comentadas. La arquitectura, alcance y criterios son propuestas propias para este proyecto. Verificar APIs y compatibilidad en las versiones elegidas al implementar.

## Decisiones propuestas y abiertas

| Tema | Estado | Criterio |
| --- | --- | --- |
| Astro + React + TypeScript | Implementado en la base | Contratos y versiones en 08-base-inicial.md |
| SVG/HTML + D3 | Prototipo implementado | React dibuja; D3 calcula y captura gestos |
| Escala narrativa | Provisional | Fechas inciertas y legibilidad |
| Identidad visual | Lienzo inmersivo carbón/crema | Referencias estructurales del usuario; 09-cronologia-inmersiva.md |
| Fuente concreta | Archivos AnimeGameData fijados a commit; importador P2 | Cobertura y exclusiones en validation/importador-p2.md; sin consulta en navegador |
| Hosting y dominio | Pendiente | Elegir al solicitar publicación |
| Capítulos/hitos de spoilers | Pendiente editorial | No confundir progreso con cronología |
| Analítica | Excluida por defecto | No es necesaria para el objetivo |
| Grafo independiente | Posterior | Añadir solo tras validar la cronología |
| Base de datos | No requerida | Reevaluar con funciones dinámicas reales |
| Idioma inicial | Español implementado | IDs independientes de textos |

## Riesgos y mitigación

- API incompleta: adaptador sustituible y fuentes editoriales manuales.
- Fechas inciertas: tipos temporales explícitos y escala narrativa.
- Demasiados elementos: agrupación y carga/renderizado selectivo.
- Spoilers indirectos: política común en búsqueda, conexiones, conteos y metadatos.
- Contenido no fiable: evidencias y revisión editorial.
- Cambios del proveedor: snapshots, diferencias y validación antes de publicar.
- Sobredimensionamiento: trabajar por fases sin incorporar funciones posteriores por anticipación.

## Plantilla breve de decisión

Al cambiar una decisión importante, registrar fecha, problema, alternativas, elección, consecuencias y documentos afectados. No hace falta convertir cada detalle de implementación en una decisión formal.

Las decisiones concretadas de esta iteración, alternativas y evidencia se registran en [08-base-inicial.md](08-base-inicial.md).
