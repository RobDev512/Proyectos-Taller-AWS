/**
 * config.js — Constantes base, dificultades y escalado progresivo.
 */

/**
 * Curva de progresión: dado el score actual, la dificultad base y el nivel,
 * retorna los parámetros efectivos que se deben aplicar al disco.
 *
 * El score mantiene la progresión suave original y el nivel añade una capa
 * extra de dificultad para que cada fase se sienta ligeramente más intensa.
 *
 * @param {string} diffKey  - 'easy'|'medium'|'hard'
 * @param {number} score
 * @param {number} level
 * @returns {{ speed, speedVariance, reverseChance, reverseEvery, tier }}
 */
export function getProgression(diffKey, score, level = 1) {
  const base = DIFFICULTIES[diffKey] ?? DIFFICULTIES.medium;
  const safeScore = Math.max(0, Number(score) || 0);
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));

  // t: progreso normalizado 0→1 a lo largo de ~60 puntos.
  const t = Math.min(1, Math.sqrt(safeScore / 60));

  // Los niveles también empujan lentamente el tier visible, sin sustituir
  // la progresión por puntaje.
  const levelTierBoost = Math.min(0.25, (safeLevel - 1) * 0.025);
  const tierProgress = Math.min(1, t + levelTierBoost);
  const tier = Math.min(5, 1 + Math.floor(tierProgress * 4));

  // Boost moderado por nivel, limitado para no volver el juego imposible.
  const levelBoost = Math.min(1.2, (safeLevel - 1) * 0.10);

  switch (diffKey) {
    case 'easy':
      return {
        speed:         base.baseSpeed + t * 1.4 + levelBoost * 0.55,
        speedVariance: t * 0.6 + levelBoost * 0.10,
        reverseChance: t > 0.6 ? (t - 0.6) * 0.003 + levelBoost * 0.0004 : 0,
        reverseEvery:  0,
        tier,
      };

    case 'medium':
      return {
        speed:         base.baseSpeed + t * 1.8 + levelBoost * 0.80,
        speedVariance: t * 0.5 + levelBoost * 0.12,
        reverseChance: 0,
        reverseEvery:  Math.max(2, Math.round(5 - t * 2.2 - levelBoost * 0.8)),
        tier,
      };

    case 'hard':
      return {
        speed:         base.baseSpeed + t * 2.2 + levelBoost,
        speedVariance: base.speedVariance + t * 1.0 + levelBoost * 0.18,
        reverseChance: base.reverseChance + t * 0.006 + levelBoost * 0.0008,
        reverseEvery:  0,
        tier,
      };

    default:
      return {
        speed: base.baseSpeed + levelBoost * 0.5,
        speedVariance: 0,
        reverseChance: 0,
        reverseEvery: 0,
        tier: 1,
      };
  }
}

export const APP_VERSION = '1.3.1';
export const APP_CODENAME = 'Interactive Power-Ups Patch';

export const DIFFICULTIES = {
  easy: {
    label:         'Easy',
    emoji:         '☁️',
    baseSpeed:     1.0,
    speedVariance: 0,
    reverseChance: 0,
    reverseEvery:  0,
    description:   'Empieza tranquilo… pero el disco aprende.',
  },
  medium: {
    label:         'Medium',
    emoji:         '⚡',
    baseSpeed:     1.8,
    speedVariance: 0,
    reverseChance: 0,
    reverseEvery:  5,
    description:   'Inversiones periódicas que se vuelven más frecuentes.',
  },
  hard: {
    label:         'Hard',
    emoji:         '🔥',
    baseSpeed:     2.6,
    speedVariance: 1.4,
    reverseChance: 0.004,
    reverseEvery:  0,
    description:   'Caos creciente. Cada flecha cuenta.',
  },
};

export const CONFIG = {
  CANVAS_WIDTH:  600,
  CANVAS_HEIGHT: 700,

  CENTRAL_RADIUS:         85,
  CENTRAL_SPEED:          1.2,
  PROJECTILE_SPEED:       1600,
  PROJECTILE_RADIUS:      22,

  GAMEOVER_DISPLAY_DELAY: 500,

  AWS_ICONS: ['lambda','s3','ec2','dynamodb','sqs','sns','rds','cloudwatch'],

  DEFAULT_DIFFICULTY: 'medium',
};
