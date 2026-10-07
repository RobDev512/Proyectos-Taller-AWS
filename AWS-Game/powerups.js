/**
 * powerups.js — Sistema base de Power-Ups.
 *
 * Contiene tipos, configuración y helpers de estado.
 * La generación, activación e integración con gameplay se añaden
 * progresivamente durante la implementación de v1.3.0.
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
