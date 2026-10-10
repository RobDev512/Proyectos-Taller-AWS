/**
 * economy.js — Economía persistente y reglas de vidas de AWS ORBISHOT.
 *
 * v1.4.2 introduce una moneda persistente y una capacidad de vidas mejorable.
 * Las vidas actuales pertenecen a la run; la capacidad máxima sí persiste.
 * Así nunca existe un bloqueo permanente por quedarse en 0 vidas: una nueva
 * run vuelve a empezar con la capacidad máxima desbloqueada.
 */

import {
  POWER_UP_CONFIG,
  POWER_UP_ORDER,
  collectPowerUp,
  getPowerUpInventoryCap,
} from './powerups.js?build=v142-economy-r4';

const ECONOMY_KEY = 'awsOrbishotEconomyV1';

export const ECONOMY_CONFIG = Object.freeze({
  initialMaxLives: 3,

  // Límite de la TIENDA de esta versión, no del sistema. El renderer soporta
  // valores mayores y los compacta como ♥ ×N para futuras expansiones.
  shopLifeCap: 5,

  normalLevelCoins: 8,
  bossBaseCoins: 25,
  maxPerfectBonus: 4,
  maxComboBonus: 3,

  lifeRefillCost: 20,
  lifeUpgradeCosts: Object.freeze({
    3: 60, // 3 -> 4
    4: 100, // 4 -> 5
  }),

  powerUpCosts: Object.freeze({
    freeze: 12,
    shield: 14,
    double: 16,
    cleanup: 18,
  }),

  // v1.4.2 r4: la capacidad del inventario de cada potenciador también es
  // progreso persistente. El juego parte de x2 y la tienda actual permite
  // ampliar cada tipo hasta x5; el sistema queda preparado para subir más.
  shopPowerUpCap: 5,
  powerUpCapacityUpgradeCosts: Object.freeze({
    2: 25, // x2 -> x3
    3: 45, // x3 -> x4
    4: 70, // x4 -> x5
  }),

  bossRankBonus: Object.freeze({
    D: 0,
    C: 3,
    B: 6,
    A: 10,
    S: 15,
  }),
});

function defaults() {
  return {
    coins: 0,
    maxLives: ECONOMY_CONFIG.initialMaxLives,
    powerUpCaps: Object.fromEntries(
      POWER_UP_ORDER.map(type => [type, POWER_UP_CONFIG.inventoryMaxPerType]),
    ),
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
  };
}

function safeInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

export function sanitizeEconomy(value) {
  const d = defaults();
  if (!value || typeof value !== 'object') return d;

  d.coins = safeInt(value.coins, 0, 0);
  d.maxLives = safeInt(
    value.maxLives,
    ECONOMY_CONFIG.initialMaxLives,
    ECONOMY_CONFIG.initialMaxLives,
    99,
  );
  const storedCaps =
    value.powerUpCaps && typeof value.powerUpCaps === 'object'
      ? value.powerUpCaps
      : {};
  for (const type of POWER_UP_ORDER) {
    d.powerUpCaps[type] = safeInt(
      storedCaps[type],
      POWER_UP_CONFIG.inventoryMaxPerType,
      POWER_UP_CONFIG.inventoryMaxPerType,
      99,
    );
  }

  d.totalCoinsEarned = safeInt(value.totalCoinsEarned, 0, 0);
  d.totalCoinsSpent = safeInt(value.totalCoinsSpent, 0, 0);
  return d;
}

