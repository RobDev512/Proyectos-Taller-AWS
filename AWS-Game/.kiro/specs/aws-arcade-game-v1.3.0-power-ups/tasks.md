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

- [ ] 3. Implementar generación de Power-Ups
  - [ ] 3.1 Implementar `getEligiblePowerUps(state)`
  - [ ] 3.2 Implementar probabilidad base del 16 %
  - [ ] 3.3 Deshabilitar Power-Ups durante Level 1
  - [ ] 3.4 Evitar dos Power-Up Arrows consecutivas
  - [ ] 3.5 Excluir Shield, Freeze o Double si ya están activos
  - [ ] 3.6 Excluir Cleanup si no existen suficientes Anchored Projectiles
  - _Requirements: 1_

- [ ] 4. Integrar Power-Ups con Projectile
  - [ ] 4.1 Añadir `powerUpType` a FlyingProjectile
  - [ ] 4.2 Copiar `state.nextPowerUp` al lanzar
  - [ ] 4.3 Preparar el Power-Up de la siguiente flecha
  - [ ] 4.4 Mantener intactos `awsIconId`, radius y velocidad
  - _Requirements: 2, 3, 13_

- [ ] 5. Implementar Freeze
  - [ ] 5.1 Activar Freeze Timer de 2 segundos
  - [ ] 5.2 Detener `updateRotation` durante Freeze en `playing`
  - [ ] 5.3 Pausar timer durante `levelcomplete`
  - [ ] 5.4 Restaurar progression normal al finalizar
  - [ ] 5.5 Verificar que dirección y baseSpeed no sean alterados
  - _Requirements: 4_

- [ ] 6. Implementar Shield
  - [ ] 6.1 Activar máximo 1 Shield Charge
  - [ ] 6.2 Interceptar `'collision'` en `gameLoop.js`
  - [ ] 6.3 Consumir Shield antes de ejecutar Game Over
  - [ ] 6.4 Eliminar Flying Projectile tras Shield Save
  - [ ] 6.5 Resetear Combo
  - [ ] 6.6 No modificar Score ni Level Hits
  - [ ] 6.7 Mantener `collision.js` y hitbox `0.35` intactos
  - _Requirements: 5, 13_

- [ ] 7. Implementar Double Score
  - [ ] 7.1 Activar efecto para los próximos 3 hits
  - [ ] 7.2 Aplicar después de Base + Perfect + Combo
  - [ ] 7.3 Actualizar High Score
  - [ ] 7.4 Consumir una carga por hit exitoso
  - [ ] 7.5 No duplicar Level Complete Bonus
  - [ ] 7.6 Evitar que la flecha que lo activa se beneficie a sí misma
  - _Requirements: 6, 8_

- [ ] 8. Implementar Cleanup
  - [ ] 8.1 Validar elegibilidad
  - [ ] 8.2 Eliminar el Anchored Projectile más antiguo
  - [ ] 8.3 Nunca eliminar la propia Power-Up Arrow
  - [ ] 8.4 Mantener Score y Level Hits
  - [ ] 8.5 Emitir feedback en la posición eliminada
  - _Requirements: 7_

- [ ] 9. Integrar Power-Ups con Game Loop
  - [ ] 9.1 Capturar `powerUpType` antes de anclar
  - [ ] 9.2 Mantener orden correcto de scoring
  - [ ] 9.3 Aplicar Double Score antes de activar el Power-Up actual
  - [ ] 9.4 Activar Power-Up después del score del tiro
  - [ ] 9.5 Mantener Tier progression
  - [ ] 9.6 Mantener Level Complete Bonus separado
  - [ ] 9.7 Manejar Shield Save sin Game Over
  - _Requirements: 3, 5, 6, 8_

