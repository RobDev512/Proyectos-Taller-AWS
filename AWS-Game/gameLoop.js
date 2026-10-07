/**
 * gameLoop.js — Bucle principal.
 */

import { updateRotation, triggerReverse } from './centralElement.js';
import { launchProjectile, advanceProjectile, anchorProjectile } from './projectile.js';
import { checkCollision }       from './collision.js';
import { render, drawGameOverFlash } from './renderer.js';
import { showGameOver }         from './ui.js';
import { getProgression } from './config.js';
import { playSoundLaunch, playSoundAnchor, playSoundGameOver, playSoundCombo } from './sound.js';
import { emitImpact, updateAndDraw, clearParticles } from './particles.js';
import { registerAnchor, resetCombo } from './combo.js';

let rafId        = null;
let overlayShown = false;

const SERVICE_COLORS = {
  lambda:'#E8702E', s3:'#569A31', ec2:'#ED7100', dynamodb:'#4053D6',
  sqs:'#FF4F8B',    sns:'#E7157B', rds:'#527FFF', cloudwatch:'#E7157B',
};

// Estado de efectos de flash
let flashTimer = 0;

export function startGameLoop(ctx, state, assets, config, overlayEl) {
  stopGameLoop();
  overlayShown = false;
  flashTimer   = 0;
  clearParticles();
  resetCombo(state);

  let lastTimestamp = performance.now();

  function tick(timestamp) {
    const deltaTime  = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp    = timestamp;
    const progression = getProgression(state.difficulty, state.score);

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
          anchorProjectile(state);
          const mult = registerAnchor(state);
          if (mult > 1) {
            state.score   += mult - 1;
            if (state.score > state.highScore) state.highScore = state.score;
            playSoundCombo(mult);
          }
          playSoundAnchor(mult);
          const ap    = state.anchoredProjectiles[state.anchoredProjectiles.length - 1];
          const ce    = state.centralElement;
          emitImpact(
            ce.x + ap.distance * Math.cos(ap.angle),
            ce.y + ap.distance * Math.sin(ap.angle),
            SERVICE_COLORS[ap.awsIconId] ?? '#FF9900',
            14
          );

        } else if (result === 'collision') {
          state.phase = 'gameover';
          state.gameOverTimestamp = performance.now();
          overlayShown = false;
          flashTimer   = 0.25;
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
    drawGameOverFlash(ctx, flashTimer);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}

export function stopGameLoop() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}
