/**
 * gameLoop.js — Bucle principal.
 */

import { updateRotation, triggerReverse } from './centralElement.js';
import {
  launchProjectile,
  advanceProjectile,
  anchorProjectile,
} from './projectile.js';
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
  playSoundPowerUpCollect,
  playSoundPowerCoreSpawn,
  playSoundPowerCoreLock,
  playSoundShieldSave,
} from './sound.js';
import {
  emitImpact,
  updateAndDraw,
  clearParticles,
} from './particles.js';
import { registerAnchor, resetCombo } from './combo.js';
import { updateHighScore } from './scoring.js';
import {
  evaluatePerfectShot,
  PERFECT_BONUS,
} from './precision.js';
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
  activateStoredPowerUp,
  addPowerUpCharge,
  consumeDoubleScoreHit,
  consumeShield,
  isDoubleScoreActive,
  isFreezeActive,
  POWER_UP_CONFIG,
  POWER_UP_TYPES,
  resetPowerUps,
  updatePowerUps,
} from './powerups.js';
import {
  checkPowerCoreCrossing,
  completePowerCoreCapture,
  resetPowerCore,
  trySpawnPowerCore,
  updatePowerCore,
} from './powercore.js';

let rafId = null;
let overlayShown = false;
let flashTimer = 0;

const SERVICE_COLORS = {
  lambda:'#E8702E',
  s3:'#569A31',
  ec2:'#ED7100',
  dynamodb:'#4053D6',
  sqs:'#FF4F8B',
  sns:'#E7157B',
  rds:'#527FFF',
  cloudwatch:'#E7157B',
};

const USE_MESSAGES = Object.freeze({
  freeze: ['FREEZE ACTIVATED', 'ROTATION PAUSED'],
  shield: ['SHIELD ARMED', 'NEXT COLLISION BLOCKED'],
  double: ['DOUBLE SCORE', 'NEXT 3 HITS'],
  cleanup: ['CLEANUP USED', 'OLDEST ARROW REMOVED'],
});

function emitActivationFeedback(state, activation) {
  if (!activation?.activated) return;

  const type = activation.type;
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  const message = USE_MESSAGES[type] ?? ['POWER-UP USED', ''];

  emitBanner(
    message[0],
    message[1],
    { color, priority: 'high', duration: 1.05 },
  );

  let fxX = state.centralElement.x;
  let fxY = state.centralElement.y;

  if (
    type === POWER_UP_TYPES.CLEANUP &&
    activation.removedProjectile
  ) {
    const removed = activation.removedProjectile;
    fxX =
      state.centralElement.x +
      removed.distance * Math.cos(removed.angle);
    fxY =
      state.centralElement.y +
      removed.distance * Math.sin(removed.angle);

    emitFloatingText(fxX, fxY - 14, 'REMOVED', {
      color,
      size: 15,
      duration: 0.76,
      vy: -25,
    });
  }

  emitRing(fxX, fxY, color, 1.15);
  emitImpact(fxX, fxY, color, 22, 'burst');
  playSoundPowerUp(type);
}

function processPendingPowerUpActivation(state) {
  const type = state.pendingPowerUpActivation;
  if (!type) return;

  state.pendingPowerUpActivation = null;
  const activation = activateStoredPowerUp(state, type);

  if (activation.activated) {
    emitActivationFeedback(state, activation);
  }
}

function emitPowerCoreSpawnFeedback(state, spawn) {
  if (!spawn?.spawned) return;

  const color =
    POWER_UP_CONFIG.colors[spawn.type] ?? '#FF9900';

  emitBanner(
    'POWER CORE READY!',
    'TIME YOUR SHOT • CROSS THE CORE AND LAND IT',
    { color, priority: 'high', duration: 1.35 },
  );

  emitImpact(
    state.centralElement.x,
    state.centralElement.y,
    color,
    26,
    'confetti',
  );

  playSoundPowerCoreSpawn();
}

function maybeSpawnPowerCore(state) {
  const spawn = trySpawnPowerCore(state);
  if (spawn.spawned) {
    emitPowerCoreSpawnFeedback(state, spawn);
  }
  return spawn;
}

function emitPowerCoreLockFeedback(hit) {
  if (!hit?.hit) return;

  const color =
    POWER_UP_CONFIG.colors[hit.type] ?? '#FFFFFF';
  const label =
    POWER_UP_CONFIG.names[hit.type] ?? 'POWER';

  emitFloatingText(hit.x, hit.y - 20, `${label} LOCKED!`, {
    color,
    size: 14,
    duration: 0.68,
    vy: -22,
  });
  emitRing(hit.x, hit.y, color, 1.05);
  emitImpact(hit.x, hit.y, color, 16, 'burst');
  playSoundPowerCoreLock(hit.type);
}

