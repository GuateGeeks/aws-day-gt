# Códigos del evento y recorrido Geek — diseño local

Fecha: 2026-10-07. Aprobación: el usuario aceptó los tres códigos propuestos y pidió una experiencia rápida, sencilla y memorable. Alcance: aplicación local; sin despliegue.

## Experiencia

- Toda persona registrada recibe en sus diez Challenges los retos C10 Taller, C11 Charla y C12 Track Pulse, además de C08 y C13. Los otros cinco mantienen variedad. Los paquetes previos se completan de forma idempotente hasta diez retos; se conservan el Aura y los documentos de progreso de los retos desplazados.
- C10 acepta un código general para cualquiera de los talleres y da sus 100 Aura una vez. C11 acepta otro código general para cualquiera de las charlas y da sus 150 Aura una vez. C11 deja de depender de C10 y no exige responder una pregunta adicional.
- C13 acepta un código del stand GuateGeeks tras la experiencia VR y da sus 250 Aura una vez. Se mantiene el método de token emitido por el personal como alternativa de operación. C14 conserva su token individual.
- Cada reto con código muestra una sola entrada, una instrucción breve y un botón claro. Al completar, se ve el Aura obtenido y un enlace al siguiente Challenge. Un código equivocado permite reintentar; el límite de intentos existente evita abuso automatizado.
- Los tres códigos se comparan con hashes privados en el servidor. No aparecen en el paquete del navegador, en este repositorio ni en documentos Firestore legibles por participantes. El panel admin permite activarlos o rotarlos con auditoría. En esta versión local se configuran los valores aprobados; no se modifica producción. Al ser compartidos, los códigos pueden circular fuera del lugar; el límite por cuenta y la activación por el equipo reducen, pero no eliminan, ese riesgo.

## Tracks y avance

- Track Pulse ofrece las siete áreas de la [agenda oficial](https://awscommunitygt.com/agenda/): IA & Agentes, Arquitectura & Serverless, Datos & Analítica, DevOps & Operaciones, Seguridad, Carrera & Comunidad y FinOps - Operaciones. Los registros ya completados conservan su respuesta y Aura, aunque el nombre histórico de la opción fuera diferente.
- La página de Challenges muestra el avance general y un acceso al siguiente reto disponible. Cada tarjeta identifica su estado y, para C08, «1 de 2» tras la primera respuesta. La página Progreso lista los diez retos asignados, su estado, el Aura obtenido y el siguiente paso; las selfies siguen separadas.
- El guía visible se llama **Geek**: saludo, burbuja, onboarding y etiquetas de accesibilidad. Se conserva el ave y su evolución visual. Los nombres internos de componentes pueden permanecer para evitar una refactorización sin impacto al usuario.

## Datos, migración y fallos

- El catálogo y el selector reservan C08, C10, C11, C12 y C13 en cada paquete de diez. La migración prioriza desplazar retos aún no completados y luego, si es necesario, retos opcionales ya completados; no borra progreso ni resta Aura. C11 bloqueado pasa a disponible sin alterar C11 completado.
- C10, C11 y C13 validan códigos en la misma transacción que acredita Aura. Una operación repetida devuelve el resultado previo; otra operación después de completar no acredita de nuevo. C13 conserva el camino de token del personal.
- Si falta la configuración de un código, el reto explica que debe solicitarse al equipo; no concede Aura. Si falla la red, el formulario conserva el valor ingresado para reintentar.

## Verificación

- Pruebas de asignación nueva y migración de paquetes previos, preservación de Aura y C11 desbloqueado.
- Pruebas con emuladores de los tres códigos, errores, límite de intentos, idempotencia y alternativa de token del stand.
- Pruebas de siete tracks, avance visible y nombre Geek; verificación visual en móvil y escritorio y recorrido real en el emulador local.
