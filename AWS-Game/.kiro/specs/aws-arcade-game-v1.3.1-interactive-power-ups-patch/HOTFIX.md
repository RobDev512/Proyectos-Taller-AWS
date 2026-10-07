# AWS Arcade Game v1.3.1 — Interactive Power-Ups Patch

Este parche se implementa como una sola entrega.

## Objetivos

1. Eliminar superposiciones del HUD entre:
   - progreso de nivel,
   - Combo,
   - banners LEVEL/TIER,
   - estados de Power-Ups.

2. Convertir los Power-Ups de v1.3.0 en un sistema interactivo:
   - adquisición mediante Power-Up Arrows,
   - inventario de hasta 2 unidades por tipo,
   - activación manual por clic/tap o teclas 1–4,
   - Power Charge como segunda fuente de recompensas.

## Reglas

- Power-Up Arrows desde Level 2.
- 18 % de probabilidad base.
- Nunca dos Power-Up Arrows consecutivas.
- Una Power-Up Arrow acertada guarda el efecto; no lo activa.
- Un slot lleno convierte la recompensa en 25 % de Power Charge.
- Power Charge se alimenta con hits, Perfects, combos y niveles completados.
- A 100 %, entrega un Power-Up con espacio disponible.
- Freeze, Shield y Double no pueden reactivarse mientras su efecto está activo.
- Cleanup requiere al menos una flecha anclada.
- Inventario y efectos activos persisten al cambiar de nivel.
- Todo el estado de Power-Ups se reinicia al terminar la partida.
- `collision.js` no se modifica.
- La hitbox permanece `fp.radius * 0.35`.

## Versión

- APP_VERSION: `1.3.1`
- APP_CODENAME: `Interactive Power-Ups Patch`
- Tag previsto: `aws-game-v1.3.1`
