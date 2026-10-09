import { CONFIG } from './config.js';

const LOGICAL_WIDTH = CONFIG.CANVAS_WIDTH;

/**
 * feedback.js — Textos flotantes, anillos de impacto y notificaciones.
 */

const texts = [];
const rings = [];
const banners = [];

let decorativeEnabled = true;

export function setFeedbackFxEnabled(val) {
  decorativeEnabled = Boolean(val);
}

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
  if (!decorativeEnabled) return;
  rings.push({ x, y, color, strength, life: 1, maxLife: 0.32 });
}

/**
 * Las notificaciones ahora se muestran de una en una en una zona dedicada.
 * priority='high' coloca la nueva notificación al frente de la cola.
 */
export function emitBanner(title, subtitle = '', options = {}) {
  const item = {
    title,
    subtitle,
    color: options.color ?? '#FF9900',
    life: 1,
    maxLife: options.duration ?? 1.2,
  };

  // Evitar duplicados inmediatos.
  for (let i = banners.length - 1; i >= 0; i--) {
    if (
      banners[i].title === title &&
      banners[i].subtitle === subtitle
    ) {
      banners.splice(i, 1);
    }
  }

  if (options.priority === 'high') {
    banners.unshift(item);
  } else {
    banners.push(item);
  }

  // No acumular mensajes viejos durante rachas muy rápidas.
  while (banners.length > 4) {
    banners.splice(banners.length - 1, 1);
  }
}

function notificationPath(ctx, x, y, w, h, r) {
  ctx.beginPath();

  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export function updateAndDrawFeedback(ctx, dt, options = {}) {
  const canvasW = Math.max(1, Number(ctx?.canvas?.dataset?.logicalWidth) || LOGICAL_WIDTH);
  const compact = ctx?.canvas?.dataset?.layout === 'compact';
  const sceneOffsetY = Math.max(0, Number(options.sceneOffsetY) || 0);
  for (let i = texts.length - 1; i >= 0; i--) {
    const item = texts[i];
    item.life -= dt / item.maxLife;
    if (item.life <= 0) {
      texts.splice(i, 1);
      continue;
    }

    item.y += item.vy * dt;

    ctx.save();
    ctx.translate(0, sceneOffsetY);
    ctx.globalAlpha = Math.min(1, item.life * 1.6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${item.size}px "Amazon Ember", Arial, sans-serif`;
    ctx.fillStyle = item.color;
    ctx.shadowColor = 'rgba(0,0,0,.65)';
    ctx.shadowBlur = decorativeEnabled ? 5 : 0;
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }

  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i];
    ring.life -= dt / ring.maxLife;
    if (ring.life <= 0) {
      rings.splice(i, 1);
      continue;
    }

    const progress = 1 - ring.life;
    const radius = 10 + progress * 34 * ring.strength;

    ctx.save();
    ctx.translate(0, sceneOffsetY);
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
    const banner = banners[0];
    banner.life -= dt / banner.maxLife;

    if (banner.life <= 0) {
      banners.shift();
    } else {
      const fadeIn = Math.min(1, (1 - banner.life) * 9);
      const fadeOut = Math.min(1, banner.life * 4.5);
      const alpha = Math.min(fadeIn, fadeOut);

      // Zona exclusiva entre el progreso superior y el disco.
      const w = compact ? 330 : 270;
      const h = 54;
      const x = (canvasW - w) / 2;
      // Debajo del medidor superior; no invade Level Progress / Overload.
      const y = compact ? 188 : 178;

      ctx.save();
      ctx.globalAlpha = alpha;

      notificationPath(ctx, x, y, w, h, 14);
      ctx.fillStyle = 'rgba(13,17,23,.78)';
      ctx.fill();
      ctx.strokeStyle = `${banner.color}AA`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 21px "Amazon Ember", Arial, sans-serif';
      ctx.fillStyle = banner.color;
      ctx.shadowColor = banner.color;
      ctx.shadowBlur = decorativeEnabled ? 10 : 0;
      ctx.fillText(banner.title, canvasW / 2, y + 21);

      ctx.shadowBlur = 0;
      if (banner.subtitle) {
        ctx.font = 'bold 9px "Amazon Ember", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,.78)';
        ctx.fillText(
          banner.subtitle,
          canvasW / 2,
          y + 40,
        );
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
