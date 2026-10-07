# Sala Aura interactiva y bono de código — diseño local

Fecha: 2026-10-07. Estado: dirección visual aprobada; la versión sencilla de C08 está integrada localmente. Las demás ideas de este documento siguen como propuestas y no forman parte de la entrega de C08. Alcance: aplicación local de AWS Community Day Guatemala 2026; sin despliegue a producción.

## Objetivo y decisiones

Presentar los retos Cloud en una sala 3D de selección sencilla y añadir un bono de código opcional. La dirección visual elegida por el usuario es una **sala inmersiva** con una sola decisión por pantalla: leer el reto, seleccionar un servicio y pasar al siguiente. El contenido exige razonar sobre la falla, pero la interacción no añade pasos. La esfera del evento, con identidad original «Esfera Aura» y sin nombres, arte ni marcas de Pokémon, solo marca la respuesta seleccionada.

Se propone un **código promocional de acceso a la experiencia** para registros nuevos. Deja de existir un segundo reto de introducir códigos. Los registros completos existentes no vuelven a pasar por esta puerta. El código no es una credencial de seguridad: es una clave promocional del evento, validada en servidor para controlar el ingreso.

## Experiencia del participante

1. El registro nuevo solicita el código de acceso una sola vez. Un error conserva los campos ya llenados y explica cómo reintentar.
2. Al abrir un reto Cloud, el participante ve una situación concreta y tres servicios representados por objetos 3D. La cámara permanece fija. Tocar un servicio selecciona la respuesta y la Esfera Aura vuela hasta él para señalarla. La aplicación comunica de inmediato si fue correcta.
3. Una selección errónea muestra una pista breve y permite tocar otro servicio. Una respuesta correcta habilita **Siguiente**. No hay modos, poderes, arrastre, inspección previa ni botón de prueba. Al completar la última situación se muestra el resultado y el acceso al siguiente Challenge.
4. Los cuatro retos Cloud conservan sus IDs y Aura actual. C06 pregunta en qué servicio de la ruta Cliente → API Gateway → Lambda → DynamoDB intervenir; C07 plantea una necesidad concreta y pide elegir el servicio adecuado; **C08 «Rescata la señal» es el reto principal obligatorio** de dos situaciones descrito abajo; C09 presenta una señal de error y pide localizar el servicio responsable. Comparten la interacción seleccionar → resultado → siguiente, con situaciones distintas.
5. Al completar un reto, la aplicación guarda Aura mediante la operación existente y muestra un enlace explícito al siguiente reto disponible.
6. El bono de código aparece aparte de los diez Challenges y de las dos selfies. Su primera versión vale **200 Aura**, una sola vez, y está disponible para participantes registrados. Resolverlo no es requisito para completar los diez Challenges.

En C08, la primera pantalla presenta una inscripción duplicada y pide elegir dónde impedir una segunda escritura. La segunda muestra un evento defectuoso que bloquea un lote y pide elegir dónde separar ese fallo. Cada pantalla ofrece SQS, Lambda y DynamoDB. La Esfera Aura aparece solo después de seleccionar y marca visualmente el servicio elegido; no es un control. No hay presupuesto, cronómetro ni número máximo de intentos. La primera respuesta permanece acreditada mientras se resuelve la segunda. Para garantizar que todos puedan jugar, C08 forma parte de los diez retos de cada paquete nuevo; los paquetes existentes que no lo incluyen reciben una sustitución idempotente, conservando el Aura y el progreso histórico del reto sustituido.

La sala se adapta a móviles y escritorio. En móvil los servicios son objetivos táctiles grandes y el botón «Siguiente» no tapa la escena. En teclado se puede recorrer y seleccionar servicios. Cuando WebGL no está disponible o se desactiva, aparece una vista 2D con los mismos objetivos y validación. No se reduce el Aura por usar el modo alternativo.

## Bono de código: incidente de eventos

La escena presenta un flujo de eventos inspirado en servicios AWS: llegan mensajes duplicados, fuera de orden, inválidos o con fallos transitorios. El participante inspecciona la sala para obtener información y luego escribe una función corta en un editor. La función recibe un evento y el estado actual; devuelve `APPLY`, `IGNORE`, `RETRY` o `ISOLATE`.

El editor usa un subconjunto documentado de JavaScript: una función, `if`, `return`, comparaciones, operadores booleanos, literales, acceso a campos permitidos y búsqueda en la lista de IDs vistos. Muestra ejemplos de sintaxis y casos públicos para probar. El servidor **analiza e interpreta** ese subconjunto: no ejecuta el texto como JavaScript arbitrario. Rechaza importaciones, acceso global, bucles, llamadas no permitidas y programas excesivos.

