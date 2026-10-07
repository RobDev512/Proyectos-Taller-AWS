/**
 * input.js
 * --------
 * Captura y filtrado de eventos de entrada del jugador.
 *
 * Acciones de juego:
 *   - Barra espaciadora
 *   - Clic dentro del canvas
 *
 * El pequeño botón de configuración dibujado en la esquina superior derecha
 * es UI, no una acción de juego: su clic abre el panel y NO lanza proyectil.
 */

function toCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

function isSettingsPoint(canvas, x, y) {
  const cx = canvas.width - 45;
  const cy = 42;
  const r  = 24; // hitbox un poco mayor que el círculo visible
  return Math.hypot(x - cx, y - cy) <= r;
}

/**
 * Registra los event listeners de entrada del jugador.
 * Usa AbortController para eliminar listeners al reiniciar.
 */
export function registerInputHandlers(canvas, state, abortController) {
  const controller = abortController ?? new AbortController();
  const { signal } = controller;

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    event.preventDefault();

    if (state.phase === 'playing' && state.flyingProjectile === null) {
      state.pendingLaunch = true;
    }
  }, { signal });

  canvas.addEventListener('click', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);

    // El botón de configuración es UI y no cuenta como lanzamiento.
    if (isSettingsPoint(canvas, x, y) && state.phase !== 'gameover') {
      canvas.dispatchEvent(new CustomEvent('settings-open'));
      return;
    }

    if (state.phase === 'playing' && state.flyingProjectile === null) {
      state.pendingLaunch = true;
    }
  }, { signal });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);
    canvas.style.cursor = isSettingsPoint(canvas, x, y) ? 'pointer' : 'default';
  }, { signal });

  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
  }, { signal });

  return controller;
}
