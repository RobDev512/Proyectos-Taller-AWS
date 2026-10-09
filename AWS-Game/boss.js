/**
 * boss.js — Sistema de bosses por capas de AWS ORBISHOT v1.4.0.
 *
 * La idea central de esta revisión es que el boss NO tenga un simple punto
 * "HIT" orbitando. Cada fase es una capa física/visual del enemigo:
 *
 *   ARMOR   -> piezas exteriores que orbitan y se destruyen una a una.
 *   EXPOSED -> segunda corona, más cercana y rápida.
 *   CORE    -> núcleo central con tres capas internas.
 *
 * La flecha debe atravesar una pieza activa y después completar un anchor
 * válido. De esta forma el timing importa, pero collision.js conserva su
 * hitbox original y las flechas ancladas siguen siendo obstáculos.
 */

export const BOSS_CONFIG = Object.freeze({
  levelInterval: 5,
  introDuration: 1.65,
  warningDuration: 0.72,
  phaseTransitionDuration: 1.18,
  overload: Object.freeze({
    max: 100,
    blockedGain: 25,
    collisionGain: 30,
    hitDrain: 10,
    phaseDrain: 20,
  }),
  phases: Object.freeze([
    Object.freeze({
      id: 'armor',
      label: 'ARMADURA',
      hitsRequired: 6,
      orbitRadiusFactor: 1.62,
      targetRadius: 14,
      orbitSpeedMultiplier: 0.82,
    }),
    Object.freeze({
      id: 'exposed',
      label: 'EXPUESTO',
      hitsRequired: 4,
      orbitRadiusFactor: 1.23,
      targetRadius: 13,
      orbitSpeedMultiplier: 1.12,
    }),
    Object.freeze({
      id: 'core',
      label: 'NÚCLEO',
      hitsRequired: 3,
      orbitRadiusFactor: 0,
      targetRadius: 19,
      orbitSpeedMultiplier: 0,
    }),
  ]),
});

export const BOSS_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'firewall',
    name: 'FIREWALL',
    subtitle: 'EL GUARDIÁN',
    shape: 'circle',
    color: '#FF6B35',
    accent: '#FFD166',
    layerSpeed: 1.10,
    bodySpeed: 0.46,
    reverseEvery: 0,
  }),
  Object.freeze({
    id: 'triad',
    name: 'TRIAD',
    subtitle: 'CENTINELA DE TRES PUNTOS',
    shape: 'triangle',
    color: '#36C5F0',
    accent: '#8BE8FF',
    layerSpeed: 1.24,
    bodySpeed: 0.54,
    reverseEvery: 4.7,
  }),
  Object.freeze({
    id: 'dynamo',
    name: 'DYNAMO',
    subtitle: 'MOTOR DE ROTACIÓN',
    shape: 'square',
    color: '#7C83FF',
    accent: '#AEB3FF',
    layerSpeed: 1.36,
    bodySpeed: 0.62,
    reverseEvery: 4.25,
  }),
  Object.freeze({
    id: 'prism',
    name: 'PRISM',
    subtitle: 'ESTRELLA FRACTURADA',
    shape: 'star',
    color: '#C06CFF',
    accent: '#F0B8FF',
    layerSpeed: 1.48,
    bodySpeed: 0.72,
    reverseEvery: 3.9,
  }),
  Object.freeze({
    id: 'pentacore',
    name: 'PENTACORE',
    subtitle: 'MATRIZ QUÍNTUPLE',
    shape: 'pentagon',
    color: '#FF9F43',
    accent: '#FFD59A',
    layerSpeed: 1.60,
    bodySpeed: 0.78,
    reverseEvery: 3.6,
  }),
  Object.freeze({
    id: 'nexus',
    name: 'CORE NEXUS',
    subtitle: 'MANDO ORBITAL',
    shape: 'hexagon',
    color: '#5DD39E',
    accent: '#B6FFD9',
    layerSpeed: 1.72,
    bodySpeed: 0.86,
    reverseEvery: 3.35,
  }),
]);

function normalizeAngle(value) {
  let a = Number(value) || 0;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function createLayerNodes(count) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => ({
    index,
    alive: true,
  }));
}

const ARROW_HALF_LENGTH_FACTOR = 2.1;

