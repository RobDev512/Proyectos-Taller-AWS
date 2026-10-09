/**
 * main.js — Punto de entrada y coordinación de UI.
 */

import { CONFIG, APP_VERSION, APP_CODENAME, APP_NAME } from './config.js?build=v141-audio-r6';
import { createInitialState }                from './state.js';
import { captureHighScore, loadHighScore }   from './scoring.js';
import { registerInputHandlers }             from './input.js?build=v141-audio-r6';
import { startGameLoop }                     from './gameLoop.js?build=v141-audio-r6';
import { hideGameOver }                      from './ui.js';
import {
  setSoundEnabled,
  setMusicEnabled,
  setSoundVolume,
  setMusicVolume,
} from './sound.js?build=v141-audio-r6';
import { setFxEnabled }                      from './particles.js';
import { setFeedbackFxEnabled }              from './feedback.js';
import { setComboEnabled }                   from './combo.js';
import { loadPreferences, savePreferences }  from './preferences.js';
import { loadStats, getAccuracy }            from './stats.js';

// ── DOM ──────────────────────────────────────────────────────────────────────
const gameWrapper     = document.getElementById('gameWrapper');
const canvas          = document.getElementById('gameCanvas');
const overlayEl       = document.getElementById('gameOverOverlay');
const playAgainBtn    = document.getElementById('playAgainBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsApply   = document.getElementById('settingsApplyBtn');
const settingsClose   = document.getElementById('settingsCloseBtn');
const diffBtns        = document.querySelectorAll('.diff-btn');
const soundToggle     = document.getElementById('soundToggle');
const musicToggle     = document.getElementById('musicToggle');
const soundVolume     = document.getElementById('soundVolume');
const musicVolume     = document.getElementById('musicVolume');
const soundVolumeValue= document.getElementById('soundVolumeValue');
const musicVolumeValue= document.getElementById('musicVolumeValue');
const comboToggle     = document.getElementById('comboToggle');
const fxToggle        = document.getElementById('fxToggle');
const versionLabel    = document.getElementById('versionLabel');
const gamesPlayedStat = document.getElementById('gamesPlayedStat');
const accuracyStat    = document.getElementById('accuracyStat');
const perfectShotsStat= document.getElementById('perfectShotsStat');
const bestComboStat   = document.getElementById('bestComboStat');
const bestLevelStat   = document.getElementById('bestLevelStat');
const levelsCompletedStat = document.getElementById('levelsCompletedStat');
const powerUpsCollectedStat = document.getElementById('powerUpsCollectedStat');
const shieldSavesStat = document.getElementById('shieldSavesStat');
const bossesDefeatedStat = document.getElementById('bossesDefeatedStat');
const bestBossRankStat = document.getElementById('bestBossRankStat');

if (versionLabel) versionLabel.textContent = `v${APP_VERSION} - ${APP_CODENAME}`;
document.title = `${APP_NAME} | v${APP_VERSION} - ${APP_CODENAME}`;

// ── Contexto ─────────────────────────────────────────────────────────────────
const ctx = canvas.getContext('2d');
if (!ctx) console.error('[AWS ORBISHOT] Canvas 2D no disponible.');

// ── Assets ───────────────────────────────────────────────────────────────────
const assets = {};
for (const id of CONFIG.AWS_ICONS) {
  const img = new Image();
  img.src = `assets/icons/${id}.svg`;
  assets[id] = img;
}

const brandLogo = new Image();
brandLogo.src = 'assets/branding/aws-orbishot-logo.png';
assets.brandLogo = brandLogo;

// ── Responsive ───────────────────────────────────────────────────────────────
// Usa VisualViewport cuando existe para responder también a barras móviles,
// teclado del navegador, notch/safe areas y cambios de orientación.
function getViewportBox() {
  const vv = window.visualViewport;
  return {
    width: Math.max(1, vv?.width ?? window.innerWidth),
    height: Math.max(1, vv?.height ?? window.innerHeight),
    offsetLeft: vv?.offsetLeft ?? 0,
    offsetTop: vv?.offsetTop ?? 0,
  };
}


function configureCanvasBackingStore(cssWidth, cssHeight, logicalH = CONFIG.CANVAS_HEIGHT) {
  const logicalW = CONFIG.CANVAS_WIDTH;
  const dpr = Math.max(1, Math.min(3, Number(window.devicePixelRatio) || 1));
  const cssScale = Math.max(
    0.01,
    Math.min(cssWidth / logicalW, cssHeight / logicalH),
  );

  // El backing store sigue el tamaño REAL de presentación × DPR. Antes el
  // juego se dibujaba siempre a 600×700 y luego el navegador lo ampliaba,
  // provocando texto/lineas borrosos. Mantener coordenadas lógicas separadas
  // da nitidez sin tocar la física del juego.
  const renderScale = Math.min(4, Math.max(1, cssScale * dpr));
  const backingW = Math.max(1, Math.round(logicalW * renderScale));
  const backingH = Math.max(1, Math.round(logicalH * renderScale));

  canvas.dataset.logicalWidth = String(logicalW);
  canvas.dataset.logicalHeight = String(logicalH);

  if (canvas.width !== backingW || canvas.height !== backingH) {
    canvas.width = backingW;
    canvas.height = backingH;
  }

  ctx.setTransform(
    backingW / logicalW,
    0,
    0,
    backingH / logicalH,
    0,
    0,
  );
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  if ('fontKerning' in ctx) ctx.fontKerning = 'normal';
  if ('textRendering' in ctx) ctx.textRendering = 'optimizeLegibility';
}

function fitCanvas() {
  const viewport = getViewportBox();

  // El wrapper sigue al VisualViewport completo. Esto evita que un pinch-zoom
  // de trackpad/móvil deje el canvas desplazado o incluso fuera de pantalla.
  // Al cambiar el offset visible, el juego vuelve a centrarse en esa ventana.
  if (gameWrapper) {
    gameWrapper.style.position = 'absolute';
    gameWrapper.style.inset = 'auto';
    gameWrapper.style.left = `${viewport.offsetLeft}px`;
    gameWrapper.style.top = `${viewport.offsetTop}px`;
    gameWrapper.style.width = `${viewport.width}px`;
    gameWrapper.style.height = `${viewport.height}px`;
  }

  const compact =
    viewport.height >= viewport.width * 1.15 &&
    viewport.width <= 900;

  const safePad = compact ? 0 : 8;
  const availableW = Math.max(1, viewport.width - safePad * 2);
  const availableH = Math.max(1, viewport.height - safePad * 2);

  // En móvil vertical el canvas adopta la relación REAL de la pantalla para
  // ocupar todo el alto disponible sin estirar las figuras del juego. El mundo
  // lógico conserva su zona clásica de 600×700; el espacio adicional se usa
  // para distribuir HUD, gameplay y Power-Ups de forma respirada.
  const logicalH = compact
    ? Math.max(820, Math.min(1320, Math.round(
        CONFIG.CANVAS_WIDTH * (availableH / availableW),
      )))
    : CONFIG.CANVAS_HEIGHT;

  // El HUD táctil móvil ocupa una franja dedicada en la parte inferior.
  // Desplazamos el mundo un poco menos que antes para que la flecha preparada
  // no invada los botones circulares, incluso en pantallas verticales cortas.
  const sceneOffsetY = compact
    ? Math.max(40, Math.min(210, (logicalH - CONFIG.CANVAS_HEIGHT) * 0.35))
    : 0;

  canvas.dataset.layout = compact ? 'compact' : 'desktop';
  canvas.dataset.logicalWidth = String(CONFIG.CANVAS_WIDTH);
  canvas.dataset.logicalHeight = String(logicalH);
  canvas.dataset.sceneOffsetY = String(sceneOffsetY);
  document.documentElement.dataset.gameLayout = compact ? 'compact' : 'desktop';

  const ratio = CONFIG.CANVAS_WIDTH / logicalH;

  let w = availableW;
  let h = w / ratio;
  if (h > availableH) {
    h = availableH;
    w = h * ratio;
  }

  // Mantener medidas enteras reduce blur en Canvas al escalar.
  w = Math.max(1, Math.floor(w));
  h = Math.max(1, Math.floor(h));

  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';

  configureCanvasBackingStore(w, h, logicalH);

  const left = viewport.offsetLeft + (viewport.width - w) / 2;
  const top = viewport.offsetTop + (viewport.height - h) / 2;

  for (const el of [overlayEl, settingsOverlay]) {
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }
}

fitCanvas();
window.addEventListener('resize', fitCanvas, { passive: true });
window.addEventListener('orientationchange', fitCanvas, { passive: true });
window.visualViewport?.addEventListener('resize', fitCanvas, { passive: true });
window.visualViewport?.addEventListener('scroll', fitCanvas, { passive: true });

// Chromium expone el pinch del trackpad como wheel+ctrlKey. Como toda la
// página es un canvas de juego, permitir ese zoom crea un viewport desplazable
// sin aportar una función útil. Se bloquea el gesto dentro de la página y el
// responsive sigue resolviendo tamaño/orientación normalmente.
window.addEventListener('wheel', (event) => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });

