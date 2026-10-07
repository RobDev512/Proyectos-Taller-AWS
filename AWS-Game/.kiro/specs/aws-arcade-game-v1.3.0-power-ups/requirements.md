# Requirements Document — AWS Arcade Game v1.3.0

## Power-Ups Update

## Introduction

La versión `v1.3.0 - Power-Ups Update` amplía AWS Arcade Game con un sistema de Power-Ups integrado en la mecánica actual de lanzamiento de flechas.

La actualización SHALL conservar el control de una sola acción del juego: el Player no tendrá que presionar botones adicionales para utilizar Power-Ups. Los Power-Ups aparecerán asociados a ciertas flechas y se activarán automáticamente cuando dichas flechas sean ancladas exitosamente al Central Element.

La actualización SHALL integrarse con los sistemas existentes de niveles, puntuación, combos, Perfect Shots, estadísticas persistentes, dificultad progresiva, efectos visuales y sonido.

La hitbox de colisión existente SHALL permanecer exactamente en:

`fp.radius * 0.35`

La actualización no deberá modificar la tolerancia de colisión normal.

---

## Glossary

- **Power-Up**: efecto especial beneficioso obtenido mediante una Power-Up Arrow.
- **Power-Up Arrow**: Projectile especial que contiene un Power-Up.
- **Normal Arrow**: Projectile que no contiene ningún Power-Up.
- **Active Effect**: Power-Up cuyo efecto continúa durante cierto tiempo o cierta cantidad de tiros.
- **Freeze**: Power-Up que detiene temporalmente la rotación durante gameplay.
- **Shield**: Power-Up que permite sobrevivir a una Collision.
- **Double Score**: Power-Up que duplica los puntos obtenidos durante una cantidad limitada de tiros exitosos.
- **Cleanup**: Power-Up que elimina una flecha previamente anclada para crear espacio.
- **Power-Up Badge**: indicador visual que identifica una Power-Up Arrow o un Active Effect.
- **Eligible Power-Up**: Power-Up que puede aparecer dadas las condiciones actuales del Game.
- **Power-Up Roll**: selección probabilística que determina si la siguiente flecha tendrá un Power-Up.
- **Shield Save**: evento en el que una Collision es absorbida por Shield y no provoca Game Over.

---

# Requirements

## Requirement 1 — Generación de Power-Ups

**User Story:** As a Player, I want Power-Ups to appear occasionally during normal gameplay, so that each run has more variety without replacing the core mechanic.

### Acceptance Criteria

1. THE Game SHALL generar Power-Ups únicamente a partir del Level 2.
2. WHEN se prepare una nueva flecha elegible, THE Game SHALL tener una probabilidad base del 16 % de convertirla en Power-Up Arrow.
3. THE Game SHALL NOT generar dos Power-Up Arrows consecutivas.
4. THE Game SHALL seleccionar únicamente entre Power-Ups que sean útiles en el estado actual.
5. IF ningún Power-Up es elegible, THEN THE Game SHALL generar una Normal Arrow.
6. THE Power-Up Roll SHALL NOT requerir ninguna acción adicional del Player.

---

## Requirement 2 — Identificación visual de Power-Up Arrows

**User Story:** As a Player, I want to know when my next arrow contains a Power-Up, so that I can recognize special opportunities.

### Acceptance Criteria

1. THE Game SHALL mostrar visualmente si la flecha preparada contiene un Power-Up.
2. THE Power-Up Arrow SHALL conservar su icono normal de servicio AWS.
3. THE Game SHALL superponer un indicador adicional específico del Power-Up.
4. THE indicador SHALL permanecer visible mientras la flecha esté preparada y durante su vuelo.
5. THE Game SHALL utilizar identificadores visuales diferentes para Freeze, Shield, Double Score y Cleanup.
6. THE Power-Up Arrow SHALL conservar las mismas dimensiones físicas y hitbox que una Normal Arrow.

---

## Requirement 3 — Activación de Power-Ups

**User Story:** As a Player, I want Power-Ups to activate automatically when I land the special arrow, so that the one-button gameplay is preserved.

### Acceptance Criteria

1. WHEN una Power-Up Arrow sea anclada exitosamente, THE Game SHALL activar automáticamente su Power-Up.
2. WHEN una Power-Up Arrow colisione y produzca Game Over, THE Power-Up SHALL NOT activarse.
3. THE Power-Up SHALL activarse solamente después de resolver los puntos del tiro que lo obtuvo.
4. THE Power-Up Arrow SHALL contar como una flecha acertada normal para Level Progress.
5. THE Power-Up Arrow SHALL poder generar Perfect Shot y Combo igual que una Normal Arrow.
6. THE Game SHALL mostrar feedback visual cuando un Power-Up sea activado.

