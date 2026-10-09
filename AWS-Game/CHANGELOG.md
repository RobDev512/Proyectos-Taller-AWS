# AWS ORBISHOT — Changelog

## v1.4.0 — Boss Update

### Final closeout
- Interfaz visible en español; el codename oficial se mantiene como **Boss Update**.
- Las superficies de las capas del jefe se reducen al romper ARMADURA/EXPUESTO y el aro destruido se desprende como escombro.
- Mejor profundidad visual de flechas ancladas al ocultar parcialmente la punta detrás del jefe.
- Ajustado el texto de versión en móvil para que no toque el panel inferior.
### Final UX Polish (pre-release)
- Mobile Power-Up buttons keep their ornamentation with segmented orbital accents so they no longer look like duplicated controls.
- Mobile action hints now live inside the Power/Core panel instead of below it, preventing bottom-edge clipping and overlap.
- Freeze now enables Stack Shots: collisions with anchored arrows become valid anchors while Freeze is active, without raising Overload.
- The prepared arrow and its launch origin were moved slightly lower for clearer separation from anchored arrows.


- Pulido final de interfaz: el Power-Up Dock se renderiza como capa UI por encima del gameplay; en móvil vertical se reemplaza por cuatro botones circulares táctiles y una barra Power/Core independiente para evitar solapamientos con el proyectil.
- Mejorada la legibilidad móvil: botones de Power-Ups, progreso de nivel, Overload, badge de dificultad y pistas inferiores usan tipografías/tamaños mayores en layout vertical.
- Roadmap posterior documentado: v1.4.1 se reserva para música/SFX y v1.4.2 para economía, monedas, tienda y sistema de vidas de hasta 5 corazones.
- Normal Stability: fuera de Boss Levels, las colisiones ya no son instakill. STABILITY empieza en 100%, las colisiones restan 40%, los aciertos recuperan 8% y completar un nivel recupera 30%. Al llegar a 0% termina la partida.
- Rebranding oficial del proyecto a **AWS ORBISHOT**, con logo transparente integrado en HUD, favicon y landing pública.
- Cada quinto nivel se convierte en Boss Level.
- Bosses por capas destructibles: **6 Armor → 4 Exposed → 3 Core**.
- Las piezas de Armor/Exposed orbitan en un único sentido y también rotan sobre sí mismas.
- Eliminado el antiguo marcador `HIT`; las propias piezas geométricas son los objetivos.
- Seis familias visuales: Firewall, Triad, Dynamo, Prism, Pentacore y Core Nexus.
- Transiciones de fase con screen shake, flash, flechas desprendidas y **escombros de la capa rota** que continúan cayendo hasta salir por abajo.
- Las flechas desprendidas ya no desaparecen al finalizar la pausa de transición.
- Durante bosses, Power Core funciona como pickup shot instantáneo y no exige alineación con la armadura.
- Nuevo sistema **OVERLOAD** como condición de derrota propia de los Boss Levels: los tiros bloqueados y las colisiones cargan el medidor; al llegar al 100 % termina la partida.
- Las colisiones con flechas ancladas durante bosses dejan de provocar Game Over instantáneo; Shield sigue absorbiendo la colisión y evita la carga de Overload.
- Los aciertos descargan Overload y completar una fase descarga una cantidad adicional.
- Boss intro, HUD de vida/fase/Overload, feedback de impacto y pantalla Boss Defeated.
- Ranking `S/A/B/C/D` calculado con precisión, tiempo y Perfect Shots; tiempo objetivo ajustado al combate de 13 impactos.
- Bonus de score dependiente del boss y del ranking.
- Nuevas estadísticas persistentes: Bosses derrotados y Mejor Boss Rank.
- Canvas HiDPI: backing store adaptado al tamaño CSS y `devicePixelRatio`, conservando coordenadas lógicas 600×700 para mejorar nitidez de texto y líneas sin alterar gameplay.
- Input actualizado para mapear clic/tap a coordenadas lógicas aunque el backing store sea de alta resolución.
- Corregido el bug que hacía que `LEVEL BONUS` mostrara siempre `+0`: `null` ya no se interpreta como override numérico.
- Responsive móvil con Dock circular táctil, barra Power/Core compacta y soporte de `VisualViewport`.
- Freeze, Double y Cleanup mantienen su comportamiento; Double no duplica daño al boss.
- `collision.js` no se modifica; la hitbox continúa exactamente en `fp.radius * 0.35`.

## v1.3.2 — Power Core Update
- Nuevo sistema de adquisición basado en habilidad: los Power-Ups ya no se entregan mediante Power-Up Arrows.
- Power Charge se llena con aciertos, Perfect Shots, combos y Level Complete.
- Al alcanzar 100 % aparece un **Power Core** orbitando alrededor del disco.
- El Power Core cambia dinámicamente entre Freeze, Shield, Double y Cleanup.
- Para ganar el Power-Up la flecha debe atravesar el Core y después anclarse correctamente.
- Si la flecha atraviesa el Core pero termina en colisión, no se concede la recompensa y el Core continúa orbitando.
- La recompensa capturada se almacena en el Power-Up Dock interactivo de v1.3.1.
- El Core solo muestra tipos con espacio disponible en inventario.
- Si todo el inventario está lleno, Power Charge permanece en 100 % hasta liberar un slot.
- Power Charge puede volver a llenarse mientras existe un Core activo; el siguiente Core aparece después de capturar el actual.
- El Core y los efectos activos se pausan durante `levelcomplete` y continúan al comenzar el siguiente nivel.
- Añadidos efectos visuales y sonidos específicos para aparición, contacto y captura del Power Core.
- Versión actualizada a `v1.3.2 - Power Core Update`.
- `collision.js` permanece sin cambios y la hitbox sigue exactamente en `fp.radius * 0.35`.

