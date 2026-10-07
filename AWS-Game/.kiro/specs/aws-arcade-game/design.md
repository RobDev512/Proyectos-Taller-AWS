# Design Document — AWS Arcade Game

## Overview

Un juego arcade web de temática AWS que corre íntegramente en el navegador como archivos estáticos (HTML + CSS + JS nativo ES6+). El jugador lanza iconos de servicios AWS hacia un elemento circular central en rotación continua. Cada impacto exitoso ancla el proyectil y suma un punto; si el proyectil en vuelo choca con uno ya anclado, la partida termina. No se usan frameworks ni librerías externas.

---

## Architecture

El juego sigue una arquitectura **Game Loop** clásica de un solo hilo, ejecutada sobre un único `<canvas>`. La lógica se organiza en módulos ES6 con responsabilidades bien delimitadas:

```
index.html
├── style.css              ← Layout, tipografía AWS, pantallas modales
└── main.js                ← Punto de entrada; inicializa y conecta módulos
    ├── gameLoop.js        ← requestAnimationFrame loop: update + render
    ├── state.js           ← Estado global inmutable por referencia (GameState)
    ├── centralElement.js  ← Lógica de rotación del elemento central
    ├── projectile.js      ← Creación, vuelo y anclaje de proyectiles
    ├── collision.js       ← Detección de colisiones por distancia
    ├── scoring.js         ← Score y High Score en memoria
    ├── input.js           ← Captura y filtrado de eventos de entrada
    ├── renderer.js        ← Dibujado del canvas en cada frame
    └── ui.js              ← Gestión del HUD y pantalla de Game Over
```

**Flujo de datos (por frame):**

```
Input Events → state.pendingLaunch
     ↓
gameLoop.update(deltaTime)
  ├── centralElement.update(state, deltaTime)   ← rota el centro y anclados
  ├── projectile.update(state, deltaTime)        ← avanza proyectil en vuelo
  ├── collision.check(state)                     ← detecta colisiones/anclaje
  └── scoring.sync(state)                        ← actualiza score/highScore
     ↓
gameLoop.render(state)
  └── renderer.draw(canvas, state)
```

---

## Components

### 1. `GameState` (state.js)

Objeto central de verdad única. Todos los módulos lo leen y escriben a través de funciones puras o mutaciones controladas.

```js
/**
 * @typedef {Object} GameState
 * @property {'idle'|'playing'|'gameover'} phase
 * @property {number} score
 * @property {number} highScore
 * @property {CentralElement} centralElement
 * @property {FlyingProjectile|null} flyingProjectile
 * @property {AnchoredProjectile[]} anchoredProjectiles
 * @property {boolean} pendingLaunch
 * @property {number} gameOverTimestamp   // ms desde epoch al detectar colisión
 */

/** Crea un GameState con valores iniciales para una nueva partida. */
export function createInitialState(highScore = 0) { /* ... */ }
```

### 2. `CentralElement` (centralElement.js)

Representa el disco giratorio central.

```js
/**
 * @typedef {Object} CentralElement
 * @property {number} x          // Centro en píxeles del canvas
 * @property {number} y
 * @property {number} radius     // Radio del disco
 * @property {number} angle      // Ángulo actual en radianes
 * @property {number} speed      // Radianes por segundo (configurable)
 */

/**
 * Avanza la rotación del elemento central y de todos los proyectiles anclados.
 * @param {GameState} state
 * @param {number} deltaTime  segundos transcurridos desde el último frame
 */
export function updateRotation(state, deltaTime) {
  const delta = state.centralElement.speed * deltaTime;
  state.centralElement.angle += delta;
  for (const ap of state.anchoredProjectiles) {
    ap.angle += delta;   // mantiene posición relativa
  }
}
```

### 3. `Projectile` (projectile.js)

```js
/**
 * @typedef {Object} FlyingProjectile
 * @property {number} x
 * @property {number} y
 * @property {number} vx   // Velocidad en px/s
 * @property {number} vy
 * @property {number} radius
 * @property {string} awsIconId   // e.g. 'lambda', 's3', 'ec2'
 */

/**
 * @typedef {Object} AnchoredProjectile
 * @property {number} angle      // Ángulo polar respecto al centro del disco
 * @property {number} distance   // Distancia radial fija desde el centro del disco
 * @property {number} radius
 * @property {string} awsIconId
 */

/** Lanza un nuevo proyectil desde la base del canvas hacia el centro del disco. */
export function launchProjectile(state, config) { /* ... */ }

/**
 * Avanza la posición del proyectil en vuelo.
 * @param {GameState} state
 * @param {number} deltaTime
 */
export function advanceProjectile(state, deltaTime) { /* ... */ }

/**
 * Convierte el proyectil en vuelo en un AnchoredProjectile en el punto de impacto.
 * Incrementa el score y borra flyingProjectile.
 */
export function anchorProjectile(state) { /* ... */ }
```

