# Descuento de Aura por errores AWS

## Objetivo

En C06–C09, una respuesta completa pero incorrecta descuenta 150 Aura una vez, cierra el reto y muestra la solución. El saldo admite valores negativos. Los códigos, QR, fotos y encuestas conservan sus reglas actuales.

## Implementación

1. Agregar pruebas de integración para descuento, respuesta revelada, idempotencia, saldo negativo y envío incompleto sin penalidad; agregar pruebas de interfaz para cierre del reto.
2. Persistir estado `failed`, `auraDeducted` y solución en la misma transacción que actualiza el saldo y el registro de operaciones.
3. Mostrar saldo neto, Aura ganada, descontada y pendiente en Challenges y Progreso. Identificar cada reto fallado y permitir continuar con otro.
4. Ejecutar pruebas, validación de tipos, compilación y revisión local. Restaurar datos de pruebas del emulador al terminar.