for (const eventName of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
  }, { passive: false });
}

// ── Estado, preferencias y estadísticas ──────────────────────────────────────
const preferences = loadPreferences();
const stats = loadStats();
let currentDifficulty = preferences.difficulty;
let state = createInitialState(loadHighScore(), currentDifficulty, stats);
let inputController = null;
const options = {
  sound: preferences.sound,
  music: preferences.music,
  soundVolume: preferences.soundVolume,
  musicVolume: preferences.musicVolume,
  combo: preferences.combo,
  fx: preferences.fx,
};

function applyOptions() {
  setSoundEnabled(options.sound);
  setMusicEnabled(options.music);
  setSoundVolume(options.soundVolume);
  setMusicVolume(options.musicVolume);
  setComboEnabled(options.combo);
  setFxEnabled(options.fx);
  setFeedbackFxEnabled(options.fx);
}
applyOptions();

function updateStatsPanel() {
  if (gamesPlayedStat) gamesPlayedStat.textContent = String(stats.gamesPlayed);
  if (accuracyStat) accuracyStat.textContent = `${getAccuracy(stats)}%`;
  if (perfectShotsStat) perfectShotsStat.textContent = String(stats.perfectShots);
  if (bestComboStat) bestComboStat.textContent = `×${stats.bestCombo}`;
  if (bestLevelStat) bestLevelStat.textContent = String(stats.bestLevel ?? 1);
  if (levelsCompletedStat) levelsCompletedStat.textContent = String(stats.levelsCompleted ?? 0);
  if (powerUpsCollectedStat) powerUpsCollectedStat.textContent = String(stats.powerUpsCollected ?? 0);
  if (shieldSavesStat) shieldSavesStat.textContent = String(stats.shieldSaves ?? 0);
  if (bossesDefeatedStat) bossesDefeatedStat.textContent = String(stats.bossesDefeated ?? 0);
  if (bestBossRankStat) bestBossRankStat.textContent = String(stats.bestBossRank ?? '—');
}

