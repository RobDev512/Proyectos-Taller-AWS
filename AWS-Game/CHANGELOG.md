# AWS Arcade Game — Changelog

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
