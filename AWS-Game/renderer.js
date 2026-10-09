import { CONFIG, APP_VERSION, APP_CODENAME, APP_NAME } from './config.js?build=v140-close-r5';
import { getLevelTarget, getLevelTheme, LEVEL_COMPLETE_DELAY } from './levels.js';
import {
  POWER_UP_CONFIG,
  POWER_UP_ORDER,
  canActivateStoredPowerUp,
} from './powerups.js?build=v140-close-r5';
import {
  getPowerUpChargeRect,
  getPowerUpSlotRects,
} from './powerupUi.js?build=v140-close-r5';
import { getPowerCorePosition } from './powercore.js';
import {
  BOSS_CONFIG,
  getBossPhase,
  getBossLayerTargets,
  getBossPhaseProgress,
  getBossPhaseBreak,
  getBossOverload,
  isBossPhaseTransitionActive,
} from './boss.js?build=v140-close-r5';
import { getStability } from './stability.js';

/**
 * renderer.js — AWS ORBISHOT
 *
 * Proyectiles: flechas de arco delgadas (punta metálica, astil fino, plumas)
 * con el icono AWS en el centro del astil.
 *
 * CONVENIO DE ÁNGULOS en drawArrow:
 *   En coordenadas locales (antes de rotate), la flecha apunta hacia -Y
 *   (punta en la parte superior). La rotación `angle` gira esa dirección
 *   al destino deseado en el canvas.
 *
 *   - Vuelo: punta en dirección de (vx,vy).
 *     flyAngle = atan2(vy, vx) - PI/2   (resta PI/2 porque local -Y = arriba)
 *
 *   - Anclado: punta apunta HACIA el centro del disco, o sea en la dirección
 *     opuesta a ap.angle (que va del centro al proyectil).
 *     anchorAngle = ap.angle + PI/2    (ap.angle + PI da la dirección hacia
 *     el centro; restar PI/2 convierte a convenio local)
 *     → simplificando: ap.angle - PI/2
 */

const COLOR_BG        = '#232F3E';
const COLOR_DISC_RING = '#FF9900';
const COLOR_DISC_INNER= '#1a2332';

const LOGICAL_WIDTH = CONFIG.CANVAS_WIDTH;
const LOGICAL_HEIGHT = CONFIG.CANVAS_HEIGHT;

function getLogicalCanvasHeight(ctx) {
  return Math.max(
    LOGICAL_HEIGHT,
    Number(ctx?.canvas?.dataset?.logicalHeight) || LOGICAL_HEIGHT,
  );
}

function getSceneOffsetY(ctx) {
  return Math.max(0, Number(ctx?.canvas?.dataset?.sceneOffsetY) || 0);
}

const SERVICE_COLORS = {
  lambda:     '#E8702E',
  s3:         '#569A31',
  ec2:        '#ED7100',
  dynamodb:   '#4053D6',
  sqs:        '#FF4F8B',
  sns:        '#E7157B',
  rds:        '#527FFF',
  cloudwatch: '#E7157B',
};

const SERVICE_LABELS = {
  lambda:     'λ',
  s3:         'S3',
  ec2:        'EC2',
  dynamodb:   'DB',
  sqs:        'SQS',
  sns:        'SNS',
  rds:        'RDS',
  cloudwatch: 'CW',
};

function isImageReady(img) {
  return !!(img && img.complete && img.naturalWidth > 0);
}

