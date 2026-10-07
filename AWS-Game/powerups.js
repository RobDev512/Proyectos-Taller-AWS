/**
 * powerups.js — Sistema de Power-Ups de AWS Arcade Game.
 *
 * Contiene tipos, configuración, helpers de estado, generación
 * probabilística y lógica de efectos activos.
 */

export const POWER_UP_TYPES = Object.freeze({
  FREEZE: 'freeze',
  SHIELD: 'shield',
  DOUBLE: 'double',
  CLEANUP: 'cleanup',
});

export const POWER_UP_CONFIG = Object.freeze({
  minLevel: 2,
  spawnChance: 0.16,

  freezeDuration: 2.0,
  shieldMaxCharges: 1,
  doubleScoreHits: 3,

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
});

const VALID_POWER_UP_TYPES = new Set(Object.values(POWER_UP_TYPES));

/**
 * Crea el estado limpio de efectos activos.
 */
export function createActivePowerUps() {
  return {
    freezeTimer: 0,
    shieldCharges: 0,
    doubleScoreHits: 0,
  };
}

/**
 * Indica si un valor representa un tipo de Power-Up válido.
 *
 * @param {unknown} type
 * @returns {boolean}
 */
export function isPowerUpType(type) {
  return VALID_POWER_UP_TYPES.has(type);
}

/**
 * Normaliza el estado relacionado con Power-Ups.
 *
 * Sirve como protección frente a valores inválidos o estados antiguos
 * creados antes de v1.3.0.
 *
 * @param {Object} state
 * @returns {Object}
 */
export function sanitizePowerUpState(state) {
  if (!state || typeof state !== 'object') {
    return state;
  }

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

  if (!isPowerUpType(state.nextPowerUp)) {
    state.nextPowerUp = null;
  }

  state.lastPreparedWasPowerUp =
    Boolean(state.lastPreparedWasPowerUp);

  return state;
}

/**
 * Restablece completamente los Power-Ups de una partida.
 *
 * No toca score, nivel, dificultad, estadísticas ni ningún otro
 * sistema del juego.
 *
 * @param {Object} state
 * @returns {Object}
 */
export function resetPowerUps(state) {
  if (!state || typeof state !== 'object') {
    return state;
  }

  state.nextPowerUp = null;
  state.activePowerUps = createActivePowerUps();
  state.lastPreparedWasPowerUp = false;

  return state;
}

/**
 * Devuelve los Power-Ups que tienen sentido para el estado actual.
 *
 * Freeze, Shield y Double Score se excluyen mientras su efecto
 * correspondiente ya esté activo. Cleanup solamente puede aparecer
 * cuando existen al menos dos proyectiles anclados.
 *
 * @param {Object} state
 * @returns {string[]}
 */
export function getEligiblePowerUps(state) {
  if (!state || typeof state !== 'object') {
    return [];
  }

  const active =
    state.activePowerUps && typeof state.activePowerUps === 'object'
      ? state.activePowerUps
      : createActivePowerUps();

  const eligible = [];

  if (!(Number(active.freezeTimer) > 0)) {
    eligible.push(POWER_UP_TYPES.FREEZE);
  }

  if (!(Number(active.shieldCharges) > 0)) {
    eligible.push(POWER_UP_TYPES.SHIELD);
  }

  if (!(Number(active.doubleScoreHits) > 0)) {
    eligible.push(POWER_UP_TYPES.DOUBLE);
  }

  if (
    Array.isArray(state.anchoredProjectiles) &&
    state.anchoredProjectiles.length >= 2
  ) {
    eligible.push(POWER_UP_TYPES.CLEANUP);
  }

  return eligible;
}

