/**
 * main.js — Punto de entrada y coordinación de UI.
 */

import { CONFIG, APP_VERSION, APP_CODENAME, APP_NAME } from './config.js?build=v142-economy-r4';
import { createInitialState }                from './state.js?build=v142-economy-r4';
import { captureHighScore, loadHighScore }   from './scoring.js';
import { registerInputHandlers }             from './input.js?build=v142-economy-r4';
import { startGameLoop }                     from './gameLoop.js?build=v142-economy-r5';
import { hideGameOver }                      from './ui.js?build=v142-economy-r4';
import {
  setSoundEnabled,
  setMusicEnabled,
  setSoundVolume,
  setMusicVolume,
} from './sound.js?build=v142-economy-r4';
import { setFxEnabled }                      from './particles.js';
import { setFeedbackFxEnabled }              from './feedback.js';
import { setComboEnabled }                   from './combo.js';
import { loadPreferences, savePreferences }  from './preferences.js';
import { loadStats, getAccuracy }            from './stats.js';
import {
  ECONOMY_CONFIG,
  loadEconomy,
  getLifeUpgradeCost,
  getPowerUpCapacityUpgradeCost,
  refillLife,
  upgradeMaxLives,
  upgradePowerUpCapacity,
  buyPowerUp,
} from './economy.js?build=v142-economy-r4';

