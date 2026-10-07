/**
 * powerups.js — Sistema de Power-Ups de AWS Arcade Game.
 *
 * Contiene tipos, configuración, helpers de estado y generación
 * probabilística de Power-Up Arrows.
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