- [ ] 10. Añadir visuales de Power-Up Arrow
  - [ ] 10.1 Implementar `drawPowerUpMarker`
  - [ ] 10.2 Mostrar marker en Ready Arrow
  - [ ] 10.3 Mostrar marker en Flying Projectile
  - [ ] 10.4 Conservar icono AWS
  - [ ] 10.5 Definir colores y labels FRZ / SHD / 2X / CLR
  - _Requirements: 2_

- [ ] 11. Añadir Active Power-Up HUD
  - [ ] 11.1 Implementar `drawPowerUpStatus`
  - [ ] 11.2 Mostrar Freeze Timer
  - [ ] 11.3 Mostrar Shield Charge
  - [ ] 11.4 Mostrar Double Score hits restantes
  - [ ] 11.5 Reposicionar Combo dinámicamente para evitar solapamiento
  - [ ] 11.6 Verificar HUD en distintas resoluciones
  - _Requirements: 9_

- [ ] 12. Añadir feedback y sonido
  - [ ] 12.1 Feedback de Freeze
  - [ ] 12.2 Feedback de Shield
  - [ ] 12.3 Feedback de Shield Save
  - [ ] 12.4 Feedback de Double Score
  - [ ] 12.5 Feedback de Cleanup
  - [ ] 12.6 Implementar `playSoundPowerUp(type)`
  - [ ] 12.7 Implementar `playSoundShieldSave()`
  - _Requirements: 11_

- [ ] 13. Ampliar estadísticas
  - [ ] 13.1 Añadir `powerUpsCollected`
  - [ ] 13.2 Añadir `shieldSaves`
  - [ ] 13.3 Implementar `recordPowerUp`
  - [ ] 13.4 Implementar `recordShieldSave`
  - [ ] 13.5 Mostrar nuevas estadísticas en Settings
  - [ ] 13.6 Comprobar migración desde estadísticas v1.2.1
  - _Requirements: 10_

- [ ] 14. Checkpoint funcional
  - [ ] 14.1 Probar una partida sin Power-Ups en Level 1
  - [ ] 14.2 Confirmar Power-Ups desde Level 2
  - [ ] 14.3 Confirmar que no aparecen consecutivos
  - [ ] 14.4 Confirmar que todos los Power-Ups activan correctamente
  - [ ] 14.5 Confirmar que la hitbox sigue en `0.35`
  - [ ] 14.6 Confirmar que Combo y Perfect Shots siguen funcionando

- [ ] 15. Versionado v1.3.0
  - [ ] 15.1 Cambiar `APP_VERSION` a `1.3.0`
  - [ ] 15.2 Cambiar `APP_CODENAME` a `Power-Ups Update`
  - [ ] 15.3 Actualizar `CHANGELOG.md`
  - [ ] 15.4 Actualizar `RELEASE_NOTES.md`
  - [ ] 15.5 Actualizar `AWS-Game/README.md`
  - [ ] 15.6 Actualizar root `README.md`
  - [ ] 15.7 Actualizar `site/index.html`
  - _Requirements: 14_

- [ ] 16. Validación final
  - [ ] 16.1 Ejecutar `git diff --check`
  - [ ] 16.2 Probar localmente con servidor HTTP
  - [ ] 16.3 Probar Easy / Medium / Hard
  - [ ] 16.4 Probar varios niveles
  - [ ] 16.5 Probar Game Over con y sin Shield
  - [ ] 16.6 Probar transición de nivel con Freeze activo
  - [ ] 16.7 Probar Double Score con Perfect + Combo
  - [ ] 16.8 Confirmar persistencia de estadísticas
  - [ ] 16.9 Confirmar responsive
  - [ ] 16.10 Confirmar cero errores 404 o excepciones en consola

- [ ] 17. Release
  - [ ] 17.1 Commit de v1.3.0
  - [ ] 17.2 Crear tag `aws-game-v1.3.0`
  - [ ] 17.3 Merge a `main`
  - [ ] 17.4 Push
  - [ ] 17.5 Confirmar GitHub Actions
  - [ ] 17.6 Confirmar GitHub Pages