function getProjectileTipAt(projectile, x, y) {
  const mag = Math.hypot(projectile?.vx ?? 0, projectile?.vy ?? 0);
  if (!Number.isFinite(mag) || mag <= 0) return { x, y };

  const nx = projectile.vx / mag;
  const ny = projectile.vy / mag;
  const offset = (Number(projectile.radius) || 0) * ARROW_HALF_LENGTH_FACTOR;

  return {
    x: x + nx * offset,
    y: y + ny * offset,
  };
}

function segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq <= 0) {
    return Math.hypot(x1 - cx, y1 - cy) <= radius;
  }

  const t = Math.min(
    1,
    Math.max(0, ((cx - x1) * dx + (cy - y1) * dy) / lenSq),
  );
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  return Math.hypot(px - cx, py - cy) <= radius;
}

export function isBossLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return safeLevel % BOSS_CONFIG.levelInterval === 0;
}

export function getBossNumber(level) {
  if (!isBossLevel(level)) return 0;
  return Math.max(1, Math.floor(Number(level) / BOSS_CONFIG.levelInterval));
}

export function getBossDefinition(level) {
  const number = getBossNumber(level);
  if (!number) return null;
  return BOSS_FAMILIES[(number - 1) % BOSS_FAMILIES.length];
}

export function getBossTarget(level) {
  if (!isBossLevel(level)) return null;
  return BOSS_CONFIG.phases.reduce((sum, phase) => sum + phase.hitsRequired, 0);
}

export function createInactiveBossState(level = 1) {
  return {
    active: false,
    level: Math.max(1, Math.floor(Number(level) || 1)),
    bossNumber: 0,
    id: null,
    name: null,
    subtitle: null,
    shape: null,
    color: '#FF9900',
    accent: '#FFD166',
    phaseIndex: 0,
    phaseHits: 0,
    totalHits: 0,
    health: 0,
    maxHealth: 0,
    layerAngle: -Math.PI / 2,
    layerDirection: 1,
    layerNodes: [],
    bodyAngle: 0,
    bodyDirection: 1,
    patternTimer: 0,
    warning: null,
    warningTimer: 0,
    phaseTransitionTimer: 0,
    phaseBreak: {
      active: false,
      timer: 0,
      duration: BOSS_CONFIG.phaseTransitionDuration,
      fromPhase: null,
      toPhase: null,
    },
    introTimer: 0,
    elapsed: 0,
    shots: 0,
    hits: 0,
    blockedShots: 0,
    overload: 0,
    perfectHits: 0,
    defeated: false,
    result: null,
  };
}

export function createBossState(level) {
  const def = getBossDefinition(level);
  if (!def) return createInactiveBossState(level);

  const maxHealth = getBossTarget(level);
  const firstPhase = BOSS_CONFIG.phases[0];

  return {
    active: true,
    level: Math.max(1, Math.floor(Number(level) || 1)),
    bossNumber: getBossNumber(level),
    id: def.id,
    name: def.name,
    subtitle: def.subtitle,
    shape: def.shape,
    color: def.color,
    accent: def.accent,
    phaseIndex: 0,
    phaseHits: 0,
    totalHits: 0,
    health: maxHealth,
    maxHealth,
    layerAngle: -Math.PI / 2,
    layerDirection: 1,
    layerNodes: createLayerNodes(firstPhase.hitsRequired),
    bodyAngle: 0,
    bodyDirection: 1,
    patternTimer: 0,
    warning: null,
    warningTimer: 0,
    phaseTransitionTimer: 0,
    phaseBreak: {
      active: false,
      timer: 0,
      duration: BOSS_CONFIG.phaseTransitionDuration,
      fromPhase: null,
      toPhase: null,
    },
    introTimer: BOSS_CONFIG.introDuration,
    elapsed: 0,
    shots: 0,
    hits: 0,
    blockedShots: 0,
    overload: 0,
    perfectHits: 0,
    defeated: false,
    result: null,
  };
}

export function prepareBossForLevel(state) {
  if (!state || typeof state !== 'object') return null;
  state.boss = createBossState(state.level);
  return state.boss;
}

export function ensureBossState(state) {
  if (!state || typeof state !== 'object') return null;

  const level = Math.max(1, Math.floor(Number(state.level) || 1));
  const shouldBeBoss = isBossLevel(level);
  const current = state.boss;

  if (
    !current ||
    typeof current !== 'object' ||
    Number(current.level) !== level ||
    Boolean(current.active) !== shouldBeBoss
  ) {
    state.boss = createBossState(level);
  }

  if (!Number.isFinite(Number(state.boss?.overload))) {
    state.boss.overload = 0;
  }

  return state.boss;
}