/**
 * Decide qué Power-Up, si alguno, tendrá la siguiente flecha preparada.
 *
 * Reglas:
 * - No hay Power-Ups antes del Level 2.
 * - Nunca se preparan dos Power-Up Arrows consecutivas.
 * - La probabilidad base es 16 %.
 * - Solo se seleccionan Power-Ups elegibles.
 *
 * La función actualiza `lastPreparedWasPowerUp` para que el siguiente
 * roll pueda aplicar correctamente la regla anti-consecutivos.
 *
 * @param {Object} state
 * @param {Function} randomFn Función RNG; Math.random por defecto.
 * @returns {string|null}
 */
export function rollNextPowerUp(state, randomFn = Math.random) {
  if (!state || typeof state !== 'object') {
    return null;
  }

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

  const rng = typeof randomFn === 'function' ? randomFn : Math.random;
  const roll = Number(rng());

  if (!Number.isFinite(roll) || roll >= POWER_UP_CONFIG.spawnChance) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  const eligible = getEligiblePowerUps(state);

  if (eligible.length === 0) {
    state.lastPreparedWasPowerUp = false;
    return null;
  }

  const selectionRoll = Number(rng());
  const normalizedSelection = Number.isFinite(selectionRoll)
    ? Math.min(Math.max(selectionRoll, 0), 0.9999999999999999)
    : 0;

  const index = Math.floor(normalizedSelection * eligible.length);
  const selected = eligible[index];

  state.lastPreparedWasPowerUp = true;
  return selected;
}

/**
 * Indica si Freeze está activo.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function isFreezeActive(state) {
  return Boolean(
    state &&
    state.activePowerUps &&
    Number(state.activePowerUps.freezeTimer) > 0
  );
}

/**
 * Activa un Power-Up.
 *
 * Cleanup elimina el Anchored Projectile más antiguo, pero únicamente
 * cuando la Power-Up Arrow recién anclada tiene al menos dos proyectiles
 * anteriores disponibles. La propia Cleanup Arrow permanece anclada.
 *
 * @param {Object} state
 * @param {string|null} type
 * @returns {{type:string|null, activated:boolean, removedProjectile:null}}
 */
export function activatePowerUp(state, type) {
  if (!state || typeof state !== 'object' || !isPowerUpType(type)) {
    return {
      type: isPowerUpType(type) ? type : null,
      activated: false,
      removedProjectile: null,
    };
  }

  if (
    !state.activePowerUps ||
    typeof state.activePowerUps !== 'object'
  ) {
    state.activePowerUps = createActivePowerUps();
  }

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
      const anchored = Array.isArray(state.anchoredProjectiles)
        ? state.anchoredProjectiles
        : [];

      // La Cleanup Arrow ya está al final del array. Para respetar la
      // elegibilidad original deben existir al menos dos flechas previas.
      if (anchored.length < 3) {
        return {
          type,
          activated: false,
          removedProjectile: null,
        };
      }

      const removedProjectile = anchored.shift();

      return {
        type,
        activated: true,
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
 * Actualiza los efectos activos basados en tiempo.
 *
 * Debe invocarse únicamente durante `phase === 'playing'`.
 * De esta forma Freeze queda pausado durante levelcomplete,
 * idle y gameover.
 *
 * @param {Object} state
 * @param {number} deltaTime Segundos transcurridos.
 */
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
  if (!Number.isFinite(dt) || dt <= 0) {
    return;
  }

  const freezeTimer = Number(state.activePowerUps.freezeTimer);

  state.activePowerUps.freezeTimer =
    Number.isFinite(freezeTimer) && freezeTimer > 0
      ? Math.max(0, freezeTimer - dt)
      : 0;
}

/**
 * Consume un Shield Charge.
 *
 * @param {Object} state
 * @returns {boolean} true cuando una carga fue consumida.
 */
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

/**
 * Indica si Double Score está activo.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function isDoubleScoreActive(state) {
  return Boolean(
    state &&
    state.activePowerUps &&
    Number(state.activePowerUps.doubleScoreHits) > 0
  );
}

/**
 * Consume un hit de Double Score.
 *
 * @param {Object} state
 * @returns {number} Hits restantes.
 */
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