// ── startGame ─────────────────────────────────────────────────────────────────
function startGame() {
  state.phase = 'playing';
  if (inputController) inputController.abort();
  inputController = registerInputHandlers(canvas, state);
  startGameLoop(ctx, state, assets, CONFIG, overlayEl);
  window.__GAME_STATE__ = state;
}
startGame();

// ── Play Again ────────────────────────────────────────────────────────────────
playAgainBtn.addEventListener('click', () => {
  const hs = captureHighScore(state);
  state = createInitialState(hs, currentDifficulty, stats);
  hideGameOver(overlayEl);
  startGame();
});

// ── Configuración ─────────────────────────────────────────────────────────────
let selectedDiff = currentDifficulty;

function normalizeVolumeInput(value) {
  return Math.max(0, Math.min(1, (Number(value) || 0) / 100));
}

function syncVolumeControl(input, label, value) {
  const pct = Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100);
  input.value = String(pct);
  label.textContent = `${pct}%`;
}

function openSettings() {
  if (state.phase === 'playing') state.phase = 'idle';
  selectedDiff = currentDifficulty;
  diffBtns.forEach(b => b.classList.toggle('selected', b.dataset.diff === selectedDiff));
  syncToggle(soundToggle, options.sound);
  syncToggle(musicToggle, options.music);
  syncVolumeControl(soundVolume, soundVolumeValue, options.soundVolume);
  syncVolumeControl(musicVolume, musicVolumeValue, options.musicVolume);
  syncToggle(comboToggle, options.combo);
  syncToggle(fxToggle, options.fx);
  updateStatsPanel();
  settingsOverlay.classList.add('visible');
}

function closeSettings(apply) {
  settingsOverlay.classList.remove('visible');

  if (apply) {
    currentDifficulty = selectedDiff;
    options.sound = soundToggle.classList.contains('on');
    options.music = musicToggle.classList.contains('on');
    options.soundVolume = normalizeVolumeInput(soundVolume.value);
    options.musicVolume = normalizeVolumeInput(musicVolume.value);
    options.combo = comboToggle.classList.contains('on');
    options.fx = fxToggle.classList.contains('on');
    applyOptions();
    savePreferences({ difficulty: currentDifficulty, ...options });

    const hs = captureHighScore(state);
    state = createInitialState(hs, currentDifficulty, stats);
    hideGameOver(overlayEl);
    startGame();
  } else {
    // Los sliders tienen preescucha en vivo. Cancelar restaura los valores
    // previamente guardados y luego reanuda la partida.
    setSoundVolume(options.soundVolume);
    setMusicVolume(options.musicVolume);
    if (state.phase === 'idle') state.phase = 'playing';
  }
}

canvas.addEventListener('settings-open', openSettings);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsOverlay.classList.contains('visible')) {
    closeSettings(false);
  }

  if ((e.key === 'p' || e.key === 's') &&
      state.phase === 'playing' &&
      !settingsOverlay.classList.contains('visible') &&
      !overlayEl.classList.contains('visible')) {
    openSettings();
  }
});

settingsApply.addEventListener('click', () => closeSettings(true));
settingsClose.addEventListener('click', () => closeSettings(false));

diffBtns.forEach(btn => btn.addEventListener('click', () => {
  selectedDiff = btn.dataset.diff;
  diffBtns.forEach(b => b.classList.toggle('selected', b === btn));
}));

function syncToggle(btn, val) {
  btn.classList.toggle('on', val);
  btn.setAttribute('aria-pressed', String(val));
}

soundVolume.addEventListener('input', () => {
  const value = normalizeVolumeInput(soundVolume.value);
  soundVolumeValue.textContent = `${Math.round(value * 100)}%`;
  setSoundVolume(value);
});

musicVolume.addEventListener('input', () => {
  const value = normalizeVolumeInput(musicVolume.value);
  musicVolumeValue.textContent = `${Math.round(value * 100)}%`;
  setMusicVolume(value);
});

[soundToggle, musicToggle, comboToggle, fxToggle].forEach(btn => {
  btn.addEventListener('click', () => {
    const on = btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', String(on));
  });
});

