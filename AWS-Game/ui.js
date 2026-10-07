/**
 * ui.js
 * -----
 * Gestión de la interfaz de usuario: HUD (score + high score) y overlay de Game Over.
 * Opera exclusivamente sobre el DOM mediante APIs nativas; sin frameworks ni librerías externas.
 *
 * Funciones exportadas:
 *  - updateHUD(scoreEl, highScoreEl, state)  → actualiza los contadores del HUD en tiempo real
 *  - showGameOver(overlayEl, state)          → muestra el overlay con los resultados finales
 *  - hideGameOver(overlayEl)                 → oculta el overlay para una nueva partida
 */

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

/**
 * Actualiza los elementos DOM del HUD con los valores actuales del estado.
 * Debe llamarse en cada frame (o cada vez que cambie el score) para cumplir
 * el requisito de actualización inmediata sin retardo perceptible.
 *
 * @param {HTMLElement} scoreEl      - Elemento que muestra el score actual (#scoreDisplay)
 * @param {HTMLElement} highScoreEl  - Elemento que muestra el high score (#highScoreDisplay)
 * @param {import('./state.js').GameState} state - Estado actual del juego
 *
 * @example
 * updateHUD(
 *   document.getElementById('scoreDisplay'),
 *   document.getElementById('highScoreDisplay'),
 *   state
 * );
 *
 * Requirements: 8.1, 8.2, 8.3
 */
export function updateHUD(scoreEl, highScoreEl, state) {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
}

// ---------------------------------------------------------------------------
// Game Over overlay
// ---------------------------------------------------------------------------

/**
 * Muestra el overlay de Game Over con el score final y el high score actuales.
 * El overlay pasa de oculto a visible añadiendo la clase CSS `visible`.
 * El botón "Play Again" queda habilitado para interacción del jugador.
 *
 * Debe llamarse tras actualizar `state.highScore` si el score final lo supera
 * (responsabilidad del llamante, típicamente `scoring.captureHighScore`), de modo
 * que el valor mostrado en `#finalHighScore` ya refleje el récord actualizado.
 *
 * @param {HTMLElement} overlayEl - Elemento raíz del overlay (#gameOverOverlay)
 * @param {import('./state.js').GameState} state - Estado al momento del game over
 *
 * @example
 * showGameOver(document.getElementById('gameOverOverlay'), state);
 *
 * Requirements: 6.1, 6.2, 6.4
 */
export function showGameOver(overlayEl, state) {
  // Actualizar los valores de score y high score dentro del overlay
  overlayEl.querySelector('#finalScore').textContent = state.score;
  overlayEl.querySelector('#finalHighScore').textContent = state.highScore;
  const finalLevel = overlayEl.querySelector('#finalLevel');
  if (finalLevel) finalLevel.textContent = String(state.level ?? 1);

  // Asegurar que el botón "Play Again" esté habilitado
  const playAgainBtn = overlayEl.querySelector('#playAgainBtn');
  if (playAgainBtn) {
    playAgainBtn.disabled = false;
  }

  // Hacer visible el overlay (la clase 'visible' en style.css activa display/opacity)
  overlayEl.classList.add('visible');
}

/**
 * Oculta el overlay de Game Over retirando la clase CSS `visible`.
 * Debe llamarse cuando el jugador activa el botón "Play Again" y se inicia
 * una nueva partida.
 *
 * @param {HTMLElement} overlayEl - Elemento raíz del overlay (#gameOverOverlay)
 *
 * @example
 * hideGameOver(document.getElementById('gameOverOverlay'));
 *
 * Requirements: 7.1
 */
export function hideGameOver(overlayEl) {
  overlayEl.classList.remove('visible');
}