---

## Requirement 4 — Freeze

**User Story:** As a Player, I want to temporarily stop the rotating target, so that I can take advantage of a brief safe window.

### Acceptance Criteria

1. WHEN Freeze sea activado, THE Game SHALL establecer un Freeze Timer de 2.0 segundos.
2. WHILE Freeze esté activo y `phase === 'playing'`, THE Central Element SHALL permanecer sin rotación.
3. WHILE Freeze esté activo, todos los Anchored Projectiles SHALL permanecer inmóviles junto al Central Element.
4. THE Freeze Timer SHALL disminuir únicamente durante gameplay activo.
5. THE Freeze Timer SHALL pausarse durante `levelcomplete`.
6. WHEN el Freeze Timer llegue a 0, THE Game SHALL restaurar inmediatamente la velocidad y dirección determinadas por el sistema normal de dificultad.
7. Freeze SHALL NOT modificar permanentemente `baseSpeed`, dificultad, Tier ni dirección.

---

## Requirement 5 — Shield

**User Story:** As a Player, I want a Shield to save me from one collision, so that a single mistake does not always end a strong run.

### Acceptance Criteria

1. WHEN Shield sea activado, THE Game SHALL almacenar exactamente 1 Shield Charge.
2. THE Player SHALL NOT poder acumular más de 1 Shield Charge.
3. WHEN ocurre una Collision y existe un Shield Charge, THE Game SHALL consumir el Shield.
4. WHEN Shield absorba una Collision, THE Game SHALL NOT entrar en `gameover`.
5. WHEN Shield absorba una Collision, THE Flying Projectile SHALL ser descartado.
6. WHEN Shield absorba una Collision, THE Score y Level Progress SHALL permanecer sin cambios.
7. WHEN Shield absorba una Collision, THE Combo SHALL reiniciarse.
8. THE Game SHALL mostrar un efecto visual y sonoro claramente identificable para Shield Save.

---

## Requirement 6 — Double Score

**User Story:** As a Player, I want a temporary scoring boost, so that accurate play during the effect feels more rewarding.

### Acceptance Criteria

1. WHEN Double Score sea activado, THE Game SHALL establecer `doubleScoreHits` en 3.
2. THE Double Score Power-Up SHALL afectar los siguientes 3 anclajes exitosos.
3. FOR EACH tiro afectado, THE Game SHALL calcular primero el puntaje normal del tiro incluyendo Base Score, Perfect Shot y Combo.
4. AFTER calcular los puntos normales del tiro, THE Game SHALL añadir una cantidad adicional igual a esos puntos.
5. THE Double Score effect SHALL NOT duplicar Level Complete Bonus.
6. AFTER cada anclaje exitoso afectado, THE Game SHALL reducir `doubleScoreHits` en 1.
7. WHEN `doubleScoreHits` llegue a 0, THE efecto SHALL terminar.
8. La flecha que activa Double Score SHALL NOT beneficiarse de su propio efecto.

---

## Requirement 7 — Cleanup

**User Story:** As a Player, I want to remove an old anchored arrow, so that I can regain some space on the rotating target.

### Acceptance Criteria

1. Cleanup SHALL ser elegible únicamente cuando existan al menos 2 Anchored Projectiles antes del lanzamiento.
2. WHEN Cleanup sea activado, THE Game SHALL eliminar el Anchored Projectile más antiguo existente antes de la Power-Up Arrow.
3. THE Power-Up Arrow que activa Cleanup SHALL permanecer anclada normalmente.
4. Cleanup SHALL NOT reducir Score.
5. Cleanup SHALL NOT reducir Level Hits.
6. Cleanup SHALL NOT modificar estadísticas históricas de hits.
7. THE Game SHALL mostrar un efecto visual en la posición de la flecha eliminada.

---

## Requirement 8 — Integración con Score, Combo y Perfect Shots

**User Story:** As a Player, I want Power-Ups to coexist with the existing scoring systems, so that previous mechanics remain meaningful.

### Acceptance Criteria

1. Power-Up Arrows SHALL utilizar el sistema existente de Combo.
2. Power-Up Arrows SHALL utilizar el sistema existente de Perfect Shot.
3. Activar un Power-Up SHALL NOT reiniciar Combo salvo cuando Shield absorba una Collision.
4. Double Score SHALL aplicar únicamente a puntos obtenidos por tiros exitosos.
5. Level Complete Bonus SHALL continuar calculándose independientemente de Power-Ups.
6. High Score SHALL actualizarse correctamente después de cualquier puntaje adicional producido por Double Score.
7. THE Game SHALL conservar la lógica actual de Tier progression.

