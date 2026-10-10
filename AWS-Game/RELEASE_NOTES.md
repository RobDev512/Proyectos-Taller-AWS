# AWS ORBISHOT — Release Notes

## v1.4.2 — Economy & Lives Update

**Enfoque:** añadir una primera economía reutilizable y convertir la derrota en una estructura de vidas/continuaciones sin alterar el control principal.

### Economía
- Monedas persistentes mediante almacenamiento local.
- Niveles normales: recompensa base de 8 monedas, con bonus pequeños por Perfect Shots y combo del nivel.
- Boss Levels: recompensa base de 25 monedas más bonus por ranking.
- El saldo aparece en el HUD y se conserva entre sesiones.

### Vidas
- Cada run comienza con la capacidad máxima desbloqueada; inicialmente son 3 corazones.
- Al agotar Stability o Boss Overload se pierde un corazón. Si aún quedan vidas, el nivel actual se reinicia en lugar de terminar toda la run.
- El reintento restaura el score al inicio del nivel para impedir farming de puntos durante continuaciones.
- La tienda permite ampliar la capacidad hasta 5 en v1.4.2. El renderer ya soporta más de 5 mostrando `♥ ×N`, pensando en futuras expansiones/campaña.
- Capacidad persistente de Power-Ups: FRZ, SHD, 2X y CLR parten en `x2` y pueden mejorarse individualmente hasta `x5`.
- Accesos móviles de Tienda/Configuración ampliados y apilados; hover/press añadido también al Dock de Power-Ups en escritorio.
- Scrollbars de Configuración y Tienda rediseñadas con el estilo de AWS ORBISHOT.

### Tienda
- Panel independiente de Configuración, abierto desde un botón propio del HUD.
- Tarjetas compactas organizadas en Vidas y Potenciadores, con costos visibles de un vistazo.
- Recarga de un corazón.
- Mejoras permanentes de capacidad `3→4→5`.
- Compra directa de Freeze, Shield, Double y Cleanup para la run actual.
- La misma moneda queda preparada para cosméticos, mejoras y desbloqueables posteriores.

### Configuración
- Audio, música, volumen, combo y FX se aplican sin reiniciar la run.
- Cambiar dificultad sí inicia una run nueva porque modifica las reglas de progresión.

### Compatibilidad
- `collision.js` no se modifica.
- La hitbox continúa exactamente en `fp.radius * 0.35`.

## v1.4.1 — Audio Update

**Audio Polish r4:** restaura la presentación final de v1.4.0, fuerza la recarga de módulos de UI y rehace los sonidos de lanzamiento/anclaje de flecha para que sean más físicos y menos arcade.

**Enfoque:** darle una identidad sonora más completa a AWS ORBISHOT sin rehacer el gameplay.

### Audio
- Música procedural para niveles normales.
- Música procedural exclusiva para Boss Levels.
- Opción persistente para activar/desactivar música sin silenciar los SFX.
- SFX ampliados para impactos, Perfect Shots, Power-Ups, Power Core, Overload, Level Complete, rupturas y transiciones.

### Gameplay
- Sin cambios en hitboxes ni balance principal.
- `collision.js` conserva la detección `fp.radius * 0.35`.

## v1.4.0 - Boss Update

### Pulido final de cierre
- La interfaz visible queda en español, manteniendo **Boss Update** como nombre oficial de la versión.
- Las capas de los jefes reducen físicamente su superficie visual al romperse; el aro roto también cae como escombro.
- Las puntas de las flechas ancladas quedan parcialmente ocultas detrás de la superficie del jefe para simular mejor que están enterradas.
- En móvil, el texto de versión se separa del panel de poder y el build final usa cache-busting `v140-close-r5`.

- Pulido de UI previo al release: Dock de Power-Ups por encima del gameplay, textos del medidor sin overflow y legibilidad móvil reforzada.
- Los próximos parches quedan fuera de este release: v1.4.1 (audio/música) y v1.4.2 (economía, monedas, tienda y vidas).

- Normal Stability: fuera de Boss Levels, las colisiones ya no son instakill. STABILITY empieza en 100%, las colisiones restan 40%, los aciertos recuperan 8% y completar un nivel recupera 30%. Al llegar a 0% termina la partida.

La primera actualización mayor bajo el nombre **AWS ORBISHOT** añade Boss Levels por capas sin abandonar el control de una sola acción del juego.

