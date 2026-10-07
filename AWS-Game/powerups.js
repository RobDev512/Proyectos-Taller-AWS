/**
 * powerups.js — Inventario y efectos de Power-Ups.
 *
 * Desde v1.3.2 los Power-Ups ya no llegan gratis mediante flechas especiales.
 * El jugador llena Power Charge, captura un Power Core con un tiro válido y
 * después decide cuándo activar la recompensa desde el Power-Up Dock.
 */

export const POWER_UP_TYPES = Object.freeze({
  FREEZE: 'freeze',
  SHIELD: 'shield',
  DOUBLE: 'double',
  CLEANUP: 'cleanup',
});

export const POWER_UP_ORDER = Object.freeze([
  POWER_UP_TYPES.FREEZE,
  POWER_UP_TYPES.SHIELD,
  POWER_UP_TYPES.DOUBLE,
  POWER_UP_TYPES.CLEANUP,
]);

export const POWER_UP_CONFIG = Object.freeze({
  minLevel: 2,

  freezeDuration: 2.0,
  shieldMaxCharges: 1,
  doubleScoreHits: 3,

  inventoryMaxPerType: 2,

  // Power Charge — v1.3.2
  chargeMax: 100,
  chargePerHit: 12,
  perfectChargeBonus: 14,
  comboChargeStep: 4,
  levelCompleteCharge: 20,

  colors: Object.freeze({
    freeze: '#36C5F0',
    shield: '#7C83FF',
    double: '#FFD166',
    cleanup: '#5DD39E',
  }),

  labels: Object.freeze({
    freeze: 'FRZ',
    shield: 'SHD',
    double: '2X',
    cleanup: 'CLR',
  }),

  names: Object.freeze({
    freeze: 'FREEZE',
    shield: 'SHIELD',
    double: 'DOUBLE',
    cleanup: 'CLEANUP',
  }),

  shortcuts: Object.freeze({
    freeze: '1',
    shield: '2',
    double: '3',
    cleanup: '4',
  }),
});

const VALID_POWER_UP_TYPES = new Set(POWER_UP_ORDER);

export function createActivePowerUps() {
  return {
    freezeTimer: 0,
    shieldCharges: 0,
    doubleScoreHits: 0,
  };
}

export function createPowerUpInventory() {
  return {
    freeze: 0,
    shield: 0,
    double: 0,
    cleanup: 0,
  };
}

export function isPowerUpType(type) {
  return VALID_POWER_UP_TYPES.has(type);
}

function sanitizeCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;

  return Math.min(
    POWER_UP_CONFIG.inventoryMaxPerType,
    Math.max(0, Math.floor(n)),
  );
}

export function sanitizePowerUpState(state) {
  if (!state || typeof state !== 'object') return state;

  const active =
    state.activePowerUps && typeof state.activePowerUps === 'object'
      ? state.activePowerUps
      : {};

  const freezeTimer = Number(active.freezeTimer);
  const shieldCharges = Number(active.shieldCharges);
  const doubleScoreHits = Number(active.doubleScoreHits);

  state.activePowerUps = {
    freezeTimer:
      Number.isFinite(freezeTimer) && freezeTimer > 0
        ? freezeTimer
        : 0,

    shieldCharges:
      Number.isFinite(shieldCharges)
        ? Math.min(
            POWER_UP_CONFIG.shieldMaxCharges,
            Math.max(0, Math.floor(shieldCharges)),
          )
        : 0,

    doubleScoreHits:
      Number.isFinite(doubleScoreHits)
        ? Math.min(
            POWER_UP_CONFIG.doubleScoreHits,
            Math.max(0, Math.floor(doubleScoreHits)),
          )
        : 0,
  };

  const inventory =
    state.powerUpInventory && typeof state.powerUpInventory === 'object'
      ? state.powerUpInventory
      : {};

  state.powerUpInventory = createPowerUpInventory();
  for (const type of POWER_UP_ORDER) {
    state.powerUpInventory[type] = sanitizeCount(inventory[type]);
  }

  const charge = Number(state.powerUpCharge);
  state.powerUpCharge = Number.isFinite(charge)
    ? Math.min(POWER_UP_CONFIG.chargeMax, Math.max(0, charge))
    : 0;

  state.pendingPowerUpActivation = isPowerUpType(
    state.pendingPowerUpActivation,
  )
    ? state.pendingPowerUpActivation
    : null;

  // Compatibilidad con estados temporales de v1.3.0/v1.3.1.
  state.nextPowerUp = null;
  state.lastPreparedWasPowerUp = false;

  return state;
}

export function resetPowerUps(state) {
  if (!state || typeof state !== 'object') return state;

  state.nextPowerUp = null;
  state.activePowerUps = createActivePowerUps();
  state.powerUpInventory = createPowerUpInventory();
  state.powerUpCharge = 0;
  state.pendingPowerUpActivation = null;
  state.lastPreparedWasPowerUp = false;

  return state;
}

export function getStorablePowerUps(state) {
  if (!state || typeof state !== 'object') return [];

  const inventory =
    state.powerUpInventory && typeof state.powerUpInventory === 'object'
      ? state.powerUpInventory
      : createPowerUpInventory();

  return POWER_UP_ORDER.filter(
    type =>
      sanitizeCount(inventory[type]) <
      POWER_UP_CONFIG.inventoryMaxPerType,
  );
}