### 4. `Collision` (collision.js)

Detección basada en distancia entre círculos (sin AABB ni polígonos).

```js
/**
 * Comprueba si el proyectil en vuelo colisiona con algún anclado
 * o ha alcanzado el perímetro del disco.
 *
 * @param {GameState} state
 * @returns {'none'|'anchor'|'collision'}
 */
export function checkCollision(state) {
  if (!state.flyingProjectile) return 'none';

  const fp = state.flyingProjectile;
  const ce = state.centralElement;

  // ¿Alcanzó el perímetro?
  const distToCenter = Math.hypot(fp.x - ce.x, fp.y - ce.y);
  if (distToCenter <= ce.radius + fp.radius) {
    // ¿Choca con algún anclado?
    for (const ap of state.anchoredProjectiles) {
      const apX = ce.x + ap.distance * Math.cos(ap.angle);
      const apY = ce.y + ap.distance * Math.sin(ap.angle);
      const d = Math.hypot(fp.x - apX, fp.y - apY);
      if (d < fp.radius + ap.radius) return 'collision';
    }
    return 'anchor';
  }
  return 'none';
}
```

### 5. `Scoring` (scoring.js)

```js
/**
 * Incrementa el Score del estado actual.
 * @param {GameState} state
 */
export function incrementScore(state) {
  state.score += 1;
  if (state.score > state.highScore) {
    state.highScore = state.score;
  }
}

/**
 * Congela el High Score en el estado para que persista en la siguiente partida.
 * @param {GameState} state
 * @returns {number} highScore que debe pasarse al nuevo estado
 */
export function captureHighScore(state) {
  return Math.max(state.score, state.highScore);
}
```

### 6. `Input` (input.js)

```js
/**
 * Registra listeners de `keydown` (Space) y `click` sobre el canvas.
 * Solo activa pendingLaunch cuando phase === 'playing' y flyingProjectile === null.
 * Cualquier otra entrada es ignorada.
 */
export function registerInputHandlers(canvas, state) { /* ... */ }
```

### 7. `Renderer` (renderer.js)

