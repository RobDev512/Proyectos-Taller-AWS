/**
 * levels.js — Sistema de niveles de la v1.2.0.
 *
 * Cada nivel pide colocar cierta cantidad de flechas. Al completar el objetivo
 * se concede un bonus, se muestra una transición breve y el siguiente nivel
 * comienza con el disco limpio, manteniendo score, récord y estadísticas.
 */

import { DIFFICULTIES } from './config.js';

export const LEVEL_COMPLETE_DELAY = 1.85;

const LEVEL_THEMES = [
  { name: 'AWS Orange', ring: '#FF9900', accent: '#FFB84D', inner: '#1a2332' },
  { name: 'Cloud Blue', ring: '#4CC2FF', accent: '#8DDBFF', inner: '#17283A' },
  { name: 'Lambda Violet', ring: '#B57BFF', accent: '#D6B5FF', inner: '#241B35' },
  { name: 'S3 Green', ring: '#72C66B', accent: '#A7E6A2', inner: '#172D24' },
  { name: 'Alert Red', ring: '#FF6B6B', accent: '#FFAAAA', inner: '#351B22' },
  { name: 'Dynamo Cyan', ring: '#4DE0D2', accent: '#A0FFF7', inner: '#153233' },
];

/** Cantidad de flechas necesarias para superar un nivel. */
export function getLevelTarget(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return Math.min(12, 4 + safeLevel); // 5, 6, 7... hasta 12
}

/** Bonus de score al completar un nivel. */
export function getLevelBonus(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return 3 + safeLevel; // +4, +5, +6...
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
 * Inicia la transición de fin de nivel. No incrementa todavía state.level;
 * eso ocurre al terminar el temporizador para que el renderer pueda mostrar
 * claramente qué nivel se completó.
 */
export function beginLevelComplete(state) {
  ensureLevelState(state);
  state.completedLevel = state.level;
  state.levelCompleteBonus = getLevelBonus(state.level);
  state.levelTransitionTimer = LEVEL_COMPLETE_DELAY;
  state.phase = 'levelcomplete';
  state.pendingLaunch = false;
  state.flyingProjectile = null;
  return state.levelCompleteBonus;
}

/**
 * Prepara el siguiente nivel manteniendo score/record/estadísticas y también
 * los Active Power-Ups. Las flechas del nivel anterior desaparecen.
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

  // La flecha preparada se reinicia al cambiar de nivel para no arrastrar,
  // por ejemplo, un Cleanup que dejó de ser útil al vaciar el disco.
  // Los efectos activos (Freeze, Shield y Double Score) sí se conservan.
  state.nextPowerUp = null;
  state.lastPreparedWasPowerUp = false;

  const diff = DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.medium;
  const ce = state.centralElement;
  ce.angle = 0;
  ce.speed = diff.baseSpeed;
  ce.baseSpeed = diff.baseSpeed;
  ce.reverseTimer = 0;
  // Alternar el sentido inicial añade variedad sin introducir azar injusto.
  ce.direction = state.level % 2 === 0 ? -1 : 1;

  state.phase = 'playing';
  return state.level;
}