export function getBossPhase(state) {
  const boss = state?.boss;
  if (!boss?.active) return null;
  return BOSS_CONFIG.phases[boss.phaseIndex] ?? BOSS_CONFIG.phases[0];
}

/**
 * Posiciones actuales de las piezas vulnerables de la capa activa.
 * En ARMOR/EXPOSED son miniaturas de la forma del boss orbitando.
 * En CORE son capas concéntricas en el centro.
 */
export function getBossLayerTargets(state) {
  const boss = state?.boss;
  const ce = state?.centralElement;
  const phase = getBossPhase(state);

  if (!boss?.active || boss.defeated || !ce || !phase) return [];

  const aliveNodes = Array.isArray(boss.layerNodes)
    ? boss.layerNodes.filter(node => node.alive)
    : [];

  if (phase.id === 'core') {
    return aliveNodes.map((node, aliveIndex) => ({
      index: node.index,
      x: ce.x,
      y: ce.y,
      angle: 0,
      radius: phase.targetRadius + Math.max(0, aliveNodes.length - aliveIndex - 1) * 5,
      shape: 'circle',
      core: true,
      color: boss.accent,
    }));
  }

  const orbitRadius = ce.radius * phase.orbitRadiusFactor;
  const count = Math.max(1, boss.layerNodes.length);

  return aliveNodes.map(node => {
    const angle =
      boss.layerAngle +
      (Math.PI * 2 * node.index) / count;

    return {
      index: node.index,
      x: ce.x + Math.cos(angle) * orbitRadius,
      y: ce.y + Math.sin(angle) * orbitRadius,
      angle,
      radius: phase.targetRadius,
      orbitRadius,
      shape: boss.shape,
      core: false,
      color: boss.accent,
    };
  });
}


function makeDetachedArrow(ap, ce, index, count) {
  const distance = Number.isFinite(ap?.renderDistance)
    ? ap.renderDistance
    : Number(ap?.distance) || ce.radius;
  const angle = Number(ap?.angle) || 0;
  const x = ce.x + distance * Math.cos(angle);
  const y = ce.y + distance * Math.sin(angle);

  const spread = count > 1
    ? (index / (count - 1) - 0.5)
    : 0;

  // La expulsión lateral es intencionalmente moderada. Queremos que las
  // flechas "salten" fuera del boss, pero que luego TODAS puedan verse caer
  // hasta la parte inferior del canvas en vez de escaparse por los lados.
  const outward = 42 + (index % 4) * 7;

  return {
    x,
    y,
    vx: Math.cos(angle) * outward + spread * 18,
    vy: Math.sin(angle) * outward + 30 + (index % 3) * 8,
    rotation: angle - Math.PI / 2,
    spin: (index % 2 === 0 ? 1 : -1) * (2.0 + (index % 3) * 0.3),
    radius: Number(ap?.radius) || 22,
    awsIconId: ap?.awsIconId ?? 'lambda',
    age: 0,
  };
}