### Bosses por capas
- ARMOR: 6 piezas exteriores orbitantes.
- EXPOSED: 4 piezas interiores más cercanas y rápidas.
- CORE: 3 capas internas del núcleo expuesto.
- Armor y Exposed giran siempre en un solo sentido y cada pieza también rota sobre sí misma.
- Las piezas usan la familia geométrica del boss: círculo, triángulo, cuadrado, estrella, pentágono o hexágono.
- Al romper una capa se activa shake/flash y la siguiente fase aparece después de una breve pausa.
- Las flechas clavadas se desprenden y siguen cayendo hasta salir por abajo.
- También se generan fragmentos/escombros físicos de la capa destruida, que continúan cayendo de forma independiente.
- El núcleo final también genera fragmentos al derrotar al boss.

### Nueva condición de derrota: OVERLOAD
- Durante Boss Levels, chocar con una flecha anclada ya no provoca Game Over instantáneo.
- Un tiro que llega al boss sin haber atravesado la pieza correcta carga `+25 %` de Overload.
- Una colisión con una flecha anclada carga `+30 %` de Overload.
- Un impacto válido descarga `10 %` y completar una fase descarga `20 %` adicionales.
- Si Overload llega a `100 %`, el boss gana el combate.
- Shield absorbe una colisión y evita que ese error cargue Overload.
- Fuera de Boss Levels, la regla clásica de colisión/Game Over permanece igual.

### Power Core durante bosses
- Power Core funciona como **pickup shot**: atravesarlo concede el Power-Up inmediatamente y la flecha se disipa.
- No requiere alinearse con las piezas de Armor/Exposed.
- El pickup shot no penaliza la precisión del ranking del boss.

### Identidad y responsive
- Nombre oficial visible: **AWS ORBISHOT**.
- Logo transparente integrado en HUD, favicon y landing pública.
- Dock móvil rediseñado con cuatro botones circulares táctiles y barra Power/Core separada para evitar solapamientos con el área jugable.
- Soporte de `VisualViewport` y bloqueo del pinch-zoom que podía desplazar el juego fuera de pantalla.
- Canvas HiDPI: el backing store se adapta al tamaño visible y al `devicePixelRatio`, manteniendo coordenadas lógicas 600×700 para que textos, HUD y líneas se vean más nítidos.

### Progresión y resultados
- Cada quinto nivel es un Boss Level.
- El combate completo requiere 13 impactos válidos: `6 + 4 + 3`.
- Ranking `S/A/B/C/D` basado en precisión, tiempo y Perfect Shots.
- Tiempo objetivo del ranking ajustado al combate de 13 impactos.
- Bonus de score dependiente del boss y del ranking.
- Estadísticas persistentes: Bosses derrotados y Mejor Boss Rank.
- Corregido `LEVEL BONUS +0` en niveles normales; `null` ya no se interpreta como un override de bonus igual a cero.

### Compatibilidad
- `collision.js` no se modifica.
- La hitbox sigue exactamente en `fp.radius * 0.35`.
- Las formas visuales de boss no alteran el radio físico base.

---

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

### Revisión de jugabilidad — dirección y Power Cores

- Las piezas vulnerables de Armor/Exposed mantienen siempre un único sentido orbital; los reversals ya no cambian su dirección.
- Firewall no usa reversal, para que el primer boss enseñe el sistema sin interrupciones.
- Los reversals de bosses posteriores afectan al cuerpo/rotación central, no a la corona vulnerable.
- Durante bosses, Power Core funciona como **pickup shot**: atravesarlo concede el Power-Up inmediatamente y la flecha se disipa, sin exigir alineación con la armadura.
- Los pickup shots de Power Core no penalizan la precisión del ranking del boss.
- El Power Core usa una órbita propia ligeramente exterior durante bosses.
- El viewport sigue al `VisualViewport` para evitar que pinch-zoom/pan deje el juego fuera de pantalla.

### Pulido final de UX
- La ayuda contextual móvil vive dentro del panel Power/Core para evitar recortes contra el borde inferior.
- Los controles circulares de Power-Ups conservan su decoración mediante acentos orbitales segmentados más claros.
- Freeze habilita Stack Shots durante el efecto: una colisión con una flecha anclada se convierte en un anchor válido y no añade Overload.
- La flecha preparada queda ligeramente más abajo y se lanza desde esa misma posición.
