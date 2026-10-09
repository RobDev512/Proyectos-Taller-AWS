/**
 * gameLoop.js — Bucle principal.
 */

import { updateRotation, triggerReverse } from './centralElement.js';
import {
  launchProjectile,
  advanceProjectile,
  anchorProjectile,
} from './projectile.js?build=v141-audio-r6';
import { checkCollision } from './collision.js';
import { render, drawGameOverFlash } from './renderer.js?build=v141-audio-r6';
import { showGameOver } from './ui.js';
import { getProgression } from './config.js?build=v141-audio-r6';
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
  playSoundBossIntro,
  playSoundBossHit,
  playSoundBossBlock,
  playSoundBossPhase,
  playSoundBossDefeat,
  playSoundBossBreak,
  playSoundOverload,
  playSoundTransition,
  updateMusicSystem,
} from './sound.js?build=v141-audio-r6';
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
  recordBossDefeat,
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
} from './powerups.js?build=v141-audio-r6';
import {
  checkPowerCoreCrossing,
  completePowerCoreCapture,
  resetPowerCore,
  trySpawnPowerCore,
  updatePowerCore,
} from './powercore.js';
import {
  damageStability,
  recoverStability,
  restoreStability,
  STABILITY_CONFIG,
} from './stability.js';
import {
  checkBossLayerCrossing,
  ensureBossState,
  evaluateBossImpact,
  getBossPhase,
  recordBossBlockedShot,
  recordBossShot,
  refundBossUtilityShot,
  registerBossHit,
  isBossPhaseTransitionActive,
  updateBossDetachedArrows,
  updateBossDetachedDebris,
  updateBossPhaseTransition,
  updateBoss,
  updateBossIntro,
} from './boss.js?build=v141-audio-r6';

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
  freeze: ['¡FREEZE ACTIVADO!', 'ROTACIÓN PAUSADA'],
  shield: ['¡ESCUDO ARMADO!', 'SIGUIENTE COLISIÓN BLOQUEADA'],
  double: ['¡PUNTAJE DOBLE!', 'PRÓXIMOS 3 GOLPES'],
  cleanup: ['¡LIMPIEZA USADA!', 'FLECHA MÁS VIEJA ELIMINADA'],
});