function deterministicJitter(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function makeBossLayerDebrisPieces(state, phase, finalBreak = false) {
  const boss = state?.boss;
  const ce = state?.centralElement;
  if (!boss?.active || !ce || !phase) return [];

  const pieces = [];
  const baseAngle = Number(boss.layerAngle) || 0;
  const bodyAngle = Number(boss.bodyAngle) || 0;

  if (phase.id === 'core') {
    // El núcleo final se rompe en varios fragmentos internos en vez de un
    // único círculo que desaparece. Al derrotar al boss añadimos algunos más.
    const count = finalBreak ? 14 : 10;
    for (let i = 0; i < count; i++) {
      const angle = bodyAngle + (Math.PI * 2 * i) / count;
      const ring = ce.radius * (0.18 + (i % 3) * 0.10);
      const x = ce.x + Math.cos(angle) * ring;
      const y = ce.y + Math.sin(angle) * ring;
      const speed = 70 + (i % 5) * 11;
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * speed + deterministicJitter(i + 31) * 22,
        vy: Math.sin(angle) * speed + 18 + (i % 4) * 7,
        rotation: angle,
        spin: (i % 2 === 0 ? 1 : -1) * (2.4 + (i % 4) * 0.45),
        radius: 7 + (i % 3) * 2,
        shape: i % 3 === 0 ? 'circle' : 'shard',
        color: boss.color,
        accent: boss.accent,
        age: 0,
      });
    }
    return pieces;
  }

  const nodeCount = Math.max(1, Number(phase.hitsRequired) || 1);
  const orbitRadius = ce.radius * (Number(phase.orbitRadiusFactor) || 1);

  // Además de los nodos destruidos, soltamos varios segmentos del aro/capa
  // que se acaba de romper. Esto evita el salto visual en el que el círculo
  // interior cambia de tamaño, pero el aro anterior parecía seguir intacto.
  const ringPieceCount = Math.max(4, Math.min(8, nodeCount));
  for (let i = 0; i < ringPieceCount; i++) {
    const angle = baseAngle + (Math.PI * 2 * i) / ringPieceCount;
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    const outwardX = Math.cos(angle);
    const outwardY = Math.sin(angle);
    const ringRadius = phase.id === 'armor' ? ce.radius : ce.radius * 0.78;
    const speed = 72 + (i % 3) * 11;
    pieces.push({
      x: ce.x + outwardX * ringRadius,
      y: ce.y + outwardY * ringRadius,
      vx: outwardX * speed + tangentX * (12 + (i % 2) * 6),
      vy: outwardY * speed + tangentY * 10 + 20,
      rotation: angle,
      spin: (i % 2 === 0 ? 1 : -1) * (1.8 + (i % 3) * 0.35),
      radius: Math.max(12, ce.radius * (phase.id === 'armor' ? 0.22 : 0.16)),
      thickness: Math.max(5, ce.radius * (phase.id === 'armor' ? 0.075 : 0.055)),
      arc: 0.7,
      shape: 'ringArc',
      color: boss.color,
      accent: boss.accent,
      age: 0,
    });
  }

  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    const nodeAngle = baseAngle + (Math.PI * 2 * nodeIndex) / nodeCount;
    const centerX = ce.x + Math.cos(nodeAngle) * orbitRadius;
    const centerY = ce.y + Math.sin(nodeAngle) * orbitRadius;

    // Dos fragmentos por pieza: uno conserva la silueta de la capa y otro
    // es un trozo irregular. Así se entiende que se rompió una estructura,
    // no que simplemente desapareció un marcador.
    for (let fragment = 0; fragment < 2; fragment++) {
      const seed = nodeIndex * 7 + fragment * 13 + (phase.id === 'armor' ? 1 : 19);
      const tangentX = -Math.sin(nodeAngle);
      const tangentY = Math.cos(nodeAngle);
      const outwardX = Math.cos(nodeAngle);
      const outwardY = Math.sin(nodeAngle);
      const lateral = deterministicJitter(seed) * 16;
      const speed = 58 + fragment * 24 + (nodeIndex % 3) * 7;

      pieces.push({
        x: centerX + tangentX * lateral * 0.35,
        y: centerY + tangentY * lateral * 0.35,
        vx: outwardX * speed + tangentX * lateral,
        vy: outwardY * speed + tangentY * lateral + 22 + fragment * 9,
        rotation: nodeAngle + fragment * 0.7,
        spin: (seed % 2 === 0 ? 1 : -1) * (2.1 + (nodeIndex % 4) * 0.35 + fragment * 0.4),
        radius: Math.max(5, Number(phase.targetRadius) * (fragment === 0 ? 0.72 : 0.48)),
        shape: fragment === 0 ? boss.shape : 'shard',
        color: boss.color,
        accent: boss.accent,
        age: 0,
      });
    }
  }

  return pieces;
}

function spawnBossLayerDebris(state, phase, finalBreak = false) {
  if (!state || !phase) return;
  if (!Array.isArray(state.detachedBossDebris)) {
    state.detachedBossDebris = [];
  }
  state.detachedBossDebris.push(
    ...makeBossLayerDebrisPieces(state, phase, finalBreak),
  );
}

function detachBossAnchoredArrows(state) {
  const ce = state?.centralElement;
  if (!state || !ce) return;

  const anchored = Array.isArray(state.anchoredProjectiles)
    ? state.anchoredProjectiles
    : [];

  if (!Array.isArray(state.detachedBossArrows)) {
    state.detachedBossArrows = [];
  }

  state.detachedBossArrows.push(
    ...anchored.map((ap, index) =>
      makeDetachedArrow(ap, ce, index, anchored.length),
    ),
  );

  state.anchoredProjectiles = [];
}

