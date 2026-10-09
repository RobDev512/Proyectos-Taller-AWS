/**
 * levels.js — Sistema de niveles de AWS ORBISHOT.
 *
 * Los niveles normales mantienen la progresión clásica. Cada quinto nivel se
 * convierte en Boss Level y usa el objetivo total definido por boss.js.
 */

import { DIFFICULTIES } from './config.js';
import {
  getBossTarget,
  isBossLevel,
  prepareBossForLevel,
} from './boss.js';

export const LEVEL_COMPLETE_DELAY = 1.85;

const LEVEL_THEMES = [
  { name: 'AWS Orange', ring: '#FF9900', accent: '#FFB84D', inner: '#1a2332' },
  { name: 'Cloud Blue', ring: '#4CC2FF', accent: '#8DDBFF', inner: '#17283A' },
  { name: 'Lambda Violet', ring: '#B57BFF', accent: '#D6B5FF', inner: '#241B35' },
  { name: 'S3 Green', ring: '#72C66B', accent: '#A7E6A2', inner: '#172D24' },
  { name: 'Alert Red', ring: '#FF6B6B', accent: '#FFAAAA', inner: '#351B22' },
  { name: 'Dynamo Cyan', ring: '#4DE0D2', accent: '#A0FFF7', inner: '#153233' },
];

/** Cantidad de impactos necesarios para superar un nivel. */
export function getLevelTarget(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));

  if (isBossLevel(safeLevel)) {
    return getBossTarget(safeLevel) ?? 7;
  }

  return Math.min(12, 4 + safeLevel); // 5, 6, 7... hasta 12
}

/** Bonus de score al completar un nivel normal. */
export function getLevelBonus(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return 3 + safeLevel;
}

/** Paleta visual cíclica por nivel. */
export function getLevelTheme(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return LEVEL_THEMES[(safeLevel - 1) % LEVEL_THEMES.length];
}

/** Inicializa campos faltantes para compatibilidad con estados anteriores. */
export function ensureLevelState(state) {
  if (!Number.isFinite(state.level) || state.level < 1) state.level = 1;
  if (!Number.isFinite(state.levelHits) || state.levelHits < 0) state.levelHits = 0;
  if (!Number.isFinite(state.levelTransitionTimer)) state.levelTransitionTimer = 0;
  if (!Number.isFinite(state.levelCompleteBonus)) state.levelCompleteBonus = 0;
  if (!Number.isFinite(state.completedLevel)) state.completedLevel = 0;
  return state;
}

/** Marca un acierto válido dentro del objetivo del nivel. */
export function registerLevelHit(state) {
  ensureLevelState(state);
  state.levelHits += 1;
  return state.levelHits;
}

export function isLevelComplete(state) {
  ensureLevelState(state);
  return state.levelHits >= getLevelTarget(state.level);
}

/**
 * Inicia la transición de fin de nivel. Un Boss Level puede proporcionar un
 * bonus propio calculado por su ranking.
 */
export function beginLevelComplete(state, bonusOverride = null) {
  ensureLevelState(state);
  state.completedLevel = state.level;

  // Number(null) === 0. La comprobación anterior interpretaba el valor
  // por defecto `null` como un override real y por eso todos los niveles
  // normales mostraban LEVEL BONUS +0. Solo aceptamos override explícito.
  const hasOverride =
    bonusOverride !== null &&
    bonusOverride !== undefined &&
    Number.isFinite(Number(bonusOverride));

  state.levelCompleteBonus = hasOverride
    ? Math.max(0, Math.floor(Number(bonusOverride)))
    : getLevelBonus(state.level);
  state.levelTransitionTimer = LEVEL_COMPLETE_DELAY;
  state.phase = 'levelcomplete';
  state.pendingLaunch = false;
  state.flyingProjectile = null;
  return state.levelCompleteBonus;
}

/**
 * Prepara el siguiente nivel manteniendo score/record/estadísticas, inventario,
 * Power Charge, Power Core y efectos activos. Las flechas anteriores se limpian.
 */
export function advanceToNextLevel(state) {
  ensureLevelState(state);
  state.level += 1;
  state.levelHits = 0;
  state.levelTransitionTimer = 0;
  state.levelCompleteBonus = 0;
  state.completedLevel = 0;
  state.anchoredProjectiles = [];
  state.flyingProjectile = null;
  state.pendingLaunch = false;
  state.lastReverseScore = state.score;

  state.nextPowerUp = null;
  state.pendingPowerUpActivation = null;
  state.lastPreparedWasPowerUp = false;

  const diff = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.medium;
  const ce = state.centralElement;
  ce.angle = 0;
  ce.speed = diff.baseSpeed;
  ce.baseSpeed = diff.baseSpeed;
  ce.reverseTimer = 0;
  ce.direction = state.level % 2 === 0 ? -1 : 1;

  const boss = prepareBossForLevel(state);
  state.phase = boss?.active ? 'bossintro' : 'playing';

  return state.level;
}