## v1.3.1 — Interactive Power-Ups Patch
- Hotfix visual del Power-Up Dock: botones más claros, textos sin recorte, hover visible y activación de teclas numéricas reforzada.
- Corregida la superposición entre mensajes temporales, Combo, progreso de nivel y Power-Ups.
- Nueva zona central exclusiva para notificaciones; los banners ahora se muestran en cola y de uno en uno.
- Combo reubicado a un indicador compacto independiente.
- Los Power-Ups dejan de activarse automáticamente al acertar una Power-Up Arrow.
- Nuevo **Power-Up Dock** interactivo en el lateral derecho con cuatro slots: Freeze, Shield, Double y Cleanup.
- Los Power-Ups almacenados pueden activarse con clic/tap o con las teclas `1`, `2`, `3` y `4`.
- Cada tipo puede almacenar hasta 2 unidades.
- Los slots muestran cantidad, disponibilidad y estado activo (`timer`, `ARMED`, `HITS`).
- Nuevo sistema **Power Charge**: aciertos, Perfect Shots, combos y niveles completados cargan un medidor que entrega Power-Ups adicionales.
- Power-Up Arrows ahora almacenan el efecto; si un slot está lleno, la recompensa se convierte parcialmente en Power Charge.
- Probabilidad de Power-Up Arrow ajustada al 18 % desde Level 2 y se mantiene la regla de no aparecer consecutivamente.
- Cleanup puede utilizarse de forma táctica incluso mientras una flecha está en vuelo.
- Inventario, Power Charge y efectos activos se conservan entre niveles; se reinician al terminar la partida.
- Añadido feedback y sonido independiente para adquisición y activación.
- Versión actualizada a `v1.3.1 - Interactive Power-Ups Patch`.
- `collision.js` no se modifica y la hitbox permanece exactamente en `fp.radius * 0.35`.

## v1.3.0 — Power-Ups Update
- Nuevo sistema de Power-Ups disponible a partir del Level 2.
- Las Power-Up Arrows conservan su icono AWS y muestran un badge especial durante espera y vuelo.
- **Freeze (FRZ):** pausa la rotación durante 2 segundos de gameplay activo.
- **Shield (SHD):** absorbe una colisión, descarta el proyectil fallido y reinicia el combo sin provocar Game Over.
- **Double Score (2X):** duplica Base + Perfect + Combo durante los siguientes 3 aciertos, sin duplicar el bonus de nivel.
- **Cleanup (CLR):** elimina el proyectil anclado más antiguo cuando existe espacio útil para hacerlo.
- Probabilidad base de aparición del 16 %, sin Power-Ups consecutivos y con selección únicamente entre efectos útiles.
- HUD de efectos activos con tiempo/cargas restantes.
- Feedback visual y sonidos específicos para activaciones y Shield Save.
- Nuevas estadísticas persistentes: Power-Ups obtenidos y Shield Saves.
- Compatibilidad automática con estadísticas guardadas de versiones anteriores.
- Los efectos activos pueden continuar entre niveles; los temporizadores se pausan durante `levelcomplete`.
- Game Over limpia todos los efectos activos.
- Versión actualizada a `v1.3.0 - Power-Ups Update`.
- Se mantiene intacta la hitbox permisiva original (`0.35 × radius`).

## v1.2.1 — HUD Fix
- Corregido el solapamiento entre las estrellas de Tier y el texto de progreso de nivel.
- Mejorado el espaciado vertical del HUD superior.
- Reubicada ligeramente la barra de progreso para mejorar la legibilidad.
- Versión actualizada a `v1.2.1 - HUD Fix`.
- Eliminadas referencias a archivos de fuente inexistentes que generaban errores 404.
- Evitada la solicitud innecesaria de favicon inexistente.
- No se realizaron cambios en gameplay, dificultad ni hitboxes.

## v1.2.0 — Level Update
- Nuevo sistema de niveles con objetivos crecientes de flechas acertadas.
- Transición **LEVEL COMPLETE** con bonus de puntuación y confetti.
- Cada nivel comienza con el disco limpio, pero conserva score, récord y estadísticas.
- Progreso de nivel visible en el HUD (`flechas / objetivo`).
- La dificultad aumenta ligeramente con cada nivel además de la progresión por score.
- Paletas visuales rotativas por nivel para dar identidad a cada fase.
- El sentido inicial del disco alterna entre niveles.
- Game Over ahora muestra el nivel alcanzado.
- Nuevas estadísticas persistentes: mejor nivel y niveles completados.
- Nuevo efecto de sonido al completar un nivel.
- Versión actualizada a `v1.2.0 - Level Update`.
- Se mantiene intacta la hitbox permisiva original (`0.35 × radius`).

## v1.1.0 — Progression Update
- Récord máximo persistente mediante `localStorage`.
- Preferencias persistentes: dificultad, sonido, combo y efectos visuales.
- Nuevo sistema **Perfect Shot**: recompensa tiros muy cercanos sin endurecer la hitbox.
- Feedback visual mejorado: `+puntos`, `PERFECT`, anillos de impacto y banners de Tier.
- Estadísticas locales: partidas, precisión, Perfect Shots y mejor combo.
- Sonidos especiales para Perfect Shot y subida de Tier.
- Versión visible en el HUD y en Configuración.
- Se conserva la hitbox permisiva original (`0.35 × radius`).

## v1.0.0 — Workshop Build
- Versión original creada durante el workshop.
- Juego base, puntaje, récord de sesión, Game Over, Play Again, dificultades, combo y efectos.