function emitActivationFeedback(state, activation) {
  if (!activation?.activated) return;

  const type = activation.type;
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  const message = USE_MESSAGES[type] ?? ['POTENCIADOR USADO', ''];

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
    const removedVisualDistance = Number.isFinite(removed.renderDistance)
      ? removed.renderDistance
      : removed.distance;
    fxX =
      state.centralElement.x +
      removedVisualDistance * Math.cos(removed.angle);
    fxY =
      state.centralElement.y +
      removedVisualDistance * Math.sin(removed.angle);

    emitFloatingText(fxX, fxY - 14, 'ELIMINADA', {
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

  const bossPickupMode = Boolean(
    state.boss?.active && !state.boss.defeated,
  );

  emitBanner(
    '¡NÚCLEO DE PODER LISTO!',
    bossPickupMode
      ? 'DISPARO DE RECOGIDA • ATRAVIÉSALO PARA OBTENERLO'
      : 'CALCULA TU DISPARO • CRUZA EL NÚCLEO Y ATERRIZA',
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

  emitFloatingText(hit.x, hit.y - 20, `¡${label} GUARDADO!`, {
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
  const label = POWER_UP_CONFIG.names[type] ?? 'POTENCIADOR';
  const shortcut = POWER_UP_CONFIG.shortcuts[type] ?? '?';

  emitBanner(
    `¡${label} CAPTURADO!`,
    `GUARDADO • CLIC EN EL ESPACIO O PRESIONA ${shortcut}`,
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
      `+${Math.round(result.added)}% PODER`,
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

function emitBossBlockedFeedback(state, overloadResult = null, label = '¡BLOQUEADO!') {
  const boss = state.boss;
  const color = boss?.color ?? '#FF6B35';
  const ce = state.centralElement;
  emitFloatingText(ce.x, ce.y + ce.radius + 28, label, {
    color,
    size: 15,
    duration: 0.72,
    vy: -20,
  });

  if (overloadResult?.added > 0) {
    emitFloatingText(
      ce.x,
      ce.y + ce.radius + 48,
      `SOBRECARGA ${Math.round(overloadResult.value)}%`,
      {
        color: overloadResult.overloaded ? '#FF4D4D' : '#FFB24D',
        size: 11,
        duration: 0.86,
        vy: -12,
      },
    );
  }

  emitRing(ce.x, ce.y, color, 1.0);
  playSoundBossBlock();
  if (overloadResult?.added > 0) {
    playSoundOverload(Math.max(0, overloadResult.value ?? 0), Boolean(overloadResult.overloaded));
  }
}

function emitStabilityCollisionFeedback(state, result) {
  const ce = state.centralElement;
  const remaining = Math.round(result?.value ?? state.stability ?? 0);
  const overload = Math.max(0, 100 - remaining);
  const critical = overload >= 75;
  const color = critical ? '#FF4D4D' : '#FFB24D';

  emitBanner(
    critical ? '¡SOBRECARGA CRÍTICA!' : '¡SUBE LA SOBRECARGA!',
    `${overload}% • 100% = FIN DE PARTIDA`,
    { color, priority: 'high', duration: 1.0 },
  );

  emitFloatingText(
    ce.x,
    ce.y + ce.radius + 34,
    `SOBRECARGA ${overload}%`,
    { color, size: 13, duration: 0.8, vy: -18 },
  );

  emitRing(ce.x, ce.y, color, 1.0);
  emitImpact(ce.x, ce.y, color, 18, 'burst');
  playSoundOverload(overload, critical);
}

function enterGameOver(state, reason = 'COLLISION') {
  if (state.phase === 'gameover') return;

  state.phase = 'gameover';
  state.gameOverReason = reason;
  state.gameOverTimestamp = performance.now();
  state.pendingPowerUpActivation = null;
  state.pendingLaunch = false;
  state.flyingProjectile = null;

  overlayShown = false;
  flashTimer = 0.25;

  resetPowerUps(state);
  resetPowerCore(state);

  if (state.stats) recordGameOver(state.stats);
  playSoundGameOver();
}

function emitBossHitFeedback(state, result) {
  const boss = state.boss;
  const phase = getBossPhase(state);
  const color = boss?.accent ?? '#FFD166';

  emitFloatingText(
    state.centralElement.x,
    state.centralElement.y - state.centralElement.radius - 28,
    result?.phaseChanged ? `¡${phase?.label ?? 'FASE'} REVELADA!` : (phase?.id === 'core' ? '¡NÚCLEO DAÑADO!' : '¡CAPA DESTRUIDA!'),
    {
      color,
      size: result?.phaseChanged ? 18 : 14,
      duration: result?.phaseChanged ? 0.95 : 0.68,
      vy: -18,
    },
  );

  emitRing(state.centralElement.x, state.centralElement.y, color, 1.12);
  playSoundBossHit();

  if (result?.phaseChanged) {
    emitImpact(
      state.centralElement.x,
      state.centralElement.y,
      color,
      42,
      'burst',
    );
    playSoundBossPhase();
    playSoundBossBreak();
  }
}

function completeBossLevel(state, result) {
  const completed = state.level;
  const bonus = beginLevelComplete(state, result?.bonus ?? null);

  state.score += bonus;
  updateHighScore(state);
  resetCombo(state);
  restoreStability(state);

  addPowerUpCharge(
    state,
    POWER_UP_CONFIG.levelCompleteCharge,
  );

  if (state.stats) {
    recordLevelComplete(state.stats, completed);
    recordBossDefeat(state.stats, result?.rank ?? 'D');
  }

  emitImpact(
    state.centralElement.x,
    state.centralElement.y,
    state.boss?.accent ?? '#FFD166',
    80,
    'confetti',
  );

  emitBanner(
    '¡JEFE DERROTADO!',
    `RANGO ${result?.rank ?? 'D'} • BONO +${bonus}`,
    {
      color: state.boss?.accent ?? '#FFD166',
      priority: 'high',
      duration: 1.35,
    },
  );

  playSoundBossDefeat();
}

export function startGameLoop(ctx, state, assets, config, overlayEl) {
  stopGameLoop();
  overlayShown = false;
  flashTimer = 0;

  clearParticles();
  clearFeedback();
  resetCombo(state);
  ensureLevelState(state);
  ensureBossState(state);

  state.lastTier =
    getProgression(
      state.difficulty,
      state.score,
      state.level,
    ).tier;

  if (state.boss?.active) {
    state.phase = 'bossintro';
    playSoundBossIntro();
  } else {
    emitBanner(
      `NIVEL ${state.level}`,
      `${getLevelTarget(state.level)} FLECHAS PARA COMPLETAR`,
      { priority: 'high', duration: 1.35 },
    );
  }

  let lastTimestamp = performance.now();

  function tick(timestamp) {
    const deltaTime = Math.min(
      (timestamp - lastTimestamp) / 1000,
      0.1,
    );
    lastTimestamp = timestamp;

    const logicalHeight = Math.max(
      config.CANVAS_HEIGHT,
      Number(ctx.canvas.dataset.logicalHeight) || config.CANVAS_HEIGHT,
    );
    const sceneOffsetY = Math.max(
      0,
      Number(ctx.canvas.dataset.sceneOffsetY) || 0,
    );
    state.uiLogicalHeight = logicalHeight;
    state.uiSceneOffsetY = sceneOffsetY;

    let progression = getProgression(
      state.difficulty,
      state.score,
      state.level,
    );

    updateMusicSystem(state, progression);

    if (flashTimer > 0) flashTimer -= deltaTime;

    // Los restos de una capa rota son puramente visuales y tienen ciclo de
    // vida propio: siguen actualizándose aunque termine la pausa de fase.
    updateBossDetachedArrows(state, deltaTime);
    updateBossDetachedDebris(state, deltaTime);

    if (state.phase === 'playing') {
      if (isBossPhaseTransitionActive(state)) {
        // Durante la ruptura entre fases no se puede lanzar ni activar nada.
        // El boss sacude la arena y expulsa visualmente las flechas antiguas.
        state.pendingLaunch = false;
        state.pendingPowerUpActivation = null;
        updateBossPhaseTransition(state, deltaTime);
      } else {
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
        if (state.boss?.active && !state.boss.defeated) recordBossShot(state);
        playSoundLaunch();
      }

      if (isFreezeActive(state)) {
        updatePowerUps(state, deltaTime);
      } else {
        updateRotation(state, deltaTime, progression);
        updateBoss(state, deltaTime);
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
          const bossPickupMode = Boolean(
            state.boss?.active && !state.boss.defeated,
          );

          if (bossPickupMode) {
            // En bosses el Power Core es un objetivo alterno, no una condición
            // adicional para dañar la armadura. Atravesarlo lo recoge al
            // instante y la flecha se disipa antes de llegar al boss.
            const capture = completePowerCoreCapture(
              state,
              coreHit.type,
            );

            if (capture.captured) {
              refundBossUtilityShot(state);
              emitPowerCoreCaptureFeedback(
                state,
                capture,
                coreHit.x,
                coreHit.y,
              );
              emitFloatingText(
                coreHit.x,
                coreHit.y + 34,
                '¡DISPARO DE RECOGIDA!',
                {
                  color: POWER_UP_CONFIG.colors[coreHit.type] ?? '#FFFFFF',
                  size: 10,
                  duration: 0.62,
                  vy: -10,
                },
              );
              state.flyingProjectile = null;
            }
          } else {
            emitPowerCoreLockFeedback(coreHit);
          }
        }

        const bossLayerHit = checkBossLayerCrossing(
          state,
          state.flyingProjectile,
          previousX,
          previousY,
        );

        if (bossLayerHit) {
          emitFloatingText(
            bossLayerHit.x,
            bossLayerHit.y - 18,
            bossLayerHit.phase === 'core' ? '¡NÚCLEO ASEGURADO!' : '¡CAPA ASEGURADA!',
            {
              color: bossLayerHit.color ?? state.boss?.accent ?? '#FFD166',
              size: 11,
              duration: 0.48,
              vy: -12,
            },
          );
          emitRing(
            bossLayerHit.x,
            bossLayerHit.y,
            bossLayerHit.color ?? state.boss?.accent ?? '#FFD166',
            0.72,
          );
        }

        const rawResult = checkCollision(state);
        // FREEZE obtiene una segunda identidad jugable: mientras está activo,
        // las flechas pueden apilarse en el mismo punto. La hitbox original se
        // sigue detectando exactamente igual; únicamente convertimos esa
        // colisión en un anchor válido durante la ventana de Freeze.
        const freezeStackShot =
          rawResult === 'collision' && isFreezeActive(state);
        const result = freezeStackShot ? 'anchor' : rawResult;

        if (result === 'anchor') {
          const bossImpact = evaluateBossImpact(
            state,
            state.flyingProjectile,
          );

          if (bossImpact.boss && !bossImpact.hit) {
            // El boss bloquea tiros que no atravesaron una pieza activa de la capa.
            // se pierde la flecha, se reinicia el combo y el boss sigue.
            state.flyingProjectile = null;
            resetCombo(state);
            const overload = recordBossBlockedShot(state, 'blocked');
            emitBossBlockedFeedback(state, overload, '¡BLOQUEADO!');

            if (overload?.overloaded) {
              emitBanner(
                '¡SOBRECARGA DEL JEFE!',
                'DEMASIADOS TIROS FALLIDOS',
                { color: '#FF4D4D', priority: 'high', duration: 1.2 },
              );
              enterGameOver(state, 'SOBRECARGA DEL JEFE');
            }
          } else {
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
          const impactDistance = Number.isFinite(ap.renderDistance)
            ? ap.renderDistance
            : ap.distance;
          const impactX =
            ce.x + impactDistance * Math.cos(ap.angle);
          const impactY =
            ce.y + impactDistance * Math.sin(ap.angle);

          const color =
            SERVICE_COLORS[ap.awsIconId] ?? '#FF9900';

          if (freezeStackShot) {
            const freezeColor = POWER_UP_CONFIG.colors.freeze;
            emitFloatingText(
              impactX,
              impactY - 24,
              '¡APILADA!',
              {
                color: freezeColor,
                size: 14,
                duration: 0.52,
                vy: -20,
              },
            );
            emitRing(impactX, impactY, freezeColor, 0.72);
          }

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
              `¡PERFECTO! +${gained}`,
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

          // En niveles normales, acertar también recupera parte del margen
          // de error. Los Boss Levels usan su propio medidor de OVERLOAD.
          if (!state.boss?.active) {
            recoverStability(state, STABILITY_CONFIG.hitRecovery);
          }

          let bossHitResult = null;
          if (state.boss?.active && !state.boss.defeated) {
            bossHitResult = registerBossHit(state, {
              perfect: Boolean(precision?.perfect),
              nodeIndex: bossImpact.nodeIndex,
            });
            emitBossHitFeedback(state, bossHitResult);
          }

          progression = getProgression(
            state.difficulty,
            state.score,
            state.level,
          );

          if (progression.tier > state.lastTier) {
            state.lastTier = progression.tier;

            emitBanner(
              `RANGO ${progression.tier}`,
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

          if (bossHitResult?.defeated) {
            completeBossLevel(state, bossHitResult.result);
          } else if (isLevelComplete(state) && !state.boss?.active) {
            const completed = state.level;
            const bonus = beginLevelComplete(state);

            state.score += bonus;
            updateHighScore(state);
            resetCombo(state);
            recoverStability(state, STABILITY_CONFIG.levelRecovery);

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
              '¡SALVADA DE ESCUDO!',
              'COLISIÓN BLOQUEADA',
              {
                color: shieldColor,
                priority: 'high',
                duration: 1.05,
              },
            );

            emitFloatingText(
              shieldX,
              shieldY - 18,
              '¡SALVADA DE ESCUDO!',
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
          } else if (state.boss?.active && !state.boss.defeated) {
            // En Boss Levels una colisión con otra flecha ya no mata al
            // instante. Se convierte en un error que carga OVERLOAD.
            state.flyingProjectile = null;
            resetCombo(state);

            const overload = recordBossBlockedShot(state, 'collision');
            emitBossBlockedFeedback(state, overload, '¡DESVIADO!');
            emitImpact(
              shieldX,
              shieldY,
              state.boss?.color ?? '#FF6B35',
              16,
              'burst',
            );

            if (overload?.overloaded) {
              emitBanner(
                '¡SOBRECARGA DEL JEFE!',
                'EL JEFE SATURÓ LA ARENA',
                { color: '#FF4D4D', priority: 'high', duration: 1.2 },
              );
              enterGameOver(state, 'SOBRECARGA DEL JEFE');
            }
          } else {
            // Los niveles normales también dan margen de error: una colisión
            // consume STABILITY en vez de matar al jugador al instante.
            state.flyingProjectile = null;
            resetCombo(state);

            const stability = damageStability(
              state,
              STABILITY_CONFIG.collisionLoss,
            );
            emitStabilityCollisionFeedback(state, stability);

            if (stability.depleted) {
              enterGameOver(state, 'SOBRECARGA');
            }
          }
        }
      }

      }
    } else if (state.phase === 'bossintro') {
      updateRotation(state, deltaTime * 0.35, progression);

      if (updateBossIntro(state, deltaTime)) {
        state.phase = 'playing';
        emitBanner(
          state.boss?.name ?? 'JEFE',
          'FASE 1 • ROMPE LA ARMADURA',
          {
            color: state.boss?.color ?? '#FF6B35',
            priority: 'high',
            duration: 1.25,
          },
        );
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

        playSoundTransition();
        if (state.boss?.active) {
          playSoundBossIntro();
        } else {
          emitBanner(
            `NIVEL ${nextLevel}`,
            `${getLevelTarget(nextLevel)} FLECHAS PARA COMPLETAR`,
            { priority: 'high', duration: 1.35 },
          );
        }
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

    // Partículas y textos de impacto pertenecen al mundo 600×700; en móvil
    // vertical siguen el mismo desplazamiento visual que disco/flechas.
    ctx.save();
    ctx.translate(0, sceneOffsetY);
    updateAndDraw(ctx, deltaTime);
    ctx.restore();

    updateAndDrawFeedback(ctx, deltaTime, { sceneOffsetY });
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

