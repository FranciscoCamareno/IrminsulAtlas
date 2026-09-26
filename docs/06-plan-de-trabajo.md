# Plan de trabajo y validación

Estado al 25 de septiembre de 2026: base implementada y prototipo de fase 2 con cronología a pantalla completa, gestos y ficha. Hay pruebas automatizadas de dominio, React/D3 en DOM simulado y HTTP. La revisión visual en navegador y el cierre de la fase 2 siguen pendientes. El MVP no está completo.

## Fase 0 — Inspección y decisiones

- [x] Inspeccionar el repositorio y preservar trabajo existente.
- [x] Confirmar o registrar como provisionales stack, escala narrativa y alcance.
- [x] Definir estilo inicial, navegadores objetivo e idioma.
- [x] Mantener API y hosting como pendientes si aún no se eligen.

Entrega: decisiones documentadas y plan concreto de la primera iteración. Si no existe API, continuar con datos sintéticos; no bloquear el prototipo.

## Fase 1 — Base y modelo

- [x] Preparar Astro + React + TypeScript estricto.
- [x] Definir scripts reales de desarrollo, compilación y validación.
- [x] Crear esquemas para eventos, entidades, fuentes y relaciones.
- [x] Preparar fixtures identificados para los casos solicitados en esta etapa: incertidumbre, relaciones, spoilers y fuentes múltiples.
- [x] Implementar validación de IDs y referencias.
- [x] Generar página inicial y ruta de evento básica.
- [ ] Completar revisión visual y de interacción: hidratación, teclado, historial y móvil a 320 px.

Entrega: proyecto ejecutable localmente y contenido validado. Actualizar README con los comandos que realmente existan.

## Fase 2 — Cronología

- [x] Layout inicial por épocas y orden narrativo.
- [x] Zoom, desplazamiento y restablecimiento con D3 y controles de teclado.
- [x] Tres niveles de detalle y agrupación inicial por épocas.
- [x] Selección y ficha contextual.
- [x] Relaciones del evento seleccionado.
- [ ] Validar visualmente el prototipo en escritorio y móvil, incluidos gestos físicos.
- [ ] Ajustar umbrales, densidad y colisiones con un corpus representativo; la agrupación general por densidad sigue pendiente.

Entrega: explorar, abrir y volver sin perder contexto. Verificar eventos densos, simultáneos y desconocidos.

## Fase 3 — Exploración y accesibilidad

- [ ] Búsqueda y filtros.
- [ ] Reglas de spoilers en todas las superficies.
- [ ] Enlaces directos e historial.
- [ ] Móvil, teclado, vista de lista y movimiento reducido.
- [ ] Estados vacíos y de error.

Entrega: flujo completo usable sin depender del ratón o de una API disponible.

## Fase 4 — Fuente real y contenido

- [ ] Evaluar API real y registrar contrato, cobertura y condiciones.
- [ ] Implementar adaptador, snapshots y detección de cambios.
- [ ] Vincular fuentes importadas a eventos editoriales.
- [ ] Revisar 30–50 eventos para completar contenido del MVP.
- [ ] Mantener compilación reproducible y fallos seguros.

Si no se identifica una API adecuada, registrar la limitación y usar contenido editorial manual verificado. No afirmar que existe integración.

## Fase 5 — Validación final y publicación solicitada

- [ ] Medir rendimiento con datos y dispositivos representativos.
- [ ] Revisar coherencia visual y enlaces.
- [ ] Completar documentación operativa.
- [ ] Solo si el usuario pide publicar: configurar alojamiento y desplegar.
- [ ] Comprobar el resultado publicado y conservar una versión recuperable.

## Pruebas prioritarias

| Prueba | Resultado esperado |
| --- | --- |
| Referencia inexistente | Validación falla con identificación del archivo y campo |
| Fecha desconocida | Se presenta incertidumbre sin inventar valor |
| Relación cíclica narrativa | Permitida si no expresa anterioridad estricta imposible |
| Restricción temporal imposible | Error explicable o revisión editorial requerida |
| Evento bloqueado | No aparece en buscador, conteos, conexiones o títulos |
| Relación con revelación propia | Oculta aunque sus extremos estén visibles |
| URL bloqueada | Aviso neutro; no amplía progreso automáticamente |
| Zoom repetido | Conserva ancla y evita etiquetas ilegibles |
| Atrás/adelante | Recupera selección y filtros documentados |
| Teclado y móvil | Funciones esenciales disponibles |
| API incompleta o esquema cambiado | No sustituye snapshot válido ni publicación |
| Fuente modificada | Marca los eventos asociados para revisión |
| Almacenamiento local no disponible | Funciones esenciales siguen utilizables |

