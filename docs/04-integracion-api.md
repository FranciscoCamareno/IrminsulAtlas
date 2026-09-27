# Integración de una API de misiones

> Estado al 27/09/2026: P2 implementa un proveedor de archivos AnimeGameData fijado a commit, sin API REST ni credenciales. Comandos efectivos, formato y garantías en [importador P2](validation/importador-p2.md). Este documento conserva el diseño general; paginación, reintentos, vinculación editorial y publicación no están implementados por aparecer aquí.

## Decisión recomendada

Consultar la API durante una importación previa a la compilación. Publicar datos preparados con el sitio. Los visitantes no necesitan volver a solicitar toda la información al proveedor.

No se ha elegido una API concreta. No inventar endpoints, cobertura o autenticación. Primero verificar documentación y una respuesta real permitida.

## Comparación

| Aspecto | Importación antes de publicar | Consulta desde el navegador |
| --- | --- | --- |
| Actualización | Requiere regenerar | Puede obtener cambios al consultar |
| Dependencia al visitar | Datos ya publicados | Disponibilidad del proveedor |
| Límites | Consumo por importación | Consumo multiplicado por visitantes |
| Claves secretas | Solo en entorno privado de importación | No pueden mantenerse secretas en el cliente |
| CORS | No condiciona una importación de servidor | Debe permitir el origen del sitio |
| Uso adecuado | Lore y misiones por versiones | Datos realmente cambiantes |

Si fuera imprescindible consultar una API autenticada en tiempo de ejecución, haría falta una función/backend que proteja credenciales y aplique caché y límites. Eso cambia la arquitectura, pero no obliga por sí solo a añadir una base de datos.

## Evaluación del proveedor

Comprobar y registrar:

- Cobertura: metadatos, diálogos completos, objetivos, personajes y requisitos.
- Idiomas y correspondencia de IDs entre traducciones.
- Estabilidad de identificadores y disponibilidad de versiones.
- Paginación, límites, autenticación y tamaño del corpus.
- Condiciones de reutilización, almacenamiento y atribución.
- Frecuencia de actualización y tratamiento de correcciones/eliminaciones.
- Posibilidad de snapshots y funcionamiento sin conexión durante desarrollo.
- Disponibilidad de localizadores para citar un diálogo concreto.

Disponer de una API no asegura disponer de una cronología ni permiso para redistribuir íntegramente su contenido.

## Proceso de importación

1. Leer configuración y secretos desde el entorno privado.
2. Descargar por páginas con límites de concurrencia.
3. Aplicar timeout, reintentos acotados y espera indicada por el proveedor.
4. Validar cada respuesta y detectar resultados parciales.
5. Guardar temporalmente el snapshot con proveedor, fecha, idioma y versión.
6. Normalizar IDs, campos y traducciones mediante un adaptador.
7. Comparar contra el snapshot válido anterior.
8. Emitir informe de elementos nuevos, modificados y ausentes.
9. Combinar con contenido editorial por IDs, sin sobrescribirlo.
10. Validar referencias y generar páginas e índices.
11. Promover la versión candidata solo si supera las comprobaciones.

Una misión ausente en una respuesta parcial no debe interpretarse como eliminada. Los cambios de fuentes deben marcar los eventos afectados para revisión; no modificar automáticamente sus conclusiones.

## Contrato interno del adaptador

La base inicial define únicamente `MissionProvider.loadMissions(): Promise<readonly Mission[]>` en `src/content/local.ts`, con una implementación funcional de lectura local. El adaptador futuro normalizará y validará la respuesta real de un proveedor antes de devolver estas fuentes. No se han definido operaciones de detalle, endpoints ni formatos externos. Reevaluar esas operaciones cuando se conozca el proveedor; algunos entregan archivos completos.

El cargador demo conserva ese contrato. P2 añade `SourceRecord` y `SourceSegment` en los esquemas de dominio para conservar conversaciones ramificadas y documentos; no fuerza todas las fuentes al texto plano de `Mission`. Su integración con eventos queda para P3. La identidad normalizada incorpora proveedor, tipo, ID externo, variante e idioma; las condiciones originales permanecen opacas y no se interpretan como fechas o spoilers.

## Separación de archivos

- Caché o snapshot de importación: material del proveedor, con procedencia.
- Datos normalizados: generados; no editar a mano.
- Contenido editorial: resúmenes, cronología, relaciones y spoilers propios.
- Datos publicados: subconjunto mínimo necesario para la web.

Definir si los snapshots se versionan según tamaño y condiciones del proveedor; evitar subir corpus enormes al repositorio por defecto. La publicación debe poder reconstruirse a partir de una versión conocida del contenido y una fuente identificada.

## API frente a trabajo editorial

| Información | Origen habitual |
| --- | --- |
| ID, título y descripción de misión | API si están disponibles |
| Diálogos, personajes, idiomas y requisitos | Depende de cobertura |
| Resumen histórico | Edición propia |
| Ubicación temporal e incertidumbre | Edición propia respaldada por fuentes |
| Importancia para zoom | Criterio editorial |
| Relaciones entre hechos | Edición propia y evidencia |
| Spoilers | Reglas propias apoyadas en requisitos y orden de revelación |

La IA puede ayudar a proponer resúmenes o conexiones, pero no convertirlos automáticamente en hechos revisados.

## Actualizaciones y fallos

Empezar con importación manual. Incorporar ejecución programada solo cuando el proveedor y el flujo editorial estén estabilizados.

Ante timeout, límite, credencial inválida o cambio incompatible de esquema: reportar el error, no exponer secretos y conservar la última versión válida. En desarrollo se puede usar un snapshot explícitamente identificado; no ocultar que está desactualizado.

## Publicación ligera

El índice inicial contiene metadatos y relaciones necesarias, no todos los diálogos. Dividir detalles en archivos por evento o bloques razonables. Buscar solo entre contenido permitido por spoilers y aplicar el mismo filtro a todos los resultados.