function emitPowerCoreCaptureFeedback(state, capture, x, y) {
  if (!capture?.captured) return;

  const type = capture.type;
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  const label = POWER_UP_CONFIG.names[type] ?? 'POWER-UP';
  const shortcut = POWER_UP_CONFIG.shortcuts[type] ?? '?';

  emitBanner(
    `${label} CAPTURED!`,
    `STORED • CLICK SLOT OR PRESS ${shortcut}`,
    { color, priority: 'high', duration: 1.25 },
  );

  emitFloatingText(x, y - 30, `${label} +1`, {
    color,
    size: 15,
    duration: 0.82,
    vy: -27,
  });

  emitRing(x, y, color, 1.2);
  emitImpact(x, y, color, 24, 'confetti');
  playSoundPowerUpCollect(type);

  if (state.stats) recordPowerUp(state.stats);
}

function awardChargeForHit(state, precision, comboMultiplier) {
  let amount = POWER_UP_CONFIG.chargePerHit;

  if (precision?.perfect) {
    amount += POWER_UP_CONFIG.perfectChargeBonus;
  }

  if (comboMultiplier > 1) {
    amount +=
      Math.min(4, comboMultiplier - 1) *
      POWER_UP_CONFIG.comboChargeStep;
  }

  const result = addPowerUpCharge(state, amount);

  if (result.added > 0) {
    emitFloatingText(
      state.centralElement.x + state.centralElement.radius + 38,
      state.centralElement.y + state.centralElement.radius + 34,
      `+${Math.round(result.added)}% POWER`,
      {
        color: '#FFB24D',
        size: 9,
        duration: 0.48,
        vy: -14,
      },
    );
  }

  if (result.becameReady) {
    maybeSpawnPowerCore(state);
  }
}