## Definición de terminado del MVP

RF-01 a RF-12 implementados, contenido revisado, casos difíciles comprobados, compilación válida, navegación accesible, sin secretos publicados y documentación ajustada a lo construido. La publicación no es obligatoria para considerar listo el prototipo local.

## Registro de avances

Añadir en cada iteración: fecha, fase, cambios, comprobaciones, limitaciones y siguiente paso. No rellenar avances hipotéticos.

### 2026-09-25 — Auditoría P0 del plan de integración

- Auditoría sin cambios de implementación: [estado actual, matriz RF-01–RF-12 y archivos afectados por futuras fases](validation/estado-actual.md). Esta P0 corresponde al plan 10, no sustituye las fases originales ni las cierra.
- Confirmados Astro/React/TypeScript, dominio Zod, carga local y cronología con 14 eventos demo. No hay importador, proveedor real, fragmentos verificables, búsqueda ni filtros del MVP.
- Lint, tipos, 36 pruebas y build correctos. `npm run validate` falla previamente en formato de `10-plan-integracion-lore-y-pruebas.md`, conservado sin reformatear. Revisión de navegador/móvil y rendimiento interactivo pendientes.
- Sin Git disponible ni `.git`: no se pudo registrar un commit. Copia local previa en `.validation/p0/estado-previo-2026-09-25.zip`, verificada mediante SHA-256 para los 49 archivos inspeccionados.
- Siguiente incremento recomendado: P1, muestra acotada de cobertura con snapshot identificado y revisión humana explícita. Antes de modificar implementación, recuperar la validación conjunta y establecer el punto Git cuando esté disponible. No se ejecutaron P1–P7 ni se desplegó.

### 2026-09-24 — Base inicial

- Núcleo Zod con tipos inferidos, validación estructural e integridad transversal, reglas de visibilidad y consultas filtradas.
- Carga local de editorial y misiones normalizadas separadas, cinco eventos sintéticos, interfaz mínima con progreso y detalle por ID. Sin API real ni despliegue.
- 25 pruebas correctas; lint y formato correctos; tipos sin errores ni advertencias; compilación de tres páginas y arranque de servidor verificados; respuestas HTTP 200 en inicio y ruta de detalle.
- La prueba de HTML verifica ausencia de títulos bloqueados en contenido renderizado y escape de texto. No certifica hidratación ni interacción real.
- Limitación: herramienta de navegador sin navegadores disponibles. Matriz manual pendiente y versiones en [08-base-inicial.md](08-base-inicial.md).
- Próximo paso: completar esa comprobación visual e iniciar el layout por épocas. Spoilers y navegación tienen una base funcional; su integración con cronología, búsqueda y filtros mantiene la fase 3 pendiente. Casos densos y simultáneos se abordarán con el layout.

### 2026-09-25 — Cronología como protagonista

- Rediseño solicitado a partir del esquema propio y la referencia de DARK: barra mínima, lienzo completo, menú plegable y ficha al seleccionar. Tema carbón con alternativa clara; secciones futuras decorativas.
- Layout separado, conexiones SVG, nodos HTML, pan/zoom D3, agrupaciones por época, tres niveles y lista accesible. Corpus ampliado a catorce eventos ficticios con diecisiete relaciones.
- Pruebas de React/D3 en jsdom para gestos, ancla, controles, selección, enlaces, progreso y viewport estrecho. Tipos, build y HTTP se verifican con el flujo de validación. Evidencia y límites en [09-cronologia-inmersiva.md](09-cronologia-inmersiva.md).
- El entorno continúa sin navegador conectado: no se certifica revisión visual ni gestos físicos. Próximo paso: revisar composición y calibrar con contenido representativo. No se desplegó.