// ---------------------------------------------------------------------------
// drawArrow — flecha de arco delgada
//
//  Anatomía (coordenadas locales, Y crece hacia abajo):
//
//       ◆           ← punta metálica    y = -totalLen/2
//       |
//    ───┼───        ← aletas de la punta (arrowhead)
//       |
//       │           ← astil (shaft) delgado
//     [icon]        ← icono AWS en el centro del astil
//       │
//       │
//      ═╪═          ← plumas (nock)     y = +totalLen/2
//
//  El punto de referencia (cx,cy) es el CENTRO GEOMÉTRICO de la flecha.
// ---------------------------------------------------------------------------
function drawArrow(ctx, cx, cy, radius, angle, awsIconId, assets) {
  // Proporciones de la flecha (todas relativas al radius del proyectil)
  const totalLen   = radius * 4.2;   // longitud total de la flecha
  const half       = totalLen / 2;   // desde el centro hasta cada extremo

  const tipLen     = radius * 0.9;   // longitud de la punta metálica desde el apex
  const headW      = radius * 0.38;  // semi-ancho de las aletas
  const headBase   = radius * 0.55;  // distancia desde apex hasta la base de aletas

  const shaftW     = radius * 0.13;  // semi-ancho del astil (muy delgado)

  const nockW      = radius * 0.55;  // semi-ancho de las plumas
  const nockH      = radius * 0.7;   // altura del bloque de plumas

  const iconR      = radius * 0.7;   // radio del círculo de icono

  const color      = SERVICE_COLORS[awsIconId] ?? '#888888';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Sombra global
  ctx.shadowColor    = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur     = 5;
  ctx.shadowOffsetX  = 1.5;
  ctx.shadowOffsetY  = 1.5;

  // ── Astil (shaft) ──────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.rect(-shaftW, -half, shaftW * 2, totalLen);
  ctx.fillStyle = '#C8A96E';   // madera clara
  ctx.fill();

  // veta de madera
  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(0, half);
  ctx.strokeStyle = 'rgba(120,80,30,0.4)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // ── Punta metálica (arrowhead) ─────────────────────────────────────────────
  // apex en -half, base en (-half + tipLen)
  const apexY    = -half;
  const baseY    = apexY + tipLen;
  const headBaseY= apexY + headBase;

  ctx.beginPath();
  ctx.moveTo(0, apexY);                   // apex (punta)
  ctx.lineTo(-headW, headBaseY);          // aleta izquierda
  ctx.lineTo(-shaftW, baseY);             // unión izquierda con astil
  ctx.lineTo(shaftW, baseY);              // unión derecha
  ctx.lineTo(headW, headBaseY);           // aleta derecha
  ctx.closePath();
  ctx.fillStyle = '#C0C8D0';             // metal grisáceo
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Brillo punta
  ctx.beginPath();
  ctx.moveTo(0, apexY);
  ctx.lineTo(-shaftW * 0.4, headBaseY * 0.6 + apexY * 0.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // ── Plumas / nock ──────────────────────────────────────────────────────────
  const nockTop = half - nockH;

  // Pluma izquierda
  ctx.beginPath();
  ctx.moveTo(-shaftW, nockTop);
  ctx.lineTo(-nockW, half - nockH * 0.2);
  ctx.lineTo(-shaftW, half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.fill();

  // Pluma derecha
  ctx.beginPath();
  ctx.moveTo(shaftW, nockTop);
  ctx.lineTo(nockW, half - nockH * 0.2);
  ctx.lineTo(shaftW, half);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;

  // ── Icono AWS centrado en el astil ────────────────────────────────────────
  // El icono está en el centro geométrico (y=0 en coords locales)
  const iconY = 0;

  // Fondo circular del icono
  ctx.beginPath();
  ctx.arc(0, iconY, iconR, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const img = assets?.[awsIconId];
  if (isImageReady(img)) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, iconY, iconR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -iconR, iconY - iconR, iconR * 2, iconR * 2);
    ctx.restore();
  } else {
    const label    = SERVICE_LABELS[awsIconId] ?? awsIconId.slice(0,3).toUpperCase();
    const fontSize = Math.max(8, Math.floor(iconR * 0.9));
    ctx.fillStyle    = '#FFFFFF';
    ctx.font         = `bold ${fontSize}px "Amazon Ember", Arial, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, iconY);
  }

  ctx.restore();
}


// ---------------------------------------------------------------------------
// drawTierIndicator — fila de estrellas que indica el tier de progresión
// ---------------------------------------------------------------------------
function drawTierIndicator(ctx, canvasW, tier) {
  const compact   = getCanvasLayout(ctx) === 'compact';
  const maxTier   = 5;
  const starSize  = compact ? 11 : 10;
  const gap       = compact ? 7 : 6;
  const totalW    = maxTier * starSize * 2 + (maxTier - 1) * gap;
  const startX    = (canvasW - totalW) / 2 + starSize;
  const y         = 108;  // debajo del HUD con logo

  for (let i = 0; i < maxTier; i++) {
    const cx = startX + i * (starSize * 2 + gap);
    const filled = i < tier;
    ctx.save();
    ctx.translate(cx, y);
    drawStar(ctx, 0, 0, starSize, starSize * 0.45, 5, filled);
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, outerR, innerR, points, filled) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r   = i % 2 === 0 ? outerR : innerR;
    const a   = (i * Math.PI) / points - Math.PI / 2;
    const x   = cx + r * Math.cos(a);
    const y_  = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y_) : ctx.lineTo(x, y_);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle   = '#FF9900';
    ctx.shadowColor = '#FF9900';
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.strokeStyle = 'rgba(255,153,0,0.3)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
}
// ---------------------------------------------------------------------------
// HUD — score, récord, dificultad y acceso a configuración
// Todo se dibuja dentro del canvas para que escale junto con el juego.
// ---------------------------------------------------------------------------
function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawHudValue(ctx, label, value, x, align = 'left') {
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,153,0,.88)';
  ctx.fillText(label, x, 29);

  ctx.font = 'bold 25px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(value), x, 49);
}

function drawSettingsIcon(ctx, canvasW) {
  const x = canvasW - 45;
  const y = 42;
  const r = 17;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Icono tipo "sliders" para no depender de que la fuente tenga ⚙.
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const ys = [36, 42, 48];
  const knobs = [x + 4, x - 5, x + 2];
  for (let i = 0; i < ys.length; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 8, ys[i]);
    ctx.lineTo(x + 8, ys[i]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(knobs[i], ys[i], 2.1, 0, Math.PI * 2);
    ctx.fillStyle = '#FF9900';
    ctx.fill();
  }
  ctx.restore();
}

function drawHUD(ctx, state, progression, canvasW, assets) {
  ctx.save();

  roundedRectPath(ctx, 18, 10, canvasW - 36, 78, 12);
  ctx.fillStyle = 'rgba(13,17,23,.46)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.20)';
  ctx.lineWidth = 1;
  ctx.stroke();

  drawHudValue(ctx, 'PUNTAJE', state.score, 34, 'left');
  drawHudValue(ctx, 'RÉCORD', state.highScore, canvasW - 78, 'right');

  const logo = assets?.brandLogo;
  if (isImageReady(logo)) {
    const maxW = 92;
    const maxH = 48;
    const ratio = logo.naturalWidth / logo.naturalHeight;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }

    ctx.save();
    ctx.shadowColor = 'rgba(54,197,240,.28)';
    ctx.shadowBlur = 7;
    ctx.drawImage(
      logo,
      canvasW / 2 - w / 2,
      13,
      w,
      h,
    );
    ctx.restore();
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(APP_NAME, canvasW / 2, 31);
  }

  const difficulty = ({ easy: 'FÁCIL', medium: 'MEDIO', hard: 'DIFÍCIL' }[state.difficulty] ?? 'MEDIO');
  const tier = progression?.tier ?? 1;
  const level = Math.max(1, state.level ?? 1);
  const badgeText = `${difficulty}  •  NV ${level}  •  RANGO ${tier}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const compact = getCanvasLayout(ctx) === 'compact';
  ctx.font = `bold ${compact ? 10 : 8}px "Amazon Ember", Arial, sans-serif`;
  const tw = ctx.measureText(badgeText).width;
  roundedRectPath(ctx, canvasW / 2 - tw / 2 - 8, 66, tw + 16, 16, 8);
  ctx.fillStyle = 'rgba(255,153,0,.13)';
  ctx.fill();
  ctx.fillStyle = '#FFB24D';
  ctx.fillText(badgeText, canvasW / 2, 74);

  drawSettingsIcon(ctx, canvasW);
  ctx.restore();
}

function drawLevelProgress(ctx, state, canvasW) {
  if (state.boss?.active) return;

  const level = Math.max(1, state.level ?? 1);
  const target = getLevelTarget(level);
  const hits = Math.min(target, Math.max(0, state.levelHits ?? 0));
  const ratio = target > 0 ? hits / target : 0;
  const theme = getLevelTheme(level);

  const compact = getCanvasLayout(ctx) === 'compact';
  const barW = compact ? 220 : 190;
  const barH = compact ? 9 : 8;
  const x = (canvasW - barW) / 2;
  const y = compact ? 148 : 145;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${compact ? 11 : 9}px "Amazon Ember", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.68)';
  ctx.fillText(`NIVEL ${level}  •  ${hits}/${target} FLECHAS`, canvasW / 2, y - 13);

  roundedRectPath(ctx, x, y, barW, barH, barH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fill();

  if (ratio > 0) {
    roundedRectPath(ctx, x, y, Math.max(barH, barW * ratio), barH, barH / 2);
    ctx.fillStyle = theme.ring;
    ctx.shadowColor = theme.ring;
    ctx.shadowBlur = 7;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawStability(ctx, state, canvasW) {
  if (state.boss?.active || state.phase === 'bossintro') return;

  // Se mantiene internamente el valor de STABILITY por compatibilidad, pero
  // al jugador se le presenta como OVERLOAD: empieza en 0%, sube con errores
  // y al llegar a 100% termina la partida. Es el mismo lenguaje visual de los
  // Boss Levels y evita tener dos medidores que se comportan al revés.
  const stability = getStability(state);
  const overloadValue = Math.max(0, stability.max - stability.value);
  const ratio = stability.max > 0 ? overloadValue / stability.max : 0;
  const compact = getCanvasLayout(ctx) === 'compact';
  const barW = compact ? 180 : 128;
  const barH = compact ? 7 : 5;
  const x = (canvasW - barW) / 2;
  const y = compact ? 178 : 166;
  const color = ratio >= 0.75
    ? '#FF4D4D'
    : ratio >= 0.4
      ? '#FFD166'
      : '#72C66B';

  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${compact ? 9 : 7}px "Amazon Ember", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.56)';
  ctx.textAlign = 'left';
  ctx.fillText('SOBRECARGA', x, y - (compact ? 10 : 7));
  ctx.textAlign = 'right';
  ctx.fillStyle = color;
  ctx.fillText(`${Math.round(overloadValue)}%`, x + barW, y - (compact ? 10 : 7));

  roundedRectPath(ctx, x, y, barW, barH, barH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fill();

  if (ratio > 0) {
    roundedRectPath(
      ctx,
      x,
      y,
      Math.max(barH, barW * ratio),
      barH,
      barH / 2,
    );
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = ratio >= 0.75 ? 8 : 4;
    ctx.fill();
  }

  ctx.restore();
}

function getActiveStatus(state, type) {
  const active = state.activePowerUps ?? {};

  switch (type) {
    case 'freeze': {
      const timer = Number(active.freezeTimer);
      return timer > 0 ? `${timer.toFixed(1)}s` : '';
    }

    case 'shield':
      return Number(active.shieldCharges) > 0
        ? 'ARMADO'
        : '';

    case 'double': {
      const hits = Math.max(
        0,
        Math.floor(Number(active.doubleScoreHits) || 0),
      );
      return hits > 0 ? `${hits} GOLPES` : '';
    }

    default:
      return '';
  }
}

function getCanvasLayout(ctx) {
  return ctx.canvas.dataset.layout === 'compact' ? 'compact' : 'desktop';
}

function getCompactActionHint(state) {
  if (state.boss?.active && !state.boss.defeated) {
    const phase = getBossPhase(state);
    return state.powerCore?.active
      ? `${phase?.label ?? 'CAPA'} • NÚCLEO = RECOGER`
      : `${phase?.label ?? 'CAPA'} • FALLOS = SOBRECARGA`;
  }

  if (state.powerCore?.active) {
    return 'CRUZA EL NÚCLEO • Y ANCLA';
  }

  if (Number(state.activePowerUps?.freezeTimer) > 0) {
    return 'CONGELAR • DISPAROS APILADOS';
  }

  return 'TOCA / ESPACIO PARA DISPARAR';
}

function drawPowerUpDock(ctx, state, canvasW, canvasH) {
  if (state.phase !== 'playing') return;

  const layout = getCanvasLayout(ctx);
  const compact = layout === 'compact';
  const slots = getPowerUpSlotRects(canvasW, layout, canvasH);
  const inventory = state.powerUpInventory ?? {};
  const chargeRect = getPowerUpChargeRect(canvasW, layout, canvasH);
  const hovered = state.hoveredPowerUpSlot ?? null;

  ctx.save();
  ctx.textBaseline = 'middle';

  if (!compact) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.52)';
    ctx.fillText(
      'POTENCIADORES • CLIC / 1–4',
      slots[0].x + slots[0].width / 2,
      slots[0].y - 13,
    );
  }

  for (const slot of slots) {
    const type = slot.type;
    const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
    const label = POWER_UP_CONFIG.labels[type] ?? 'PU';
    const name = POWER_UP_CONFIG.names[type] ?? type.toUpperCase();
    const shortcut = POWER_UP_CONFIG.shortcuts[type] ?? '?';
    const count = Math.max(0, Math.floor(Number(inventory[type]) || 0));
    const status = getActiveStatus(state, type);
    const activatable = canActivateStoredPowerUp(state, type);
    const occupied = count > 0 || Boolean(status);
    const isHovered = hovered === type;

    ctx.save();
    ctx.globalAlpha = occupied ? 1 : 0.58;

    if (compact) {
      const cx = slot.cx;
      const cy = slot.cy;
      const radius = slot.radius;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 260);

      // Ornamento exterior: conserva el look futurista, pero en arcos
      // separados para que se lea como decoración y no como un segundo botón.
      if (activatable || isHovered || status) {
        const ornamentR = radius + 6;
        const arcOffset = Date.now() / 1800;
        ctx.strokeStyle = `${color}${activatable ? '7A' : '48'}`;
        ctx.lineWidth = activatable ? 2.6 : 1.8;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = activatable ? 11 + pulse * 5 : 7;

        for (let i = 0; i < 3; i++) {
          const start = arcOffset + i * (Math.PI * 2 / 3);
          ctx.beginPath();
          ctx.arc(cx, cy, ornamentR, start, start + 0.72);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Tres pequeños nodos orbitantes rematan el adorno sin duplicar la
        // silueta circular principal.
        ctx.fillStyle = `${color}${activatable ? 'B8' : '70'}`;
        for (let i = 0; i < 3; i++) {
          const a = arcOffset + i * (Math.PI * 2 / 3) + 0.84;
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(a) * ornamentR,
            cy + Math.sin(a) * ornamentR,
            1.7,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      const gradient = ctx.createRadialGradient(
        cx - radius * 0.30,
        cy - radius * 0.35,
        radius * 0.12,
        cx,
        cy,
        radius,
      );
      gradient.addColorStop(0, activatable ? `${color}24` : 'rgba(31,42,56,.98)');
      gradient.addColorStop(0.58, 'rgba(17,24,34,.985)');
      gradient.addColorStop(1, 'rgba(9,14,21,.995)');

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = occupied ? color : 'rgba(255,255,255,.18)';
      ctx.lineWidth = activatable || isHovered ? 2.6 : 1.5;
      ctx.stroke();

      // Aro interno para mejorar lectura del botón sobre fondos complejos.
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = occupied ? `${color}35` : 'rgba(255,255,255,.055)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Número de atajo: pequeña burbuja arriba a la izquierda.
      const badgeR = 9;
      const shortcutX = cx - radius * 0.66;
      const badgeY = cy - radius * 0.66;
      ctx.beginPath();
      ctx.arc(shortcutX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? color : 'rgba(255,255,255,.13)';
      ctx.fill();
      ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = occupied ? '#0D1117' : 'rgba(255,255,255,.50)';
      ctx.fillText(shortcut, shortcutX, badgeY + 0.5);

      // Cantidad disponible: burbuja opuesta, siempre contenida en el círculo.
      const countX = cx + radius * 0.66;
      ctx.beginPath();
      ctx.arc(countX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = count > 0 ? `${color}33` : 'rgba(255,255,255,.07)';
      ctx.fill();
      ctx.strokeStyle = count > 0 ? `${color}AA` : 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = count > 0 ? '#FFFFFF' : 'rgba(255,255,255,.32)';
      ctx.fillText(`×${count}`, countX, badgeY + 0.5);

      // Centro: sigla grande y un único estado corto. En móvil no repetimos
      // nombres largos para evitar texto amontonado.
      ctx.font = 'bold 16px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = occupied ? color : 'rgba(255,255,255,.44)';
      ctx.fillText(label, cx, cy - 3);

      let mobileStatus = status;
      if (!mobileStatus) {
        mobileStatus = count > 0 ? 'LISTO' : 'VACÍO';
      }
      ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = status
        ? color
        : count > 0
          ? 'rgba(255,255,255,.72)'
          : 'rgba(255,255,255,.30)';
      ctx.fillText(mobileStatus, cx, cy + 15);
    } else {
      roundedRectPath(ctx, slot.x, slot.y, slot.width, slot.height, 12);
      ctx.fillStyle = activatable
        ? 'rgba(13,17,23,.985)'
        : isHovered
          ? 'rgba(13,17,23,.96)'
          : 'rgba(13,17,23,.92)';
      ctx.fill();

      ctx.strokeStyle = occupied ? color : 'rgba(255,255,255,.14)';
      ctx.lineWidth = activatable || isHovered ? 2.1 : 1.1;
      ctx.shadowColor = color;
      ctx.shadowBlur = activatable || isHovered ? 10 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(slot.x + 18, slot.y + 19, 11, 0, Math.PI * 2);
      ctx.fillStyle = occupied ? `${color}D0` : 'rgba(255,255,255,.08)';
      ctx.fill();

      ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = '#0E1824';
      ctx.textAlign = 'center';
      ctx.fillText(shortcut, slot.x + 18, slot.y + 19.5);

      ctx.textAlign = 'left';
      ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = occupied ? color : 'rgba(255,255,255,.52)';
      ctx.fillText(label, slot.x + 35, slot.y + 16);

      ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = occupied ? '#FFFFFF' : 'rgba(255,255,255,.46)';
      ctx.fillText(name, slot.x + 35, slot.y + 29);

      let subtitle = status;
      if (!subtitle && count > 0) {
        subtitle =
          type === 'cleanup' && !(state.anchoredProjectiles?.length > 0)
            ? 'ESPERA OBJETIVO'
             : 'LISTO';
      }
      if (!subtitle) subtitle = 'VACÍO';

      ctx.font = 'bold 8px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = status ? color : 'rgba(255,255,255,.54)';
      ctx.fillText(subtitle, slot.x + 35, slot.y + 43);

      const badgeW = 26;
      const badgeH = 18;
      const badgeX = slot.x + slot.width - badgeW - 7;
      const badgeY = slot.y + 8;

      roundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 9);
      ctx.fillStyle = count > 0 ? `${color}26` : 'rgba(255,255,255,.06)';
      ctx.fill();
      ctx.strokeStyle = count > 0 ? `${color}AA` : 'rgba(255,255,255,.10)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = count > 0 ? '#FFFFFF' : 'rgba(255,255,255,.35)';
      ctx.fillText(`×${count}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    }

    ctx.restore();
  }

  const charge = Math.min(
    POWER_UP_CONFIG.chargeMax,
    Math.max(0, Number(state.powerUpCharge) || 0),
  );
  const ratio = charge / POWER_UP_CONFIG.chargeMax;
  const coreActive = Boolean(state.powerCore?.active);
  const coreType = state.powerCore?.currentType;
  const coreColor = coreType
    ? POWER_UP_CONFIG.colors[coreType] ?? '#FF9900'
    : '#FF9900';

  roundedRectPath(
    ctx,
    chargeRect.x,
    chargeRect.y,
    chargeRect.width,
    chargeRect.height,
    compact ? 15 : 12,
  );
  ctx.fillStyle = compact ? 'rgba(9,14,21,.985)' : 'rgba(13,17,23,.94)';
  ctx.fill();
  ctx.strokeStyle = coreActive ? `${coreColor}AA` : 'rgba(255,153,0,.34)';
  ctx.lineWidth = compact ? 1.5 : 1.2;
  ctx.stroke();

  if (compact) {
    // HUD móvil: texto arriba y barra abajo. Nunca dibujamos texto encima de
    // la pista vacía para evitar recortes del tipo "FRZ ACTIVE".
    const pad = 12;
    const topY = chargeRect.y + 10;
    const hintY = chargeRect.y + 22;
    const barX = chargeRect.x + pad;
    const barW = chargeRect.width - pad * 2;
    const barY = chargeRect.y + chargeRect.height - 12;
    const barH = 7;
    const shortType = POWER_UP_CONFIG.labels[coreType] ?? 'PU';

    ctx.save();
    roundedRectPath(ctx, chargeRect.x + 2, chargeRect.y + 2, chargeRect.width - 4, chargeRect.height - 4, 12);
    ctx.clip();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = coreActive ? coreColor : '#FFB24D';
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel ? 'PODER BLOQUEADO' : coreActive ? 'NÚCLEO ACTIVO' : 'PODER',
      chargeRect.x + pad,
      topY,
    );

    ctx.textAlign = 'right';
    ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = coreActive ? coreColor : 'rgba(255,255,255,.78)';
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? `LV ${POWER_UP_CONFIG.minLevel}`
        : coreActive
          ? shortType
          : `${Math.round(charge)}%`,
      chargeRect.x + chargeRect.width - pad,
      topY,
    );

    // La instrucción contextual vive DENTRO del panel, entre etiqueta y barra.
    // Así nunca compite con el borde inferior del canvas ni queda bajo la pista.
    ctx.textAlign = 'center';
    ctx.font = 'bold 7.5px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = coreActive ? `${coreColor}C8` : 'rgba(255,255,255,.52)';
    ctx.fillText(
      getCompactActionHint(state),
      chargeRect.x + chargeRect.width / 2,
      hintY,
    );

    roundedRectPath(ctx, barX, barY, barW, barH, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,.09)';
    ctx.fill();
    if (ratio > 0) {
      roundedRectPath(ctx, barX, barY, Math.max(barH, barW * ratio), barH, 3.5);
      ctx.fillStyle = coreActive ? coreColor : '#FF9900';
      ctx.shadowColor = coreActive ? coreColor : '#FF9900';
      ctx.shadowBlur = ratio >= 1 || coreActive ? 8 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  } else {
    ctx.textAlign = 'left';
    ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = '#FFB24D';
    ctx.fillText('CARGA DE PODER', chargeRect.x + 9, chargeRect.y + 15);

    ctx.textAlign = 'right';
    ctx.font = 'bold 8px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.66)';
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? `LV ${POWER_UP_CONFIG.minLevel}`
        : `${Math.round(charge)}%`,
      chargeRect.x + chargeRect.width - 9,
      chargeRect.y + 15,
    );

    const barX = chargeRect.x + 9;
    const barY = chargeRect.y + 26;
    const barW = chargeRect.width - 18;
    const barH = 10;

    roundedRectPath(ctx, barX, barY, barW, barH, 5);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fill();
    if (ratio > 0) {
      roundedRectPath(ctx, barX, barY, Math.max(barH, barW * ratio), barH, 5);
      ctx.fillStyle = '#FF9900';
      ctx.shadowColor = '#FF9900';
      ctx.shadowBlur = ratio >= 1 ? 10 : 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
    ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = coreActive ? coreColor : 'rgba(255,255,255,.54)';
    ctx.save();
    roundedRectPath(ctx, chargeRect.x + 7, chargeRect.y + 38, chargeRect.width - 14, 13, 5);
    ctx.clip();
    ctx.fillText(
      state.level < POWER_UP_CONFIG.minLevel
        ? 'BLOQUEADO'
        : coreActive
          ? `${POWER_UP_CONFIG.labels[coreType] ?? 'PU'} ACTIVO`
          : charge >= POWER_UP_CONFIG.chargeMax
            ? 'ESPERANDO ESPACIO'
            : 'JUEGA BIEN PARA CARGAR',
      chargeRect.x + 9,
      chargeRect.y + 46,
    );
    ctx.restore();
  }

  ctx.restore();
}

function drawComboBadge(ctx, state) {
  const combo = state.comboLevel ?? 1;
  if (combo <= 1 || state.phase !== 'playing') return;

  const text = `COMBO ×${combo}`;
  const x = 22;
  const y = 104;

  ctx.save();
  ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';

  const tw = ctx.measureText(text).width;
  const w = Math.max(84, tw + 22);

  roundedRectPath(ctx, x, y, w, 24, 12);
  ctx.fillStyle = 'rgba(255,153,0,.13)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.48)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFB24D';
  ctx.fillText(text, x + w / 2, y + 12.5);

  ctx.restore();
}

function drawBottomHint(ctx, state, canvasW, canvasH) {
  if (state.phase !== 'playing' || state.flyingProjectile) return;

  const compact = getCanvasLayout(ctx) === 'compact';
  if (compact) return; // En móvil la ayuda ya vive dentro del panel Power/Core.
  let text = compact
    ? 'TOCA / ESPACIO PARA DISPARAR'
    : 'CLIC/ESPACIO: DISPARAR  •  POTENCIADORES: CLIC O 1–4';
  let fill = 'rgba(255,255,255,.43)';

  if (state.boss?.active && !state.boss.defeated) {
    const phase = getBossPhase(state);
    const bossCoreReady = Boolean(state.powerCore?.active);
    text = compact
      ? bossCoreReady
        ? `ROMPE ${phase?.label ?? 'CAPA'} • NÚCLEO = DISPARO DE RECOGIDA`
        : `ROMPE ${phase?.label ?? 'CAPA'} • FALLOS = SOBRECARGA`
      : bossCoreReady
        ? `JEFE: ROMPE ${phase?.label ?? 'CAPA'} • NÚCLEO DE PODER = RECOGIDA INSTANTÁNEA • POTENCIADORES 1–4`
        : `JEFE: ROMPE ${phase?.label ?? 'CAPA'} • LOS FALLOS CARGAN SOBRECARGA • POTENCIADORES 1–4`;
    fill = state.boss.accent ?? '#FFD166';
  } else if (state.powerCore?.active) {
    text = compact
      ? 'CRUZA EL NÚCLEO DE PODER • Y ANCLA'
      : 'NÚCLEO DE PODER: ATRAVIÉSALO Y ANCLA  •  POTENCIADORES: CLIC O 1–4';
    fill = 'rgba(255,184,77,.72)';
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${compact ? 11 : 11}px "Amazon Ember", Arial, sans-serif`;
  ctx.fillStyle = fill;
  ctx.fillText(text, canvasW / 2, canvasH - 22);
  ctx.restore();
}

function drawVersion(ctx, canvasW, canvasH) {
  const compact = getCanvasLayout(ctx) === 'compact';
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `${compact ? 7.5 : 9}px "Amazon Ember", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.28)';

  if (compact) {
    ctx.textAlign = 'center';
    ctx.fillText(`v${APP_VERSION} - ${APP_CODENAME}`, canvasW / 2, canvasH - 8);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(`v${APP_VERSION} - ${APP_CODENAME}`, 12, canvasH - 14);
  }
  ctx.restore();
}

export function drawGameOverFlash(ctx, flashTimer) {
  if (!(flashTimer > 0)) return;
  const alpha = Math.min(0.22, flashTimer * 0.88);
  ctx.save();
  ctx.fillStyle = `rgba(255,70,70,${alpha})`;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, getLogicalCanvasHeight(ctx));
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Power Core — recompensa orbitante que debe atravesarse con un tiro válido.
// ---------------------------------------------------------------------------
function drawPowerCore(ctx, state) {
  const position = getPowerCorePosition(state);
  if (!position) return;

  const type = position.type;
  const color = POWER_UP_CONFIG.colors[type] ?? '#FFFFFF';
  const label = POWER_UP_CONFIG.labels[type] ?? 'PU';
  const name = POWER_UP_CONFIG.names[type] ?? 'POWER';
  const pulse = state.powerCore?.pulse ?? 0;
  const pulseScale = 1 + Math.sin(pulse * 7) * 0.08;

  ctx.save();

  // Órbita guía tenue.
  ctx.beginPath();
  ctx.arc(
    state.centralElement.x,
    state.centralElement.y,
    position.orbitRadius,
    0,
    Math.PI * 2,
  );
  ctx.setLineDash([5, 8]);
  ctx.strokeStyle = `${color}${position.bossPickupMode ? '48' : '28'}`;
  ctx.lineWidth = position.bossPickupMode ? 1.5 : 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // Halo exterior.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    (position.radius + 8) * pulseScale,
    0,
    Math.PI * 2,
  );
  ctx.strokeStyle = `${color}70`;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Núcleo.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    position.radius * pulseScale,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = 'rgba(13,17,23,.94)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Punto energético central.
  ctx.beginPath();
  ctx.arc(
    position.x,
    position.y,
    Math.max(4, position.radius * 0.35),
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = color;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 8px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(
    label,
    position.x,
    position.y + position.radius + 13,
  );

  ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(
    position.bossPickupMode ? `${name} • PICKUP` : name,
    position.x,
    position.y + position.radius + 23,
  );

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Bosses — siluetas distintas con hitbox física circular sin modificar.
// ---------------------------------------------------------------------------
function drawRegularPolygonPath(ctx, sides, radius, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBossStarPath(ctx, radius, innerRadius, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : innerRadius;
    const a = rotation + (Math.PI * i) / 5 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBossProgress(ctx, state, canvasW) {
  const boss = state.boss;
  if (!boss?.active) return;

  const phase = getBossPhase(state);
  const progress = getBossPhaseProgress(state);
  const max = Math.max(1, boss.maxHealth || 1);
  const healthRatio = Math.max(0, Math.min(1, (boss.health ?? max) / max));
  const barW = 220;
  const barH = 9;
  const x = (canvasW - barW) / 2;
  const y = 145;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.accent ?? '#FFD166';
  ctx.fillText(
    `${boss.name} • CAPA ${boss.phaseIndex + 1}/3 • ${phase?.label ?? 'FASE'} ${progress.hits}/${progress.target}`,
    canvasW / 2,
    y - 13,
  );

  roundedRectPath(ctx, x, y, barW, barH, barH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.fill();

  if (healthRatio > 0) {
    roundedRectPath(ctx, x, y, Math.max(barH, barW * healthRatio), barH, barH / 2);
    ctx.fillStyle = boss.color ?? '#FF6B35';
    ctx.shadowColor = boss.color ?? '#FF6B35';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Condición de derrota propia de los bosses. Los errores cargan OVERLOAD
  // en vez de provocar un Game Over instantáneo por tocar una flecha vieja.
  const overload = getBossOverload(state);
  const overloadY = y + 24;
  const overloadH = 5;
  const overloadColor = overload.ratio >= 0.75
    ? '#FF4D4D'
    : overload.ratio >= 0.5
      ? '#FF6B35'
      : '#FFB24D';

  ctx.font = 'bold 7px "Amazon Ember", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,.50)';
  ctx.fillText('SOBRECARGA', x, overloadY - 6);
  ctx.textAlign = 'right';
  ctx.fillStyle = overloadColor;
  ctx.fillText(`${Math.round(overload.value)}%`, x + barW, overloadY - 6);

  roundedRectPath(ctx, x, overloadY, barW, overloadH, overloadH / 2);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fill();

  if (overload.ratio > 0) {
    roundedRectPath(
      ctx,
      x,
      overloadY,
      Math.max(overloadH, barW * overload.ratio),
      overloadH,
      overloadH / 2,
    );
    ctx.fillStyle = overloadColor;
    ctx.shadowColor = overloadColor;
    ctx.shadowBlur = overload.ratio >= 0.75 ? 8 : 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function traceBossShape(ctx, shape, radius, rotation = 0) {
  if (shape === 'triangle') {
    drawRegularPolygonPath(ctx, 3, radius, rotation);
  } else if (shape === 'square') {
    drawRegularPolygonPath(ctx, 4, radius, rotation + Math.PI / 4);
  } else if (shape === 'pentagon') {
    drawRegularPolygonPath(ctx, 5, radius, rotation);
  } else if (shape === 'hexagon') {
    drawRegularPolygonPath(ctx, 6, radius, rotation + Math.PI / 6);
  } else if (shape === 'star') {
    drawBossStarPath(ctx, radius, radius * 0.48, rotation);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  }
}

function drawBossLayerTarget(ctx, target, boss, phase, index) {
  const pulse = 1 + Math.sin(performance.now() / 150 + index * 0.8) * 0.07;
  const size = target.radius * pulse;

  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.rotate(
    (boss.bodyAngle ?? 0) * (index % 2 === 0 ? 1 : -1) +
    performance.now() / 1800,
  );

  ctx.shadowColor = boss.accent;
  ctx.shadowBlur = phase.id === 'core' ? 20 : 12;

  if (phase.id === 'core') {
    ctx.beginPath();
    ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
    ctx.fillStyle = `${boss.accent}20`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = `${boss.accent}66`;
    ctx.fill();
    ctx.strokeStyle = boss.accent;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, Math.max(5, size * 0.36), 0, Math.PI * 2);
    ctx.fillStyle = boss.accent;
    ctx.fill();
  } else {
    traceBossShape(ctx, boss.shape, size, 0);
    ctx.fillStyle = 'rgba(13,17,23,.90)';
    ctx.fill();
    ctx.strokeStyle = boss.accent;
    ctx.lineWidth = phase.id === 'armor' ? 2.8 : 2.3;
    ctx.stroke();

    traceBossShape(ctx, boss.shape, size * 0.44, Math.PI / 9);
    ctx.fillStyle = `${boss.color}8A`;
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function getBossSurfaceScale(phase) {
  if (phase?.id === 'armor') return 1;
  if (phase?.id === 'exposed') return 0.78;
  return 0.60;
}

function drawBoss(ctx, state, progression) {
  const boss = state.boss;
  const ce = state.centralElement;
  if (!boss?.active) return;

  const phase = getBossPhase(state);
  const targets = getBossLayerTargets(state);
  const tier = progression?.tier ?? 1;
  const r = ce.radius;

  ctx.save();

  if (isBossPhaseTransitionActive(state)) {
    const fx = getBossPhaseBreak(state);
    const duration = Math.max(0.001, Number(fx?.duration) || BOSS_CONFIG.phaseTransitionDuration);
    const reveal = 1 - Math.max(0, Math.min(1, Number(fx?.timer) / duration));
    ctx.globalAlpha = 0.18 + 0.82 * Math.min(1, reveal * 1.55);
  }

  // Órbita guía de la capa activa. ARMOR y EXPOSED giran alrededor del boss.
  if (phase?.id !== 'core' && targets.length) {
    const orbitRadius = targets[0].orbitRadius ?? r * 1.4;
    ctx.beginPath();
    ctx.arc(ce.x, ce.y, orbitRadius, 0, Math.PI * 2);
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = `${boss.accent}28`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    for (const target of targets) {
      ctx.beginPath();
      ctx.moveTo(ce.x, ce.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `${boss.color}12`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Cuerpo central: se "desviste" conforme desaparecen las capas.
  ctx.translate(ce.x, ce.y);
  ctx.rotate(boss.bodyAngle ?? ce.angle * 0.5);

  // La superficie oscura visible también se rompe por capas. La hitbox física
  // NO cambia: collision.js conserva exactamente el radio histórico.
  const surfaceR = r * getBossSurfaceScale(phase);
  ctx.beginPath();
  ctx.arc(0, 0, surfaceR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,15,24,.94)';
  ctx.fill();
  ctx.strokeStyle = `${boss.color}38`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const bodyScale = phase?.id === 'armor'
    ? 0.86
    : phase?.id === 'exposed'
      ? 0.69
      : 0.52;
  const bodyR = r * bodyScale;

  traceBossShape(ctx, boss.shape, bodyR, 0);
  ctx.fillStyle = phase?.id === 'core'
    ? 'rgba(10,15,24,.52)'
    : `${boss.color}${phase?.id === 'armor' ? '26' : '18'}`;
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = phase?.id === 'armor' ? 4 : phase?.id === 'exposed' ? 3 : 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 7 + tier * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (phase?.id === 'armor') {
    // Armadura exterior: dos bordes que desaparecen por completo en fase 2.
    traceBossShape(ctx, boss.shape, r * 0.95, Math.PI / 18);
    ctx.strokeStyle = `${boss.accent}80`;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (phase?.id === 'exposed') {
    // Segunda capa: reactor intermedio, visualmente más desnudo.
    traceBossShape(ctx, boss.shape, r * 0.58, -Math.PI / 12);
    ctx.strokeStyle = `${boss.accent}8A`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Core: las capas externas ya no existen; solo quedan anillos internos.
    const aliveCoreLayers = Math.max(0, targets.length);
    for (let i = 0; i < aliveCoreLayers; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.34 - i * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = boss.accent;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.shadowColor = boss.accent;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  // Mini-piezas orbitantes / núcleo. Cada una ES el objetivo, no un marcador.
  targets.forEach((target, index) => {
    drawBossLayerTarget(ctx, target, boss, phase, index);
  });

  if (boss.warning) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = '#FFD166';
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = 8;
    ctx.fillText('⚠ INVERSIÓN DEL CUERPO', ce.x, ce.y - r - 36);
    ctx.restore();
  }

  if ((boss.phaseTransitionTimer ?? 0) > 0) {
    const alpha = Math.min(1, boss.phaseTransitionTimer * 2.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
    ctx.fillStyle = boss.accent;
    ctx.fillText(
      phase?.id === 'core' ? 'NÚCLEO EXPUESTO' : 'SIGUIENTE CAPA REVELADA',
      ce.x,
      ce.y + r + 30,
    );
    ctx.restore();
  }
}



function drawEmbeddedArrowMasks(ctx, state, progression) {
  const boss = state?.boss;
  const ce = state?.centralElement;
  if (!boss?.active || !Array.isArray(state?.anchoredProjectiles) || state.anchoredProjectiles.length === 0 || !ce) return;

  const phase = getBossPhase(state);
  const tier = progression?.tier ?? 1;
  const r = ce.radius;

  ctx.save();
  ctx.translate(ce.x, ce.y);
  ctx.rotate(boss.bodyAngle ?? ce.angle * 0.5);

  const surfaceR = r * getBossSurfaceScale(phase);
  ctx.beginPath();
  ctx.arc(0, 0, surfaceR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,15,24,.94)';
  ctx.fill();

  const bodyScale = phase?.id === 'armor'
    ? 0.86
    : phase?.id === 'exposed'
      ? 0.69
      : 0.52;
  const bodyR = r * bodyScale;

  traceBossShape(ctx, boss.shape, bodyR, 0);
  ctx.fillStyle = phase?.id === 'core'
    ? 'rgba(10,15,24,.52)'
    : `${boss.color}${phase?.id === 'armor' ? '26' : '18'}`;
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = phase?.id === 'armor' ? 4 : phase?.id === 'exposed' ? 3 : 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 7 + tier * 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (phase?.id === 'armor') {
    traceBossShape(ctx, boss.shape, r * 0.95, Math.PI / 18);
    ctx.strokeStyle = `${boss.accent}80`;
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (phase?.id === 'exposed') {
    traceBossShape(ctx, boss.shape, r * 0.58, -Math.PI / 12);
    ctx.strokeStyle = `${boss.accent}8A`;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const targets = getBossLayerTargets(state);
    const aliveCoreLayers = Math.max(0, targets.length);
    for (let i = 0; i < aliveCoreLayers; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.34 - i * 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = boss.accent;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.shadowColor = boss.accent;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function getBossShakeOffset(state) {
  if (!isBossPhaseTransitionActive(state)) return { x: 0, y: 0 };

  const fx = getBossPhaseBreak(state);
  const duration = Math.max(0.001, Number(fx?.duration) || BOSS_CONFIG.phaseTransitionDuration);
  const remaining = Math.max(0, Math.min(1, Number(fx?.timer) / duration));
  const intensity = 8.5 * Math.pow(remaining, 1.35);
  const now = performance.now();

  return {
    x: Math.sin(now * 0.095) * intensity + Math.sin(now * 0.173) * intensity * 0.42,
    y: Math.cos(now * 0.121) * intensity * 0.66,
  };
}


function drawBossDetachedDebris(ctx, state) {
  const debris = state?.detachedBossDebris;
  if (!Array.isArray(debris) || debris.length === 0) return;

  for (const piece of debris) {
    const radius = Math.max(3, Number(piece.radius) || 7);
    const accent = piece.accent ?? '#FFD166';
    const color = piece.color ?? '#FF6B35';

    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(Number(piece.rotation) || 0);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;

    if (piece.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.95, -radius * 0.30);
      ctx.lineTo(radius * 0.25, -radius * 0.90);
      ctx.lineTo(radius, radius * 0.20);
      ctx.lineTo(-radius * 0.20, radius * 0.78);
      ctx.closePath();
      ctx.fillStyle = `${color}CC`;
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (piece.shape === 'ringArc') {
      const thickness = Math.max(3, Number(piece.thickness) || radius * 0.28);
      const arc = Math.max(0.35, Number(piece.arc) || 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, radius, -arc, arc);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = `${accent}E8`;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, radius - thickness * 0.45), -arc * 0.92, arc * 0.92);
      ctx.lineWidth = Math.max(1.5, thickness * 0.34);
      ctx.strokeStyle = `${color}D5`;
      ctx.stroke();
    } else {
      traceBossShape(ctx, piece.shape ?? 'circle', radius, 0);
      ctx.fillStyle = 'rgba(13,17,23,.88)';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.7;
      ctx.stroke();

      traceBossShape(ctx, piece.shape ?? 'circle', radius * 0.42, Math.PI / 8);
      ctx.fillStyle = `${color}B0`;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBossDetachedArrows(ctx, state, assets) {
  const arrows = state?.detachedBossArrows;
  if (!Array.isArray(arrows) || arrows.length === 0) return;

  for (const arrow of arrows) {
    ctx.save();
    ctx.globalAlpha = 1;
    drawArrow(
      ctx,
      arrow.x,
      arrow.y,
      arrow.radius,
      arrow.rotation,
      arrow.awsIconId,
      assets,
    );
    ctx.restore();
  }
}

function drawBossPhaseBreakOverlay(ctx, state) {
  const fx = getBossPhaseBreak(state);
  if (!fx?.active) return;

  const duration = Math.max(0.001, Number(fx.duration) || BOSS_CONFIG.phaseTransitionDuration);
  const progress = 1 - Math.max(0, Math.min(1, Number(fx.timer) / duration));
  const boss = state.boss;
  const accent = boss?.accent ?? '#FFD166';

  // Flash inicial de ruptura.
  const flashAlpha = Math.max(0, 0.30 - progress) / 0.30;
  if (flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha * 0.24;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, getLogicalCanvasHeight(ctx));
    ctx.restore();
  }

  // Título central: entra rápido y se desvanece antes de terminar la pausa.
  const inAlpha = Math.min(1, progress / 0.12);
  const outAlpha = Math.min(1, Math.max(0, (1 - progress) / 0.24));
  const alpha = Math.min(inAlpha, outAlpha);
  if (alpha <= 0) return;

  const from = String(fx.fromPhase ?? '').toLowerCase();
  const to = String(fx.toPhase ?? '').toLowerCase();
  const title = from === 'armor'
    ? '¡ARMADURA DESTROZADA!'
    : from === 'exposed'
      ? '¡CAPA EXTERNA ROTA!'
      : '¡FASE ROTA!';
  const subtitle = to === 'core'
    ? 'NÚCLEO EXPUESTO'
    : `SE REVELA ${String(fx.toLabel ?? 'SIGUIENTE FASE').toUpperCase()}`;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 24px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillText(title, LOGICAL_WIDTH / 2, screenH / 2 - 18);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(subtitle, LOGICAL_WIDTH / 2, screenH / 2 + 14);
  ctx.restore();
}

function drawBossIntroOverlay(ctx, state) {
  if (state.phase !== 'bossintro' || !state.boss?.active) return;

  const boss = state.boss;
  const elapsed = 1 - Math.min(1, (boss.introTimer ?? 0) / 1.65);
  const alpha = Math.min(1, elapsed * 5 + 0.18);

  ctx.save();
  ctx.fillStyle = 'rgba(5,8,13,.72)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(0, 0, LOGICAL_WIDTH, screenH);

  const w = 410;
  const h = 190;
  const x = (LOGICAL_WIDTH - w) / 2;
  const y = (screenH - h) / 2;
  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(13,17,23,.95)';
  ctx.fill();
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 18;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`⚠ JEFE ${boss.bossNumber} ENTRANTE ⚠`, LOGICAL_WIDTH / 2, y + 34);

  ctx.font = 'bold 34px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(boss.name, LOGICAL_WIDTH / 2, y + 76);

  ctx.font = 'bold 11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.accent;
  ctx.fillText(boss.subtitle, LOGICAL_WIDTH / 2, y + 104);

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = boss.color;
  ctx.fillText('CAPA 1 • ROMPE EL ANILLO DE ARMADURA', LOGICAL_WIDTH / 2, y + 139);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  ctx.fillText('Rompe las capas • tiros fallidos cargan OVERLOAD • al 100% pierdes', LOGICAL_WIDTH / 2, y + 165);
  ctx.restore();
}

function drawBossCompleteOverlay(ctx, state) {
  if (state.phase !== 'levelcomplete' || !state.boss?.defeated || !state.boss?.result) return false;

  const result = state.boss.result;
  const remaining = Math.max(0, state.levelTransitionTimer ?? 0);
  const progress = 1 - Math.min(1, remaining / LEVEL_COMPLETE_DELAY);
  const fadeIn = Math.min(1, progress * 5);
  const fadeOut = Math.min(1, remaining * 3.2);
  const alpha = Math.min(fadeIn, fadeOut);

  ctx.save();
  ctx.globalAlpha = Math.max(0.15, alpha);
  ctx.fillStyle = 'rgba(5,8,13,.68)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(0, 0, LOGICAL_WIDTH, screenH);

  const w = 420;
  const h = 235;
  const x = (LOGICAL_WIDTH - w) / 2;
  const y = (screenH - h) / 2;
  roundedRectPath(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(13,17,23,.96)';
  ctx.fill();
  ctx.strokeStyle = state.boss.color;
  ctx.lineWidth = 2;
  ctx.shadowColor = state.boss.color;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = state.boss.accent;
  ctx.fillText(result.bossName, LOGICAL_WIDTH / 2, y + 28);

  ctx.font = 'bold 28px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('JEFE DERROTADO', LOGICAL_WIDTH / 2, y + 60);

  ctx.font = 'bold 50px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = result.rank === 'S' ? '#FFD166' : state.boss.accent;
  ctx.fillText(result.rank, LOGICAL_WIDTH / 2, y + 108);

  ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.74)';
  ctx.fillText(
    `ACCURACY ${result.accuracy}%  •  PERFECTS ${result.perfectHits}  •  TIME ${result.time}s`,
    LOGICAL_WIDTH / 2,
    y + 145,
  );

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`BONO DE JEFE +${result.bonus}`, LOGICAL_WIDTH / 2, y + 176);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.56)';
  ctx.fillText(`SIGUE: NIVEL ${(state.completedLevel || state.level) + 1}`, LOGICAL_WIDTH / 2, y + 207);
  ctx.restore();
  return true;
}

// ---------------------------------------------------------------------------
// Disco central
// ---------------------------------------------------------------------------
function drawDisc(ctx, ce, progression, level = 1) {
  const { x, y, radius, angle } = ce;
  const theme = getLevelTheme(level);
  ctx.save();
  ctx.translate(x, y);

  // Fondo interior oscuro
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = theme.inner ?? COLOR_DISC_INNER;
  ctx.fill();

  // Radios giratorios
  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const a = angle + (Math.PI * 2 * i) / spokeCount;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88);
    ctx.strokeStyle = `${theme.ring}55`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // Anillo exterior — color y brillo varían con el tier
  const tier = progression ? progression.tier : 1;
  const ringColor = tier >= 5 ? '#FF4D4D' : (tier >= 4 ? theme.accent : theme.ring);
  const ringGlow = tier >= 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  if (ringGlow) {
    ctx.shadowColor = ringColor;
    ctx.shadowBlur  = 14 + (tier - 4) * 6;
  }
  ctx.strokeStyle = ringColor;
  ctx.lineWidth   = 6 + tier * 0.5;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Anillo interior
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `${theme.ring}73`;
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = theme.ring ?? COLOR_DISC_RING;
  ctx.fill();

  // Marcador de rotación
  const mx = Math.cos(angle) * radius;
  const my = Math.sin(angle) * radius;
  ctx.beginPath();
  ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}


// ---------------------------------------------------------------------------
// drawReadyArrow — flecha en espera (parte inferior del canvas)
// Apunta siempre hacia arriba (-PI/2 en convenio canvas, o sea angle = 0
// en drawArrow porque local -Y ya es arriba).
// ---------------------------------------------------------------------------
function drawReadyArrow(ctx, state, assets, canvasW, canvasH) {
  if (state.flyingProjectile) return;
  if (state.phase !== 'playing') return;

  const r  = 22;
  const cx = canvasW / 2;
  const t  = Date.now() / 1000;

  // La flecha preparada queda un poco más abajo para distinguirla mejor de
  // las ya clavadas. La misma posición se usa al lanzar para evitar saltos.
  const readyBottomFactor = Number(CONFIG.READY_ARROW_BOTTOM_FACTOR) || 5;
  const baseY = LOGICAL_HEIGHT - r * readyBottomFactor;
  // Flotado: oscilación vertical suave ±5px, período ~2s
  const floatY = baseY + Math.sin(t * Math.PI) * 5;

  // Opacidad: ligeramente pulsante entre 0.82 y 1.0
  ctx.globalAlpha = 0.82 + 0.18 * Math.sin(t * Math.PI * 0.8);
  drawArrow(ctx, cx, floatY, r, 0, state.nextArrowId, assets);
  ctx.globalAlpha = 1;

}

function drawLevelCompleteOverlay(ctx, state) {
  if (state.phase !== 'levelcomplete') return;

  const remaining = Math.max(0, state.levelTransitionTimer ?? 0);
  const progress = 1 - Math.min(1, remaining / LEVEL_COMPLETE_DELAY);
  const fadeIn = Math.min(1, progress * 5);
  const fadeOut = Math.min(1, remaining * 3.2);
  const alpha = Math.min(fadeIn, fadeOut);
  const level = state.completedLevel || state.level || 1;
  const nextLevel = level + 1;
  const theme = getLevelTheme(level);

  ctx.save();
  ctx.globalAlpha = Math.max(0.15, alpha);
  ctx.fillStyle = 'rgba(8,12,18,.58)';
  const screenH = getLogicalCanvasHeight(ctx);
  ctx.fillRect(0, 0, LOGICAL_WIDTH, screenH);

  const cardW = 360;
  const cardH = 150;
  const x = (LOGICAL_WIDTH - cardW) / 2;
  const y = (screenH - cardH) / 2 - 8;
  roundedRectPath(ctx, x, y, cardW, cardH, 18);
  ctx.fillStyle = 'rgba(26,35,50,.94)';
  ctx.fill();
  ctx.strokeStyle = theme.ring;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.ring;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`NIVEL ${level}`, LOGICAL_WIDTH / 2, y + 28);

  ctx.font = 'bold 30px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('¡COMPLETADO!', LOGICAL_WIDTH / 2, y + 59);

  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFD166';
  ctx.fillText(`BONO DE NIVEL  +${state.levelCompleteBonus ?? 0}`, LOGICAL_WIDTH / 2, y + 91);

  ctx.font = '10px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.66)';
  ctx.fillText(`SIGUE: NIVEL ${nextLevel}  •  ${getLevelTarget(nextLevel)} FLECHAS`, LOGICAL_WIDTH / 2, y + 120);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// render — función principal exportada
// ---------------------------------------------------------------------------
export function render(ctx, state, assets, progression = null) {
  const { centralElement: ce, anchoredProjectiles, flyingProjectile } = state;
  const { canvas } = ctx;

  const screenH = getLogicalCanvasHeight(ctx);
  const sceneOffsetY = getSceneOffsetY(ctx);

  // Reafirmar la matriz lógica cada frame evita desplazamientos acumulados si
  // algún efecto externo dejó una transformación activa. También mantiene las
  // notificaciones perfectamente centradas tras resize/orientationchange.
  ctx.setTransform(
    canvas.width / LOGICAL_WIDTH,
    0,
    0,
    canvas.height / screenH,
    0,
    0,
  );

  // Fondo fijo: evita descubrir bordes durante el shake y llena por completo
  // el canvas vertical de móvil.
  ctx.clearRect(0, 0, LOGICAL_WIDTH, screenH);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, screenH);

  const shake = getBossShakeOffset(state);
  ctx.save();
  ctx.translate(shake.x, shake.y);

  // HUD dentro del canvas (evita que se desalineé al escalar responsivamente)
  drawHUD(ctx, state, progression, LOGICAL_WIDTH, assets);

  if (progression && progression.tier > 0) {
    drawTierIndicator(ctx, LOGICAL_WIDTH, progression.tier);
  }

  drawLevelProgress(ctx, state, LOGICAL_WIDTH);
  drawStability(ctx, state, LOGICAL_WIDTH);
  drawBossProgress(ctx, state, LOGICAL_WIDTH);
  drawComboBadge(ctx, state);

  // El gameplay conserva las coordenadas físicas 600×700 y se desplaza dentro
  // del canvas alto de móvil. Esto llena la pantalla sin deformar hitboxes.
  ctx.save();
  ctx.translate(0, sceneOffsetY);

  if (state.boss?.active) drawBoss(ctx, state, progression);
  else drawDisc(ctx, ce, progression, state.level);

  // Flechas ancladas de la fase ACTUAL.
  for (const ap of anchoredProjectiles) {
    const renderDistance = Number.isFinite(ap.renderDistance)
      ? ap.renderDistance
      : ap.distance;
    const apX = ce.x + renderDistance * Math.cos(ap.angle);
    const apY = ce.y + renderDistance * Math.sin(ap.angle);
    const arrowAngle = ap.angle - Math.PI / 2;
    drawArrow(ctx, apX, apY, ap.radius, arrowAngle, ap.awsIconId, assets);
  }

  // Volvemos a dibujar la superficie del jefe encima de las puntas.
  // Así la punta queda parcialmente oculta y se siente realmente clavada.
  if (state.boss?.active && anchoredProjectiles.length > 0) {
    drawEmbeddedArrowMasks(ctx, state, progression);
  }

  // Al romper una fase, los pedazos de la capa y las flechas antiguas dejan
  // de ser gameplay y continúan cayendo como restos físicos independientes.
  drawBossDetachedDebris(ctx, state);
  drawBossDetachedArrows(ctx, state, assets);

  drawPowerCore(ctx, state);

  if (flyingProjectile) {
    const fp = flyingProjectile;
    const flyAngle = Math.atan2(fp.vy, fp.vx) + Math.PI / 2;
    drawArrow(ctx, fp.x, fp.y, fp.radius, flyAngle, fp.awsIconId, assets);
  }

  drawReadyArrow(ctx, state, assets, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.restore();

  // El Dock se dibuja DESPUÉS del gameplay. Esto lo convierte en una capa UI
  // real: flechas, Power Cores y efectos pueden pasar por detrás, pero nunca
  // tapar botones, cantidades ni textos.
  drawPowerUpDock(ctx, state, LOGICAL_WIDTH, screenH);

  drawBottomHint(ctx, state, LOGICAL_WIDTH, screenH);
  drawBossIntroOverlay(ctx, state);
  if (!drawBossCompleteOverlay(ctx, state)) {
    drawLevelCompleteOverlay(ctx, state);
  }
  drawVersion(ctx, LOGICAL_WIDTH, screenH);

  ctx.restore();

  // El texto de ruptura y el flash permanecen estables mientras el mundo tiembla.
  drawBossPhaseBreakOverlay(ctx, state);
}
