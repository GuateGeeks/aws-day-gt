# Solo Aura Challenges — diseño aprobado

## Decisión

La experiencia para participantes y personal mostrará únicamente Aura Challenges. Las misiones M01–M50 dejarán de asignarse, mostrarse, aceptarse y sembrarse. Los documentos históricos que ya existan en Firebase se conservarán sin borrado automático y quedarán fuera de la aplicación. El trabajo continúa solo en la rama local hasta una publicación autorizada.

## Flujo

- Incorporación: perfil breve para Challenges y asignación persistente de diez Challenges. Ninguna misión M se asigna.
- Participante: navegación, inicio, detalle, progreso, ranking y fotos se refieren solo a Challenges. Las rutas anteriores redirigen al listado de Challenges.
- Personal: la cola de moderación muestra solo envíos de Challenges. Las funciones antiguas de envío y reemplazo dejan de exponerse; el registro y revisión de fotos aceptan solo IDs de Challenges fotográficos.
- Datos: la semilla agrega/configura solo evento, Challenges, respuestas privadas y estaciones. No borra documentos anteriores. Las reglas impiden lecturas y escrituras cliente de colecciones de misiones anteriores.
- Compatibilidad: scores y envíos anteriores pueden permanecer almacenados para auditoría, pero no influyen en Aura ni se muestran. No se migran ni se recalculan.

## Verificación

- Prueba de incorporación: diez Challenges, cero `userMissions` nuevos.
- Pruebas de rutas y pantallas: sin enlace ni texto de misiones anteriores.
- Pruebas de reglas y funciones: colecciones M inaccesibles para clientes, funciones antiguas ausentes, C15 conserva subida y revisión.
- Semilla local y build: cero escrituras a misiones antiguas, cero borrados y aplicación web compilable.
