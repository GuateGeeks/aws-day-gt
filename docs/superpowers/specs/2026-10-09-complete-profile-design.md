# Diseño: perfil completo

## Objetivo

Mostrar en “Mi perfil” la información que la persona proporcionó al registrarse: alias, datos para Challenges, intereses y preferencias de privacidad. La información debe ser fácil de revisar en móvil y mantener los estilos actuales de AWS Community Day Guatemala.

## Alcance y experiencia

- **Cuenta:** alias público, correo enmascarado y rol. El alias y el correo son de solo lectura.
- **Perfil para Challenges:** área principal, nivel, primera asistencia e intereses AWS. Si faltan estos datos, se muestra el formulario existente para completarlos y guardar con `setChallengeProfile`. Una vez guardados, se muestran como resumen de solo lectura porque la función actual bloquea cambios posteriores.
- **Privacidad y consentimiento:** estado de aceptación, versión de términos, fecha de aceptación, permiso de uso de fotos y suscripción a novedades. Se muestran como valores de solo lectura; no se alteran consentimientos previos desde esta pantalla.
- Se conserva la navegación actual de perfil y los enlaces de comunidad, cierre de sesión y solicitud de eliminación.

## Datos y componentes

`ProfilePage` lee los valores ya expuestos por `useAuth().profile`. Reutiliza `ChallengeProfileFields` y la función callable existente solo cuando falten los datos de Challenges. El formulario inicializa sus controles desde el perfil para que cualquier dato guardado aparezca seleccionado. Los resúmenes se presentan en secciones con etiquetas visibles, evitando mostrar `undefined` si hay perfiles antiguos con campos incompletos.

No se agregan funciones Firebase, cambios al modelo de consentimiento ni escrituras directas desde el cliente. La regla de campos de perfil sigue siendo la definida por el backend actual.

## Estados y accesibilidad

- Perfil completo: resumen legible de cada sección.
- Perfil de Challenges incompleto: formulario actual, con valores preseleccionados si existen, y confirmación o error al guardar.
- Datos opcionales ausentes en perfiles antiguos: se indica “No configurado” o se omite el valor según corresponda.
- Los controles conservan etiquetas asociadas y foco visible; los mensajes de guardado mantienen el patrón `StatusNotice`.

## Verificación

- Pruebas de `ProfilePage` para los valores visibles del perfil completo, privacidad y valores ausentes.
- Prueba para mostrar el formulario cuando falte el perfil de Challenges y para guardar usando la callable existente.
- Ejecutar el conjunto de pruebas unitarias/integración y la compilación de producción.

## Fuera de alcance

Editar alias, correo o consentimientos; cambiar permisos o esquema de Firebase; volver a abrir cambios de Challenges una vez completado el perfil.
