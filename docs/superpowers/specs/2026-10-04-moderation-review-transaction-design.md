# Corrección de revisiones y auditoría de interacciones

**Fecha:** 4 de octubre de 2026  
**Estado:** Aprobado  
**Alcance:** Moderación de evidencias y revisión no destructiva de interacciones

## Problema confirmado

Los intentos de aprobar evidencia llegan autenticados a `reviewSubmission`, pero terminan con HTTP 500. Los logs de producción muestran:

```text
Firestore transactions require all reads to be executed before all writes.
```

La función lee el envío y la asignación, registra escrituras y luego intenta leer el puntaje. Firestore rechaza esa secuencia completa antes de confirmar cambios, por lo que los intentos fallidos no alteraron los datos.

## Solución

La función conservará una única transacción atómica. Para una aprobación ejecutará, en este orden:

1. leer envío, asignación y puntaje;
2. validar que el envío siga pendiente y que exista su asignación;
3. calcular el puntaje resultante;
4. escribir envío, asignación, puntaje y auditoría.

Para un rechazo leerá envío y asignación antes de escribir. No necesita leer ni modificar el puntaje.

La corrección no cambiará el contrato callable, las reglas de autorización, los estados públicos ni el cálculo existente de puntos.

## Regresión automatizada

La operación transaccional se expondrá como una unidad interna testeable. Una transacción simulada registrará todas las llamadas y verificará que:

- no exista ningún `get` después del primer `update`, `set` o `create`;
- una aprobación lea el puntaje y lo actualice;
- un rechazo no lea ni actualice el puntaje;
- un envío ya revisado siga produciendo `ALREADY_REVIEWED`;
- una asignación inexistente falle explícitamente antes de escribir.

## Auditoría no destructiva de interacciones

Se revisarán los flujos visibles y sus pruebas existentes:

- acceso por correo y finalización de autenticación;
- onboarding y errores de alias;
- listado, detalle y reemplazo de misiones;
- envío de selección y fotografía;
- carga privada, aprobación y rechazo de evidencia;
- progreso, ranking, perfil y cierre de sesión;
- actualización de PWA;
- navegación y acciones contextuales de Quetzi.

La auditoría buscará controles sin bloqueo durante operaciones, errores silenciosos, doble envío, navegación accidental y estados de carga indistinguibles. Solo se corregirán defectos reproducibles relacionados con esas interacciones; hallazgos mayores se documentarán por separado.

## Despliegue y verificación

1. Ejecutar la prueba de regresión en rojo y luego en verde.
2. Ejecutar todas las pruebas, typecheck y builds de frontend y Functions.
3. Desplegar únicamente `reviewSubmission`.
4. Consultar el estado y los logs de la nueva revisión sin enviar datos de usuario.
5. Ejecutar smoke checks públicos de solo lectura.

No se crearán, aprobarán, rechazarán ni eliminarán evidencias reales durante la verificación.

## Criterios de aceptación

1. La transacción realiza todas sus lecturas antes de cualquier escritura.
2. Aprobar conserva el cálculo actual y registra auditoría.
3. Rechazar no modifica el puntaje.
4. La suite completa, tipos y builds pasan.
5. Solo la Function afectada se despliega.
6. La auditoría no modifica datos de participantes.
