# Implementation Plan — AWS Arcade Game v1.3.0

## Power-Ups Update

## Tasks

- [x] 1. Preparar infraestructura del sistema de Power-Ups
  - [x] 1.1 Crear `powerups.js`
  - [x] 1.2 Definir `POWER_UP_TYPES`
  - [x] 1.3 Definir configuración de spawn, colores, duración y cargas
  - [x] 1.4 Implementar helpers de sanitización y reset
  - _Requirements: 1, 12, 13_

- [x] 2. Ampliar GameState
  - [x] 2.1 Añadir `nextPowerUp`
  - [x] 2.2 Añadir `activePowerUps.freezeTimer`
  - [x] 2.3 Añadir `activePowerUps.shieldCharges`
  - [x] 2.4 Añadir `activePowerUps.doubleScoreHits`
  - [x] 2.5 Añadir flag para impedir Power-Ups consecutivos
  - [x] 2.6 Garantizar reset correcto al iniciar nueva partida
  - _Requirements: 1, 12_

- [x] 3. Implementar generación de Power-Ups
  - [x] 3.1 Implementar `getEligiblePowerUps(state)`
  - [x] 3.2 Implementar probabilidad base del 16 %
  - [x] 3.3 Deshabilitar Power-Ups durante Level 1
  - [x] 3.4 Evitar dos Power-Up Arrows consecutivas
  - [x] 3.5 Excluir Shield, Freeze o Double si ya están activos
  - [x] 3.6 Excluir Cleanup si no existen suficientes Anchored Projectiles
  - _Requirements: 1_

- [x] 4. Integrar Power-Ups con Projectile
  - [x] 4.1 Añadir `powerUpType` a FlyingProjectile
  - [x] 4.2 Copiar `state.nextPowerUp` al lanzar
  - [x] 4.3 Preparar el Power-Up de la siguiente flecha
  - [x] 4.4 Mantener intactos `awsIconId`, radius y velocidad
  - _Requirements: 2, 3, 13_

- [x] 5. Implementar Freeze
  - [x] 5.1 Activar Freeze Timer de 2 segundos
  - [x] 5.2 Detener `updateRotation` durante Freeze en `playing`
  - [x] 5.3 Pausar timer durante `levelcomplete`
  - [x] 5.4 Restaurar progression normal al finalizar
  - [x] 5.5 Verificar que dirección y baseSpeed no sean alterados
  - _Requirements: 4_

- [x] 6. Implementar Shield
  - [x] 6.1 Activar máximo 1 Shield Charge
  - [x] 6.2 Interceptar `'collision'` en `gameLoop.js`
  - [x] 6.3 Consumir Shield antes de ejecutar Game Over
  - [x] 6.4 Eliminar Flying Projectile tras Shield Save
  - [x] 6.5 Resetear Combo
  - [x] 6.6 No modificar Score ni Level Hits
  - [x] 6.7 Mantener `collision.js` y hitbox `0.35` intactos
  - _Requirements: 5, 13_

- [x] 7. Implementar Double Score
  - [x] 7.1 Activar efecto para los próximos 3 hits
  - [x] 7.2 Aplicar después de Base + Perfect + Combo
  - [x] 7.3 Actualizar High Score
  - [x] 7.4 Consumir una carga por hit exitoso
  - [x] 7.5 No duplicar Level Complete Bonus
  - [x] 7.6 Evitar que la flecha que lo activa se beneficie a sí misma
  - _Requirements: 6, 8_

- [x] 8. Implementar Cleanup
  - [x] 8.1 Validar elegibilidad
  - [x] 8.2 Eliminar el Anchored Projectile más antiguo
  - [x] 8.3 Nunca eliminar la propia Power-Up Arrow
  - [x] 8.4 Mantener Score y Level Hits
  - [x] 8.5 Emitir feedback en la posición eliminada
  - _Requirements: 7_

- [x] 9. Integrar Power-Ups con Game Loop
  - [x] 9.1 Capturar `powerUpType` antes de anclar
  - [x] 9.2 Mantener orden correcto de scoring
  - [x] 9.3 Aplicar Double Score antes de activar el Power-Up actual
  - [x] 9.4 Activar Power-Up después del score del tiro
  - [x] 9.5 Mantener Tier progression
  - [x] 9.6 Mantener Level Complete Bonus separado
  - [x] 9.7 Manejar Shield Save sin Game Over
  - _Requirements: 3, 5, 6, 8_

