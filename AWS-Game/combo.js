/**
 * combo.js — Sistema de combo/multiplicador de puntos.
 * Si el jugador lanza flechas consecutivas en menos de MAX_GAP segundos,
 * el multiplicador sube. Si tarda más, se reinicia a x1.
 */

const MAX_GAP = 2.2;   // segundos máximos entre flechas para mantener combo

let enabled    = true;
export function setComboEnabled(val) { enabled = val; }
export function isComboEnabled()     { return enabled; }

/**
 * Registra un anclaje exitoso y retorna el multiplicador actual.
 * @param {Object} state  - GameState (se modifica comboLevel y lastAnchorTime)
 * @returns {number} multiplicador (1, 2, 3, …)
 */
export function registerAnchor(state) {
  if (!enabled) {
    state.comboLevel    = 1;
    state.lastAnchorTime = performance.now();
    return 1;
  }

  const now = performance.now();
  const previous = state.lastAnchorTime ?? 0;

  // El primer anclaje de cada partida SIEMPRE comienza en x1.
  // Antes se comparaba contra 0 y, si el jugador acertaba rápido,
  // podía arrancar accidentalmente en x2.
  if (previous <= 0) {
    state.comboLevel = 1;
    state.lastAnchorTime = now;
    return 1;
  }

  const elapsed = (now - previous) / 1000;
  if (elapsed <= MAX_GAP && (state.comboLevel ?? 1) < 5) {
    state.comboLevel = (state.comboLevel ?? 1) + 1;
  } else {
    state.comboLevel = 1;
  }

  state.lastAnchorTime = now;
  return state.comboLevel ?? 1;
}

/** Resetea el combo (al iniciar partida) */
export function resetCombo(state) {
  state.comboLevel     = 1;
  state.lastAnchorTime = 0;
}
