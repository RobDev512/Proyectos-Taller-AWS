# Design Document — AWS Arcade Game v1.3.0

## Power-Ups Update

## Overview

La v1.3.0 añade Power-Ups sin alterar el control de una sola acción ni reemplazar los sistemas existentes.

El sistema se implementará como una capa adicional sobre el Game Loop actual.

Los Power-Ups estarán asociados a proyectiles individuales mediante `powerUpType`.

La lógica principal vivirá en un nuevo módulo:

`powerups.js`

El módulo administrará:

- generación,
- elegibilidad,
- activación,
- timers,
- Shield,
- Double Score,
- Cleanup,
- reset de estado.

---

# Architecture

## Current modules involved

```text
state.js
projectile.js
gameLoop.js
renderer.js
collision.js
scoring.js
combo.js
precision.js
feedback.js
particles.js
sound.js
stats.js
levels.js
config.js
```

## New module

```text
powerups.js
```

Dependencias principales:

```text
state.js
   ↓
powerups.js
   ↓
projectile.js
   ↓
gameLoop.js
   ├── scoring
   ├── combo
   ├── precision
   ├── levels
   ├── feedback
   ├── particles
   └── sound
   ↓
renderer.js
```

---

# Power-Up Types

```js
export const POWER_UP_TYPES = {
  FREEZE: 'freeze',
  SHIELD: 'shield',
  DOUBLE: 'double',
  CLEANUP: 'cleanup',
};
```

Configuración:

```js
export const POWER_UP_CONFIG = {
  minLevel: 2,
  spawnChance: 0.16,

  freezeDuration: 2.0,
  shieldMaxCharges: 1,
  doubleScoreHits: 3,

  colors: {
    freeze:  '#36C5F0',
    shield:  '#7C83FF',
    double:  '#FFD166',
    cleanup: '#5DD39E',
  },

  labels: {
    freeze:  'FRZ',
    shield:  'SHD',
    double:  '2X',
    cleanup: 'CLR',
  },
};
```

---

# GameState additions

`state.js` deberá añadir:

```js
nextPowerUp: null,

activePowerUps: {
  freezeTimer: 0,
  shieldCharges: 0,
  doubleScoreHits: 0,
},

lastPreparedWasPowerUp: false,
```

`nextPowerUp` representa el Power-Up asociado a la próxima flecha preparada.

---

# FlyingProjectile extension

`FlyingProjectile` añadirá:

```js
powerUpType: null | 'freeze' | 'shield' | 'double' | 'cleanup'
```

Ejemplo:

```js
state.flyingProjectile = {
  x,
  y,
  vx,
  vy,
  radius,
  awsIconId,
  powerUpType,
};
```

La flecha conserva siempre su `awsIconId`.

---

# Power-Up generation

## Eligibility

Función propuesta:

```js
export function getEligiblePowerUps(state)
```

Reglas:

### Freeze

Elegible cuando:

```js
state.activePowerUps.freezeTimer <= 0
```

### Shield

Elegible cuando:

```js
state.activePowerUps.shieldCharges === 0
```

### Double Score

Elegible cuando:

```js
state.activePowerUps.doubleScoreHits === 0
```

### Cleanup

Elegible cuando:

```js
state.anchoredProjectiles.length >= 2
```

---

## Power-Up Roll

Función propuesta:

```js
export function rollNextPowerUp(state)
```

Flujo:

```text
Level < 2
    ↓
normal

Last arrow was Power-Up
    ↓
normal

Random >= 0.16
    ↓
normal

Obtener Power-Ups elegibles
    ↓
lista vacía → normal

Seleccionar uno aleatoriamente
```

---

# Power-Up activation

Función central:

```js
export function activatePowerUp(state, type)
```

Retorna información para feedback:

```js
{
  type,
  activated: true,
  removedProjectile: null
}
```

Para Cleanup:

```js
{
  type: 'cleanup',
  activated: true,
  removedProjectile
}
```

---

# Freeze design

Freeze no debe modificar permanentemente velocidad ni dirección.

Durante `phase === 'playing'`:

