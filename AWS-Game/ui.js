/**
 * ui.js
 * -----
 * Gestión de la interfaz de usuario: HUD (score + high score) y overlay de Game Over.
 * Opera exclusivamente sobre el DOM mediante APIs nativas; sin frameworks ni librerías externas.
 */

export function updateHUD(scoreEl, highScoreEl, state) {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
}

export function showGameOver(overlayEl, state) {
  overlayEl.querySelector('#finalScore').textContent = state.score;
  overlayEl.querySelector('#finalHighScore').textContent = state.highScore;

  const finalLevel = overlayEl.querySelector('#finalLevel');
  if (finalLevel) finalLevel.textContent = String(state.level ?? 1);

  const title = overlayEl.querySelector('#gameOverTitle');
  if (title) {
    title.textContent = state.gameOverReason === 'SOBRECARGA DEL JEFE'
      ? 'Sobrecarga del jefe'
      : 'Fin de la partida';
  }

  const finalCoins = overlayEl.querySelector('#finalCoins');
  if (finalCoins) finalCoins.textContent = String(Math.max(0, Math.floor(Number(state.economy?.coins) || 0)));

  const finalMaxLives = overlayEl.querySelector('#finalMaxLives');
  if (finalMaxLives) finalMaxLives.textContent = String(Math.max(3, Math.floor(Number(state.economy?.maxLives) || 3)));

  const playAgainBtn = overlayEl.querySelector('#playAgainBtn');
  if (playAgainBtn) playAgainBtn.disabled = false;

  overlayEl.classList.add('visible');
}

export function hideGameOver(overlayEl) {
  overlayEl.classList.remove('visible');
}
