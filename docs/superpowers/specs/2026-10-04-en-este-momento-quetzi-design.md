# En este momento con Quetzi

**Fecha:** 4 de octubre de 2026  
**Estado:** Aprobado  
**Alcance:** Experiencia frontend de la pestaña Hoy y lógica compartida del compañero

## Objetivo

Convertir la pestaña Hoy en una experiencia enfocada en el presente. Al abrirla, el participante debe poder entender en pocos segundos qué ocurre ahora, saber si tiene una misión vinculada con ese momento e iniciarla directamente desde la interacción con Quetzi.

La aplicación seguirá tratando la agenda oficial como fuente principal. No mostrará una agenda paralela ni recomendará sesiones futuras desde esta pantalla.

## Principios

- Mostrar solo información del momento actual.
- No sugerir misiones futuras ni misiones generales como sustituto.
- No inventar una relación entre el bloque actual y una misión.
- Dar a Quetzi el papel principal en la explicación y la acción.
- Mantener intactas las reglas actuales de asignación, evidencia y puntuación.

## Experiencia

La pestaña Hoy se presentará visualmente como **En este momento** y tendrá esta jerarquía:

1. Quetzi como elemento principal.
2. Un mensaje breve basado en la hora real de Guatemala.
3. Información del bloque que está ocurriendo.
4. Una misión únicamente si corresponde a una sesión activa.
5. El progreso de plumas como información secundaria compacta.

Se elimina de esta pantalla la tarjeta del siguiente bloque y cualquier recomendación de una misión general. El enlace a la agenda oficial puede mantenerse como salida secundaria para consultar la programación completa.

## Modelo del momento actual

La lógica compartida producirá un modelo explícito para la interfaz, con al menos:

- fase del evento: antes, en vivo o después;
- tipo de momento: registro, apertura, sesiones, almuerzo, cierre, cena u otro bloque activo;
- resumen breve para Quetzi;
- detalle ampliado;
- misión relacionada opcional;
- estado de carga de misiones;
- acción opcional para abrir la misión.

Durante bloques paralelos, la aplicación no enumerará todas las sesiones. Si el participante tiene una misión disponible o rechazada asociada exactamente con una sesión en curso, el modelo incluirá únicamente esa sesión, su sala, horario y misión. Si no existe una coincidencia, el modelo describirá el bloque de forma general y declarará que no hay una misión relacionada en ese momento.

Una misión se considera accionable solamente cuando:

- su estado es `available` o `rejected`; y
- su `slot` y `room` corresponden a una sesión activa.

Las misiones `submitted`, `approved`, `failed`, `replaced`, `cancelled` o `expired` no se ofrecerán. Tampoco se ofrecerán misiones sin horario ni misiones de sesiones futuras.

## Interacción con Quetzi

Quetzi tendrá dos estados locales:

### Reposo

Muestra un mensaje corto sobre el momento actual. Su control comunica que puede tocarse para obtener más información.

### Expandido

Un toque activa una animación breve y revela el detalle contextual. Si hay una misión accionable, el diálogo incluye un botón **Comenzar misión** que navega a `/app/missions/:missionId`. Si no hay misión, Quetzi lo expresa claramente y no muestra una acción alternativa.

Los toques posteriores alternan entre reposo y expandido. Se retira de esta interacción la rotación de consejos aleatorios para conservar el contexto. El botón de misión es independiente del control que expande a Quetzi, evitando navegaciones accidentales.

## Estados de la experiencia

### Antes del evento

Quetzi presenta la cuenta regresiva y orienta hacia la agenda oficial. No muestra una misión contextual.

### Evento en vivo

- Registro, apertura, almuerzo, cierre y cena tienen mensajes específicos.
- En un bloque de sesiones con misión coincidente, Quetzi muestra solo esa sesión y permite comenzar la misión.
- En un bloque de sesiones sin misión coincidente, Quetzi acompaña y explica que no hay un reto relacionado ahora.
- Si aún se están cargando las misiones, muestra un estado breve de espera. No afirma que no hay una misión hasta terminar la carga.
- Si los datos internos no permiten identificar el bloque, usa un mensaje neutral sin inventar títulos, ubicaciones o acciones.

