# Marca GuateGeeks en Aura — diseño local

Fecha: 2026-10-07. La solicitud del usuario fija el logotipo principal (`GeekEyes.png`) y el archivo de referencia cromática (`GuateGeeksFull.png`); autoriza su integración en la aplicación local.

## Dirección visual

- El recurso original de los ojos se copia sin alterarlo a `public/brand/geek-eyes.png` y se convierte en la marca principal del encabezado, la bienvenida y el acceso. Un contenedor cian intenso le da contraste a sus formas blancas y negras. La tipografía adyacente mantiene el nombre GuateGeeks legible para todos los tamaños.
- La imagen completa solo sirve como referencia de color. Su azul exacto `#0E89AF` guía la paleta; se combinan cian vivo, gris, blanco y tinta oscura para el texto. La interfaz permanece clara incluso cuando el sistema operativo usa modo oscuro. Verde y rojo se reservan para estados funcionales de éxito y error.
- La portada se organiza en dos columnas en escritorio y deja visible la acción principal antes del guía en móvil. Challenges y Progreso usan superficies luminosas, progreso visible y una llamada clara hacia el siguiente reto.
- El logotipo oficial de AWS Community Day queda como referencia secundaria en la bienvenida. Geek, el guía animado, permanece en el contenido y deja de ocupar la posición del logotipo de la aplicación.
- El icono del navegador y de la aplicación instalada incluye el archivo original de los ojos sobre fondo azul. La descripción y el color de tema de la PWA reflejan GuateGeeks Aura.

## Alcance técnico

- Un pequeño componente de marca reutiliza la misma imagen en las pantallas principales. Las variables de color centrales gobiernan los componentes existentes; las excepciones cromáticas de hero, progreso, tarjetas y sala 3D se alinean con la nueva paleta.
- No cambian las reglas, el Aura, las asignaciones, las fotos ni los datos del evento.
- Se verifica que el logotipo cargue en app, bienvenida y acceso, que los controles sean legibles y que la pantalla móvil no tenga desbordamiento horizontal. Se ejecutan las pruebas y la compilación.
