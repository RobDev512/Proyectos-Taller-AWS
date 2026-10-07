/**
 * precision.js — Detección de tiros "Perfect".
 *
 * La colisión real sigue usando la hitbox permisiva original (0.35R).
 * Un Perfect se concede cuando una flecha queda muy cerca de otra sin
 * invadir esa hitbox. Es una recompensa, no una colisión más estricta.
 */

export const PERFECT_BONUS = 2;
const PERFECT_DISTANCE_MULTIPLIER = 1.25;
const COLLISION_DISTANCE_MULTIPLIER = 0.35;

export function evaluatePerfectShot(state, anchoredProjectile) {
  if (!anchoredProjectile || state.anchoredProjectiles.length < 2) {
    return { perfect: false, nearestDistance: Infinity };
  }

  const ce = state.centralElement;
  const px = ce.x + anchoredProjectile.distance * Math.cos(anchoredProjectile.angle);
  const py = ce.y + anchoredProjectile.distance * Math.sin(anchoredProjectile.angle);

  let nearestDistance = Infinity;
  for (const other of state.anchoredProjectiles) {
    if (other === anchoredProjectile) continue;
    const ox = ce.x + other.distance * Math.cos(other.angle);
    const oy = ce.y + other.distance * Math.sin(other.angle);
    nearestDistance = Math.min(nearestDistance, Math.hypot(px - ox, py - oy));
  }

  const radius = anchoredProjectile.radius;
  const minDistance = radius * COLLISION_DISTANCE_MULTIPLIER;
  const maxDistance = radius * PERFECT_DISTANCE_MULTIPLIER;

  return {
    perfect: nearestDistance > minDistance && nearestDistance <= maxDistance,
    nearestDistance,
  };
}
