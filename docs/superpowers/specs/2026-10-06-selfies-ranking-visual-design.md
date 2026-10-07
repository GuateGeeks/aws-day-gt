# Selfies, ranking verificado y presentación de Challenges

## Alcance aprobado

- Mantener el paquete original de diez Challenges para cada participante, sin alterar progreso existente.
- Añadir dos Challenges de foto opcionales y accesibles a toda persona con registro completo: C16, selfie con un speaker; C17, selfie en un stand del evento. Aparecen en Challenges y como accesos en Mi Geek ID. El QR de Geek ID sigue disponible sin esperar fotos.
- Cada foto se carga por separado, pasa por la misma validación técnica y revisión manual de C15, y concede Aura una sola vez al aprobarse. La persona ve estados claros: disponible, en revisión, aprobado, rechazado con opción de reenvío.
- Después de completar un Challenge, mostrar un único mensaje en español con el Aura ganado y un botón que abre el siguiente Challenge disponible. Si no queda otro, abrir el listado.
- El ranking muestra únicamente personas con onboarding completo, incluidas las de 0 Aura. El servidor comprueba los perfiles; no basta con que exista un documento en `scores`.
- Corregir la distribución en escritorio y móvil: dos columnas para el catálogo en escritorio, una en móvil; navegación que no cubra contenido; logo Quetzi contenido en su marca; tarjetas y detalles con jerarquía consistente.

## Datos y acceso

Los Challenges C16 y C17 se incorporan al catálogo sin entrar en el algoritmo que selecciona los diez. `challengeAssignments` conserva `challengeIds` y añade `bonusChallengeIds` para ambas fotos. Una operación idempotente prepara los dos documentos `challengeProgress` para registros nuevos y existentes. El cliente muestra ambos grupos por separado. Las funciones de foto y las reglas de Storage aceptan únicamente IDs de foto del catálogo: C15, C16 y C17. Para C16 y C17 verifican la asignación de bonificación y el registro completo. La moderación usa el premio provisional almacenado al enviar la imagen. Ninguna imagen se publica automáticamente; el consentimiento de publicación sigue separado de la aprobación del reto.

El registro marca el score como `registeredForRanking` solo cuando `users/{uid}` tiene `onboardingComplete`, `createdAt` y `consent.acceptedAt` escritos por el flujo real. Los perfiles existentes reciben esa marca mediante una operación idempotente y una migración local segura. `getLeaderboardSnapshot` consulta los scores elegibles, ordenados por Aura, cantidad de Challenges completados y momento en que alcanzaron el Aura, y verifica los perfiles por lotes. Se incluyen todas las personas registradas, incluso si su posición supera el puesto 50. La interfaz deja de consultar `scores` directamente. Las reglas dejan de permitir leer la colección completa de puntuaciones desde el cliente.

## Interfaz y estados

Mi Geek ID conserva su QR y muestra una sección «Selfies del evento» con dos tarjetas que enlazan a C16 y C17. El listado de Challenges distingue los diez asignados de las dos oportunidades de foto. Cada detalle explica qué debe verse en la foto y que el equipo la revisará. El mensaje de finalización sustituye las dos confirmaciones actuales y traduce estados técnicos. El siguiente reto se elige entre los asignados y después entre las selfies pendientes; nunca abre uno bloqueado o en revisión.

## Verificación

Pruebas de asignación idempotente para usuarios nuevos y existentes; controles de Storage y envío de C16/C17; aprobación, rechazo y doble revisión; ranking con scores huérfanos y usuarios registrados con 0 Aura; interfaz de estados y botón siguiente. Compilar web y Functions, pasar tipos y revisar visualmente el enlace local a ancho móvil y escritorio.

## Fuera de alcance

No habrá reconocimiento automático de speakers ni stands, publicación pública de fotos, borrado de datos históricos ni cambios en producción.
