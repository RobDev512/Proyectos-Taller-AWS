# Requirements Document

## Introduction

Juego arcade web de temática AWS ejecutado íntegramente en el navegador (HTML, CSS y JavaScript sin frameworks). El jugador lanza objetos con temática AWS hacia un elemento circular central en rotación continua. Cada objeto lanzado queda anclado al elemento central; si el nuevo objeto colisiona con uno ya anclado, la partida termina. El juego registra el puntaje de la sesión y el récord histórico de puntaje máximo, y ofrece la opción de reiniciar la partida.

## Glossary

- **Game**: La aplicación web arcade completa que corre en el navegador.
- **Player**: El usuario humano que interactúa con el Game.
- **Central Element**: El objeto circular rotatorio ubicado al centro del área de juego; actúa como diana.
- **Projectile**: El objeto con temática AWS que el Player lanza hacia el Central Element.
- **Anchored Projectile**: Un Projectile que ya fue lanzado, impactó en el Central Element y quedó fijado a él.
- **Collision**: El evento que ocurre cuando un Projectile en vuelo contacta físicamente con un Anchored Projectile.
- **Score**: El contador numérico de Projectiles anclados exitosamente en la sesión actual.
- **High Score**: El valor máximo histórico del Score alcanzado por el Player, persistido durante la sesión del navegador.
- **Game Over Screen**: La pantalla modal que se muestra cuando ocurre una Collision.
- **Play Area**: La región del viewport donde ocurre la mecánica de juego.
- **Session**: La duración de la página cargada en el navegador hasta que se cierra o recarga.

---

## Requirements

### Requirement 1 — Renderizado del área de juego

**User Story:** As a Player, I want to see a clearly defined Play Area with the Central Element visible, so that I understand where to aim my Projectiles.

#### Acceptance Criteria

1. THE Game SHALL render a Play Area que ocupe al menos el 80 % del viewport disponible al cargar la página.
2. THE Game SHALL mostrar el Central Element centrado dentro del Play Area al iniciar cada partida.
3. THE Game SHALL aplicar temática visual de AWS (paleta de colores, iconografía o tipografía característica de AWS) al Central Element y a los Projectiles.

---

### Requirement 2 — Rotación continua del elemento central

**User Story:** As a Player, I want the Central Element to rotate continuously, so that the placement challenge changes over time.

#### Acceptance Criteria

1. WHILE la partida esté activa, THE Central Element SHALL rotar sobre su propio eje de forma continua a una velocidad constante definida en la configuración del Game.
2. WHEN se inicia una nueva partida, THE Central Element SHALL comenzar a rotar desde el ángulo 0 grados.
3. WHILE haya al menos un Anchored Projectile, THE Game SHALL rotar todos los Anchored Projectiles solidariamente con el Central Element, manteniendo sus posiciones relativas.

---

### Requirement 3 — Control de lanzamiento del jugador

**User Story:** As a Player, I want to launch a Projectile with a single action (click or spacebar), so that the game is easy to learn and accessible.

#### Acceptance Criteria

1. WHEN el Player presiona la barra espaciadora o hace clic dentro del Play Area, THE Game SHALL lanzar un Projectile desde la parte inferior del Play Area en dirección al centro del Central Element.
2. THE Game SHALL aceptar únicamente la barra espaciadora o el clic del ratón como acciones de control; cualquier otra entrada de teclado o puntero SHALL ser ignorada durante la partida.
3. WHILE un Projectile esté en vuelo, THE Game SHALL ignorar nuevas pulsaciones de control hasta que ese Projectile haya colisionado o se haya anclado.
4. THE Projectile SHALL viajar en línea recta hacia el centro del Central Element a una velocidad constante definida en la configuración del Game.

---

### Requirement 4 — Anclaje exitoso de proyectiles

**User Story:** As a Player, I want my Projectile to stick to the Central Element when it lands correctly, so that I can accumulate score over time.

#### Acceptance Criteria

