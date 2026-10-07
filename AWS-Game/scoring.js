/**
 * scoring.js
 * ----------
 * Gestión del Score y el High Score en memoria.
 * No persiste datos fuera del GameState; la persistencia entre partidas
 * se delega a `captureHighScore` + `createInitialState`.
 */

/**
 * Incrementa el Score de la partida en curso en 1 punto.
 * Si el nuevo Score supera el High Score actual, actualiza también el High Score.
 *
 * @param {import('./state.js').GameState} state - Estado mutable del juego.
 *
 * Requirement 4.2 — cada anclaje exitoso suma 1 punto.
 * Requirement 6.3 / 9.3 — el High Score se actualiza en el mismo instante
 *                          en que el Score lo supera.
 */
export function incrementScore(state) {
  state.score += 1;
  if (state.score > state.highScore) {
    state.highScore = state.score;
  }
}

/**
 * Retorna el High Score que debe conservarse para la próxima partida.
 * Toma el mayor entre `state.score` y `state.highScore` para garantizar
 * que una actualización tardía nunca se pierda.
 *
 * Uso típico al reiniciar:
 *   const hs = captureHighScore(state);
 *   state = createInitialState(hs);
 *
 * @param {import('./state.js').GameState} state
 * @returns {number} El High Score a preservar entre partidas.
 *
 * Requirement 9.2 — el High Score se conserva en memoria entre partidas
 *                    sin almacenamiento externo.
 */
export function captureHighScore(state) {
  return Math.max(state.score, state.highScore);
}
