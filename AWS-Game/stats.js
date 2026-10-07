/**
 * stats.js — Estadísticas locales persistentes.
 */

const STATS_KEY = 'awsArcadeStatsV1';

function defaults() {
  return {
    gamesPlayed: 0,
    shots: 0,
    hits: 0,
    perfectShots: 0,
    bestCombo: 1,
    levelsCompleted: 0,
    bestLevel: 1,
  };
}

function sanitize(value) {
  const d = defaults();
  if (!value || typeof value !== 'object') return d;

  for (const key of Object.keys(d)) {
    const n = Number.parseInt(value[key], 10);
    d[key] = Number.isFinite(n) && n >= 0 ? n : d[key];
  }

  d.bestCombo = Math.max(1, d.bestCombo);
  d.bestLevel = Math.max(1, d.bestLevel);
  return d;
}

export function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? sanitize(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

export function saveStats(stats) {
  const safe = sanitize(stats);
  Object.assign(stats, safe);
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(safe));
  } catch {
    // Sin persistencia seguimos manteniendo las estadísticas en memoria.
  }
  return stats;
}

export function recordShot(stats) {
  stats.shots += 1;
  saveStats(stats);
}

export function recordHit(stats) {
  stats.hits += 1;
  saveStats(stats);
}

export function recordPerfect(stats) {
  stats.perfectShots += 1;
  saveStats(stats);
}

export function recordCombo(stats, level) {
  stats.bestCombo = Math.max(stats.bestCombo, Math.floor(level || 1));
  saveStats(stats);
}

export function recordLevelComplete(stats, completedLevel) {
  stats.levelsCompleted += 1;
  stats.bestLevel = Math.max(stats.bestLevel, Math.floor(completedLevel || 1) + 1);
  saveStats(stats);
}

export function recordGameOver(stats) {
  stats.gamesPlayed += 1;
  saveStats(stats);
}

export function getAccuracy(stats) {
  if (!stats.shots) return 0;
  return Math.round((stats.hits / stats.shots) * 100);
}
