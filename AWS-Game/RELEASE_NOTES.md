# AWS Arcade Game — Release Notes

## v1.3.2 - Power Core Update

Esta actualización reemplaza la obtención pasiva de Power-Ups por una mecánica integrada directamente al timing del juego.

### Power Charge
- Cada acierto aporta `+12` de carga.
- Perfect Shot aporta `+14` adicional.
- Cada nivel extra de combo aporta `+4` adicional, con límite moderado por tiro.
- Completar un nivel aporta `+20`.
- La carga se conserva entre niveles.

### Power Core
- Al llegar a 100 % de Power Charge aparece un Core orbitando alrededor del disco.
- El Core cambia de color y tipo aproximadamente cada 0.72 segundos.
- Solo rota entre Power-Ups que todavía tienen espacio en el inventario.
- Para capturarlo, una flecha debe atravesar físicamente el Core y luego anclarse con éxito.
- Atravesarlo y después chocar no concede el Power-Up.
- Un fallo no destruye el Core: permanece disponible para otro intento.

### Power-Up Dock
- El Dock interactivo de v1.3.1 se mantiene sin cambios conceptuales.
- Los Power-Ups capturados se almacenan allí y se activan con clic/tap o teclas `1–4`.
- Se elimina la obtención mediante Power-Up Arrows; todas las flechas vuelven a ser proyectiles normales.

### Compatibilidad
- No se altera `collision.js`.
- La hitbox permanece exactamente en `fp.radius * 0.35`.
- El juego continúa siendo HTML, CSS y JavaScript nativo.

---

## v1.3.1 - Interactive Power-Ups Patch
- Hotfix visual del Power-Up Dock: botones más claros, textos sin recorte, hover visible y activación de teclas numéricas reforzada.

Este parche amplía v1.3.0 con dos correcciones principales: un HUD sin superposiciones y un sistema de Power-Ups interactivo.

### HUD y notificaciones
- Las notificaciones `LEVEL`, `TIER`, adquisiciones y activaciones utilizan una zona central dedicada.
- Los mensajes se muestran secuencialmente en lugar de competir por el mismo espacio.
- Combo queda separado del progreso de nivel y del sistema de Power-Ups.
- El estado de los efectos deja de ocupar la zona superior.

### Power-Up Dock
- Freeze, Shield, Double y Cleanup tienen slots permanentes y clicables.
- Los Power-Ups se almacenan al acertar una Power-Up Arrow.
- Activación con clic/tap o teclas `1–4`.
- Máximo de 2 unidades almacenadas por tipo.
- Los slots muestran cantidad y estado activo en tiempo real.
- Cleanup puede activarse tácticamente siempre que exista una flecha anclada.

### Power Charge
- Cada acierto carga el medidor.
- Perfect Shots y combos aceleran la carga.
- Completar niveles añade carga adicional.
- Al llegar al 100 %, el juego entrega automáticamente un Power-Up que tenga espacio en inventario.
- Una Power-Up Arrow cuyo slot ya está lleno se convierte parcialmente en Power Charge.

### Compatibilidad
- El disparo sigue funcionando con clic/tap o Space.
- El inventario y los efectos activos se mantienen entre niveles.
- No se guarda estado de Power-Ups en LocalStorage entre partidas.
- `collision.js` no cambia: la hitbox sigue en `fp.radius * 0.35`.

---

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
