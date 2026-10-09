/**
 * input.js
 * --------
 * Controles:
 * - Space o clic fuera de UI: lanzar.
 * - Clic/tap en el Power-Up Dock: activar Power-Up almacenado.
 * - Teclas 1–4: activar Freeze, Shield, Double o Cleanup.
 */

import {
  POWER_UP_ORDER,
  canActivateStoredPowerUp,
} from './powerups.js?build=v140-close-r5';
import { getPowerUpSlotAtPoint } from './powerupUi.js?build=v140-close-r5';

function getLogicalCanvasSize(canvas) {
  return {
    width: Math.max(1, Number(canvas.dataset.logicalWidth) || 600),
    height: Math.max(1, Number(canvas.dataset.logicalHeight) || 700),
  };
}

function toCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const logical = getLogicalCanvasSize(canvas);
  return {
    x: (event.clientX - rect.left) * (logical.width / rect.width),
    y: (event.clientY - rect.top)  * (logical.height / rect.height),
  };
}

function getLayout(canvas) {
  return canvas.dataset.layout === 'compact' ? 'compact' : 'desktop';
}

function isSettingsPoint(canvas, x, y) {
  const { width } = getLogicalCanvasSize(canvas);
  const cx = width - 45;
  const cy = 42;
  const r  = 24;
  return Math.hypot(x - cx, y - cy) <= r;
}

function shortcutToPowerUp(code, key = '') {
  const keyMap = {
    '1': POWER_UP_ORDER[0],
    '2': POWER_UP_ORDER[1],
    '3': POWER_UP_ORDER[2],
    '4': POWER_UP_ORDER[3],
  };

  const codeMap = {
    Digit1: POWER_UP_ORDER[0],
    Numpad1: POWER_UP_ORDER[0],
    Digit2: POWER_UP_ORDER[1],
    Numpad2: POWER_UP_ORDER[1],
    Digit3: POWER_UP_ORDER[2],
    Numpad3: POWER_UP_ORDER[2],
    Digit4: POWER_UP_ORDER[3],
    Numpad4: POWER_UP_ORDER[3],
  };

  return codeMap[code] ?? keyMap[key] ?? null;
}

function requestPowerUpActivation(state, type) {
  if (
    state.phase === 'playing' &&
    canActivateStoredPowerUp(state, type)
  ) {
    state.pendingPowerUpActivation = type;
    return true;
  }

  return false;
}

export function registerInputHandlers(canvas, state, abortController) {
  const controller = abortController ?? new AbortController();
  const { signal } = controller;

  canvas.tabIndex = 0;
  canvas.style.outline = 'none';

  window.addEventListener('keydown', (event) => {
    const powerUpType = shortcutToPowerUp(event.code, event.key);

    if (powerUpType) {
      event.preventDefault();
      requestPowerUpActivation(state, powerUpType);
      return;
    }

    if (event.code !== 'Space' && event.key !== ' ') return;
    event.preventDefault();

    if (state.phase === 'playing' && state.flyingProjectile === null) {
      state.pendingLaunch = true;
    }
  }, { signal });

  canvas.addEventListener('pointerdown', () => {
    canvas.focus();
  }, { signal });

  canvas.addEventListener('click', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);
    canvas.focus();

    if (isSettingsPoint(canvas, x, y) && state.phase === 'playing') {
      canvas.dispatchEvent(new CustomEvent('settings-open'));
      return;
    }

    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize(canvas);
    const powerUpType = getPowerUpSlotAtPoint(
      logicalWidth,
      x,
      y,
      getLayout(canvas),
      logicalHeight,
    );
    state.hoveredPowerUpSlot = powerUpType;

    if (powerUpType) {
      requestPowerUpActivation(state, powerUpType);
      return;
    }

    if (state.phase === 'playing' && state.flyingProjectile === null) {
      state.pendingLaunch = true;
    }
  }, { signal });

  canvas.addEventListener('mousemove', (event) => {
    const { x, y } = toCanvasPoint(canvas, event);
    const { width: logicalWidth, height: logicalHeight } = getLogicalCanvasSize(canvas);
    const powerUpType = getPowerUpSlotAtPoint(
      logicalWidth,
      x,
      y,
      getLayout(canvas),
      logicalHeight,
    );

    state.hoveredPowerUpSlot = powerUpType;

    const overSettings =
      state.phase === 'playing' &&
      isSettingsPoint(canvas, x, y);

    const overPowerUp =
      state.phase === 'playing' &&
      powerUpType !== null;

    canvas.style.cursor =
      overSettings || overPowerUp ? 'pointer' : 'default';
  }, { signal });

  canvas.addEventListener('mouseleave', () => {
    state.hoveredPowerUpSlot = null;
    canvas.style.cursor = 'default';
  }, { signal });

  return controller;
}
