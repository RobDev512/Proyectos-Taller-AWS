/**
 * state.js — Fuente única de verdad del juego.
 */

import { CONFIG, DIFFICULTIES } from './config.js';
import {
  createActivePowerUps,
  createPowerUpInventory,
} from './powerups.js';

function randomIcon() {
  return CONFIG.AWS_ICONS[Math.floor(Math.random() * CONFIG.AWS_ICONS.length)];
}

/**
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'levelcomplete'|'gameover'} phase
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
 * @property {string} nextArrowId
 * @property {string|null} nextPowerUp
 * @property {{freezeTimer:number, shieldCharges:number, doubleScoreHits:number}} activePowerUps
 * @property {{freeze:number, shield:number, double:number, cleanup:number}} powerUpInventory
 * @property {number} powerUpCharge
 * @property {boolean} lastPreparedWasPowerUp
 * @property {string} difficulty
 * @property {number} lastReverseScore
 */

export function createInitialState(
  highScore = 0,
  difficulty = CONFIG.DEFAULT_DIFFICULTY,
  stats = null,
) {
  const diff = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;

  return {
    phase: 'idle',
    score: 0,
    highScore,

    level: 1,
    levelHits: 0,
    levelTransitionTimer: 0,
    levelCompleteBonus: 0,
    completedLevel: 0,

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

    nextArrowId: randomIcon(),
    nextPowerUp: null,

    activePowerUps: createActivePowerUps(),
    powerUpInventory: createPowerUpInventory(),
    powerUpCharge: 0,
    lastPreparedWasPowerUp: false,

    difficulty,
    lastReverseScore: 0,
    lastTier: 1,
    comboLevel: 1,
    lastAnchorTime: 0,

    stats,
  };
}

export { randomIcon };
