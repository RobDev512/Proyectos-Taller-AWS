/**
 * gameLoop.js — Bucle principal.
 */

import { updateRotation, triggerReverse } from './centralElement.js';
import { launchProjectile, advanceProjectile, anchorProjectile } from './projectile.js';
import { checkCollision }       from './collision.js';
import { render, drawGameOverFlash } from './renderer.js';
import { showGameOver }         from './ui.js';
import { getProgression }       from './config.js';
import {
  playSoundLaunch,
  playSoundAnchor,
  playSoundGameOver,
  playSoundCombo,
  playSoundPerfect,
  playSoundTierUp,
} from './sound.js';
import { emitImpact, updateAndDraw, clearParticles } from './particles.js';
import { registerAnchor, resetCombo } from './combo.js';
import { updateHighScore }             from './scoring.js';
import { evaluatePerfectShot, PERFECT_BONUS } from './precision.js';
import {
  emitFloatingText,
  emitRing,
  emitBanner,
  updateAndDrawFeedback,
  clearFeedback,
} from './feedback.js';
import { recordHit, recordPerfect, recordCombo, recordGameOver } from './stats.js';

let rafId        = null;
let overlayShown = false;

const SERVICE_COLORS = {
  lambda:'#E8702E', s3:'#569A31', ec2:'#ED7100', dynamodb:'#4053D6',
  sqs:'#FF4F8B',    sns:'#E7157B', rds:'#527FFF', cloudwatch:'#E7157B',
};

let flashTimer = 0;

export function startGameLoop(ctx, state, assets, config, overlayEl) {
  stopGameLoop();
  overlayShown = false;
  flashTimer   = 0;
  clearParticles();
  clearFeedback();
  resetCombo(state);
  state.lastTier = getProgression(state.difficulty, state.score).tier;

  let lastTimestamp = performance.now();

  function tick(timestamp) {
    const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;
    let progression = getProgression(state.difficulty, state.score);

    if (flashTimer > 0) flashTimer -= deltaTime;

    if (state.phase === 'playing') {
      if (state.pendingLaunch && !state.flyingProjectile) {
        launchProjectile(state, config);
        playSoundLaunch();
      }

      updateRotation(state, deltaTime, progression);

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
          const scoreBefore = state.score;
          anchorProjectile(state); // +1 base

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

          // Recalcular inmediatamente porque el tiro pudo sumar varios puntos.
          progression = getProgression(state.difficulty, state.score);
          if (progression.tier > state.lastTier) {
            state.lastTier = progression.tier;
            emitBanner(`TIER ${progression.tier}`, 'La dificultad acaba de subir');
            emitImpact(ce.x, ce.y, '#FF9900', 36, 'confetti');
            playSoundTierUp();
          }

        } else if (result === 'collision') {
          state.phase = 'gameover';
          state.gameOverTimestamp = performance.now();
          overlayShown = false;
          flashTimer = 0.25;
          if (state.stats) recordGameOver(state.stats);
          playSoundGameOver();
        }
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
