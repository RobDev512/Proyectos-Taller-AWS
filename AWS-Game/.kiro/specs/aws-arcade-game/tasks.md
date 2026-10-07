# Implementation Plan: AWS Arcade Game

## Overview

Juego arcade web de temática AWS implementado como archivos estáticos (HTML + CSS + JS ES6+ nativo) sin frameworks ni dependencias externas. La implementación sigue la arquitectura Game Loop con módulos ES6, avanzando desde la estructura base hasta la integración final de todos los componentes.

---

## Tasks

- [x] 1. Estructura del proyecto y configuración base
  - Crear `index.html` con canvas, overlay de Game Over, HUD y carga de módulos ES6
  - Crear `style.css` con paleta AWS (#232F3E, #FF9900, #FFFFFF), layout del canvas, tipografía y estilos del modal de Game Over
  - Crear `config.js` con el objeto `CONFIG` (dimensiones, velocidades, radios, lista de iconos AWS)
  - _Requirements: 1.1, 1.3, 10.1, 10.3_

- [x] 2. Estado del juego y módulo de puntuación
  - [x] 2.1 Implementar `state.js` con `createInitialState(highScore)` y el typedef `GameState`
    - Definir las fases `'idle'|'playing'|'gameover'`, `score`, `highScore`, `centralElement`, `flyingProjectile`, `anchoredProjectiles`, `pendingLaunch`, `gameOverTimestamp`
    - _Requirements: 9.1, 9.2_
  - [x] 2.2 Implementar `scoring.js` con `incrementScore(state)` y `captureHighScore(state)`
    - `incrementScore` actualiza `score` y `highScore` si se supera el récord
    - `captureHighScore` retorna el `highScore` para pasarlo al próximo `createInitialState`
    - _Requirements: 4.2, 6.3, 9.2, 9.3_
  - [ ]* 2.3 Escribir property test para incremento unitario del score (Property 5)
    - **Property 5: Incremento unitario del score en cada anclaje**
    - **Validates: Requirements 4.2**
  - [ ]* 2.4 Escribir property test para monotonicidad del High Score (Property 11)
    - **Property 11: Invariante de monotonicidad del High Score**
    - **Validates: Requirements 9.2, 9.3**
  - [ ]* 2.5 Escribir property test para actualización del High Score (Property 8)
    - **Property 8: Actualización del High Score cuando el score lo supera**
    - **Validates: Requirements 6.3, 9.3**
  - [ ]* 2.6 Escribir property test para preservación del High Score tras reinicio (Property 9)
    - **Property 9: Preservación del High Score tras reinicio**
    - **Validates: Requirements 7.2, 9.2**

- [x] 3. Elemento central y rotación
  - [x] 3.1 Implementar `centralElement.js` con el typedef `CentralElement` y la función `updateRotation(state, deltaTime)`
    - La rotación aplica `speed * deltaTime` al ángulo del Central Element
    - La misma delta se aplica a todos los `anchoredProjectiles` para co-rotación
    - Inicializar con ángulo 0 al crear estado nuevo
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 3.2 Escribir property test para rotación proporcional al tiempo (Property 1)
    - **Property 1: Rotación proporcional al tiempo**
    - **Validates: Requirements 2.1**
  - [ ]* 3.3 Escribir property test para co-rotación de proyectiles anclados (Property 2)
    - **Property 2: Co-rotación de proyectiles anclados**
    - **Validates: Requirements 2.3**

- [x] 4. Proyectil — vuelo y anclaje
  - [x] 4.1 Implementar `projectile.js` con los typedefs `FlyingProjectile` y `AnchoredProjectile`, y las funciones `launchProjectile(state, config)`, `advanceProjectile(state, deltaTime)` y `anchorProjectile(state)`
    - `launchProjectile` crea el proyectil en la base del canvas apuntando al centro del disco; elige un `awsIconId` aleatorio de `CONFIG.AWS_ICONS`
    - `advanceProjectile` aplica `vx * deltaTime` y `vy * deltaTime` a la posición
    - `anchorProjectile` convierte el `flyingProjectile` en un `AnchoredProjectile` en coordenadas polares respecto al centro del disco y llama a `incrementScore`
    - _Requirements: 3.1, 3.4, 4.1, 4.2, 4.3_
  - [ ]* 4.2 Escribir property test para movimiento rectilíneo uniforme (Property 4)
    - **Property 4: Movimiento rectilíneo uniforme del proyectil**
    - **Validates: Requirements 3.4**

- [x] 5. Detección de colisiones
  - [x] 5.1 Implementar `collision.js` con `checkCollision(state)` que retorna `'none'|'anchor'|'collision'`
    - Verificar si `distToCenter <= ce.radius + fp.radius` para evaluar si alcanzó el perímetro
    - Si alcanzó el perímetro, iterar sobre `anchoredProjectiles` y verificar si `d < fp.radius + ap.radius`
    - Retornar `'anchor'` si llegó al perímetro sin colisión, `'collision'` si chocó con un anclado
    - _Requirements: 4.1, 5.1_
  - [ ]* 5.2 Escribir property test para detección de colisión por superposición de hitboxes (Property 6)
    - **Property 6: Detección de colisión por superposición de hitboxes**
    - **Validates: Requirements 5.1**

- [x] 6. Checkpoint — Lógica de juego completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Entrada del jugador
  - [x] 7.1 Implementar `input.js` con `registerInputHandlers(canvas, state)`
    - Registrar listener `keydown` para Space y `click` sobre el canvas
    - Solo activar `pendingLaunch = true` cuando `phase === 'playing'` y `flyingProjectile === null`
    - Ignorar cualquier otra tecla o evento de puntero
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 7.2 Escribir property test para filtrado de entradas inválidas (Property 3)
    - **Property 3: Filtrado de entradas inválidas**
    - **Validates: Requirements 3.2**

- [x] 8. Renderer y assets
  - [x] 8.1 Implementar `renderer.js` con `render(ctx, state, assets)`
    - Limpiar el canvas y dibujar: fondo (`#232F3E`), disco central (`#FF9900`), proyectiles anclados con su icono AWS y el proyectil en vuelo
    - Aplicar transformaciones rotacionales para los anclados usando `ap.angle` y `ap.distance`
    - Usar `assets[awsIconId]` para pintar los iconos; fallback a círculo degradado si la imagen no cargó
    - _Requirements: 1.2, 1.3, 4.3_
  - [x] 8.2 Implementar carga de assets en `main.js` — precargar imágenes SVG de los 8 iconos AWS como objetos `Image`
    - Gestionar el caso en que una imagen no cargue (error silencioso con fallback visual)
    - _Requirements: 1.3, 10.1_

- [x] 9. UI — HUD y Game Over
  - [x] 9.1 Implementar `ui.js` con `updateHUD(scoreEl, highScoreEl, state)`, `showGameOver(overlayEl, state)` y `hideGameOver(overlayEl)`
    - `updateHUD` actualiza los elementos DOM con `state.score` y `state.highScore`
    - `showGameOver` muestra el overlay con el score final y el high score; habilita el botón "Play Again"
    - `hideGameOver` oculta el overlay
    - _Requirements: 6.1, 6.2, 6.4, 8.1, 8.2_
  - [ ]* 9.2 Escribir property test para actualización inmediata del HUD (Property 10)
    - **Property 10: Actualización inmediata del HUD al cambiar el score**
    - **Validates: Requirements 8.3**
  - [ ]* 9.3 Escribir property test para pantalla de Game Over con score correcto (Property 7)
    - **Property 7: Pantalla de Game Over muestra el score final correcto**
    - **Validates: Requirements 6.1**

- [x] 10. Game Loop — integración principal
  - [x] 10.1 Implementar `gameLoop.js` con `startGameLoop(ctx, state, assets, config)`
    - Calcular `deltaTime` con cap en 0.1 s para evitar tunneling de físicas
    - Coordinar en cada frame: `updateRotation`, `advanceProjectile`, `checkCollision`, respuesta a resultado (`anchor` → `anchorProjectile`, `collision` → fase `gameover` + timestamp)
    - Manejar `pendingLaunch`: si es true y no hay proyectil volando, llamar a `launchProjectile` y resetear el flag
    - Disparar `showGameOver` con el delay configurado (`GAMEOVER_DISPLAY_DELAY`) tras una colisión
    - _Requirements: 2.1, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3_
  - [x] 10.2 Implementar `main.js` — punto de entrada que inicializa canvas, state, assets, registra handlers de input, conecta el botón "Play Again" al reinicio y arranca el game loop
    - El reinicio llama a `captureHighScore(state)`, crea nuevo `createInitialState(highScore)`, oculta el overlay y llama `startGameLoop` de nuevo
    - Exponer `window.__GAME_STATE__ = state` en modo desarrollo
    - _Requirements: 7.1, 7.2, 7.3, 10.1_

- [x] 11. Checkpoint final — Verificación integral
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los property tests validan invariantes formales definidas en el documento de diseño.
- El cap de `deltaTime` a 0.1 s es un requisito de robustez del game loop (error handling del diseño).
- Los iconos AWS en SVG deben ubicarse en `assets/icons/` y nombrarse `{awsIconId}.svg`.
- No se requiere servidor: el juego corre directamente desde `index.html` con `file://` o un servidor estático básico.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "3.2", "3.3", "4.2", "5.1", "7.1"] },
    { "id": 3, "tasks": ["5.2", "7.2", "8.1", "8.2"] },
    { "id": 4, "tasks": ["9.1", "10.1"] },
    { "id": 5, "tasks": ["9.2", "9.3", "10.2"] }
  ]
}
```
