/**
 * state.js — Fuente única de verdad del juego.
 */

import { CONFIG, DIFFICULTIES } from './config.js';
import {
  createActivePowerUps,
  createPowerUpInventory,
} from './powerups.js?build=v142-economy-r4';
import { createPowerCoreState } from './powercore.js?build=v142-economy-r4';
import { createInactiveBossState } from './boss.js';
import { STABILITY_CONFIG } from './stability.js';
import { ECONOMY_CONFIG } from './economy.js?build=v142-economy-r4';

function randomIcon() {
  return CONFIG.AWS_ICONS[
    Math.floor(Math.random() * CONFIG.AWS_ICONS.length)
  ];
}

/**
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'bossintro'|'lifelost'|'levelcomplete'|'gameover'} phase
 * @property {number} score
 * @property {number} highScore
 * @property {number} level
 * @property {number} levelHits
 * @property {number} levelTransitionTimer
 * @property {number} levelCompleteBonus
 * @property {number} completedLevel
 * @property {Object} centralElement
 * @property {Object|null} flyingProjectile
 * @property {Object[]} anchoredProjectiles
 * @property {boolean} pendingLaunch
 * @property {string|null} pendingPowerUpActivation
 * @property {number} gameOverTimestamp
 * @property {string|null} gameOverReason
 * @property {string} nextArrowId
 * @property {{freezeTimer:number, shieldCharges:number, doubleScoreHits:number}} activePowerUps
 * @property {{freeze:number, shield:number, double:number, cleanup:number}} powerUpInventory
 * @property {number} powerUpCharge
 * @property {Object} powerCore
 * @property {Object} boss
 * @property {Object[]} detachedBossArrows
 * @property {Object[]} detachedBossDebris
 * @property {number} stability
 * @property {string|null} hoveredPowerUpSlot
 * @property {string} difficulty
 * @property {number} lastReverseScore
 */

export function createInitialState(
  highScore = 0,
  difficulty = CONFIG.DEFAULT_DIFFICULTY,
  stats = null,
  economy = null,
) {
  const diff = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  const maxLives = Math.max(
    ECONOMY_CONFIG.initialMaxLives,
    Math.floor(Number(economy?.maxLives) || ECONOMY_CONFIG.initialMaxLives),
  );

  return {
    phase: 'idle',
    score: 0,
    highScore,

    level: 1,
    levelHits: 0,
    levelTransitionTimer: 0,
    levelCompleteBonus: 0,
    completedLevel: 0,
    levelStartScore: 0,
    levelPerfectShots: 0,
    levelBestCombo: 1,
    lastCoinReward: 0,

    currentLives: maxLives,
    lifeLostTimer: 0,
    lifeLostReason: null,

    centralElement: {
      x: CONFIG.CANVAS_WIDTH / 2,
      y: CONFIG.CANVAS_HEIGHT / 2,
      radius: CONFIG.CENTRAL_RADIUS,
      angle: 0,
      speed: diff.baseSpeed,
      baseSpeed: diff.baseSpeed,
      direction: 1,
      reverseTimer: 0,
    },

    flyingProjectile: null,
    anchoredProjectiles: [],
    pendingLaunch: false,
    pendingPowerUpActivation: null,
    hoveredPowerUpSlot: null,
    gameOverTimestamp: 0,
    gameOverReason: null,
    stability: STABILITY_CONFIG.max,

    nextArrowId: randomIcon(),
    nextPowerUp: null,

    activePowerUps: createActivePowerUps(),
    powerUpInventory: createPowerUpInventory(),
    powerUpCharge: 0,
    powerCore: createPowerCoreState(),
    boss: createInactiveBossState(1),
    detachedBossArrows: [],
    detachedBossDebris: [],
    lastPreparedWasPowerUp: false,

    difficulty,
    lastReverseScore: 0,
    lastTier: 1,
    comboLevel: 1,
    lastAnchorTime: 0,

    stats,
    economy,
  };
}

export { randomIcon };
