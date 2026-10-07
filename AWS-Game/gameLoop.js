/**
 * gameLoop.js — Bucle principal.
 */

import { updateRotation, triggerReverse } from './centralElement.js';
import { launchProjectile, advanceProjectile, anchorProjectile } from './projectile.js';
import { checkCollision } from './collision.js';
import { render, drawGameOverFlash } from './renderer.js';
import { showGameOver } from './ui.js';
import { getProgression } from './config.js';
import {
  playSoundLaunch,
  playSoundAnchor,
  playSoundGameOver,
  playSoundCombo,
  playSoundPerfect,
  playSoundTierUp,
  playSoundLevelComplete,
  playSoundPowerUp,
  playSoundShieldSave,
} from './sound.js';
import { emitImpact, updateAndDraw, clearParticles } from './particles.js';
import { registerAnchor, resetCombo } from './combo.js';
import { updateHighScore } from './scoring.js';
import { evaluatePerfectShot, PERFECT_BONUS } from './precision.js';
import {
  emitFloatingText,
  emitRing,
  emitBanner,
  updateAndDrawFeedback,
  clearFeedback,
} from './feedback.js';
import {
  recordHit,
  recordPerfect,
  recordCombo,
  recordGameOver,
  recordLevelComplete,
  recordPowerUp,
  recordShieldSave,
} from './stats.js';
import {
  ensureLevelState,
  getLevelTarget,
  registerLevelHit,
  isLevelComplete,
  beginLevelComplete,
  advanceToNextLevel,
} from './levels.js';
import {
  activatePowerUp,
  consumeDoubleScoreHit,
  consumeShield,
  isDoubleScoreActive,
  isFreezeActive,
  POWER_UP_CONFIG,
  POWER_UP_TYPES,
  resetPowerUps,
  updatePowerUps,
} from './powerups.js';

let rafId = null;
let overlayShown = false;

const SERVICE_COLORS = {
  lambda:'#E8702E', s3:'#569A31', ec2:'#ED7100', dynamodb:'#4053D6',
  sqs:'#FF4F8B', sns:'#E7157B', rds:'#527FFF', cloudwatch:'#E7157B',
};


let flashTimer = 0;

const POWER_UP_MESSAGES = Object.freeze({
  freeze: {
    title: 'FREEZE!',
    subtitle: 'ROTATION PAUSED',
  },
  shield: {
    title: 'SHIELD READY!',
    subtitle: 'ONE COLLISION BLOCKED',
  },
  double: {
    title: 'DOUBLE SCORE!',
    subtitle: 'NEXT 3 HITS',
  },
  cleanup: {
    title: 'CLEANUP!',
    subtitle: 'OLDEST ARROW REMOVED',
  },
});

function emitPowerUpActivationFeedback(state, activation, x, y) {
  if (!activation?.activated) return;

  const type = activation.type;
  const message = POWER_UP_MESSAGES[type];
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';

  if (message) {
    emitBanner(message.title, message.subtitle);
  }

  emitFloatingText(x, y - 34, POWER_UP_CONFIG.labels[type] ?? 'POWER-UP', {
    color,
    size: 14,
    duration: 0.75,
    vy: -28,
  });
  emitRing(x, y, color, 1.05);
  emitImpact(x, y, color, 20, 'burst');

  playSoundPowerUp(type);
  if (state.stats) recordPowerUp(state.stats);
}

