/**
 * scoring.js
 * ----------
 * Gestión del Score y del High Score.
 * El récord se guarda en localStorage para conservarlo incluso al cerrar
 * y volver a abrir el juego.
 */

const HIGH_SCORE_KEY = 'awsArcadeHighScore';

/**
 * Lee el récord guardado. Si el navegador no permite localStorage o el dato
 * no es válido, devuelve 0 sin romper el juego.
 */
export function loadHighScore() {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const value = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Guarda un récord válido en localStorage.
 */
export function saveHighScore(value) {
  const safeValue = Math.max(0, Math.floor(Number(value) || 0));
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(safeValue));
  } catch {
    // Si localStorage no está disponible, el juego continúa usando memoria.
  }
  return safeValue;
}

/**
 * Sincroniza el récord del estado con el score actual y lo persiste si cambia.
 */
export function updateHighScore(state) {
  const nextHighScore = Math.max(state.highScore ?? 0, state.score ?? 0);
  if (nextHighScore !== state.highScore) {
    state.highScore = nextHighScore;
    saveHighScore(nextHighScore);
  }
  return state.highScore;
}

/**
 * Incrementa el Score de la partida en curso en 1 punto y actualiza el récord.
 */
export function incrementScore(state) {
  state.score += 1;
  updateHighScore(state);
}

/**
 * Retorna el High Score que debe conservarse para la próxima partida y se
 * asegura de que quede guardado permanentemente.
 */
export function captureHighScore(state) {
  const highScore = updateHighScore(state);
  saveHighScore(highScore);
  return highScore;
}