Dibuja en cada frame mediante la Canvas 2D API. Aplica la paleta de colores AWS (#FF9900 naranja, #232F3E azul oscuro, #FFFFFF blanco) y los iconos AWS en SVG embebidos como imágenes pre-cargadas.

```js
/** Dibuja el frame completo: fondo, disco, anclados y proyectil en vuelo. */
export function render(ctx, state, assets) { /* ... */ }
```

### 8. `UI` (ui.js)

Gestiona el HUD (score + high score superpuestos en canvas) y el overlay modal de Game Over en el DOM.

```js
export function updateHUD(scoreEl, highScoreEl, state) { /* ... */ }
export function showGameOver(overlayEl, state) { /* ... */ }
export function hideGameOver(overlayEl) { /* ... */ }
```

### 9. `GameLoop` (gameLoop.js)

```js
/**
 * Arranca el bucle principal.
 * En cada frame:
 *   1. Calcula deltaTime (segundos, con cap en 0.1 s para evitar spirales de física).
 *   2. Llama a update(state, deltaTime).
 *   3. Llama a render(ctx, state, assets).
 */
export function startGameLoop(ctx, state, assets, config) { /* ... */ }
```

---

## Data Models

### Config (constantes de configuración)

```js
export const CONFIG = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  CENTRAL_RADIUS: 80,            // px
  CENTRAL_SPEED: 1.2,            // rad/s
  PROJECTILE_RADIUS: 18,         // px
  PROJECTILE_SPEED: 380,         // px/s
  GAMEOVER_DISPLAY_DELAY: 500,   // ms
  AWS_ICONS: ['lambda', 's3', 'ec2', 'dynamodb', 'sqs', 'sns', 'rds', 'cloudwatch'],
};
```

### Ciclo de vida del Proyectil

```
[ready]  → launch() → [flying] → anchor event → [anchored]
                               ↘ collision event → [game_over]
```

### Ciclo de vida del Juego

```
[idle] → start() → [playing] → collision → [gameover] → restart() → [playing]
```

---

## Interfaces

### Comunicación entre módulos

Todos los módulos reciben `state` por referencia y producen efectos sobre él. No existen callbacks privados entre módulos; el `gameLoop` actúa como coordinador único.

### API pública expuesta en `main.js`

```js
// Para uso en tests (acceso al estado interno)
window.__GAME_STATE__ = state;   // solo en modo desarrollo
```

---

## Error Handling

| Situación | Comportamiento |
|---|---|
| `deltaTime` > 100 ms | Se recorta a 100 ms para evitar tunneling de físicas |
| Proyectil sale del canvas sin impactar | Se descarta silenciosamente; se genera uno nuevo |
| `requestAnimationFrame` no disponible | Advertencia en consola; el juego no arranca |
| Imagen de icono AWS no carga | Se sustituye por un círculo de color degradado |
| Score overflow (> Number.MAX_SAFE_INTEGER) | Imposible en práctica; no se maneja |

---

## Visual Design (AWS Theme)

**Paleta de colores:**
- Fondo del canvas: `#232F3E` (AWS Squid Ink)
- Elemento central: `#FF9900` (AWS Orange)
- Proyectil ready: `#FFFFFF` con borde `#FF9900`
- Proyectil en vuelo: `#FF9900`
- Texto HUD: `#FFFFFF` / `#FF9900`

**Tipografía:** `Amazon Ember` (web font embebida vía `@font-face` desde archivos locales) con fallback `Arial, sans-serif`.

**Iconos AWS:** SVG inline precargados como `Image` objects en el objeto `assets`. Cada `AnchoredProjectile` y `FlyingProjectile` lleva un `awsIconId` que el renderer usa para seleccionar la imagen correcta.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Rotación proporcional al tiempo

*For any* deltaTime positivo aplicado al Central Element en estado `playing`, el incremento del ángulo del Central Element SHALL ser exactamente `speed * deltaTime` radianes.

**Validates: Requirements 2.1**

---

### Property 2: Co-rotación de proyectiles anclados

*For any* conjunto de Anchored Projectiles y cualquier deltaTime positivo, tras aplicar `updateRotation`, el ángulo de cada Anchored Projectile SHALL haberse incrementado en la misma cantidad que el ángulo del Central Element (preservando sus posiciones relativas).

**Validates: Requirements 2.3**

---

### Property 3: Filtrado de entradas inválidas

*For any* evento de entrada que no sea `keydown(Space)` ni `click` en el canvas, el GameState SHALL permanecer sin cambios (no se activa `pendingLaunch` ni se altera ningún otro campo de estado).

**Validates: Requirements 3.2**

---

### Property 4: Movimiento rectilíneo uniforme del proyectil

*For any* FlyingProjectile y cualquier deltaTime positivo, la posición del proyectil después de `advanceProjectile` SHALL satisfacer `new_x = old_x + vx * deltaTime` y `new_y = old_y + vy * deltaTime`, y el vector de velocidad (vx, vy) SHALL permanecer constante.

**Validates: Requirements 3.4**

---

### Property 5: Incremento unitario del score en cada anclaje

*For any* GameState con score = N, cuando ocurre un evento de anclaje exitoso, el score posterior SHALL ser exactamente N + 1.

**Validates: Requirements 4.2**

---

### Property 6: Detección de colisión por superposición de hitboxes

*For any* posición del FlyingProjectile y cualquier conjunto de Anchored Projectiles, `checkCollision` SHALL retornar `'collision'` si y solo si la distancia entre el centro del FlyingProjectile y el centro de algún AnchoredProjectile es estrictamente menor que la suma de sus radios.

**Validates: Requirements 5.1**

---

### Property 7: Pantalla de Game Over muestra el score final correcto

*For any* valor de score S al momento de la Collision, la Game Over Screen SHALL mostrar exactamente S como score final.

**Validates: Requirements 6.1**

---

### Property 8: Actualización del High Score cuando el score lo supera

*For any* par (score S, highScore H) donde S > H, tras el fin de la partida el campo `highScore` del estado SHALL ser igual a S.

**Validates: Requirements 6.3, 9.3**

---

### Property 9: Preservación del High Score tras reinicio

*For any* valor de High Score H almacenado en el estado al momento del reinicio, el GameState resultante de la nueva partida SHALL tener `highScore = H`.

**Validates: Requirements 7.2, 9.2**

---

### Property 10: Actualización inmediata del HUD al cambiar el score

*For any* transición de score de N a N+1, el elemento DOM del score SHALL reflejar el valor N+1 en el mismo frame en que ocurre el cambio (sin pasar por ningún frame intermedio con valor N).

**Validates: Requirements 8.3**

---

### Property 11: Invariante de monotonicidad del High Score

*For any* secuencia de partidas con scores [S₁, S₂, …, Sₙ] jugadas durante la misma Session, el High Score al final SHALL ser igual a `max(S₁, S₂, …, Sₙ)` y NUNCA SHALL disminuir entre partidas consecutivas.

**Validates: Requirements 9.2, 9.3**
