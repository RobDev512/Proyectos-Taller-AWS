/**
 * powerups.js — Sistema interactivo de Power-Ups de AWS Arcade Game.
 *
 * v1.3.1 cambia el modelo de activación:
 * - Las Power-Up Arrows OTORGAN un Power-Up al inventario.
 * - El jugador decide cuándo usarlo mediante clic/tap o teclas 1–4.
 * - Power Charge ofrece una segunda vía de obtención basada en buen juego.
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
  spawnChance: 0.18,

  freezeDuration: 2.0,
  shieldMaxCharges: 1,
  doubleScoreHits: 3,

  inventoryMaxPerType: 2,
  chargeMax: 100,
  chargePerHit: 10,
  perfectChargeBonus: 18,
  comboChargeStep: 5,
  levelCompleteCharge: 15,
  overflowConversionCharge: 25,

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
      Number.isFinite(freezeTimer) && freezeTimer > 0 ? freezeTimer : 0,
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
  state.powerUpCharge =
    Number.isFinite(charge)
      ? Math.min(POWER_UP_CONFIG.chargeMax, Math.max(0, charge))
      : 0;

  state.nextPowerUp = isPowerUpType(state.nextPowerUp)
    ? state.nextPowerUp
    : null;

  state.pendingPowerUpActivation =
    isPowerUpType(state.pendingPowerUpActivation)
      ? state.pendingPowerUpActivation
      : null;

  state.lastPreparedWasPowerUp = Boolean(state.lastPreparedWasPowerUp);

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

/**
 * Tipos que aún caben en el inventario.
 */
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
 * Compatibilidad con el nombre usado por v1.3.0.
 * Ahora la elegibilidad depende de espacio de inventario, porque la flecha
 * ya no activa el efecto automáticamente.
 */
export function getEligiblePowerUps(state) {
  return getStorablePowerUps(state);
}

/**
 * Decide si la próxima flecha preparada será una Power-Up Arrow.
 */
export function rollNextPowerUp(state, randomFn = Math.random) {
  if (!state || typeof state !== 'object') return null;

  const level = Number.isFinite(Number(state.level))
    ? Math.max(1, Math.floor(Number(state.level)))
    : 1;

  if (level < POWER_UP_CONFIG.minLevel) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  if (state.lastPreparedWasPowerUp) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  const eligible = getStorablePowerUps(state);
  if (eligible.length === 0) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  const rng = typeof randomFn === 'function' ? randomFn : Math.random;
  const roll = Number(rng());

  if (!Number.isFinite(roll) || roll >= POWER_UP_CONFIG.spawnChance) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  const selectionRoll = Number(rng());
  const normalizedSelection = Number.isFinite(selectionRoll)
    ? Math.min(Math.max(selectionRoll, 0), 0.9999999999999999)
    : 0;

  const index = Math.floor(normalizedSelection * eligible.length);
  const selected = eligible[index] ?? null;

  state.lastPreparedWasPowerUp = selected !== null;
  return selected;
}

/**
 * Intenta otorgar un Power-Up al inventario.
 * Si el tipo está lleno, lo convierte en Power Charge.
 */
export function collectPowerUp(state, type, randomFn = Math.random) {
  if (!state || !isPowerUpType(type)) {
    return {
      type: isPowerUpType(type) ? type : null,
      collected: false,
      converted: false,
      count: 0,
      chargeReward: null,
    };
  }

  sanitizePowerUpState(state);

  const current = state.powerUpInventory[type];
  if (current < POWER_UP_CONFIG.inventoryMaxPerType) {
    state.powerUpInventory[type] = current + 1;
    return {
      type,
      collected: true,
      converted: false,
      count: state.powerUpInventory[type],
      chargeReward: null,
    };
  }

  const chargeResult = addPowerUpCharge(
    state,
    POWER_UP_CONFIG.overflowConversionCharge,
    randomFn,
  );

  return {
    type,
    collected: false,
    converted: true,
    count: current,
    chargeReward: chargeResult.reward,
  };
}

/**
 * Puede usarse un Power-Up almacenado ahora mismo.
 */
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

/**
 * Consume un Power-Up almacenado y activa su efecto.
 */
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
      const removedProjectile = state.anchoredProjectiles.shift() ?? null;
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
 * Entrega automáticamente una recompensa si Power Charge está lleno.
 */
export function claimPowerUpChargeReward(state, randomFn = Math.random) {
  if (!state || typeof state !== 'object') return null;
  sanitizePowerUpState(state);

  if (Number(state.level) < POWER_UP_CONFIG.minLevel) return null;
  if (state.powerUpCharge < POWER_UP_CONFIG.chargeMax) return null;

  const eligible = getStorablePowerUps(state);
  if (eligible.length === 0) return null;

  const rng = typeof randomFn === 'function' ? randomFn : Math.random;
  const selectionRoll = Number(rng());
  const normalizedSelection = Number.isFinite(selectionRoll)
    ? Math.min(Math.max(selectionRoll, 0), 0.9999999999999999)
    : 0;

  const index = Math.floor(normalizedSelection * eligible.length);
  const type = eligible[index] ?? eligible[0];

  state.powerUpInventory[type] += 1;
  state.powerUpCharge = Math.max(
    0,
    state.powerUpCharge - POWER_UP_CONFIG.chargeMax,
  );

  return {
    type,
    collected: true,
    converted: false,
    count: state.powerUpInventory[type],
    source: 'charge',
  };
}

/**
 * Añade progreso al medidor y, cuando corresponde, entrega recompensa.
 */
export function addPowerUpCharge(state, amount, randomFn = Math.random) {
  if (!state || typeof state !== 'object') {
    return { added: 0, reward: null };
  }

  sanitizePowerUpState(state);

  const safeAmount = Math.max(0, Number(amount) || 0);
  const before = state.powerUpCharge;
  state.powerUpCharge = Math.min(
    POWER_UP_CONFIG.chargeMax,
    before + safeAmount,
  );

  const reward = claimPowerUpChargeReward(state, randomFn);

  return {
    added: state.powerUpCharge - before + (reward ? POWER_UP_CONFIG.chargeMax : 0),
    reward,
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
