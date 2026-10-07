/**
 * powercore.js — Power Core orbitante de v1.3.2.
 *
 * El Core aparece al llenar Power Charge, cambia de tipo mientras orbita y
 * solo concede su recompensa si una flecha lo atraviesa Y después se ancla.
 */

import {
  POWER_UP_CONFIG,
  POWER_UP_ORDER,
  collectPowerUp,
  getStorablePowerUps,
  isPowerUpType,
} from './powerups.js';

export const POWER_CORE_CONFIG = Object.freeze({
  radius: 15,
  orbitGap: 58,
  angularSpeed: 1.55,
  typeInterval: 0.72,
  hitPaddingFactor: 0.22,
});

export function createPowerCoreState() {
  return {
    active: false,
    angle: -Math.PI / 2,
    direction: 1,
    currentType: null,
    typeTimer: 0,
    pulse: 0,
  };
}

export function resetPowerCore(state) {
  if (!state || typeof state !== 'object') return state;
  state.powerCore = createPowerCoreState();
  return state;
}

function pickAvailableType(state, startIndex = 0) {
  const storable = new Set(getStorablePowerUps(state));
  if (storable.size === 0) return null;

  for (let offset = 0; offset < POWER_UP_ORDER.length; offset++) {
    const index = (startIndex + offset) % POWER_UP_ORDER.length;
    const type = POWER_UP_ORDER[index];
    if (storable.has(type)) return type;
  }

  return null;
}

/**
 * Intenta convertir 100 Power Charge en un Core. Si todo el inventario está
 * lleno, la carga permanece en 100 hasta que vuelva a existir un slot libre.
 */
export function trySpawnPowerCore(state, randomFn = Math.random) {
  if (!state || typeof state !== 'object') {
    return { spawned: false, reason: 'invalid-state' };
  }

  if (!state.powerCore || typeof state.powerCore !== 'object') {
    state.powerCore = createPowerCoreState();
  }

  if (state.powerCore.active) {
    return { spawned: false, reason: 'already-active' };
  }

  if (Number(state.level) < POWER_UP_CONFIG.minLevel) {
    return { spawned: false, reason: 'locked' };
  }

  if (Number(state.powerUpCharge) < POWER_UP_CONFIG.chargeMax) {
    return { spawned: false, reason: 'not-ready' };
  }

  const storable = getStorablePowerUps(state);
  if (storable.length === 0) {
    return { spawned: false, reason: 'inventory-full' };
  }

  const rng = typeof randomFn === 'function' ? randomFn : Math.random;
  const firstRoll = Number(rng());
  const angleRoll = Number(rng());
  const directionRoll = Number(rng());

  const safeFirst = Number.isFinite(firstRoll)
    ? Math.min(Math.max(firstRoll, 0), 0.9999999999999999)
    : 0;

  const firstType = storable[
    Math.floor(safeFirst * storable.length)
  ];

  state.powerCore.active = true;
  state.powerCore.angle = Number.isFinite(angleRoll)
    ? Math.min(Math.max(angleRoll, 0), 0.9999999999999999) * Math.PI * 2
    : -Math.PI / 2;
  state.powerCore.direction =
    Number.isFinite(directionRoll) && directionRoll < 0.5 ? -1 : 1;
  state.powerCore.currentType = firstType;
  state.powerCore.typeTimer = 0;
  state.powerCore.pulse = 0;

  state.powerUpCharge = Math.max(
    0,
    Number(state.powerUpCharge) - POWER_UP_CONFIG.chargeMax,
  );

  return {
    spawned: true,
    type: firstType,
  };
}

export function updatePowerCore(state, deltaTime) {
  const core = state?.powerCore;
  if (!core?.active) return null;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return null;

  core.angle +=
    POWER_CORE_CONFIG.angularSpeed * core.direction * dt;
  core.typeTimer += dt;
  core.pulse += dt;

  while (core.typeTimer >= POWER_CORE_CONFIG.typeInterval) {
    core.typeTimer -= POWER_CORE_CONFIG.typeInterval;

    const currentIndex = Math.max(
      0,
      POWER_UP_ORDER.indexOf(core.currentType),
    );

    const next = pickAvailableType(state, currentIndex + 1);
    if (next) core.currentType = next;
  }

  return core;
}

export function getPowerCorePosition(state) {
  const core = state?.powerCore;
  const ce = state?.centralElement;

  if (!core?.active || !ce) return null;

  const orbitRadius =
    ce.radius + POWER_CORE_CONFIG.orbitGap;

  return {
    x: ce.x + Math.cos(core.angle) * orbitRadius,
    y: ce.y + Math.sin(core.angle) * orbitRadius,
    radius: POWER_CORE_CONFIG.radius,
    orbitRadius,
    type: core.currentType,
  };
}

function segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq <= 0) {
    return Math.hypot(x1 - cx, y1 - cy) <= radius;
  }

  const t = Math.min(
    1,
    Math.max(
      0,
      ((cx - x1) * dx + (cy - y1) * dy) / lenSq,
    ),
  );

  const closestX = x1 + dx * t;
  const closestY = y1 + dy * t;

  return Math.hypot(closestX - cx, closestY - cy) <= radius;
}

/**
 * Detecta si el segmento recorrido por la flecha en este frame atravesó el
 * Core. No concede nada todavía: solo marca el tipo capturado en la flecha.
 */
export function checkPowerCoreCrossing(
  state,
  flyingProjectile,
  previousX,
  previousY,
) {
  if (
    !state?.powerCore?.active ||
    !flyingProjectile ||
    flyingProjectile.powerCoreHitType
  ) {
    return null;
  }

  const position = getPowerCorePosition(state);
  if (!position || !isPowerUpType(position.type)) return null;

  const hitRadius =
    position.radius +
    flyingProjectile.radius * POWER_CORE_CONFIG.hitPaddingFactor;

  const hit = segmentIntersectsCircle(
    previousX,
    previousY,
    flyingProjectile.x,
    flyingProjectile.y,
    position.x,
    position.y,
    hitRadius,
  );

  if (!hit) return null;

  flyingProjectile.powerCoreHitType = position.type;

  return {
    hit: true,
    type: position.type,
    x: position.x,
    y: position.y,
  };
}

/**
 * Se llama únicamente después de un anchor válido.
 */
export function completePowerCoreCapture(state, type) {
  if (
    !state?.powerCore?.active ||
    !isPowerUpType(type)
  ) {
    return {
      captured: false,
      type: isPowerUpType(type) ? type : null,
      collection: null,
    };
  }

  const collection = collectPowerUp(state, type);

  if (!collection.collected) {
    return {
      captured: false,
      type,
      collection,
    };
  }

  state.powerCore = createPowerCoreState();

  return {
    captured: true,
    type,
    collection,
  };
}
