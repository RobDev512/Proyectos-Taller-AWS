/**
 * renderer.js — AWS Arcade Game
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
  const maxTier   = 5;
  const starSize  = 10;
  const gap       = 6;
  const totalW    = maxTier * starSize * 2 + (maxTier - 1) * gap;
  const startX    = (canvasW - totalW) / 2 + starSize;
  const y         = 100;  // debajo del HUD

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

function drawHUD(ctx, state, progression, canvasW) {
  ctx.save();

  roundedRectPath(ctx, 18, 14, canvasW - 36, 56, 11);
  ctx.fillStyle = 'rgba(13,17,23,.38)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.16)';
  ctx.lineWidth = 1;
  ctx.stroke();

  drawHudValue(ctx, 'SCORE', state.score, 34, 'left');
  drawHudValue(ctx, 'BEST', state.highScore, canvasW - 78, 'right');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('AWS ARCADE', canvasW / 2, 29);

  const difficulty = String(state.difficulty || 'medium').toUpperCase();
  const tier = progression?.tier ?? 1;
  const badgeText = `${difficulty}  •  TIER ${tier}`;
  ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
  const tw = ctx.measureText(badgeText).width;
  roundedRectPath(ctx, canvasW / 2 - tw / 2 - 8, 40, tw + 16, 18, 9);
  ctx.fillStyle = 'rgba(255,153,0,.13)';
  ctx.fill();
  ctx.fillStyle = '#FFB24D';
  ctx.fillText(badgeText, canvasW / 2, 49);

  drawSettingsIcon(ctx, canvasW);
  ctx.restore();
}

function drawComboBadge(ctx, state, canvasW) {
  const combo = state.comboLevel ?? 1;
  if (combo <= 1 || state.phase !== 'playing') return;

  const text = `COMBO ×${combo}`;
  ctx.save();
  ctx.font = 'bold 12px "Amazon Ember", Arial, sans-serif';
  const tw = ctx.measureText(text).width;
  roundedRectPath(ctx, canvasW / 2 - tw / 2 - 12, 122, tw + 24, 27, 14);
  ctx.fillStyle = 'rgba(255,153,0,.16)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,153,0,.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFB24D';
  ctx.fillText(text, canvasW / 2, 135.5);
  ctx.restore();
}

function drawBottomHint(ctx, state, canvasW, canvasH) {
  if (state.phase !== 'playing' || state.flyingProjectile) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '11px "Amazon Ember", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.43)';
  ctx.fillText('CLIC O ESPACIO PARA LANZAR', canvasW / 2, canvasH - 18);
  ctx.restore();
}

export function drawGameOverFlash(ctx, flashTimer) {
  if (!(flashTimer > 0)) return;
  const alpha = Math.min(0.22, flashTimer * 0.88);
  ctx.save();
  ctx.fillStyle = `rgba(255,70,70,${alpha})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Disco central
// ---------------------------------------------------------------------------
function drawDisc(ctx, ce, progression) {
  const { x, y, radius, angle } = ce;
  ctx.save();
  ctx.translate(x, y);

  // Fondo interior oscuro
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLOR_DISC_INNER;
  ctx.fill();

  // Radios giratorios
  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const a = angle + (Math.PI * 2 * i) / spokeCount;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88);
    ctx.strokeStyle = 'rgba(255,153,0,0.3)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // Anillo exterior — color y brillo varían con el tier
  const tier      = progression ? progression.tier : 1;
  const tierColors = ['#FF9900','#FF9900','#FFB833','#FF6600','#FF3300','#CC0000'];
  const ringColor  = tierColors[Math.min(tier, 5)];
  const ringGlow   = tier >= 4;
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
  ctx.strokeStyle = 'rgba(255,153,0,0.45)';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = COLOR_DISC_RING;
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
  if (state.phase === 'gameover') return;

  const r  = 22;
  const cx = canvasW / 2;
  const t  = Date.now() / 1000;

  // Posición base: más arriba que antes (r*5 desde el fondo en vez de r*3)
  const baseY = canvasH - r * 6;
  // Flotado: oscilación vertical suave ±5px, período ~2s
  const floatY = baseY + Math.sin(t * Math.PI) * 5;

  // Opacidad: ligeramente pulsante entre 0.82 y 1.0
  ctx.globalAlpha = 0.82 + 0.18 * Math.sin(t * Math.PI * 0.8);
  drawArrow(ctx, cx, floatY, r, 0, state.nextArrowId, assets);
  ctx.globalAlpha = 1;
}
// ---------------------------------------------------------------------------
// render — función principal exportada
// ---------------------------------------------------------------------------
export function render(ctx, state, assets, progression = null) {
  const { centralElement: ce, anchoredProjectiles, flyingProjectile } = state;
  const { canvas } = ctx;

  // Fondo
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // HUD dentro del canvas (evita que se desalineé al escalar responsivamente)
  drawHUD(ctx, state, progression, canvas.width);

  // Indicador de tier (esquina superior central, debajo del HUD)
  if (progression && progression.tier > 0) {
    drawTierIndicator(ctx, canvas.width, progression.tier);
  }

  drawComboBadge(ctx, state, canvas.width);

  // Disco
  drawDisc(ctx, ce, progression);

  // Proyectiles anclados
  // ap.angle = ángulo polar DEL CENTRO AL PROYECTIL.
  // La punta debe apuntar en sentido CONTRARIO (hacia el centro), es decir
  // en la dirección ap.angle + PI.
  // En coords locales la punta apunta hacia -Y.
  // Para que -Y local = dirección (ap.angle + PI) en canvas:
  //   rotate = (ap.angle + PI) - (-PI/2) = ap.angle + PI + PI/2 = ap.angle + 3*PI/2
  //   simplificado: ap.angle - PI/2  (equivalente mod 2PI)
  for (const ap of anchoredProjectiles) {
    const apX = ce.x + ap.distance * Math.cos(ap.angle);
    const apY = ce.y + ap.distance * Math.sin(ap.angle);
    const arrowAngle = ap.angle - Math.PI / 2;
    drawArrow(ctx, apX, apY, ap.radius, arrowAngle, ap.awsIconId, assets);
  }

  // Proyectil en vuelo
  if (flyingProjectile) {
    const fp = flyingProjectile;
    const flyAngle = Math.atan2(fp.vy, fp.vx) + Math.PI / 2;
    drawArrow(ctx, fp.x, fp.y, fp.radius, flyAngle, fp.awsIconId, assets);
  }

  // Flecha en espera (visible antes de lanzar)
  drawReadyArrow(ctx, state, assets, canvas.width, canvas.height);

  drawBottomHint(ctx, state, canvas.width, canvas.height);
}