- [x] 10. Añadir visuales de Power-Up Arrow
  - [x] 10.1 Implementar `drawPowerUpMarker`
  - [x] 10.2 Mostrar marker en Ready Arrow
  - [x] 10.3 Mostrar marker en Flying Projectile
  - [x] 10.4 Conservar icono AWS
  - [x] 10.5 Definir colores y labels FRZ / SHD / 2X / CLR
  - _Requirements: 2_

- [x] 11. Añadir Active Power-Up HUD
  - [x] 11.1 Implementar `drawPowerUpStatus`
  - [x] 11.2 Mostrar Freeze Timer
  - [x] 11.3 Mostrar Shield Charge
  - [x] 11.4 Mostrar Double Score hits restantes
  - [x] 11.5 Reposicionar Combo dinámicamente para evitar solapamiento
  - [x] 11.6 Verificar HUD en distintas resoluciones
  - _Requirements: 9_

- [x] 12. Añadir feedback y sonido
  - [x] 12.1 Feedback de Freeze
  - [x] 12.2 Feedback de Shield
  - [x] 12.3 Feedback de Shield Save
  - [x] 12.4 Feedback de Double Score
  - [x] 12.5 Feedback de Cleanup
  - [x] 12.6 Implementar `playSoundPowerUp(type)`
  - [x] 12.7 Implementar `playSoundShieldSave()`
  - _Requirements: 11_

- [x] 13. Ampliar estadísticas
  - [x] 13.1 Añadir `powerUpsCollected`
  - [x] 13.2 Añadir `shieldSaves`
  - [x] 13.3 Implementar `recordPowerUp`
  - [x] 13.4 Implementar `recordShieldSave`
  - [x] 13.5 Mostrar nuevas estadísticas en Settings
  - [x] 13.6 Comprobar migración desde estadísticas v1.2.1
  - _Requirements: 10_

- [x] 14. Checkpoint funcional
  - [x] 14.1 Probar una partida sin Power-Ups en Level 1
  - [x] 14.2 Confirmar Power-Ups desde Level 2
  - [x] 14.3 Confirmar que no aparecen consecutivos
  - [x] 14.4 Confirmar que todos los Power-Ups activan correctamente
  - [x] 14.5 Confirmar que la hitbox sigue en `0.35`
  - [x] 14.6 Confirmar que Combo y Perfect Shots siguen funcionando

- [x] 15. Versionado v1.3.0
  - [x] 15.1 Cambiar `APP_VERSION` a `1.3.0`
  - [x] 15.2 Cambiar `APP_CODENAME` a `Power-Ups Update`
  - [x] 15.3 Actualizar `CHANGELOG.md`
  - [x] 15.4 Actualizar `RELEASE_NOTES.md`
  - [x] 15.5 Actualizar `AWS-Game/README.md`
  - [x] 15.6 Actualizar root `README.md`
  - [x] 15.7 Actualizar `site/index.html`
  - _Requirements: 14_

- [x] 16. Validación final
  - [x] 16.1 Ejecutar `git diff --check`
  - [x] 16.2 Probar localmente con servidor HTTP
  - [x] 16.3 Probar Easy / Medium / Hard
  - [x] 16.4 Probar varios niveles
  - [x] 16.5 Probar Game Over con y sin Shield
  - [x] 16.6 Probar transición de nivel con Freeze activo
  - [x] 16.7 Probar Double Score con Perfect + Combo
  - [x] 16.8 Confirmar persistencia de estadísticas
  - [x] 16.9 Confirmar responsive
  - [x] 16.10 Confirmar cero errores 404 o excepciones en consola

- [x] 17. Release
  - [x] 17.1 Commit de v1.3.0
  - [x] 17.2 Crear tag `aws-game-v1.3.0`
  - [x] 17.3 Merge a `main`
  - [x] 17.4 Push
  - [x] 17.5 Confirmar GitHub Actions
  - [x] 17.6 Confirmar GitHub Pages
