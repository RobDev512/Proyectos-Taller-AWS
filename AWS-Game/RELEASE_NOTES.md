# AWS Arcade Game — Release Notes

## v1.2.1 - HUD Fix

Patch de interfaz para la actualización de niveles.

### Cambios
- Corregido el solapamiento entre las estrellas de Tier y el indicador `LEVEL X • Y/Z ARROWS`.
- Mejorado el espaciado de la barra de progreso.
- Eliminadas solicitudes a fuentes inexistentes y al favicon faltante.
- Sin cambios en la mecánica del juego, dificultad o colisiones.

## v1.2.0 - Level Update

Esta versión convierte la partida infinita original en una progresión por fases sin perder el score acumulado.

## Novedades principales
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

## Compatibilidad
- Conserva récord, preferencias y estadísticas de v1.1.0.
- La hitbox de colisión continúa en `0.35 × radius`.