/**
 * Compatibilidad con código anterior. Ya no se generan Power-Up Arrows.
 */
export function getEligiblePowerUps(state) {
  return getStorablePowerUps(state);
}

/**
 * v1.3.2: las flechas normales nunca llevan Power-Up automáticamente.
 */
export function rollNextPowerUp() {
  return null;
}

/**
 * Guarda una recompensa capturada en el inventario.
 */
export function collectPowerUp(state, type) {
  if (!state || !isPowerUpType(type)) {
    return {
      type: isPowerUpType(type) ? type : null,
      collected: false,
      count: 0,
    };
  }

  sanitizePowerUpState(state);

  const current = state.powerUpInventory[type];
  if (current >= POWER_UP_CONFIG.inventoryMaxPerType) {
    return {
      type,
      collected: false,
      count: current,
    };
  }

  state.powerUpInventory[type] = current + 1;

  return {
    type,
    collected: true,
    count: state.powerUpInventory[type],
  };
}

export function canActivateStoredPowerUp(state, type) {
  if (!state || !isPowerUpType(type)) return false;

  const inventory = state.powerUpInventory ?? {};
  if ((Number(inventory[type]) || 0) <= 0) return false;

  const active = state.activePowerUps ?? {};

  switch (type) {
    case POWER_UP_TYPES.FREEZE:
      return !(Number(active.freezeTimer) > 0);

    case POWER_UP_TYPES.SHIELD:
      return !(Number(active.shieldCharges) > 0);

    case POWER_UP_TYPES.DOUBLE:
      return !(Number(active.doubleScoreHits) > 0);

    case POWER_UP_TYPES.CLEANUP:
      return (
        Array.isArray(state.anchoredProjectiles) &&
        state.anchoredProjectiles.length > 0
      );

    default:
      return false;
  }
}

export function activateStoredPowerUp(state, type) {
  if (!canActivateStoredPowerUp(state, type)) {
    return {
      type: isPowerUpType(type) ? type : null,
      activated: false,
      removedProjectile: null,
    };
  }

  sanitizePowerUpState(state);
  state.powerUpInventory[type] -= 1;

  switch (type) {
    case POWER_UP_TYPES.FREEZE:
      state.activePowerUps.freezeTimer =
        POWER_UP_CONFIG.freezeDuration;
      break;

    case POWER_UP_TYPES.SHIELD:
      state.activePowerUps.shieldCharges =
        POWER_UP_CONFIG.shieldMaxCharges;
      break;

    case POWER_UP_TYPES.DOUBLE:
      state.activePowerUps.doubleScoreHits =
        POWER_UP_CONFIG.doubleScoreHits;
      break;

    case POWER_UP_TYPES.CLEANUP: {
      const removedProjectile =
        state.anchoredProjectiles.shift() ?? null;

      return {
        type,
        activated: removedProjectile !== null,
        removedProjectile,
      };
    }

    default:
      return {
        type,
        activated: false,
        removedProjectile: null,
      };
  }

  return {
    type,
    activated: true,
    removedProjectile: null,
  };
}

/**
 * Añade Power Charge. Llegar a 100 NO regala un Power-Up: únicamente deja
 * el medidor listo para generar un Power Core desde powercore.js.
 */
export function addPowerUpCharge(state, amount) {
  if (!state || typeof state !== 'object') {
    return { before: 0, after: 0, added: 0, becameReady: false };
  }

  sanitizePowerUpState(state);

  const safeAmount = Math.max(0, Number(amount) || 0);
  const before = state.powerUpCharge;
  const after = Math.min(
    POWER_UP_CONFIG.chargeMax,
    before + safeAmount,
  );

  state.powerUpCharge = after;

  return {
    before,
    after,
    added: after - before,
    becameReady:
      before < POWER_UP_CONFIG.chargeMax &&
      after >= POWER_UP_CONFIG.chargeMax,
  };
}

export function isFreezeActive(state) {
  return Boolean(
    state &&
    state.activePowerUps &&
    Number(state.activePowerUps.freezeTimer) > 0
  );
}

export function updatePowerUps(state, deltaTime) {
  if (
    !state ||
    typeof state !== 'object' ||
    !state.activePowerUps ||
    typeof state.activePowerUps !== 'object'
  ) {
    return;
  }

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return;

  const freezeTimer = Number(state.activePowerUps.freezeTimer);

  state.activePowerUps.freezeTimer =
    Number.isFinite(freezeTimer) && freezeTimer > 0
      ? Math.max(0, freezeTimer - dt)
      : 0;
}

export function consumeShield(state) {
  if (
    !state ||
    !state.activePowerUps ||
    Number(state.activePowerUps.shieldCharges) <= 0
  ) {
    return false;
  }

  state.activePowerUps.shieldCharges = 0;
  return true;
}

export function isDoubleScoreActive(state) {
  return Boolean(
    state &&
    state.activePowerUps &&
    Number(state.activePowerUps.doubleScoreHits) > 0
  );
}

export function consumeDoubleScoreHit(state) {
  if (
    !state ||
    !state.activePowerUps ||
    Number(state.activePowerUps.doubleScoreHits) <= 0
  ) {
    return 0;
  }

  const remaining = Math.max(
    0,
    Math.floor(Number(state.activePowerUps.doubleScoreHits)) - 1,
  );

  state.activePowerUps.doubleScoreHits = remaining;
  return remaining;
}