export function startGameLoop(ctx, state, assets, config, overlayEl) {
  stopGameLoop();
  overlayShown = false;
  flashTimer = 0;

  clearParticles();
  clearFeedback();
  resetCombo(state);
  ensureLevelState(state);

  state.lastTier =
    getProgression(
      state.difficulty,
      state.score,
      state.level,
    ).tier;

  emitBanner(
    `LEVEL ${state.level}`,
    `${getLevelTarget(state.level)} ARROWS TO CLEAR`,
    { priority: 'high', duration: 1.35 },
  );

  let lastTimestamp = performance.now();

  function tick(timestamp) {
    const deltaTime = Math.min(
      (timestamp - lastTimestamp) / 1000,
      0.1,
    );
    lastTimestamp = timestamp;

    let progression = getProgression(
      state.difficulty,
      state.score,
      state.level,
    );

    if (flashTimer > 0) flashTimer -= deltaTime;

    if (state.phase === 'playing') {
      processPendingPowerUpActivation(state);

      // Si el inventario estaba lleno al llegar a 100 %, usar un Power-Up
      // puede liberar un slot y permitir que el Core aparezca ahora.
      maybeSpawnPowerCore(state);
      updatePowerCore(state, deltaTime);

      if (
        state.pendingLaunch &&
        !state.flyingProjectile
      ) {
        launchProjectile(state, config);
        playSoundLaunch();
      }

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
        const previousX = state.flyingProjectile.x;
        const previousY = state.flyingProjectile.y;

        advanceProjectile(state, deltaTime);

        const coreHit = checkPowerCoreCrossing(
          state,
          state.flyingProjectile,
          previousX,
          previousY,
        );

        if (coreHit) {
          emitPowerCoreLockFeedback(coreHit);
        }

        const result = checkCollision(state);

        if (result === 'anchor') {
          // El tipo queda bloqueado exactamente cuando la flecha atraviesa
          // el Core. Aún debe anclarse para cobrar la recompensa.
          const powerCoreHitType =
            state.flyingProjectile?.powerCoreHitType ?? null;

          const scoreBefore = state.score;

          anchorProjectile(state);
          registerLevelHit(state);

          const ap =
            state.anchoredProjectiles[
              state.anchoredProjectiles.length - 1
            ];

          const ce = state.centralElement;
          const impactX =
            ce.x + ap.distance * Math.cos(ap.angle);
          const impactY =
            ce.y + ap.distance * Math.sin(ap.angle);

          const color =
            SERVICE_COLORS[ap.awsIconId] ?? '#FF9900';

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

            if (!precision.perfect) {
              playSoundCombo(mult);
            }
          }

          const normalShotGain = state.score - scoreBefore;

          if (isDoubleScoreActive(state)) {
            state.score += normalShotGain;
            consumeDoubleScoreHit(state);
            updateHighScore(state);
          }

          playSoundAnchor(mult);

          const gained = state.score - scoreBefore;

          if (precision.perfect) {
            emitFloatingText(
              impactX,
              impactY - 18,
              `PERFECT! +${gained}`,
              {
                color: '#FFD166',
                size: 19,
                duration: 0.95,
                vy: -32,
              },
            );
            emitRing(impactX, impactY, '#FFD166', 1.25);
            emitImpact(
              impactX,
              impactY,
              '#FFD166',
              22,
              'burst',
            );
          } else if (mult > 1) {
            emitFloatingText(
              impactX,
              impactY - 16,
              `×${mult}  +${gained}`,
              {
                color: '#FFB24D',
                size: 17,
                duration: 0.8,
              },
            );
            emitRing(impactX, impactY, color, 1.0);
            emitImpact(impactX, impactY, color, 16);
          } else {
            emitFloatingText(
              impactX,
              impactY - 14,
              `+${gained}`,
              {
                color: '#FFFFFF',
                size: 15,
                duration: 0.62,
              },
            );
            emitRing(impactX, impactY, color, 0.8);
            emitImpact(impactX, impactY, color, 14);
          }

          // El Power Core se cobra únicamente después del anchor válido.
          if (powerCoreHitType) {
            const capture = completePowerCoreCapture(
              state,
              powerCoreHitType,
            );

            if (capture.captured) {
              emitPowerCoreCaptureFeedback(
                state,
                capture,
                impactX,
                impactY,
              );
            }
          }

          // Jugar bien llena el siguiente Power Charge.
          awardChargeForHit(state, precision, mult);

          progression = getProgression(
            state.difficulty,
            state.score,
            state.level,
          );

          if (progression.tier > state.lastTier) {
            state.lastTier = progression.tier;

            emitBanner(
              `TIER ${progression.tier}`,
              'La dificultad acaba de subir',
              { duration: 0.95 },
            );

            emitImpact(
              ce.x,
              ce.y,
              '#FF9900',
              36,
              'confetti',
            );

            playSoundTierUp();
          }

          if (isLevelComplete(state)) {
            const completed = state.level;
            const bonus = beginLevelComplete(state);

            state.score += bonus;
            updateHighScore(state);
            resetCombo(state);

            addPowerUpCharge(
              state,
              POWER_UP_CONFIG.levelCompleteCharge,
            );

            if (state.stats) {
              recordLevelComplete(
                state.stats,
                completed,
              );
            }

            emitImpact(
              ce.x,
              ce.y,
              '#FF9900',
              58,
              'confetti',
            );

            playSoundLevelComplete();
          }

        } else if (result === 'collision') {
          const shieldX =
            state.flyingProjectile?.x ??
            state.centralElement.x;

          const shieldY =
            state.flyingProjectile?.y ??
            state.centralElement.y;

          if (consumeShield(state)) {
            // Aunque la flecha hubiera atravesado un Core, un tiro que termina
            // en colisión NO lo cobra. El Core continúa orbitando.
            state.flyingProjectile = null;
            resetCombo(state);

            const shieldColor =
              POWER_UP_CONFIG.colors.shield;

            emitBanner(
              'SHIELD SAVE!',
              'COLLISION BLOCKED',
              {
                color: shieldColor,
                priority: 'high',
                duration: 1.05,
              },
            );

            emitFloatingText(
              shieldX,
              shieldY - 18,
              'SHIELD SAVE!',
              {
                color: shieldColor,
                size: 17,
                duration: 0.9,
                vy: -30,
              },
            );

            emitRing(
              shieldX,
              shieldY,
              shieldColor,
              1.25,
            );

            emitImpact(
              shieldX,
              shieldY,
              shieldColor,
              26,
              'burst',
            );

            playSoundShieldSave();

            if (state.stats) {
              recordShieldSave(state.stats);
            }
          } else {
            state.phase = 'gameover';
            state.gameOverTimestamp = performance.now();
            state.pendingPowerUpActivation = null;

            overlayShown = false;
            flashTimer = 0.25;

            resetPowerUps(state);
            resetPowerCore(state);

            if (state.stats) recordGameOver(state.stats);
            playSoundGameOver();
          }
        }
      }

    } else if (state.phase === 'levelcomplete') {
      // Los efectos temporizados y el Core se pausan durante la transición.
      updateRotation(state, deltaTime, progression);
      state.levelTransitionTimer -= deltaTime;

      if (state.levelTransitionTimer <= 0) {
        const nextLevel = advanceToNextLevel(state);
        resetCombo(state);

        progression = getProgression(
          state.difficulty,
          state.score,
          state.level,
        );

        state.lastTier = progression.tier;

        emitBanner(
          `LEVEL ${nextLevel}`,
          `${getLevelTarget(nextLevel)} ARROWS TO CLEAR`,
          { priority: 'high', duration: 1.35 },
        );
      }
    }

    if (
      state.phase === 'gameover' &&
      !overlayShown
    ) {
      if (
        performance.now() -
          state.gameOverTimestamp >=
        config.GAMEOVER_DISPLAY_DELAY
      ) {
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