### Después del evento

Quetzi agradece la participación y no muestra misiones contextuales.

## Arquitectura y cambios previstos

### `shared/companion.ts`

Incorporará la función pura que deriva el modelo de “En este momento” a partir de la hora, las sesiones internas, las misiones asignadas y su estado de carga. Esta función concentrará las reglas de selección para que puedan probarse sin renderizar React.

### `src/features/companion/CompanionPage.tsx`

Consumirá el modelo y renderizará la experiencia enfocada. Dejará de solicitar o presentar el siguiente bloque y no usará la selección general de retos.

### `src/features/companion/QuetziGuide.tsx`

Gestionará el estado local de reposo/expansión, la animación y el contenido accionable del diálogo. La navegación seguirá usando una ruta interna existente.

### `src/features/companion/CompanionCards.tsx`

Proveerá la presentación compacta del contexto y del progreso. Las piezas dedicadas al siguiente bloque o a una recomendación general dejarán de utilizarse en Hoy y podrán eliminarse si no tienen consumidores.

### Estilos

Los estilos reforzarán a Quetzi como foco visual, mantendrán el botón de misión dentro del diálogo expandido y preservarán una interacción cómoda con una mano en pantallas móviles.

## Accesibilidad y movimiento

- El control de Quetzi tendrá un nombre accesible que refleje si expande o contrae información.
- Los cambios del diálogo se anunciarán con `aria-live="polite"`.
- **Comenzar misión** será un enlace o botón con destino y nombre explícitos.
- El foco no cambiará automáticamente al expandir el diálogo.
- Las animaciones respetarán `prefers-reduced-motion`.
- El estado cargando será perceptible sin depender solo de animación o color.

## Manejo de errores

- Una ausencia de misiones después de cargar produce el estado válido “sin misión relacionada”.
- Una carga pendiente produce un estado distinto y temporal.
- Una misión que no puede mapearse a la agenda interna se ignora para el momento actual.
- Si varias misiones accionables coinciden con el mismo momento, se selecciona de forma determinista la primera según el orden actual de asignación. La interfaz muestra solo una para mantener el foco.
- La navegación y la entrega de evidencia permanecen a cargo de la pantalla de detalle existente.

## Pruebas

La implementación seguirá pruebas primero y cubrirá:

- selección exclusiva de una misión de una sesión activa;
- exclusión de misiones futuras y generales;
- reintento de una misión rechazada durante su sesión;
- exclusión de misiones enviadas, aprobadas o inactivas;
- diferencia entre carga pendiente y ausencia de misión;
- mensajes para registro, almuerzo, bloques paralelos, cierre y estados antes/después;
- comportamiento neutral ante datos sin coincidencia;
- expansión y contracción de Quetzi;
- aparición y destino de **Comenzar misión**;
- ausencia de navegación al tocar solamente a Quetzi;
- nombres accesibles y anuncios del diálogo;
- regresión de las pruebas existentes, typecheck y build.

## Fuera de alcance

- Cambios en Cloud Functions, Firestore o reglas de seguridad.
- Cambios en asignación, reemplazo, moderación o puntuación.
- Sincronización dinámica de la agenda oficial.
- Una interfaz de chat libre con Quetzi.
- Mostrar todas las sesiones activas o reconstruir la agenda dentro de la aplicación.
- Llevar el compañero flotante al resto de las pestañas.

## Criterios de aceptación

1. Durante el evento, Hoy no muestra información del siguiente bloque.
2. Quetzi describe únicamente el momento actual.
3. Solo aparece una misión cuando coincide con una sesión activa y tiene estado accionable.
4. Sin coincidencia, Quetzi dice que no hay una misión relacionada y no propone sustitutos.
5. Tocar a Quetzi amplía el contexto sin navegar.
6. **Comenzar misión** abre directamente el detalle de la misión relacionada.
7. El estado de carga nunca se confunde con la ausencia de una misión.
8. La agenda oficial continúa siendo la referencia para consultar toda la programación.
