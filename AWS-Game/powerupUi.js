/**
 * powerupUi.js — Geometría compartida del dock interactivo de Power-Ups.
 *
 * v1.4.0 mantiene el dock descriptivo de escritorio y usa un HUD móvil
 * dedicado con cuatro botones circulares. En vertical, el Power Charge queda
 * separado debajo de los botones para no competir con el proyectil ni con el
 * área jugable.
 */

import { POWER_UP_ORDER } from './powerups.js?build=v142-economy-r4';

export const POWER_UP_DOCK = Object.freeze({
  desktop: Object.freeze({
    right: 18,
    width: 126,
    startY: 170,
    slotHeight: 54,
    gap: 10,
    chargeGap: 14,
    chargeHeight: 54,
  }),
  compact: Object.freeze({
    buttonRadius: 30,
    buttonGap: 24,
    rowBottom: 112,
    hitPadding: 7,
    chargeGap: 16,
    chargeWidth: 420,
    chargeHeight: 44,
  }),
});

export function getPowerUpSlotRects(
  canvasWidth,
  layout = 'desktop',
  canvasHeight = 700,
) {
  if (layout === 'compact') {
    const cfg = POWER_UP_DOCK.compact;
    const diameter = cfg.buttonRadius * 2;
    const totalWidth =
      POWER_UP_ORDER.length * diameter +
      (POWER_UP_ORDER.length - 1) * cfg.buttonGap;
    const startCx = (canvasWidth - totalWidth) / 2 + cfg.buttonRadius;
    const cy = Math.max(
      cfg.buttonRadius + 12,
      canvasHeight - cfg.rowBottom,
    );

    return POWER_UP_ORDER.map((type, index) => {
      const cx = startCx + index * (diameter + cfg.buttonGap);
      return {
        type,
        index,
        cx,
        cy,
        radius: cfg.buttonRadius,
        x: cx - cfg.buttonRadius,
        y: cy - cfg.buttonRadius,
        width: diameter,
        height: diameter,
      };
    });
  }

  const cfg = POWER_UP_DOCK.desktop;
  const x = canvasWidth - cfg.right - cfg.width;

  return POWER_UP_ORDER.map((type, index) => ({
    type,
    index,
    x,
    y: cfg.startY + index * (cfg.slotHeight + cfg.gap),
    width: cfg.width,
    height: cfg.slotHeight,
  }));
}

export function getPowerUpChargeRect(
  canvasWidth,
  layout = 'desktop',
  canvasHeight = 700,
) {
  if (layout === 'compact') {
    const cfg = POWER_UP_DOCK.compact;
    const slots = getPowerUpSlotRects(canvasWidth, layout, canvasHeight);
    const first = slots[0];
    return {
      x: (canvasWidth - cfg.chargeWidth) / 2,
      y: first.cy + first.radius + cfg.chargeGap,
      width: cfg.chargeWidth,
      height: cfg.chargeHeight,
    };
  }

  const cfg = POWER_UP_DOCK.desktop;
  const slots = getPowerUpSlotRects(canvasWidth, layout, canvasHeight);
  const last = slots[slots.length - 1];

  return {
    x: last.x,
    y: last.y + last.height + cfg.chargeGap,
    width: cfg.width,
    height: cfg.chargeHeight,
  };
}

export function getPowerUpSlotAtPoint(
  canvasWidth,
  x,
  y,
  layout = 'desktop',
  canvasHeight = 700,
) {
  const slots = getPowerUpSlotRects(canvasWidth, layout, canvasHeight);

  for (const slot of slots) {
    if (layout === 'compact' && Number.isFinite(slot.radius)) {
      const hitRadius = slot.radius + POWER_UP_DOCK.compact.hitPadding;
      if (Math.hypot(x - slot.cx, y - slot.cy) <= hitRadius) {
        return slot.type;
      }
      continue;
    }

    if (
      x >= slot.x &&
      x <= slot.x + slot.width &&
      y >= slot.y &&
      y <= slot.y + slot.height
    ) {
      return slot.type;
    }
  }

  return null;
}
