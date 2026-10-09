# v1.4.0 — Detached Arrow Persistence Fix

Corrección del ciclo de vida de las flechas desprendidas al romper una fase del boss.

## Problema

La animación estaba almacenada dentro de `boss.phaseBreak`, por lo que seguía demasiado acoplada al objeto temporal de transición. Visualmente podía desaparecer antes de terminar su caída.

## Solución

- Las flechas desprendidas viven ahora en `state.detachedBossArrows`.
- Su actualización es independiente de `phaseBreak.active` y del estado de la pausa.
- Se actualizan en cada frame del game loop.
- No usan fade de alpha.
- Solo se eliminan cuando toda su geometría ha rebasado la parte inferior del canvas lógico.
- Si intentan escapar por los laterales, rebotan suavemente para mantener la caída visible.
- La transición jugable puede terminar mientras las flechas continúan cayendo.

No se modifica `collision.js` ni la hitbox `fp.radius * 0.35`.