Cada participante recibe una variante de incidente y una secuencia de pistas progresivas. Las pruebas privadas cubren límites, duplicados, orden y fallos. El servidor solo concede Aura si todas pasan. Se limitan envíos automatizados o excesivamente rápidos; los intentos normales no se agotan. Una captura de un estado aislado no incluye todo el incidente ni las pruebas privadas. Ningún mecanismo web puede impedir por completo capturas, fotografías externas o ayuda de IA; el diseño no promete esa protección.

## Actividad de sesión sin código repetido

C10 «Session Unlock» se retira de paquetes nuevos. En paquetes existentes, su posición se reemplaza de manera idempotente por otro reto activo que la persona aún no tenga. El sistema conserva el progreso histórico de C10 y todo el Aura ya ganado; no vuelve a acreditarlo. C11 deja de depender de C10 y pasa a ser «Session Lab»: el participante ordena o conecta tres elementos basados en una sesión, configurados por administración, y ve cómo funciona la solución. C12 sigue siendo la encuesta del track. La selección de paquetes continúa entregando diez Challenges.

Si C11 ya estaba completado, su estado y Aura se conservan. Si estaba bloqueado por C10, queda disponible tras la migración. Las preguntas históricas y sus claves permanecen archivadas; no se usan para nuevas respuestas.

## Componentes y datos

- **Motor de retos Cloud:** reglas puras para acciones, objetivos y estado; recibe una definición pública de escenario y devuelve el siguiente estado visual. No otorga Aura.
- **Escena Three.js:** carga diferida al entrar en un reto Cloud; dibuja tres servicios, conexiones y la trayectoria de la esfera al servicio seleccionado. Se destruye al salir para liberar recursos. La cámara permanece fija; la escena solo recibe selección de servicios.
- **Vista accesible 2D:** opera el mismo motor de acciones y muestra el mismo progreso. No depende del lienzo 3D.
- **Validador Cloud en Functions:** genera o recupera un escenario de usuario, verifica que cada acción sea válida y reproduce su resultado. El cliente no envía una bandera «completado» confiable. La acreditación de Aura conserva la idempotencia por operación.
- **Juez del bono:** analiza el programa permitido, evalúa casos públicos y privados con límites de complejidad e intentos, y acredita C18 una sola vez. Las soluciones y pruebas privadas nunca se publican en Firestore ni en el paquete del navegador.
- **Acceso al evento:** el onboarding envía la clave al servidor; el servidor compara una representación almacenada en configuración privada. No se guarda la clave en el perfil.

El catálogo conserva C06–C09 con reglas nuevas, marca C08 como obligatorio y agrega C18 como bono. La asignación agrega C18 a `bonusChallengeIds` de manera idempotente, junto con C16/C17. La interfaz separa «Selfies del evento» y «Bono de código». El ranking sigue incluyendo solo perfiles con registro completo; el Aura del bono suma al total de esos perfiles.

## Fallos y recuperación

La pérdida de conexión deja la escena en el último estado local y permite revalidar sin doble crédito. Un escenario vencido puede reiniciarse conservando la asignación. Una respuesta errónea explica la regla que faltó sin revelar la solución completa. Los fallos de WebGL activan la vista 2D. Un error de sintaxis en el bono señala el lugar y la construcción admitida. Los intentos excesivos muestran el tiempo de espera. La migración de C10 no elimina documentos ni ajusta totales de Aura.

## Verificación

- Pruebas unitarias de reglas de cada reto, entradas incorrectas, controles de estado y parser del bono.
- Pruebas con emuladores para clave de registro, asignación y migración de C10, preservación de Aura, validación de acciones, intento duplicado y límites del bono.
- Prueba visual y funcional en escritorio y ancho móvil: tocar un servicio, ver el resultado, fallar y corregir, pulsar «Siguiente», completar ambas situaciones, abrir el siguiente Challenge, modo 2D y ausencia de controles superpuestos.
- Confirmación de que el ranking excluye cuentas sin registro y que fotos C16/C17 mantienen su revisión actual.

La maqueta interactiva local «Rescata la señal» permitió validar el recorrido leer reto → seleccionar servicio → ver resultado → siguiente en dos pantallas. Ese recorrido ahora forma parte de C08 en la aplicación local y otorga 150 Aura al completar ambas situaciones. La clave de registro, el bono de código y los rediseños de otros retos descritos arriba quedan pendientes.