export function loadEconomy() {
  try {
    const raw = localStorage.getItem(ECONOMY_KEY);
    return raw ? sanitizeEconomy(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

export function saveEconomy(economy) {
  const safe = sanitizeEconomy(economy);
  Object.assign(economy, safe);
  try {
    localStorage.setItem(ECONOMY_KEY, JSON.stringify(safe));
  } catch {
    // El juego continúa en memoria si el navegador bloquea persistencia.
  }
  return economy;
}

export function awardCoins(economy, amount) {
  if (!economy || typeof economy !== 'object') return 0;
  const added = safeInt(amount, 0, 0, 999999);
  if (added <= 0) return 0;

  economy.coins = safeInt(economy.coins, 0, 0) + added;
  economy.totalCoinsEarned = safeInt(economy.totalCoinsEarned, 0, 0) + added;
  saveEconomy(economy);
  return added;
}

export function spendCoins(economy, amount) {
  if (!economy || typeof economy !== 'object') return false;
  const cost = safeInt(amount, 0, 0, 999999);
  if (cost <= 0) return true;

  const balance = safeInt(economy.coins, 0, 0);
  if (balance < cost) return false;

  economy.coins = balance - cost;
  economy.totalCoinsSpent = safeInt(economy.totalCoinsSpent, 0, 0) + cost;
  saveEconomy(economy);
  return true;
}

export function getLifeUpgradeCost(economy) {
  const maxLives = safeInt(
    economy?.maxLives,
    ECONOMY_CONFIG.initialMaxLives,
    ECONOMY_CONFIG.initialMaxLives,
    99,
  );

  if (maxLives >= ECONOMY_CONFIG.shopLifeCap) return null;
  const cost = ECONOMY_CONFIG.lifeUpgradeCosts[maxLives];
  return Number.isFinite(Number(cost)) ? Number(cost) : null;
}

export function refillLife(state) {
  const economy = state?.economy;
  if (!economy) return { ok: false, reason: 'economy' };

  const maxLives = Math.max(
    ECONOMY_CONFIG.initialMaxLives,
    Math.floor(Number(economy.maxLives) || ECONOMY_CONFIG.initialMaxLives),
  );
  const current = Math.max(0, Math.floor(Number(state.currentLives) || 0));

  if (current >= maxLives) return { ok: false, reason: 'full' };
  if (!spendCoins(economy, ECONOMY_CONFIG.lifeRefillCost)) {
    return { ok: false, reason: 'coins' };
  }

  state.currentLives = current + 1;
  return {
    ok: true,
    currentLives: state.currentLives,
    maxLives,
    cost: ECONOMY_CONFIG.lifeRefillCost,
  };
}

export function upgradeMaxLives(state) {
  const economy = state?.economy;
  if (!economy) return { ok: false, reason: 'economy' };

  const cost = getLifeUpgradeCost(economy);
  if (cost === null) return { ok: false, reason: 'cap' };
  if (!spendCoins(economy, cost)) return { ok: false, reason: 'coins' };

  economy.maxLives = Math.min(
    99,
    Math.max(
      ECONOMY_CONFIG.initialMaxLives,
      Math.floor(Number(economy.maxLives) || ECONOMY_CONFIG.initialMaxLives) + 1,
    ),
  );
  saveEconomy(economy);

  // La mejora también entrega inmediatamente el corazón recién desbloqueado.
  state.currentLives = Math.min(
    economy.maxLives,
    Math.max(0, Math.floor(Number(state.currentLives) || 0)) + 1,
  );

  return {
    ok: true,
    maxLives: economy.maxLives,
    currentLives: state.currentLives,
    cost,
  };
}

export function getPowerUpCapacityUpgradeCost(economy, type) {
  if (!POWER_UP_ORDER.includes(type)) return null;

  const current = safeInt(
    economy?.powerUpCaps?.[type],
    POWER_UP_CONFIG.inventoryMaxPerType,
    POWER_UP_CONFIG.inventoryMaxPerType,
    99,
  );
  if (current >= ECONOMY_CONFIG.shopPowerUpCap) return null;

  const cost = ECONOMY_CONFIG.powerUpCapacityUpgradeCosts[current];
  return Number.isFinite(Number(cost)) ? Number(cost) : null;
}

export function upgradePowerUpCapacity(state, type) {
  if (!state?.economy || !POWER_UP_ORDER.includes(type)) {
    return { ok: false, reason: 'type' };
  }

  const cost = getPowerUpCapacityUpgradeCost(state.economy, type);
  if (cost === null) return { ok: false, reason: 'cap' };
  if (!spendCoins(state.economy, cost)) return { ok: false, reason: 'coins' };

  const current = safeInt(
    state.economy.powerUpCaps?.[type],
    POWER_UP_CONFIG.inventoryMaxPerType,
    POWER_UP_CONFIG.inventoryMaxPerType,
    99,
  );
  state.economy.powerUpCaps = {
    ...(state.economy.powerUpCaps ?? {}),
    [type]: Math.min(99, current + 1),
  };
  saveEconomy(state.economy);

  return {
    ok: true,
    type,
    capacity: state.economy.powerUpCaps[type],
    cost,
  };
}

export function buyPowerUp(state, type) {
  if (!state?.economy || !POWER_UP_ORDER.includes(type)) {
    return { ok: false, reason: 'type' };
  }

  const current = Math.max(
    0,
    Math.floor(Number(state.powerUpInventory?.[type]) || 0),
  );
  const capacity = getPowerUpInventoryCap(state, type);
  if (current >= capacity) {
    return { ok: false, reason: 'full' };
  }

  const cost = Number(ECONOMY_CONFIG.powerUpCosts[type]) || 0;
  if (!spendCoins(state.economy, cost)) {
    return { ok: false, reason: 'coins' };
  }

  const result = collectPowerUp(state, type);
  if (!result.collected) {
    // Falla defensiva: devolver las monedas si el inventario cambió entre
    // comprobación y entrega.
    state.economy.coins = Math.max(0, Number(state.economy.coins) || 0) + cost;
    state.economy.totalCoinsSpent = Math.max(
      0,
      (Number(state.economy.totalCoinsSpent) || 0) - cost,
    );
    saveEconomy(state.economy);
    return { ok: false, reason: 'full' };
  }

  return {
    ok: true,
    type,
    cost,
    count: result.count,
  };
}

export function getNormalLevelCoinReward(state) {
  const perfects = Math.max(0, Math.floor(Number(state?.levelPerfectShots) || 0));
  const bestCombo = Math.max(1, Math.floor(Number(state?.levelBestCombo) || 1));
  const perfectBonus = Math.min(ECONOMY_CONFIG.maxPerfectBonus, perfects);
  const comboBonus = Math.min(
    ECONOMY_CONFIG.maxComboBonus,
    Math.max(0, bestCombo - 1),
  );
  return ECONOMY_CONFIG.normalLevelCoins + perfectBonus + comboBonus;
}

export function getBossCoinReward(rank = 'D') {
  const safeRank = String(rank || 'D').toUpperCase();
  return ECONOMY_CONFIG.bossBaseCoins +
    (ECONOMY_CONFIG.bossRankBonus[safeRank] ?? 0);
}