```js
if (state.activePowerUps.freezeTimer > 0) {
  updatePowerUps(state, deltaTime);
  // no updateRotation()
} else {
  updateRotation(state, deltaTime, progression);
}
```

El timer:

```js
freezeTimer = Math.max(0, freezeTimer - deltaTime);
```

Durante `levelcomplete`:

- no disminuir timer,
- la transición puede continuar con la animación normal del disco,
- cuando comience el siguiente nivel, Freeze continúa con el tiempo restante.

---

# Shield design

La detección normal permanece intacta:

```js
const result = checkCollision(state);
```

Luego:

```text
result === collision
        ↓
shieldCharges > 0 ?
   │
   ├── sí → consume Shield
   │         elimina flyingProjectile
   │         reset combo
   │         continúa playing
   │
   └── no → Game Over normal
```

Función:

```js
export function consumeShield(state)
```

Resultado:

```js
true | false
```

`collision.js` NO deberá modificarse para Shield.

La hitbox seguirá siendo:

```js
fp.radius * 0.35
```

---

# Double Score design

La lógica actual calcula:

```text
base point
+
Perfect Shot
+
Combo
=
gained
```

Durante Double Score:

```js
const gainedBeforeDouble = state.score - scoreBefore;
```

Si:

```js
state.activePowerUps.doubleScoreHits > 0
```

entonces:

```js
state.score += gainedBeforeDouble;
state.activePowerUps.doubleScoreHits -= 1;
updateHighScore(state);
```

Orden requerido:

```text
Anchor
↓
Base Score
↓
Perfect Shot
↓
Combo
↓
Double Score
↓
Power-Up activation of current arrow
↓
Tier progression
↓
Level completion
```

Esto garantiza que una flecha que activa Double Score NO se duplica a sí misma.

Level Complete Bonus ocurre después y no se duplica.

---

# Cleanup design

Antes de activar Cleanup, la nueva Power-Up Arrow ya estará anclada.

El proyectil más antiguo se encuentra al inicio de:

```js
state.anchoredProjectiles
```

Cleanup deberá eliminar:

```js
state.anchoredProjectiles.shift()
```

pero únicamente un proyectil que existía antes de la Power-Up Arrow.

La Power-Up Arrow recién añadida está al final del array y nunca deberá ser eliminada por su propio Cleanup.

La eliminación:

- no reduce score,
- no reduce levelHits,
- no modifica accuracy,
- no modifica hits.

---

# Power-Up projectile preparation

`projectile.js` deberá copiar:

```js
const powerUpType = state.nextPowerUp;
```

al crear `flyingProjectile`.

Luego preparará el siguiente Power-Up mediante:

```js
state.nextPowerUp = rollNextPowerUp(state);
```

La implementación deberá garantizar la regla de no Power-Ups consecutivos.

---

# Renderer

## Ready Arrow

`drawReadyArrow()` seguirá dibujando la flecha normal.

Si:

```js
state.nextPowerUp !== null
```

dibujará además un Power-Up Badge.

---

## Flying Arrow

`drawFlyingProjectile()` deberá utilizar:

```js
fp.powerUpType
```

para mostrar el mismo indicador durante el vuelo.

---

## Power-Up Badge

Función propuesta:

```js
drawPowerUpMarker(ctx, x, y, radius, type)
```

Diseño:

```text
Freeze    FRZ   cyan
Shield    SHD   violet
Double    2X    yellow
Cleanup   CLR   green
```

El indicador será un pequeño badge adicional y no reemplazará el icono AWS.

---

# Active Power-Up HUD

Nueva función propuesta:

```js
drawPowerUpStatus(ctx, state, canvasW)
```

Ejemplos:

```text
FRZ 1.4s
SHD ×1
2X ×3
```

Cleanup no aparece porque es instantáneo.

Posición inicial propuesta:

```text
debajo de Level Progress
```

Si existe al menos un Active Effect:

```text
Level progress
Power-Up status row
Combo badge
```

Si no existe:

```text
Level progress
Combo badge en posición normal
```

