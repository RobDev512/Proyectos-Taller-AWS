/**
 * feedback.js — Textos flotantes, anillos de impacto y banners.
 */

const texts = [];
const rings = [];
const banners = [];

export function emitFloatingText(x, y, text, options = {}) {
  texts.push({
    x, y,
    text,
    color: options.color ?? '#FFFFFF',
    size: options.size ?? 17,
    life: 1,
    maxLife: options.duration ?? 0.75,
    vy: options.vy ?? -28,
  });
}

export function emitRing(x, y, color = '#FF9900', strength = 1) {
  rings.push({ x, y, color, strength, life: 1, maxLife: 0.32 });
}

export function emitBanner(title, subtitle = '') {
  banners.push({ title, subtitle, life: 1, maxLife: 1.5 });
}

export function updateAndDrawFeedback(ctx, dt) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const item = texts[i];
    item.life -= dt / item.maxLife;
    if (item.life <= 0) { texts.splice(i, 1); continue; }
    item.y += item.vy * dt;

    ctx.save();
    ctx.globalAlpha = Math.min(1, item.life * 1.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${item.size}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = item.color;
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = 5;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i];
    ring.life -= dt / ring.maxLife;
    if (ring.life <= 0) { rings.splice(i, 1); continue; }

    const progress = 1 - ring.life;
    const radius = 10 + progress * 34 * ring.strength;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ring.life * 0.8);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 4 * ring.life + 1;
    ctx.shadowColor = ring.color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
  }

  if (banners.length) {
    const banner = banners[banners.length - 1];
    banner.life -= dt / banner.maxLife;
    if (banner.life <= 0) {
      banners.pop();
    } else {
      const fadeIn = Math.min(1, (1 - banner.life) * 8);
      const fadeOut = Math.min(1, banner.life * 4);
      const alpha = Math.min(fadeIn, fadeOut);
      const y = 165 - (1 - banner.life) * 7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 28px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = '#FF9900';
      ctx.shadowColor = '#FF9900';
      ctx.shadowBlur = 12;
      ctx.fillText(banner.title, ctx.canvas.width / 2, y);
      ctx.shadowBlur = 0;
      if (banner.subtitle) {
        ctx.font = 'bold 10px "Amazon Ember", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        ctx.fillText(banner.subtitle, ctx.canvas.width / 2, y + 24);
      }
      ctx.restore();
    }
  }
}

export function clearFeedback() {
  texts.length = 0;
  rings.length = 0;
  banners.length = 0;
}
