/**
 * config.js — Constantes base, dificultades y escalado progresivo.
 */

/**
 * Curva de progresión: dado el score actual y la dificultad base,
 * retorna los parámetros efectivos que se deben aplicar al disco.
 *
 * El escalado es suave (raíz cuadrada) para que los primeros puntos
 * se sientan significativos pero no se vuelva imposible demasiado rápido.
 *
 * @param {string} diffKey  - 'easy'|'medium'|'hard'
 * @param {number} score
 * @returns {{ speed, speedVariance, reverseChance, reverseEvery, tier }}
 */
export function getProgression(diffKey, score) {
  const base  = DIFFICULTIES[diffKey];
  // t: progreso normalizado 0→1 a lo largo de ~60 puntos
  const t     = Math.min(1, Math.sqrt(score / 60));
  // tier visible al jugador: 1–5
  const tier  = Math.min(5, 1 + Math.floor(t * 4));

  switch (diffKey) {
    case 'easy':
      return {
        speed:         base.baseSpeed + t * 1.4,        // 1.0 → 2.4
        speedVariance: t * 0.6,                          // 0   → 0.6 (empieza a variar)
        reverseChance: t > 0.6 ? (t - 0.6) * 0.003 : 0,// aparece tarde
        reverseEvery:  0,
        tier,
      };

    case 'medium':
      return {
        speed:         base.baseSpeed + t * 1.8,         // 1.8 → 3.6
        speedVariance: t * 0.5,
        reverseChance: 0,
        reverseEvery:  Math.max(2, Math.round(5 - t * 3)), // 5 → 2 (más frecuente)
        tier,
      };

    case 'hard':
      return {
        speed:         base.baseSpeed + t * 2.2,         // 2.6 → 4.8
        speedVariance: base.speedVariance + t * 1.0,     // 1.4 → 2.4
        reverseChance: base.reverseChance + t * 0.006,   // 0.004 → 0.010
        reverseEvery:  0,
        tier,
      };

    default:
      return { speed: base.baseSpeed, speedVariance: 0, reverseChance: 0, reverseEvery: 0, tier: 1 };
  }
}


export const APP_VERSION = '1.1.0';
export const APP_CODENAME = 'Progression Update';

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