La posición del Combo deberá ajustarse dinámicamente para evitar solapamientos.

---

# Visual feedback

Al activar Power-Up:

```js
emitBanner('POWER-UP', label)
```

y:

```js
emitImpact(...)
emitRing(...)
emitFloatingText(...)
```

según configuración de Visual Effects.

Ejemplos:

```text
FREEZE!
SHIELD READY!
DOUBLE SCORE!
CLEANUP!
```

Shield Save:

```text
SHIELD SAVE!
```

---

# Sound

`sound.js` añadirá:

```js
playSoundPowerUp(type)
playSoundShieldSave()
```

No será necesario cargar archivos externos; se utilizará el sistema actual de sonido generado por Web Audio.

---

# Statistics

`stats.js` añadirá a `defaults()`:

```js
powerUpsCollected: 0,
shieldSaves: 0,
```

Funciones:

```js
recordPowerUp(stats)
recordShieldSave(stats)
```

La función actual `sanitize()` ya permite migrar estadísticas antiguas usando defaults.

---

# Settings statistics UI

La sección de estadísticas existente deberá añadir:

```text
Power-Ups
Shield Saves
```

sin eliminar ninguna estadística previa.

---

# Lifecycle

## New Game

```js
activePowerUps = {
  freezeTimer: 0,
  shieldCharges: 0,
  doubleScoreHits: 0,
}
```

y:

```js
nextPowerUp = null;
lastPreparedWasPowerUp = false;
```

---

## Level Complete

Los efectos activos se conservan.

Timers basados en tiempo no disminuyen durante la transición.

---

## Game Over

Los efectos dejan de tener efecto inmediatamente.

El nuevo estado creado mediante Play Again comienza limpio.

---

# Error Handling

| Situation | Behavior |
|---|---|
| Unknown `powerUpType` | Ignorar y continuar como flecha normal |
| No eligible Power-Ups | Generar Normal Arrow |
| Cleanup sin objetivo válido | No eliminar ninguna flecha |
| Freeze Timer negativo | Clamp a 0 |
| Shield Charges > 1 | Clamp a 1 |
| Double Score Hits negativo | Clamp a 0 |
| Datos antiguos de stats | Inicializar nuevos campos a 0 |

---

# Correctness Properties

## Property 1 — No Power-Ups consecutivos

For any Power-Up Arrow preparada, la siguiente flecha preparada SHALL ser una Normal Arrow.

Validates Requirement 1.3.

---

## Property 2 — Power-Up solo por anclaje exitoso

For any Power-Up Arrow que no alcance un anclaje exitoso, el estado de Active Power-Ups SHALL permanecer sin cambios.

Validates Requirement 3.1 y 3.2.

---

## Property 3 — Freeze no altera velocidad base

For any Freeze activation, cuando `freezeTimer` vuelva a 0, la velocidad del Central Element SHALL volver a estar determinada exclusivamente por progression y difficulty.

Validates Requirement 4.6 y 4.7.

---

## Property 4 — Shield evita exactamente una derrota

For any state con `shieldCharges = 1`, la primera Collision SHALL reducir `shieldCharges` a 0 y SHALL NOT producir Game Over.

Una Collision posterior sin Shield SHALL producir Game Over normalmente.

Validates Requirement 5.

---

## Property 5 — Double Score duplica únicamente puntos del tiro

For any successful shot con ganancia normal G y Double Score activo, la ganancia total SHALL ser exactamente `2 × G`, excluyendo Level Complete Bonus.

Validates Requirement 6.

---

## Property 6 — Cleanup no modifica progreso

For any Cleanup activation, `score`, `levelHits` y estadísticas acumuladas SHALL conservar su valor excepto por los puntos normales obtenidos por la Power-Up Arrow.

Validates Requirement 7.

---

## Property 7 — Hitbox invariante

For all normal collisions and Power-Up collisions, `collision.js` SHALL continuar utilizando:

`fp.radius * 0.35`

Validates Requirement 13.3.

---

# Version

```text
APP_VERSION = 1.3.0
APP_CODENAME = Power-Ups Update
```