// ── DOM ──────────────────────────────────────────────────────────────────────
const gameWrapper     = document.getElementById('gameWrapper');
const canvas          = document.getElementById('gameCanvas');
const overlayEl       = document.getElementById('gameOverOverlay');
const playAgainBtn    = document.getElementById('playAgainBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const shopOverlay     = document.getElementById('shopOverlay');
const shopCloseBtn    = document.getElementById('shopCloseBtn');
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
const shopCoinBalance = document.getElementById('shopCoinBalance');
const shopLivesValue = document.getElementById('shopLivesValue');
const shopMessage = document.getElementById('shopMessage');
const buyLifeBtn = document.getElementById('buyLifeBtn');
const buyLifeCost = document.getElementById('buyLifeCost');
const upgradeLivesBtn = document.getElementById('upgradeLivesBtn');
const upgradeLivesCost = document.getElementById('upgradeLivesCost');
const shopPowerBtns = document.querySelectorAll('[data-shop-power]');
const shopCapacityBtns = document.querySelectorAll('[data-shop-capacity]');

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

assets.powerUpIcons = {};
for (const [type, file] of Object.entries({
  freeze: 'power-freeze.svg',
  shield: 'power-shield.svg',
  double: 'power-double.svg',
  cleanup: 'power-cleanup.svg',
})) {
  const img = new Image();
  img.src = `assets/ui/${file}`;
  assets.powerUpIcons[type] = img;
}

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

  for (const el of [overlayEl, settingsOverlay, shopOverlay]) {
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
const economy = loadEconomy();
let currentDifficulty = preferences.difficulty;
let state = createInitialState(loadHighScore(), currentDifficulty, stats, economy);
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

function setShopMessage(message = '', kind = '') {
  if (!shopMessage) return;
  shopMessage.textContent = message;
  shopMessage.classList.toggle('ok', kind === 'ok');
  shopMessage.classList.toggle('error', kind === 'error');
}

function updateShopPanel() {
  const coins = Math.max(0, Math.floor(Number(economy.coins) || 0));
  const maxLives = Math.max(
    ECONOMY_CONFIG.initialMaxLives,
    Math.floor(Number(economy.maxLives) || ECONOMY_CONFIG.initialMaxLives),
  );
  const currentLives = Math.max(0, Math.floor(Number(state.currentLives) || 0));
  if (shopCoinBalance) shopCoinBalance.textContent = `🪙 ${coins}`;
  if (shopLivesValue) shopLivesValue.textContent = `${currentLives} / ${maxLives}`;

  if (buyLifeCost) buyLifeCost.textContent = `🪙 ${ECONOMY_CONFIG.lifeRefillCost}`;
  if (buyLifeBtn) {
    buyLifeBtn.disabled = currentLives >= maxLives || coins < ECONOMY_CONFIG.lifeRefillCost;
    buyLifeBtn.title = currentLives >= maxLives
      ? 'Ya tienes todas tus vidas.'
      : coins < ECONOMY_CONFIG.lifeRefillCost
        ? 'No tienes suficientes monedas.'
        : 'Recupera un corazón para esta run.';
  }

  const upgradeCost = getLifeUpgradeCost(economy);
  if (upgradeLivesCost) {
    upgradeLivesCost.textContent = upgradeCost === null
      ? 'MÁX.'
      : `🪙 ${upgradeCost}`;
  }
  if (upgradeLivesBtn) {
    upgradeLivesBtn.disabled = upgradeCost === null || coins < upgradeCost;
    upgradeLivesBtn.title = upgradeCost === null
      ? 'La tienda de v1.4.2 llega hasta 5 vidas.'
      : coins < upgradeCost
        ? 'No tienes suficientes monedas.'
        : 'Aumenta permanentemente la capacidad de vidas.';
  }

  shopPowerBtns.forEach(btn => {
    const type = btn.dataset.shopPower;
    const cost = Number(ECONOMY_CONFIG.powerUpCosts[type]) || 0;
    const count = Math.max(0, Math.floor(Number(state.powerUpInventory?.[type]) || 0));
    const capacity = Math.max(
      2,
      Math.floor(Number(economy.powerUpCaps?.[type]) || 2),
    );
    btn.disabled = count >= capacity || coins < cost;
    btn.title = count >= capacity
      ? `Inventario lleno (${count}/${capacity}).`
      : coins < cost
        ? 'No tienes suficientes monedas.'
        : `Compra una carga para esta run (${count}/${capacity}).`;
  });

  shopCapacityBtns.forEach(btn => {
    const type = btn.dataset.shopCapacity;
    const current = Math.max(
      2,
      Math.floor(Number(economy.powerUpCaps?.[type]) || 2),
    );
    const cost = getPowerUpCapacityUpgradeCost(economy, type);
    const label = btn.querySelector(`[data-capacity-label="${type}"]`);
    const costEl = btn.querySelector(`[data-capacity-cost="${type}"]`);

    if (label) {
      label.textContent = cost === null
        ? `Capacidad x${current} • MÁX.`
        : `x${current} → x${current + 1}`;
    }
    if (costEl) costEl.textContent = cost === null ? 'MÁX.' : `🪙 ${cost}`;

    btn.disabled = cost === null || coins < cost;
    btn.title = cost === null
      ? `Capacidad máxima de tienda alcanzada (x${current}).`
      : coins < cost
        ? 'No tienes suficientes monedas.'
        : `Aumenta permanentemente ${type} de x${current} a x${current + 1}.`;
  });
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
  state = createInitialState(hs, currentDifficulty, stats, economy);
  hideGameOver(overlayEl);
  startGame();
});

// ── Tienda ───────────────────────────────────────────────────────────────────
function openShop() {
  if (settingsOverlay.classList.contains('visible') || overlayEl.classList.contains('visible')) return;
  if (state.phase === 'playing') state.phase = 'idle';
  updateShopPanel();
  setShopMessage('');
  shopOverlay.classList.add('visible');
}

function closeShop() {
  shopOverlay.classList.remove('visible');
  if (state.phase === 'idle') state.phase = 'playing';
}

canvas.addEventListener('shop-open', openShop);
shopCloseBtn?.addEventListener('click', closeShop);

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
    const difficultyChanged = selectedDiff !== currentDifficulty;
    currentDifficulty = selectedDiff;
    options.sound = soundToggle.classList.contains('on');
    options.music = musicToggle.classList.contains('on');
    options.soundVolume = normalizeVolumeInput(soundVolume.value);
    options.musicVolume = normalizeVolumeInput(musicVolume.value);
    options.combo = comboToggle.classList.contains('on');
    options.fx = fxToggle.classList.contains('on');
    applyOptions();
    savePreferences({ difficulty: currentDifficulty, ...options });

    if (difficultyChanged) {
      // Cambiar las reglas de dificultad sí inicia una run nueva. Las demás
      // opciones se aplican en vivo y ya no regalan un reinicio/recarga.
      const hs = captureHighScore(state);
      state = createInitialState(hs, currentDifficulty, stats, economy);
      hideGameOver(overlayEl);
      startGame();
    } else if (state.phase === 'idle') {
      state.phase = 'playing';
    }
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
  if (e.key === 'Escape' && shopOverlay.classList.contains('visible')) {
    closeShop();
    return;
  }

  if (e.key === 'Escape' && settingsOverlay.classList.contains('visible')) {
    closeSettings(false);
    return;
  }

  if ((e.key === 'p' || e.key === 's') &&
      state.phase === 'playing' &&
      !shopOverlay.classList.contains('visible') &&
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

buyLifeBtn?.addEventListener('click', () => {
  const result = refillLife(state);
  if (result.ok) {
    setShopMessage('Corazón recuperado.', 'ok');
  } else if (result.reason === 'full') {
    setShopMessage('Ya tienes todas tus vidas.', 'error');
  } else {
    setShopMessage('No tienes suficientes monedas.', 'error');
  }
  updateShopPanel();
});

upgradeLivesBtn?.addEventListener('click', () => {
  const result = upgradeMaxLives(state);
  if (result.ok) {
    setShopMessage(`Capacidad ampliada a ${result.maxLives} vidas.`, 'ok');
  } else if (result.reason === 'cap') {
    setShopMessage('Límite de tienda alcanzado por ahora.', 'error');
  } else {
    setShopMessage('No tienes suficientes monedas.', 'error');
  }
  updateShopPanel();
});

shopPowerBtns.forEach(btn => btn.addEventListener('click', () => {
  const type = btn.dataset.shopPower;
  const result = buyPowerUp(state, type);
  if (result.ok) {
    setShopMessage('Potenciador entregado a esta run.', 'ok');
  } else if (result.reason === 'full') {
    setShopMessage('Ese slot ya está lleno.', 'error');
  } else {
    setShopMessage('No tienes suficientes monedas.', 'error');
  }
  updateShopPanel();
}));

shopCapacityBtns.forEach(btn => btn.addEventListener('click', () => {
  const type = btn.dataset.shopCapacity;
  const result = upgradePowerUpCapacity(state, type);
  if (result.ok) {
    setShopMessage(`Capacidad ampliada a x${result.capacity}.`, 'ok');
  } else if (result.reason === 'cap') {
    setShopMessage('Ese potenciador ya alcanzó el máximo de la tienda.', 'error');
  } else {
    setShopMessage('No tienes suficientes monedas.', 'error');
  }
  updateShopPanel();
}));

[soundToggle, musicToggle, comboToggle, fxToggle].forEach(btn => {
  btn.addEventListener('click', () => {
    const on = btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', String(on));
  });
});
