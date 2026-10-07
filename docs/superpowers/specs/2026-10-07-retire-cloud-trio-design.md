# Retirar Cloud Trio de Aura Challenges

## Decisión aprobada

Cloud Trio (C03) deja de estar disponible y no se asigna a participantes nuevos. Las personas que ya lo tienen reciben automáticamente otro Challenge de la categoría Conecta para mantener un paquete de diez. El Aura y los registros obtenidos previamente con C03 se conservan.

## Datos y comportamiento

- El catálogo conserva C03 como registro histórico inactivo. No se elimina ningún documento de progreso, conexión, operación ni puntuación.
- Cuando un participante con C03 abre Challenges, `ensureChallengeAssignment` sustituye C03 en su asignación por el primer Challenge Conecta activo, en orden de ID, que aún no tenga. La operación es idempotente, incluso con solicitudes concurrentes. Se crea progreso `available` para el sustituto si falta. Si no hay sustituto, se muestra un error en lugar de dejar una asignación incompleta. La asignación sigue teniendo diez IDs y su firma se actualiza.
- La sustitución conserva el orden de los demás retos. No modifica `scores.auraTotal`, `completedChallenges`, `auraReachedAt` ni el progreso histórico de C03. C03 deja de mostrarse y el servidor rechaza nuevas finalizaciones de ese ID aunque el documento del catálogo todavía no se haya actualizado. Un reintento de una operación ya confirmada devuelve su resultado almacenado para mantener la idempotencia.
- El total de Aura del encabezado de Challenges proviene del score guardado, igual que en Progreso y Ranking; así incluye el Aura histórico aunque C03 ya no aparezca entre los diez retos activos. El contador de retos completados se calcula únicamente con el paquete vigente.
- La semilla existente es de creación única. Una operación local explícita y limitada al emulador marca el documento C03 como inactivo; la migración de paquetes sucede al abrir la aplicación. No se despliega ni se modifica producción.

## Comprobación

Probar asignaciones nuevas sin C03; reemplazo de un C03 disponible y uno completado sin perder Aura; repetición/concurrencia; bloqueo de finalización de C03; encabezado de Challenges con Aura histórica; y enlace local con diez tarjetas activas.