export function startGameLoop(ctx, state, assets, config, overlayEl) {
  stopGameLoop();
  overlayShown = false;
  flashTimer = 0;
  clearParticles();
  clearFeedback();
  resetCombo(state);
  ensureLevelState(state);
  state.lastTier = getProgression(state.difficulty, state.score, state.level).tier;

  emitBanner(`LEVEL ${state.level}`, `${getLevelTarget(state.level)} ARROWS TO CLEAR`);

  let lastTimestamp = performance.now();

  function tick(timestamp) {
    const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;
    let progression = getProgression(state.difficulty, state.score, state.level);

    if (flashTimer > 0) flashTimer -= deltaTime;

    if (state.phase === 'playing') {
      if (state.pendingLaunch && !state.flyingProjectile) {
        launchProjectile(state, config);
        playSoundLaunch();
      }

      // Freeze detiene por completo la rotación durante gameplay.
      // El timer solo disminuye mientras phase === 'playing'.
      if (isFreezeActive(state)) {
        updatePowerUps(state, deltaTime);
      } else {
        updateRotation(state, deltaTime, progression);
      }

      if (
        progression.reverseEvery > 0 &&
        state.score > 0 &&
        state.score !== state.lastReverseScore &&
        state.score % progression.reverseEvery === 0
      ) {
        triggerReverse(state);
        state.lastReverseScore = state.score;
      }

      if (state.flyingProjectile) {
        advanceProjectile(state, deltaTime);
        const result = checkCollision(state);

        if (result === 'anchor') {
          // Capturar antes de anclar: anchorProjectile() limpia flyingProjectile.
          const powerUpType = state.flyingProjectile?.powerUpType ?? null;
          const scoreBefore = state.score;

          anchorProjectile(state); // +1 base
          registerLevelHit(state);

          const ap = state.anchoredProjectiles[state.anchoredProjectiles.length - 1];
          const ce = state.centralElement;
          const impactX = ce.x + ap.distance * Math.cos(ap.angle);
          const impactY = ce.y + ap.distance * Math.sin(ap.angle);
          const color = SERVICE_COLORS[ap.awsIconId] ?? '#FF9900';

          if (state.stats) recordHit(state.stats);

          const precision = evaluatePerfectShot(state, ap);
          if (precision.perfect) {
            state.score += PERFECT_BONUS;
            updateHighScore(state);
            if (state.stats) recordPerfect(state.stats);
            playSoundPerfect();
          }

          const mult = registerAnchor(state);
          if (state.stats) recordCombo(state.stats, mult);
          if (mult > 1) {
            state.score += mult - 1;
            updateHighScore(state);
            if (!precision.perfect) playSoundCombo(mult);
          }

          // Double Score duplica exactamente lo ganado por este tiro
          // (base + Perfect + Combo), antes de cualquier bonus de nivel.
          const normalShotGain = state.score - scoreBefore;
          if (isDoubleScoreActive(state)) {
            state.score += normalShotGain;
            consumeDoubleScoreHit(state);
            updateHighScore(state);
          }

          playSoundAnchor(mult);

          const gained = state.score - scoreBefore;
          if (precision.perfect) {
            emitFloatingText(impactX, impactY - 18, `PERFECT! +${gained}`, {
              color: '#FFD166', size: 19, duration: 0.95, vy: -32,
            });
            emitRing(impactX, impactY, '#FFD166', 1.25);
            emitImpact(impactX, impactY, '#FFD166', 22, 'burst');
          } else if (mult > 1) {
            emitFloatingText(impactX, impactY - 16, `×${mult}  +${gained}`, {
              color: '#FFB24D', size: 17, duration: 0.8,
            });
            emitRing(impactX, impactY, color, 1.0);
            emitImpact(impactX, impactY, color, 16);
          } else {
            emitFloatingText(impactX, impactY - 14, `+${gained}`, {
              color: '#FFFFFF', size: 15, duration: 0.62,
            });
            emitRing(impactX, impactY, color, 0.8);
            emitImpact(impactX, impactY, color, 14);
          }

          // Activar el Power-Up únicamente después de resolver todos los
          // puntos del tiro. Así una Double Arrow no se duplica a sí misma.
          const activation = activatePowerUp(state, powerUpType);
          emitPowerUpActivationFeedback(state, activation, impactX, impactY);

          if (
            activation.activated &&
            activation.type === POWER_UP_TYPES.CLEANUP &&
            activation.removedProjectile
          ) {
            const removed = activation.removedProjectile;
            const removedX = ce.x + removed.distance * Math.cos(removed.angle);
            const removedY = ce.y + removed.distance * Math.sin(removed.angle);
            const cleanupColor = POWER_UP_CONFIG.colors.cleanup;

            emitFloatingText(removedX, removedY - 12, 'REMOVED', {
              color: cleanupColor,
              size: 15,
              duration: 0.72,
              vy: -24,
            });
            emitRing(removedX, removedY, cleanupColor, 1.0);
            emitImpact(removedX, removedY, cleanupColor, 18, 'burst');
          }

          // Recalcular inmediatamente porque el tiro pudo sumar varios puntos.
          progression = getProgression(state.difficulty, state.score, state.level);
          if (progression.tier > state.lastTier) {
            state.lastTier = progression.tier;
            emitBanner(`TIER ${progression.tier}`, 'La dificultad acaba de subir');
            emitImpact(ce.x, ce.y, '#FF9900', 36, 'confetti');
            playSoundTierUp();
          }

          // El objetivo del nivel se basa en flechas acertadas, no en score.
          if (isLevelComplete(state)) {
            const completed = state.level;
            const bonus = beginLevelComplete(state);
            state.score += bonus;
            updateHighScore(state);
            resetCombo(state);
            if (state.stats) recordLevelComplete(state.stats, completed);
            emitImpact(ce.x, ce.y, '#FF9900', 58, 'confetti');
            playSoundLevelComplete();
          }

        } else if (result === 'collision') {
          // Shield intercepta el resultado después de checkCollision().
          // collision.js y su hitbox permanecen completamente intactos.
          const shieldX = state.flyingProjectile?.x ?? state.centralElement.x;
          const shieldY = state.flyingProjectile?.y ?? state.centralElement.y;

          if (consumeShield(state)) {
            state.flyingProjectile = null;
            resetCombo(state);

            const shieldColor = POWER_UP_CONFIG.colors.shield;
            emitBanner('SHIELD SAVE!', 'COLLISION BLOCKED');
            emitFloatingText(shieldX, shieldY - 18, 'SHIELD SAVE!', {
              color: shieldColor,
              size: 17,
              duration: 0.9,
              vy: -30,
            });
            emitRing(shieldX, shieldY, shieldColor, 1.25);
            emitImpact(shieldX, shieldY, shieldColor, 26, 'burst');
            playSoundShieldSave();

            if (state.stats) recordShieldSave(state.stats);
          } else {
            state.phase = 'gameover';
            state.gameOverTimestamp = performance.now();
            overlayShown = false;
            flashTimer = 0.25;

            // Game Over elimina todos los efectos y cualquier Power-Up
            // preparado. Las estadísticas y el score permanecen intactos.
            resetPowerUps(state);

            if (state.stats) recordGameOver(state.stats);
            playSoundGameOver();
          }
        }
      }
    } else if (state.phase === 'levelcomplete') {
      // Freeze se pausa durante la transición; el disco puede seguir animándose.
      updateRotation(state, deltaTime, progression);
      state.levelTransitionTimer -= deltaTime;

      if (state.levelTransitionTimer <= 0) {
        const nextLevel = advanceToNextLevel(state);
        resetCombo(state);
        progression = getProgression(state.difficulty, state.score, state.level);
        state.lastTier = progression.tier;
        emitBanner(`LEVEL ${nextLevel}`, `${getLevelTarget(nextLevel)} ARROWS TO CLEAR`);
      }
    }

    if (state.phase === 'gameover' && !overlayShown) {
      if (performance.now() - state.gameOverTimestamp >= config.GAMEOVER_DISPLAY_DELAY) {
        showGameOver(overlayEl, state);
        overlayShown = true;
      }
    }

    render(ctx, state, assets, progression);
    updateAndDraw(ctx, deltaTime);
    updateAndDrawFeedback(ctx, deltaTime);
    drawGameOverFlash(ctx, flashTimer);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}

export function stopGameLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
