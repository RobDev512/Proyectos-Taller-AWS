/**
 * powerupUi.js — Geometría compartida del dock interactivo de Power-Ups.
 */

import { POWER_UP_ORDER } from './powerups.js';

export const POWER_UP_DOCK = Object.freeze({
  right: 18,
  width: 126,
  startY: 170,
  slotHeight: 54,
  gap: 10,
  chargeGap: 14,
  chargeHeight: 54,
});

export function getPowerUpSlotRects(canvasWidth) {
  const x = canvasWidth - POWER_UP_DOCK.right - POWER_UP_DOCK.width;

  return POWER_UP_ORDER.map((type, index) => ({
    type,
    index,
    x,
    y:
      POWER_UP_DOCK.startY +
      index * (POWER_UP_DOCK.slotHeight + POWER_UP_DOCK.gap),
    width: POWER_UP_DOCK.width,
    height: POWER_UP_DOCK.slotHeight,
  }));
}

export function getPowerUpChargeRect(canvasWidth) {
  const slots = getPowerUpSlotRects(canvasWidth);
  const last = slots[slots.length - 1];

  return {
    x: last.x,
    y: last.y + last.height + POWER_UP_DOCK.chargeGap,
    width: POWER_UP_DOCK.width,
    height: POWER_UP_DOCK.chargeHeight,
  };
}

export function getPowerUpSlotAtPoint(canvasWidth, x, y) {
  for (const slot of getPowerUpSlotRects(canvasWidth)) {
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
