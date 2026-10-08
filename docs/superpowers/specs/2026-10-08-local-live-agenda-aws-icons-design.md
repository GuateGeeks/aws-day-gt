# Agenda local en vivo e iconos oficiales de AWS

## Objetivo

En la versión local, la agenda debe comportarse como si hoy fuera el sábado 10 de octubre de 2026. Debe conservar la hora actual de Guatemala y avanzar de forma automática por las actividades simultáneas. Las preguntas sobre servicios AWS deben mostrar iconos oficiales sin alterar respuestas, puntos ni validación.

## Reloj y agenda

- La simulación automática se activa en `localhost`, `127.0.0.1` y `::1` durante el 8 de octubre. No depende de los emuladores Firebase.
- Se suman dos días a la fecha efectiva y se conserva la hora y los minutos de Guatemala. La página actualiza el reloj cada 20 segundos, como ya hace `useNow`.
- La simulación nunca se activa por el dominio público. El parámetro manual `?ahora=` conserva su precedencia y `?ahora=real` la desactiva en la pestaña.
- `AgendaSpotlightCard` muestra todas las sesiones que coinciden con el bloque actual y las próximas según `shared/agenda.ts`. Conserva la etiqueta visible de ensayo para evitar presentar la simulación como un evento real.
- La agenda usa una copia local de la [agenda oficial](https://awscommunitygt.com/agenda/), por lo que el reloj avanza en tiempo real, aunque cambios editoriales en la web oficial requieren actualizar esa copia.

## Iconos de servicios

- Fuente: [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), paquete oficial del 31 de julio de 2026. Se copian únicamente los SVG de los servicios presentes en las preguntas.
- Un mapa único relaciona los identificadores del catálogo con los archivos. `dynamo` y `dynamodb` comparten el mismo icono.
- Las opciones de respuesta muestran icono y nombre. Los objetos de la sala 3D muestran el icono en su cara visible, conservando la selección por toque o clic y el respaldo textual accesible.
- No se cambian el orden, la solución, la recompensa ni el resultado de ningún reto. Si un icono no carga, el nombre del servicio permanece disponible.

## Verificación

- Pruebas del reloj para host local, host público y anulación manual.
- Pruebas de asociación de iconos y de que las opciones siguen siendo botones accesibles.
- Compilación y comprobación visual local de agenda y retos en pantalla amplia y móvil.
- No publicar en producción dentro de este cambio.
