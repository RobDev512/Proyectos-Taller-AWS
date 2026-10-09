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
    powerUpsCollected: 0,
    shieldSaves: 0,
    bossesDefeated: 0,
    bestBossRank: '—',
  };
}

const RANK_ORDER = Object.freeze({
  '—': 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
});

function sanitize(value) {
  const d = defaults();
  if (!value || typeof value !== 'object') return d;

  for (const key of [
    'gamesPlayed',
    'shots',
    'hits',
    'perfectShots',
    'bestCombo',
    'levelsCompleted',
    'bestLevel',
    'powerUpsCollected',
    'shieldSaves',
    'bossesDefeated',
  ]) {
    const n = Number.parseInt(value[key], 10);
    d[key] = Number.isFinite(n) && n >= 0 ? n : d[key];
  }

  const rank = String(value.bestBossRank ?? '—').toUpperCase();
  d.bestBossRank = Object.hasOwn(RANK_ORDER, rank) ? rank : '—';

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

export function recordPowerUp(stats) {
  stats.powerUpsCollected = (stats.powerUpsCollected ?? 0) + 1;
  saveStats(stats);
}

export function recordShieldSave(stats) {
  stats.shieldSaves = (stats.shieldSaves ?? 0) + 1;
  saveStats(stats);
}

export function recordBossDefeat(stats, rank = 'D') {
  stats.bossesDefeated = (stats.bossesDefeated ?? 0) + 1;

  const safeRank = Object.hasOwn(RANK_ORDER, String(rank).toUpperCase())
    ? String(rank).toUpperCase()
    : 'D';
  const currentRank = Object.hasOwn(RANK_ORDER, stats.bestBossRank)
    ? stats.bestBossRank
    : '—';

  if (RANK_ORDER[safeRank] > RANK_ORDER[currentRank]) {
    stats.bestBossRank = safeRank;
  }

  saveStats(stats);
}

export function getAccuracy(stats) {
  if (!stats.shots) return 0;
  return Math.round((stats.hits / stats.shots) * 100);
}