1. WHEN un Projectile alcanza el perímetro del Central Element sin haber colisionado con ningún Anchored Projectile, THE Game SHALL anclar el Projectile en el punto de impacto del perímetro del Central Element.
2. WHEN se produce un anclaje exitoso, THE Game SHALL incrementar el Score en 1 punto.
3. WHEN se produce un anclaje exitoso, THE Game SHALL mostrar el nuevo Projectile visualmente integrado al Central Element y comenzar a rotarlo con él de forma inmediata.

---

### Requirement 5 — Detección de colisión y fin de partida

**User Story:** As a Player, I want the game to end immediately when my Projectile hits an already-anchored one, so that I have a clear failure condition to avoid.

#### Acceptance Criteria

1. WHEN la hitbox del Projectile en vuelo se superpone con la hitbox de cualquier Anchored Projectile, THE Game SHALL declarar una Collision y detener la partida de forma inmediata.
2. WHEN se produce una Collision, THE Game SHALL detener la rotación del Central Element y de todos los Anchored Projectiles.
3. WHEN se produce una Collision, THE Game SHALL mostrar la Game Over Screen dentro de 500 ms desde la detección de la Collision.

---

### Requirement 6 — Pantalla de Game Over

**User Story:** As a Player, I want to see a Game Over screen with my final score and the high score, so that I know how I performed and can try to beat my record.

#### Acceptance Criteria

1. THE Game Over Screen SHALL mostrar el Score final de la partida que acaba de terminar.
2. THE Game Over Screen SHALL mostrar el High Score actual.
3. WHEN el Score final supera el High Score almacenado, THE Game SHALL actualizar el High Score con el nuevo valor antes de mostrar la Game Over Screen.
4. THE Game Over Screen SHALL contener un botón de reinicio claramente identificado como "Play Again" o equivalente en el idioma de la interfaz.

---

### Requirement 7 — Botón de reinicio y nueva partida

**User Story:** As a Player, I want to restart the game instantly from the Game Over screen, so that I can try again without reloading the page.

#### Acceptance Criteria

1. WHEN el Player activa el botón de reinicio de la Game Over Screen, THE Game SHALL reiniciar la partida restableciendo el Score a 0 y ocultando la Game Over Screen.
2. WHEN se inicia una nueva partida tras un reinicio, THE Game SHALL conservar el High Score de la sesión anterior en pantalla.
3. WHEN se inicia una nueva partida, THE Game SHALL generar un nuevo Projectile listo para ser lanzado.

---

### Requirement 8 — Puntaje visible durante la partida

**User Story:** As a Player, I want to see my current score at all times during a match, so that I can track my progress in real time.

#### Acceptance Criteria

1. WHILE la partida esté activa, THE Game SHALL mostrar el Score actual en una zona fija y visible del Play Area que no obstruya la mecánica de juego.
2. WHILE la partida esté activa, THE Game SHALL mostrar el High Score actual junto al Score en la misma zona.
3. WHEN el Score cambia, THE Game SHALL actualizar el valor mostrado de forma inmediata, sin retardo perceptible.

---

### Requirement 9 — Persistencia del récord en la sesión

**User Story:** As a Player, I want my high score to persist across multiple rounds within the same browser session, so that I have a goal to beat.

#### Acceptance Criteria

1. THE Game SHALL inicializar el High Score en 0 al cargar la página por primera vez en la Session.
2. WHILE dure la Session, THE Game SHALL conservar el High Score en memoria entre partidas sin requerir almacenamiento externo ni cookies.
3. IF el Score de la partida que termina es mayor que el High Score almacenado, THEN THE Game SHALL reemplazar el High Score con el Score de esa partida.

---

### Requirement 10 — Compatibilidad y ejecución en el navegador

**User Story:** As a Player, I want to play the game directly in a modern browser without installing anything, so that it is immediately accessible.

#### Acceptance Criteria

1. THE Game SHALL ejecutarse íntegramente mediante un único archivo HTML, o conjunto de archivos HTML, CSS y JavaScript estáticos, sin requerir servidor de aplicaciones ni proceso de build.
2. THE Game SHALL funcionar en las versiones actuales de Google Chrome, Mozilla Firefox y Microsoft Edge en el momento de su creación.
3. THE Game SHALL implementarse exclusivamente con APIs nativas del navegador (HTML5, CSS3, JavaScript ES6+), sin dependencias de frameworks o librerías externas.
