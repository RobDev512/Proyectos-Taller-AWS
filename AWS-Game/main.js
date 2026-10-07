/**
 * main.js — Punto de entrada con responsive correcto.
 * El canvas se dimensiona por CSS para ocupar el viewport manteniendo
 * aspect ratio. El HUD se dibuja dentro del canvas por el renderer.
 * Los overlays modales se posicionan sobre el canvas via JS.
 */

import { CONFIG }                      from './config.js';
import { createInitialState }          from './state.js';
import { captureHighScore }            from './scoring.js';
import { registerInputHandlers }       from './input.js';
import { startGameLoop }               from './gameLoop.js';
import { hideGameOver }                from './ui.js';
import { setSoundEnabled }             from './sound.js';
import { setFxEnabled }                from './particles.js';
import { setComboEnabled }             from './combo.js';

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
// El canvas tiene resolución lógica fija (600×700).
// Lo escalamos con CSS width/height para caber en el viewport sin scroll.
// Los overlays modales se colocan encima del canvas calculando su rect.

function fitCanvas() {
  const vw    = window.innerWidth;
  const vh    = window.innerHeight;
  const ratio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
  let w, h;
  if (vw / vh > ratio) {
    h = vh; w = h * ratio;
  } else {
    w = vw; h = w / ratio;
  }
  // CSS size — el canvas interno sigue siendo 600×700 (resolución lógica)
  canvas.style.width  = `${w}px`;
  canvas.style.height = `${h}px`;

  // Posicionar los overlays modales exactamente sobre el canvas
  const left = (vw - w) / 2;
  const top  = (vh - h) / 2;
  for (const el of [overlayEl, settingsOverlay]) {
    el.style.left   = `${left}px`;
    el.style.top    = `${top}px`;
    el.style.width  = `${w}px`;
    el.style.height = `${h}px`;
  }
}

fitCanvas();
window.addEventListener('resize', fitCanvas);

// ── Estado y opciones ─────────────────────────────────────────────────────────
let currentDifficulty = CONFIG.DEFAULT_DIFFICULTY;
let state             = createInitialState(0, currentDifficulty);
let inputController   = null;
const options         = { sound: true, combo: true, fx: true };

function applyOptions() {
  setSoundEnabled(options.sound);
  setComboEnabled(options.combo);
  setFxEnabled(options.fx);
}
applyOptions();

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
  state = createInitialState(hs, currentDifficulty);
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
  syncToggle(fxToggle,    options.fx);
  settingsOverlay.classList.add('visible');
}

function closeSettings(apply) {
  settingsOverlay.classList.remove('visible');
  if (apply) {
    currentDifficulty = selectedDiff;
    options.sound = soundToggle.classList.contains('on');
    options.combo = comboToggle.classList.contains('on');
    options.fx    = fxToggle.classList.contains('on');
    applyOptions();
    const hs = captureHighScore(state);
    state = createInitialState(hs, currentDifficulty);
    hideGameOver(overlayEl);
    startGame();
  } else {
    if (state.phase === 'idle') state.phase = 'playing';
  }
}

// Botón ⚙ — el renderer lo dibuja en el canvas y notifica via evento custom
canvas.addEventListener('settings-open', openSettings);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsOverlay.classList.contains('visible'))
    closeSettings(false);
  // Atajo: 'p' o 's' abre settings
  if ((e.key === 'p' || e.key === 's') &&
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
