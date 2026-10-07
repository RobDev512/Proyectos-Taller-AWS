/**
 * main.js — Punto de entrada y coordinación de UI.
 */

import { CONFIG, APP_VERSION, APP_CODENAME } from './config.js';
import { createInitialState }                from './state.js';
import { captureHighScore, loadHighScore }   from './scoring.js';
import { registerInputHandlers }             from './input.js';
import { startGameLoop }                     from './gameLoop.js';
import { hideGameOver }                      from './ui.js';
import { setSoundEnabled }                   from './sound.js';
import { setFxEnabled }                      from './particles.js';
import { setFeedbackFxEnabled }              from './feedback.js';
import { setComboEnabled }                   from './combo.js';
import { loadPreferences, savePreferences }  from './preferences.js';
import { loadStats, getAccuracy }            from './stats.js';

// ── DOM ──────────────────────────────────────────────────────────────────────
const canvas          = document.getElementById('gameCanvas');
const overlayEl       = document.getElementById('gameOverOverlay');
const playAgainBtn    = document.getElementById('playAgainBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsApply   = document.getElementById('settingsApplyBtn');
const settingsClose   = document.getElementById('settingsCloseBtn');
const diffBtns        = document.querySelectorAll('.diff-btn');
const soundToggle     = document.getElementById('soundToggle');
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

if (versionLabel) versionLabel.textContent = `v${APP_VERSION} - ${APP_CODENAME}`;
document.title = `AWS Arcade Game | v${APP_VERSION} - ${APP_CODENAME}`;

// ── Contexto ─────────────────────────────────────────────────────────────────
const ctx = canvas.getContext('2d');
if (!ctx) console.error('[AWS Arcade] Canvas 2D no disponible.');

// ── Assets ───────────────────────────────────────────────────────────────────
const assets = {};
for (const id of CONFIG.AWS_ICONS) {
  const img = new Image();
  img.src = `assets/icons/${id}.svg`;
  assets[id] = img;
}

// ── Responsive ───────────────────────────────────────────────────────────────
function fitCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ratio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
  let w, h;

  if (vw / vh > ratio) {
    h = vh;
    w = h * ratio;
  } else {
    w = vw;
    h = w / ratio;
  }

  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const left = (vw - w) / 2;
  const top = (vh - h) / 2;
  for (const el of [overlayEl, settingsOverlay]) {
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
  }
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

// ── Estado, preferencias y estadísticas ──────────────────────────────────────
const preferences = loadPreferences();
const stats = loadStats();
let currentDifficulty = preferences.difficulty;
let state = createInitialState(loadHighScore(), currentDifficulty, stats);
let inputController = null;
const options = {
  sound: preferences.sound,
  combo: preferences.combo,
  fx: preferences.fx,
};

function applyOptions() {
  setSoundEnabled(options.sound);
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

function openSettings() {
  if (state.phase === 'playing') state.phase = 'idle';
  selectedDiff = currentDifficulty;
  diffBtns.forEach(b => b.classList.toggle('selected', b.dataset.diff === selectedDiff));
  syncToggle(soundToggle, options.sound);
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
    options.combo = comboToggle.classList.contains('on');
    options.fx = fxToggle.classList.contains('on');
    applyOptions();
    savePreferences({ difficulty: currentDifficulty, ...options });

    const hs = captureHighScore(state);
    state = createInitialState(hs, currentDifficulty, stats);
    hideGameOver(overlayEl);
    startGame();
  } else if (state.phase === 'idle') {
    state.phase = 'playing';
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

[soundToggle, comboToggle, fxToggle].forEach(btn => {
  btn.addEventListener('click', () => {
    const on = btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', String(on));
  });
});