function beginBossPhaseBreak(state, fromPhase, toPhase) {
  const boss = state?.boss;
  const ce = state?.centralElement;
  if (!boss?.active || !ce) return;

  // Las flechas y los restos de la capa rota viven fuera de phaseBreak.
  // Por eso pueden seguir cayendo aunque la nueva fase ya haya empezado.
  detachBossAnchoredArrows(state);
  spawnBossLayerDebris(state, fromPhase);

  boss.phaseBreak = {
    active: true,
    timer: BOSS_CONFIG.phaseTransitionDuration,
    duration: BOSS_CONFIG.phaseTransitionDuration,
    fromPhase: fromPhase?.id ?? null,
    fromLabel: fromPhase?.label ?? 'LAYER',
    toPhase: toPhase?.id ?? null,
    toLabel: toPhase?.label ?? 'PHASE',
  };
  boss.phaseTransitionTimer = BOSS_CONFIG.phaseTransitionDuration;

  // La capa se rompe: dejan de ser obstáculos de gameplay inmediatamente.
  state.flyingProjectile = null;
  state.pendingLaunch = false;
}

export function isBossPhaseTransitionActive(state) {
  return Boolean(state?.boss?.phaseBreak?.active);
}

/**
 * Actualiza los restos visuales de forma completamente independiente de la
 * transición y del estado actual del boss. Cada flecha solo se elimina cuando
 * TODA su geometría ya pasó por debajo del canvas lógico.
 */
export function updateBossDetachedArrows(state, deltaTime) {
  if (!state || !Array.isArray(state.detachedBossArrows)) return;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return;

  const canvasWidth = 600;
  const canvasHeight = Math.max(
    700,
    (Number(state.uiLogicalHeight) || 700) -
      (Number(state.uiSceneOffsetY) || 0),
  );
  const gravity = 205;
  const sideMargin = 16;

  for (const arrow of state.detachedBossArrows) {
    arrow.age = (Number(arrow.age) || 0) + dt;
    arrow.vy = (Number(arrow.vy) || 0) + gravity * dt;
    arrow.x += (Number(arrow.vx) || 0) * dt;
    arrow.y += arrow.vy * dt;
    arrow.rotation += (Number(arrow.spin) || 0) * dt;

    // Mantener la animación visible. Si una flecha intenta escapar por un
    // lateral, rebota suavemente hacia dentro pero continúa cayendo.
    const extent = Math.max(24, (Number(arrow.radius) || 22) * 2.5);
    const minX = sideMargin + extent;
    const maxX = canvasWidth - sideMargin - extent;

    if (arrow.x < minX) {
      arrow.x = minX;
      arrow.vx = Math.abs(Number(arrow.vx) || 0) * 0.55;
    } else if (arrow.x > maxX) {
      arrow.x = maxX;
      arrow.vx = -Math.abs(Number(arrow.vx) || 0) * 0.55;
    }
  }

  state.detachedBossArrows = state.detachedBossArrows.filter(arrow => {
    // drawArrow ocupa bastante más que el radio del icono. Usar un margen
    // generoso evita eliminarla mientras todavía queda una parte visible.
    const visualExtent = Math.max(70, (Number(arrow.radius) || 22) * 3.8);
    return arrow.y - visualExtent <= canvasHeight;
  });
}


/**
 * Los fragmentos de armadura/núcleo comparten la misma filosofía que las
 * flechas desprendidas: siguen existiendo hasta salir completamente por abajo.
 */
export function updateBossDetachedDebris(state, deltaTime) {
  if (!state || !Array.isArray(state.detachedBossDebris)) return;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return;

  const canvasWidth = 600;
  const canvasHeight = Math.max(
    700,
    (Number(state.uiLogicalHeight) || 700) -
      (Number(state.uiSceneOffsetY) || 0),
  );
  const gravity = 235;
  const sideMargin = 10;

  for (const piece of state.detachedBossDebris) {
    piece.age = (Number(piece.age) || 0) + dt;
    piece.vy = (Number(piece.vy) || 0) + gravity * dt;
    piece.x += (Number(piece.vx) || 0) * dt;
    piece.y += piece.vy * dt;
    piece.rotation += (Number(piece.spin) || 0) * dt;

    const extent = Math.max(10, (Number(piece.radius) || 8) * 1.8);
    const minX = sideMargin + extent;
    const maxX = canvasWidth - sideMargin - extent;

    if (piece.x < minX) {
      piece.x = minX;
      piece.vx = Math.abs(Number(piece.vx) || 0) * 0.48;
    } else if (piece.x > maxX) {
      piece.x = maxX;
      piece.vx = -Math.abs(Number(piece.vx) || 0) * 0.48;
    }
  }

  state.detachedBossDebris = state.detachedBossDebris.filter(piece => {
    const visualExtent = Math.max(20, (Number(piece.radius) || 8) * 2.2);
    return piece.y - visualExtent <= canvasHeight;
  });
}

