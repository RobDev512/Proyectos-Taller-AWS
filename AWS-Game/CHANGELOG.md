# AWS Arcade Game — Changelog

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
