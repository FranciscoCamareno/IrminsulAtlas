# Base inicial: decisiones y evidencia

Fecha: 24 de septiembre de 2026. Alcance autorizado: base técnica, dominio, carga local y página mínima. La especificación del MVP permanece como trabajo futuro.

> Registro histórico de la primera iteración. El rediseño posterior, la incorporación de D3 y las pruebas de interacción se documentan en [09-cronologia-inmersiva.md](09-cronologia-inmersiva.md). Los conteos y limitaciones descritos aquí corresponden al estado inicial.

## Stack verificado

| Elemento                   | Versión utilizada |
| -------------------------- | ----------------- |
| Node / npm del entorno     | 24.21.0 / 11.19.0 |
| Astro / integración React  | 7.3.5 / 7.0.0     |
| React y React DOM          | 19.3.0            |
| TypeScript / Zod           | 6.0.3 / 4.6.5     |
| Vitest                     | 5.0.1             |
| ESLint / typescript-eslint | 10.11.0 / 8.70.1  |
| Prettier / plugin Astro    | 3.9.9 / 1.1.0     |

Se consultaron versiones estables, `engines` y `peerDependencies` en npm. `npm ls --depth=0`, instalación, tipos y compilación confirman una resolución compatible. Dependencias directas fijadas y transitivas conservadas en `package-lock.json`. El proyecto limita el entorno a Node 24 y npm 11 para acotar la matriz inicial.