export function updateBossPhaseTransition(state, deltaTime) {
  const boss = state?.boss;
  const fx = boss?.phaseBreak;
  if (!boss?.active || !fx?.active) return false;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return true;

  fx.timer = Math.max(0, fx.timer - dt);
  boss.phaseTransitionTimer = fx.timer;

  if (fx.timer <= 0) {
    fx.active = false;
    fx.timer = 0;
    // Importante: NO se borran aquí las flechas desprendidas. Siguen
    // cayendo hasta abandonar la parte inferior de la pantalla.
    boss.phaseTransitionTimer = 0;
    return false;
  }

  return true;
}

export function getBossPhaseBreak(state) {
  return state?.boss?.phaseBreak ?? null;
}

export function updateBoss(state, deltaTime) {
  const boss = state?.boss;
  if (!boss?.active || boss.defeated) return null;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return boss;

  const def = getBossDefinition(boss.level);
  const phase = getBossPhase(state);
  if (!def || !phase) return boss;

  boss.elapsed += dt;
  boss.patternTimer += dt;
  // La corona vulnerable SIEMPRE mantiene el mismo sentido de giro.
  // Los patrones de reversal afectan únicamente al cuerpo/rotación central;
  // así todas las piezas terminarán pasando por la línea de disparo.
  const reversalEnabled = Number(def.reverseEvery) > 0;

  if (boss.warningTimer > 0) {
    boss.warningTimer = Math.max(0, boss.warningTimer - dt);

    if (boss.warningTimer === 0 && boss.warning) {
      boss.bodyDirection = (boss.bodyDirection ?? 1) * -1;
      if (state.centralElement) {
        state.centralElement.direction *= -1;
      }
      boss.warning = null;
    }
  } else if (
    reversalEnabled &&
    boss.patternTimer >= def.reverseEvery
  ) {
    boss.patternTimer = 0;
    boss.warning = 'BODY REVERSAL';
    boss.warningTimer = BOSS_CONFIG.warningDuration;
  }

  boss.bodyAngle +=
    def.bodySpeed * (boss.bodyDirection ?? 1) * dt;

  if (phase.id !== 'core') {
    boss.layerAngle +=
      def.layerSpeed *
      phase.orbitSpeedMultiplier *
      (boss.layerDirection ?? 1) *
      dt;
  }

  return boss;
}

export function updateBossIntro(state, deltaTime) {
  const boss = state?.boss;
  if (!boss?.active) return false;

  const dt = Number(deltaTime);
  if (!Number.isFinite(dt) || dt <= 0) return boss.introTimer <= 0;

  boss.introTimer = Math.max(0, boss.introTimer - dt);
  return boss.introTimer <= 0;
}

export function recordBossShot(state) {
  const boss = state?.boss;
  if (!boss?.active || boss.defeated) return;
  boss.shots += 1;
}

/**
 * Un disparo usado únicamente para recoger un Power Core durante un boss no
 * cuenta contra la precisión del combate. La flecha desaparece al recogerlo.
 */
export function refundBossUtilityShot(state) {
  const boss = state?.boss;
  if (!boss?.active || boss.defeated) return;
  boss.shots = Math.max(boss.hits, boss.shots - 1);
}

export function getBossOverload(state) {
  const boss = state?.boss;
  const max = BOSS_CONFIG.overload.max;
  const value = Math.max(0, Math.min(max, Number(boss?.overload) || 0));
  return {
    value,
    max,
    ratio: max > 0 ? value / max : 0,
    overloaded: value >= max,
  };
}

/**
 * En Boss Levels las colisiones ya no provocan Game Over instantáneo.
 * Los errores cargan OVERLOAD; al llegar al 100 % el boss gana el combate.
 */
