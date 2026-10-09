/**
 * stability.js — margen de error de los niveles normales.
 *
 * Fuera de Boss Levels, una colisión ya no termina la partida al instante.
 * Reduce STABILITY; los impactos correctos y completar niveles permiten
 * recuperarla. Los Boss Levels mantienen su sistema separado de OVERLOAD.
 */

export const STABILITY_CONFIG = Object.freeze({
  max: 100,
  collisionLoss: 40,
  hitRecovery: 8,
  levelRecovery: 30,
});

export function ensureStability(state) {
  if (!state || typeof state !== 'object') return 0;

  if (!Number.isFinite(Number(state.stability))) {
    state.stability = STABILITY_CONFIG.max;
  }

  state.stability = Math.max(
    0,
    Math.min(STABILITY_CONFIG.max, Number(state.stability)),
  );

  return state.stability;
}

export function getStability(state) {
  const value = ensureStability(state);
  return {
    value,
    max: STABILITY_CONFIG.max,
    ratio: STABILITY_CONFIG.max > 0 ? value / STABILITY_CONFIG.max : 0,
    depleted: value <= 0,
  };
}

export function damageStability(state, amount = STABILITY_CONFIG.collisionLoss) {
  const before = ensureStability(state);
  const loss = Math.max(0, Number(amount) || 0);
  const value = Math.max(0, before - loss);
  state.stability = value;

  return {
    before,
    value,
    lost: before - value,
    depleted: value <= 0,
  };
}

export function recoverStability(state, amount = STABILITY_CONFIG.hitRecovery) {
  const before = ensureStability(state);
  const gain = Math.max(0, Number(amount) || 0);
  const value = Math.min(STABILITY_CONFIG.max, before + gain);
  state.stability = value;

  return {
    before,
    value,
    gained: value - before,
  };
}

export function restoreStability(state) {
  if (!state || typeof state !== 'object') return STABILITY_CONFIG.max;
  state.stability = STABILITY_CONFIG.max;
  return state.stability;
}
