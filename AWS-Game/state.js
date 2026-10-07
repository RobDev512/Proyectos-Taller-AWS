/**
 * state.js — Fuente única de verdad del juego.
 */

import { CONFIG, DIFFICULTIES } from './config.js';

function randomIcon() {
  return CONFIG.AWS_ICONS[Math.floor(Math.random() * CONFIG.AWS_ICONS.length)];
}

/**
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'gameover'} phase
 * @property {number} score
 * @property {number} highScore
 * @property {Object} centralElement
 * @property {Object|null} flyingProjectile
 * @property {Object[]} anchoredProjectiles
 * @property {boolean} pendingLaunch
 * @property {number} gameOverTimestamp
 * @property {string} nextArrowId
 * @property {string} difficulty       - 'easy'|'medium'|'hard'
 * @property {number} lastReverseScore - último score en que se disparó inversión medium
 */

export function createInitialState(highScore = 0, difficulty = CONFIG.DEFAULT_DIFFICULTY) {
  const diff = DIFFICULTIES[difficulty];
  return {
    phase:   'idle',
    score:   0,
    highScore,
    centralElement: {
      x:            CONFIG.CANVAS_WIDTH  / 2,
      y:            CONFIG.CANVAS_HEIGHT / 2,
      radius:       CONFIG.CENTRAL_RADIUS,
      angle:        0,
      speed:        diff.baseSpeed,
      baseSpeed:    diff.baseSpeed,
      direction:    1,
      reverseTimer: 0,
    },
    flyingProjectile:    null,
    anchoredProjectiles: [],
    pendingLaunch:       false,
    gameOverTimestamp:   0,
    nextArrowId:         randomIcon(),
    difficulty,
    lastReverseScore:    0,
    comboLevel:          1,
    lastAnchorTime:      0,
  };
}

export { randomIcon };