export function recordBossBlockedShot(state, kind = 'blocked') {
  const boss = state?.boss;
  if (!boss?.active || boss.defeated) {
    return getBossOverload(state);
  }

  boss.blockedShots += 1;

  const gain = kind === 'collision'
    ? BOSS_CONFIG.overload.collisionGain
    : BOSS_CONFIG.overload.blockedGain;

  boss.overload = Math.min(
    BOSS_CONFIG.overload.max,
    Math.max(0, Number(boss.overload) || 0) + gain,
  );

  return {
    ...getBossOverload(state),
    added: gain,
    kind,
  };
}

/**
 * Detecta cuando el segmento recorrido por la flecha atraviesa una pieza
 * activa. No destruye todavía la pieza: la flecha debe terminar anclándose.
 */
export function checkBossLayerCrossing(
  state,
  flyingProjectile,
  previousX,
  previousY,
) {
  const boss = state?.boss;
  const phase = getBossPhase(state);

  if (
    !boss?.active ||
    boss.defeated ||
    !phase ||
    !flyingProjectile
  ) {
    return null;
  }

  // CORE queda completamente expuesto: en esa fase cualquier anchor válido
  // daña la capa interna actual. No exigimos que el centro geométrico de la
  // flecha atraviese el centro, porque collision.js ancla por la punta al
  // tocar el radio físico del boss.
  if (phase.id === 'core') return null;

  const existing = flyingProjectile.bossLayerLock;
  if (existing?.phaseIndex === boss.phaseIndex) return null;

  // collision.js decide el anchor usando la PUNTA de la flecha. La capa
  // EXPOSED está más cerca del cuerpo que el centro geométrico de la flecha
  // en el instante del anchor, así que detectar con el centro hacía que nunca
  // pudiera bloquearse esa capa. Usamos exactamente la misma geometría de
  // punta (2.1 × radius) para que lo que se ve golpeado sea lo que cuenta.
  const previousTip = getProjectileTipAt(
    flyingProjectile,
    previousX,
    previousY,
  );
  const currentTip = getProjectileTipAt(
    flyingProjectile,
    flyingProjectile.x,
    flyingProjectile.y,
  );

  const targets = getBossLayerTargets(state);
  for (const target of targets) {
    // Tolerancia pequeña para que el borde visible de la pieza cuente, sin
    // convertir el objetivo en una hitbox mucho mayor a su dibujo.
    const hitRadius = target.radius + flyingProjectile.radius * 0.12;
    const hit = segmentIntersectsCircle(
      previousTip.x,
      previousTip.y,
      currentTip.x,
      currentTip.y,
      target.x,
      target.y,
      hitRadius,
    );

    if (!hit) continue;

    flyingProjectile.bossLayerLock = {
      phaseIndex: boss.phaseIndex,
      phaseId: phase.id,
      nodeIndex: target.index,
      x: target.x,
      y: target.y,
    };

    return {
      hit: true,
      phase: phase.id,
      nodeIndex: target.index,
      x: target.x,
      y: target.y,
      color: boss.accent,
    };
  }

  return null;
}

/**
 * El impacto final al llegar al boss solo es válido si antes atravesó una
 * pieza de la capa actual. Así no hay un "circulito HIT" arbitrario.
 */
export function evaluateBossImpact(state, flyingProjectile) {
  const boss = state?.boss;

  if (!boss?.active || boss.defeated || !flyingProjectile) {
    return { boss: false, hit: true };
  }

  const phase = getBossPhase(state);

  if (phase?.id === 'core') {
    const nextCoreLayer = boss.layerNodes.find(item => item.alive);
    return {
      boss: true,
      hit: Boolean(nextCoreLayer),
      phase: 'core',
      nodeIndex: nextCoreLayer?.index ?? null,
      lock: null,
    };
  }

  const lock = flyingProjectile.bossLayerLock;
  const node = Array.isArray(boss.layerNodes)
    ? boss.layerNodes.find(item => item.index === lock?.nodeIndex)
    : null;

  const hit = Boolean(
    lock &&
    lock.phaseIndex === boss.phaseIndex &&
    node?.alive,
  );

  return {
    boss: true,
    hit,
    phase: phase?.id ?? 'armor',
    nodeIndex: hit ? lock.nodeIndex : null,
    lock: hit ? lock : null,
  };
}

