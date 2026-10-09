# AWS ORBISHOT v1.4.0 — Boss Quality Polish

Esta revisión continúa la Boss Update sin cambiar la hitbox base de `collision.js`.

## Cambios de boss

- CORE requiere 3 impactos: el combate completo queda en 6 Armor + 4 Exposed + 3 Core.
- Al romper una fase, además de las flechas se desprenden fragmentos visibles de la capa destruida.
- Flechas y escombros siguen actualizándose hasta abandonar físicamente la parte inferior del canvas.
- El Core final también genera fragmentos al derrotar al boss.

## Condición de derrota — Overload

Durante un Boss Level las colisiones con flechas ancladas dejan de provocar Game Over instantáneo.

- Tiro bloqueado: +25 % Overload.
- Colisión con flecha: +30 % Overload.
- Impacto válido: -10 % Overload.
- Cambio de fase: -20 % adicional.
- Overload 100 %: Game Over.
- Shield absorbe la colisión antes de aplicar Overload.

Fuera de Boss Levels se conserva la regla clásica de colisión/Game Over.

## Calidad visual

El Canvas separa resolución lógica (600×700) de resolución física de render. El backing store se adapta al tamaño CSS y al `devicePixelRatio`, mientras input y renderer continúan trabajando en coordenadas lógicas. Esto mejora la nitidez de textos, HUD y geometría sin alterar posiciones ni hitboxes.

## Level Bonus

Se corrige `beginLevelComplete`: `null` ya no se convierte accidentalmente a `0` como override. Los niveles normales vuelven a usar `3 + level` como bonus.

## Invariante

La colisión entre flechas continúa exactamente en:

```js
const d = Math.hypot(fp.x - apX, fp.y - apY);
if (d < fp.radius * 0.35) return 'collision';
```
