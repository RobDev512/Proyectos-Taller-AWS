/**
 * particles.js — Sistema de partículas para efectos visuales.
 * Partículas de impacto al aterrizar, confetti en hitos.
 */

/** @type {Array<{x,y,vx,vy,life,maxLife,color,size}>} */
const pool = [];

let enabled = true;
export function setFxEnabled(val) { enabled = val; }

/**
 * Emite N partículas desde (x,y) en un arco dirigido.
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {number} count
 * @param {'burst'|'confetti'} mode
 */
export function emitImpact(x, y, color, count = 12, mode = 'burst') {
  if (!enabled) return;
  for (let i = 0; i < count; i++) {
    const angle  = mode === 'confetti'
      ? Math.random() * Math.PI * 2
      : -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.2;
    const speed  = mode === 'confetti' ? 1.5 + Math.random() * 3.5 : 2 + Math.random() * 4;
    pool.push({
      x, y,
      vx:      Math.cos(angle) * speed,
      vy:      Math.sin(angle) * speed,
      life:    1,
      maxLife: 0.35 + Math.random() * 0.3,
      color,
      size:    2 + Math.random() * 3,
      rot:     Math.random() * Math.PI * 2,
      rotV:    (Math.random() - 0.5) * 8,
    });
  }
}

/**
 * Actualiza y dibuja todas las partículas activas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} dt  - deltaTime en segundos
 */
export function updateAndDraw(ctx, dt) {
  for (let i = pool.length - 1; i >= 0; i--) {
    const p = pool[i];
    p.life -= dt / p.maxLife;
    if (p.life <= 0) { pool.splice(i, 1); continue; }

    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.15;   // gravedad leve
    p.rot += p.rotV * dt;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function clearParticles() { pool.length = 0; }
