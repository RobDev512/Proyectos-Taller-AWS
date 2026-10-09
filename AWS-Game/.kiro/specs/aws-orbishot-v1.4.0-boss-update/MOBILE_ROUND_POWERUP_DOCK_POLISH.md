# v1.4.0 — Mobile Round Power-Up Dock Polish

Ajuste final de interfaz móvil antes de publicar **AWS ORBISHOT v1.4.0 — Boss Update**.

## Objetivo

Evitar que el dock horizontal de tarjetas compita visualmente con el proyectil y el área jugable en pantallas verticales estrechas.

## Cambios

- Escritorio conserva el dock descriptivo actual.
- Móvil vertical usa cuatro botones circulares independientes para Freeze, Shield, Double y Cleanup.
- Cada botón muestra atajo, sigla, cantidad y estado corto dentro de su propio círculo.
- El hit area móvil es circular con un pequeño padding táctil.
- Los dos botones centrales dejan un corredor libre por el centro para que la flecha preparada no quede visualmente detrás del HUD.
- Power Charge/Core pasa a una barra compacta separada debajo de los botones.
- Se elimina el encabezado largo del dock móvil para reducir saturación.
- Se reduce ligeramente el desplazamiento vertical del mundo en móvil para mantener distancia entre la flecha preparada y el HUD táctil.
- No cambia ninguna hitbox de gameplay ni `collision.js`.

## Versionado

Este ajuste sigue formando parte de **v1.4.0**. El roadmap posterior permanece sin cambios:

- v1.4.1 — Audio Update / Soundtrack Patch.
- v1.4.2 — Economy & Lives Update.

## Cache-busting y barra de estado

- Se versionan los módulos críticos del HUD móvil para evitar que el navegador conserve renderer/powerupUi anteriores durante pruebas locales.
- Power/Core usa una fila de texto separada de la barra, con clipping interno, para impedir overflow de estados como FRZ ACTIVE.