---

## Requirement 9 — HUD de Power-Ups

**User Story:** As a Player, I want to see which Power-Ups are currently active, so that I can make sense of their effects.

### Acceptance Criteria

1. THE Game SHALL mostrar un Power-Up Badge por cada Active Effect relevante.
2. Freeze SHALL mostrar el tiempo restante.
3. Shield SHALL mostrar si existe una carga disponible.
4. Double Score SHALL mostrar la cantidad de tiros restantes.
5. Cleanup SHALL NOT permanecer en HUD después de su efecto instantáneo.
6. Power-Up Badges SHALL NOT solaparse con Level Progress, Tier Stars, Score, Best Score ni Combo.
7. WHEN no exista ningún Active Effect, THE HUD SHALL conservar un layout equivalente al de v1.2.1.

---

## Requirement 10 — Estadísticas persistentes

**User Story:** As a Player, I want my Power-Up usage to appear in my statistics, so that I can track how they affect my runs.

### Acceptance Criteria

1. THE Game SHALL añadir `powerUpsCollected` a las estadísticas persistentes.
2. THE Game SHALL añadir `shieldSaves` a las estadísticas persistentes.
3. WHEN cualquier Power-Up sea activado exitosamente, THE Game SHALL incrementar `powerUpsCollected`.
4. WHEN Shield absorba una Collision, THE Game SHALL incrementar `shieldSaves`.
5. Existing statistics stored by v1.2.1 SHALL continuar cargando sin errores.
6. Missing Power-Up statistics from older saved data SHALL inicializarse automáticamente en 0.

---

## Requirement 11 — Sonido y feedback

**User Story:** As a Player, I want Power-Ups to feel distinct when activated, so that their effects are immediately understandable.

### Acceptance Criteria

1. THE Game SHALL reproducir feedback visual al activar cada Power-Up.
2. THE Game SHALL mostrar el nombre del Power-Up mediante Floating Text o Banner.
3. THE Game SHALL reproducir un sonido de activación de Power-Up cuando Sound esté habilitado.
4. Shield Save SHALL utilizar feedback distinto de la activación normal de Shield.
5. Visual Effects disabled SHALL reducir efectos decorativos sin ocultar información necesaria del estado activo.

---

## Requirement 12 — Ciclo de vida y reinicio

**User Story:** As a Player, I want Power-Ups to reset predictably between games and behave consistently across levels.

### Acceptance Criteria

1. WHEN se inicia una nueva partida, THE Game SHALL resetear Freeze Timer a 0.
2. WHEN se inicia una nueva partida, THE Game SHALL resetear Shield Charges a 0.
3. WHEN se inicia una nueva partida, THE Game SHALL resetear Double Score Hits a 0.
4. Active Effects SHALL poder conservarse al pasar de un nivel al siguiente.
5. Timed effects SHALL pausarse mientras `phase !== 'playing'`.
6. Game Over SHALL eliminar todos los Active Effects.
7. Power-Up state SHALL NOT persistir mediante LocalStorage entre partidas.

---

## Requirement 13 — Compatibilidad con la mecánica existente

**User Story:** As a Player, I want Power-Ups to expand the game without changing its fundamental feel.

### Acceptance Criteria

1. THE Game SHALL continuar utilizando únicamente click o Space para lanzar.
2. THE Game SHALL NOT añadir botones de activación de Power-Ups.
3. THE normal Collision hitbox SHALL permanecer exactamente en `fp.radius * 0.35`.
4. Shield SHALL interceptar el resultado de una Collision después de su detección; SHALL NOT modificar `checkCollision`.
5. THE Game SHALL continuar ejecutándose con HTML, CSS y JavaScript ES6+ sin frameworks.
6. THE Game SHALL conservar compatibilidad con GitHub Pages.

---

## Requirement 14 — Versionado y documentación

**User Story:** As a maintainer, I want the new release to be clearly documented and versioned.

### Acceptance Criteria

1. THE Game SHALL mostrar `v1.3.0 - Power-Ups Update`.
2. `CHANGELOG.md` SHALL incluir una nueva entrada para v1.3.0.
3. `RELEASE_NOTES.md` SHALL incluir una sección para v1.3.0.
4. `AWS-Game/README.md` SHALL documentar los Power-Ups.
5. Root `README.md` SHALL mostrar v1.3.0 como versión estable cuando la release sea publicada.
6. `site/index.html` SHALL actualizar la tarjeta de AWS-Game a v1.3.0 cuando la release sea publicada.
