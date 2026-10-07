/**
 * collision.js — detección con flecha de arco.
 *
 * La punta está a HALF_ARROW píxeles por delante del centro de referencia
 * del proyectil (en la dirección de vuelo).
 */

const HALF_ARROW = 2.1; // multiplicador de radius, debe coincidir con projectile.js

function getTipPosition(fp) {
  const mag = Math.hypot(fp.vx, fp.vy);
  if (mag === 0) return { tx: fp.x, ty: fp.y };
  const nx = fp.vx / mag;
  const ny = fp.vy / mag;
  return {
    tx: fp.x + nx * fp.radius * HALF_ARROW,
    ty: fp.y + ny * fp.radius * HALF_ARROW,
  };
}

/**
 * @param {import('./state.js').GameState} state
 * @returns {'none'|'anchor'|'collision'}
 */
export function checkCollision(state) {
  if (!state.flyingProjectile) return 'none';

  const fp = state.flyingProjectile;
  const ce = state.centralElement;

  // Detectar por la punta de la flecha
  const { tx, ty } = getTipPosition(fp);
  const distToCenter = Math.hypot(tx - ce.x, ty - ce.y);

  if (distToCenter <= ce.radius) {
    // ¿Choca con algún anclado?
    for (const ap of state.anchoredProjectiles) {
      const apX = ce.x + ap.distance * Math.cos(ap.angle);
      const apY = ce.y + ap.distance * Math.sin(ap.angle);
      // Comparar centros de flecha (zona del icono) con tolerancia pequeña.
      // La colisión solo cuenta cuando realmente se superponen bastante,
      // no cuando los círculos apenas se rozan visualmente.
      const d = Math.hypot(fp.x - apX, fp.y - apY);
      if (d < fp.radius * 0.35) return 'collision';
    }
    return 'anchor';
  }

  return 'none';
}
