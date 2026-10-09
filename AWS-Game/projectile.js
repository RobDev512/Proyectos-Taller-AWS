/**
 * projectile.js — proyectiles con forma de flecha de arco.
 */

import { incrementScore } from './scoring.js';
import { randomIcon } from './state.js';
import { recordShot } from './stats.js';

/**
 * @typedef {Object} FlyingProjectile
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} radius
 * @property {string} awsIconId
 * @property {string|null} powerCoreHitType
 */

/**
 * @typedef {Object} AnchoredProjectile
 * @property {number} angle
 * @property {number} distance
 * @property {number} renderDistance
 * @property {number} radius
 * @property {string} awsIconId
 */

export function launchProjectile(state, config) {
  const startX = config.CANVAS_WIDTH / 2;
  const readyBottomFactor =
    Number(config.READY_ARROW_BOTTOM_FACTOR) || 5;
  const startY =
    config.CANVAS_HEIGHT -
    config.PROJECTILE_RADIUS * readyBottomFactor;

  const dx = state.centralElement.x - startX;
  const dy = state.centralElement.y - startY;
  const mag = Math.hypot(dx, dy);

  const awsIconId = state.nextArrowId;
  state.nextArrowId = randomIcon();

  // v1.3.2 elimina las Power-Up Arrows: todas las flechas vuelven a ser
  // normales y el Power Core se captura mediante timing.
  state.nextPowerUp = null;

  state.flyingProjectile = {
    x: startX,
    y: startY,
    vx: (dx / mag) * config.PROJECTILE_SPEED,
    vy: (dy / mag) * config.PROJECTILE_SPEED,
    radius: config.PROJECTILE_RADIUS,
    awsIconId,
    powerCoreHitType: null,
  };

  if (state.stats) recordShot(state.stats);
  state.pendingLaunch = false;
}

export function advanceProjectile(state, deltaTime) {
  const fp = state.flyingProjectile;
  if (!fp) return;

  fp.x += fp.vx * deltaTime;
  fp.y += fp.vy * deltaTime;
}

export function anchorProjectile(state) {
  const fp = state.flyingProjectile;
  if (!fp) return;

  const ce = state.centralElement;
  const angle = Math.atan2(fp.y - ce.y, fp.x - ce.x);

  // Distancia LÓGICA: se conserva exactamente como antes para que
  // collision.js siga comparando contra la misma posición física.
  const HALF_ARROW = fp.radius * 2.1;
  const distance = ce.radius + HALF_ARROW;

  // Distancia VISUAL: durante bosses hundimos un poco la punta dentro del
  // cuerpo para que se vea realmente clavada. Esto NO cambia la hitbox ni la
  // posición lógica usada por collision.js.
  const bossPhaseIndex = Math.max(
    0,
    Math.min(2, Math.floor(Number(state.boss?.phaseIndex) || 0)),
  );
  const bossEmbedFactors = [0.70, 1.05, 1.45];
  const bossEmbed =
    state.boss?.active && !state.boss?.defeated
      ? fp.radius * bossEmbedFactors[bossPhaseIndex]
      : 0;
  const renderDistance = Math.max(
    ce.radius,
    distance - bossEmbed,
  );

  state.anchoredProjectiles.push({
    angle,
    distance,
    renderDistance,
    radius: fp.radius,
    awsIconId: fp.awsIconId,
  });

  incrementScore(state);
  state.flyingProjectile = null;
}