function buildBossResult(state) {
  const boss = state.boss;
  const accuracy = boss.shots > 0 ? boss.hits / boss.shots : 1;
  const targetTime = 48;
  const timeScore = Math.max(
    0,
    Math.min(25, 25 - Math.max(0, boss.elapsed - targetTime) * 0.48),
  );
  const accuracyScore = Math.max(0, Math.min(55, accuracy * 55));
  const perfectScore = Math.max(0, Math.min(20, boss.perfectHits * 5));
  const total = Math.round(accuracyScore + timeScore + perfectScore);

  let rank = 'D';
  if (total >= 90) rank = 'S';
  else if (total >= 80) rank = 'A';
  else if (total >= 68) rank = 'B';
  else if (total >= 55) rank = 'C';

  const rankBonus = {
    S: 40,
    A: 30,
    B: 22,
    C: 15,
    D: 10,
  }[rank];

  const bonus = 20 + boss.bossNumber * 5 + rankBonus;

  return {
    rank,
    score: total,
    bonus,
    accuracy: Math.round(accuracy * 100),
    time: Number(boss.elapsed.toFixed(1)),
    shots: boss.shots,
    hits: boss.hits,
    blocked: boss.blockedShots,
    perfectHits: boss.perfectHits,
    bossName: boss.name,
    bossNumber: boss.bossNumber,
  };
}

export function registerBossHit(state, options = {}) {
  const boss = state?.boss;
  if (!boss?.active || boss.defeated) {
    return {
      hit: false,
      phaseChanged: false,
      defeated: false,
      result: null,
    };
  }

  const phaseBefore = getBossPhase(state);
  const nodeIndex = Number(options.nodeIndex);
  const node = boss.layerNodes.find(item => item.index === nodeIndex);

  if (!node?.alive) {
    return {
      hit: false,
      phaseChanged: false,
      defeated: false,
      result: null,
    };
  }

  node.alive = false;
  boss.hits += 1;
  boss.totalHits += 1;
  boss.phaseHits += 1;
  boss.health = Math.max(0, boss.maxHealth - boss.totalHits);
  boss.overload = Math.max(
    0,
    (Number(boss.overload) || 0) - BOSS_CONFIG.overload.hitDrain,
  );

  if (options.perfect) boss.perfectHits += 1;

  if (boss.health <= 0) {
    // El último núcleo también se rompe físicamente: fragmentos y flechas
    // continúan cayendo detrás de la pantalla de resultado.
    spawnBossLayerDebris(state, phaseBefore, true);
    detachBossAnchoredArrows(state);
    boss.defeated = true;
    boss.result = buildBossResult(state);
    return {
      hit: true,
      phaseChanged: false,
      phase: phaseBefore?.id ?? 'core',
      defeated: true,
      result: boss.result,
      destroyedNodeIndex: nodeIndex,
    };
  }

  const aliveRemaining = boss.layerNodes.some(item => item.alive);
  let phaseChanged = false;

  if (
    !aliveRemaining &&
    boss.phaseIndex < BOSS_CONFIG.phases.length - 1
  ) {
    boss.phaseIndex += 1;
    boss.phaseHits = 0;
    const nextPhase = getBossPhase(state);
    boss.layerNodes = createLayerNodes(nextPhase.hitsRequired);
    boss.layerAngle = normalizeAngle(
      boss.layerAngle + Math.PI / Math.max(2, nextPhase.hitsRequired),
    );
    boss.patternTimer = 0;
    boss.warning = null;
    boss.warningTimer = 0;
    boss.overload = Math.max(
      0,
      (Number(boss.overload) || 0) - BOSS_CONFIG.overload.phaseDrain,
    );
    beginBossPhaseBreak(state, phaseBefore, nextPhase);
    phaseChanged = true;
  }

  return {
    hit: true,
    phaseChanged,
    phase: getBossPhase(state)?.id ?? 'armor',
    defeated: false,
    result: null,
    destroyedNodeIndex: nodeIndex,
  };
}

export function getBossPhaseProgress(state) {
  const boss = state?.boss;
  const phase = getBossPhase(state);
  if (!boss?.active || !phase) return { hits: 0, target: 0 };

  const alive = Array.isArray(boss.layerNodes)
    ? boss.layerNodes.filter(node => node.alive).length
    : phase.hitsRequired;

  return {
    hits: Math.max(0, phase.hitsRequired - alive),
    target: phase.hitsRequired,
    remaining: alive,
  };
}