Referencias verificadas: [instalación de Astro](https://docs.astro.build/en/install-and-setup/), [integración React](https://docs.astro.build/en/guides/integrations-guide/react/), [Zod](https://zod.dev/), [Vitest](https://vitest.dev/guide/). La compatibilidad concreta se contrastó también con los paquetes instalados; la documentación en línea puede evolucionar.

ESLint analiza TS/TSX y JS (incluidas reglas de hooks). Astro check comprueba TS/TSX y Astro. Prettier es el único formateador e incluye Astro. No se añadió un segundo formateador, framework CSS, estado global ni herramientas visuales extensas. La especificación original se excluye del formateo automático para evitar cambios ajenos.

## Límites y contratos

- **Dominio:** esquemas Zod independientes de Astro, tipos inferidos, integridad y visibilidad. No se duplican contratos con interfaces manuales. Zod es su única dependencia de ejecución.
- **Contenido:** `src/content/local.ts` lee dos archivos, valida estructura y luego comprueba el conjunto. Fallos de lectura o validación abortan la carga; no hay omisiones silenciosas ni escritura de datos. El error conserva ubicación y causa sin imprimir respuestas de proveedores.
- **Aplicación:** `catalog.ts` ordena por época y orden editorial, resuelve evidencia y devuelve proyecciones permitidas. Ni páginas ni componentes deciden reglas históricas o de spoilers.
- **Interfaz:** Astro genera páginas estáticas y React mantiene progreso/navegación. Etiquetas visuales y enlaces pertenecen a la interfaz. Los textos editoriales deben respetar sus propios requisitos; el programa no detecta revelaciones semánticas dentro de un párrafo.
- **Visualización futura:** no se creó código vacío. El layout recibirá eventos filtrados y devolverá coordenadas aparte; nunca convertirá `unknown` a una fecha numérica. D3 no se instala hasta que haya cálculos/gestos que lo usen.

Se eligió JSON local explícito en lugar de colecciones Astro porque este pequeño conjunto requiere integridad transversal y debe poder probarse sin el framework. Markdown/colecciones podrán incorporarse como otra entrada sin alterar los contratos.

## Modelo concretado

IDs estables globalmente únicos; slugs únicos por universo/idioma; referencias dentro del mismo universo. Las fuentes importadas conservan identidad proveedor/ID externo/idioma. Todo registro declara estado `demo`, `draft` o `reviewed`. Los borradores no se publican en las consultas; registros reales no pueden depender de demostración.

El tiempo es una unión de `exact`, `approximate`, `range`, `relative` y `unknown`. Cada tiempo numérico identifica un sistema declarado por su universo. `range.approximate` conserva límites inciertos; `approximate.margin` es opcional. `relative.before/after` son restricciones explícitas; no contienen fechas de conveniencia. Se rechazan intervalos invertidos y ciclos de anterioridad (incluidas relaciones `precedes`). Las asociaciones narrativas pueden formar ciclos. No se infieren fechas, simultaneidades o contradicciones numéricas transitivas.

`displayOrder` es orden editorial dentro de una época; `revelation.order` y sus hitos representan revelación, sin conceder acceso. Solo `spoilerRequirements` concede visibilidad mediante cumplimiento de todos sus hitos. Importancia visual, certeza (`fact`, `interpretation`, `theory`) y estado editorial son dimensiones independientes.

`Mission` es una variante de `Source`, no una lista de eventos. La ausencia de texto se registra como `text.status = missing` con razón, nunca como diálogo vacío inventado. Evidencias enlazan fuentes con localizador, afirmación, postura (respalda/contradice), observación opcional y requisitos propios. Los fixtures contienen una fuente compartida por varios eventos y un evento con dos fuentes contradictorias.

La comprobación de ciclos es una regla de consistencia de referencias; no es un motor temporal. No se comprueban todavía todas las contradicciones entre fechas exactas y restricciones relativas.

## Entrada externa futura

Contrato mínimo: `MissionProvider.loadMissions(): Promise<readonly Mission[]>`. La implementación local lee `content/imported/demo-missions.json`. Un adaptador futuro validará la respuesta real de un proveedor y devolverá ese formato; la entrada común vuelve a validarlo. No se modelaron detalle, paginación ni autenticación sin conocer un proveedor.

`content/editorial/` es edición propia; `content/imported/` es fuente normalizada. El fixture importado actual se escribió manualmente para demostración. Una futura salida generada vivirá separada del editorial y se documentará con su proveedor. La carga actual no escribe ni promociona archivos. No existe aún infraestructura que garantice la promoción segura de una publicación externa.

## Interfaz y spoilers

Tokens de `styles.md`, crema/carbón, tipografías con fallbacks locales (sin descarga de fuentes), controles nativos y lista adaptable. La escala visual y el mapa de conexiones completos permanecen pendientes. No hay animaciones que requieran reducir movimiento.

La isla contiene el corpus de demostración serializado. El filtro se aplica antes de producir listas, conteos, relaciones, participantes, fuentes y etiquetas temporales relativas. Una referencia temporal bloqueada no expone el título del evento aludido. El control de progreso usa etiquetas deliberadamente seguras.

Rutas: `/` y `/evento/?id=…`; `/404.html` para rutas inexistentes. En detalle, el servidor genera un estado neutro y React consulta el ID al hidratar. Título y descripción de documento son genéricos. `pushState`/`popstate` conservan selección y progreso de memoria al navegar con enlaces de la isla; no se persisten filtros ni viewport porque no existen. Los enlaces modificados (Ctrl/clic, nueva pestaña) conservan su comportamiento nativo. Sin JavaScript queda disponible la lista inicial, pero no el detalle.

Un ID inexistente dentro de `/evento/` produce un estado de interfaz, no un HTTP 404, porque la ruta es estática. No hay slugs sensibles en enlaces públicos ni ampliación de progreso desde URL. Los recursos son públicos e inspeccionables: protección de experiencia, no confidencialidad.

## Evidencia de validación

- `npm run format:check`: correcto.
- `npm run lint`: correcto.
- `npm run check`: cero errores, advertencias e indicaciones.
- `npm test`: 25 pruebas, dos archivos, correctas. Incluyen entrada inválida, referencias, identidad, incompletitud, incertidumbre, ciclos estrictos, visibilidad indirecta y escape de texto en HTML.
- `npm run build`: correcto; inicio, detalle y 404 generados.
- `npm run dev -- --host 127.0.0.1`: arranque correcto; peticiones HTTP al inicio y detalles con ID bloqueado/inexistente devuelven 200 con isla Astro.
- No había navegador disponible en la herramienta de control; no se obtuvo evidencia visual ni se ejecutó una prueba de hidratación real. No se instaló infraestructura extensa para suplir esa limitación.

Revisión manual pendiente en Chromium/Edge, Firefox y Safari actuales (objetivos, todavía sin certificación):

1. Inicio: cuatro eventos; marcar lectura A: cinco; desmarcar: cuatro.
2. Detalle del evento 02: relación al 05 solo con A y al 03 solo con B.
3. Abrir `/evento/?id=demo-event-05` en pestaña nueva: aviso neutro; marcar A revela el detalle; quitar A vuelve a ocultarlo.
4. Abrir ID inexistente; volver a lista; comprobar atrás/adelante y foco del encabezado con teclado.
5. Probar a 320 px y con zoom del navegador: texto sin desplazamiento horizontal, contraste y foco visibles, controles operables.
6. Desactivar JavaScript: lista inicial legible y aviso de limitación de controles.

Limitación del entorno: la carpeta inicial tampoco tenía metadatos `.git` y Git no estaba disponible. Se conservaron los documentos originales y se actualizaron las decisiones pertinentes; no se creó historial ni se publicó nada.
