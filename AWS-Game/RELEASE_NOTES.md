# AWS Arcade Game — Release Notes

## v1.3.0 - Power-Ups Update

La actualización añade una nueva capa de estrategia sin cambiar el control de una sola acción del juego. Los Power-Ups aparecen directamente en determinadas flechas y se activan automáticamente al anclarlas con éxito.

### Power-Ups
- **Freeze (FRZ):** detiene la rotación durante 2 segundos de gameplay activo.
- **Shield (SHD):** protege de una colisión. Al salvar al jugador consume su única carga, elimina la flecha fallida y reinicia el combo.
- **Double Score (2X):** duplica la ganancia normal de los siguientes 3 aciertos, incluyendo Base Score, Perfect Shot y Combo.
- **Cleanup (CLR):** elimina la flecha anclada más antigua sin reducir score, progreso del nivel ni estadísticas.

### Generación
- Los Power-Ups comienzan a aparecer desde Level 2.
- Probabilidad base de aparición: 16 %.
- Nunca aparecen dos Power-Up Arrows consecutivas.
- Solo se eligen efectos útiles para el estado actual.

### Interfaz y feedback
- Badges `FRZ`, `SHD`, `2X` y `CLR` sobre las Power-Up Arrows.
- HUD para efectos activos con tiempo o cargas restantes.
- Combo reposicionado automáticamente cuando hay efectos activos.
- Banners, textos, partículas y sonidos diferenciados para activaciones.
- Feedback especial para `SHIELD SAVE!`.

### Estadísticas
- Nueva estadística `Power-Ups`.
- Nueva estadística `Shield Saves`.
- Los datos guardados por v1.2.1 se migran automáticamente añadiendo los nuevos campos con valor 0.

### Compatibilidad
- Se mantienen los controles de click, toque o Space.
- No se añaden botones de activación.
- Los efectos activos pueden continuar entre niveles.
- Freeze no consume tiempo durante la transición `levelcomplete`.
- Game Over elimina los efectos activos.
- El juego continúa siendo HTML, CSS y JavaScript nativo.
- La hitbox de colisión continúa exactamente en `fp.radius * 0.35`.

---

## v1.2.1 - HUD Fix

Patch de interfaz para la actualización de niveles.

### Cambios
- Corregido el solapamiento entre las estrellas de Tier y el indicador `LEVEL X • Y/Z ARROWS`.
- Mejorado el espaciado de la barra de progreso.
- Eliminadas solicitudes a fuentes inexistentes y al favicon faltante.
- Sin cambios en la mecánica del juego, dificultad o colisiones.

## v1.2.0 - Level Update

Esta versión convierte la partida infinita original en una progresión por fases sin perder el score acumulado.

### Novedades principales
- Sistema de niveles con objetivos crecientes de flechas: 5, 6, 7... hasta un máximo de 12 por nivel.
- Pantalla de transición `LEVEL COMPLETE!` entre niveles.
- Bonus de puntuación por completar cada nivel.
- Barra de progreso del nivel en el HUD.
- Paletas visuales que cambian con cada nivel.
- Aumento moderado de dificultad según el nivel alcanzado.
- El sentido inicial del disco alterna al comenzar cada nuevo nivel.
- Game Over muestra el nivel alcanzado.
- Estadísticas persistentes de mejor nivel y niveles completados.
- Nueva fanfarria al superar un nivel.

### Compatibilidad
- Conserva récord, preferencias y estadísticas de v1.1.0.
- La hitbox de colisión continúa en `0.35 × radius`.
