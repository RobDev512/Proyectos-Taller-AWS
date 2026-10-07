# AWS Arcade Game v1.3.2 — Power Core Update

Esta actualización se implementa como una sola entrega, sin dividirla en Tasks.

## Objetivo

Hacer que obtener un Power-Up sea parte activa del gameplay y dependa del timing del jugador.

## Flujo final

1. Aciertos, Perfect Shots, combos y Level Complete llenan **Power Charge**.
2. Al alcanzar 100 %, aparece un **Power Core** orbitando el disco.
3. El Core alterna entre FRZ, SHD, 2X y CLR.
4. El jugador debe disparar cuando el tipo deseado cruce su trayectoria.
5. La flecha debe atravesar el Core y después anclarse correctamente.
6. Solo entonces el Power-Up entra al Dock.
7. El Power-Up se activa posteriormente con clic/tap o teclas 1–4.

## Balance inicial

- Hit: +12 Power Charge.
- Perfect Shot: +14 adicional.
- Combo: +4 por nivel adicional de combo, con límite moderado por tiro.
- Level Complete: +20.
- Power Core: 15 px de radio lógico.
- Velocidad orbital: 1.55 rad/s.
- Cambio de tipo: cada 0.72 s.

## Reglas

- Los Power Cores se desbloquean desde Level 2.
- Ya no existen Power-Up Arrows como fuente de recompensa.
- Solo puede existir un Core activo a la vez.
- El Core solo alterna entre tipos con espacio en inventario.
- Si todo el inventario está lleno, la carga permanece al 100 %.
- Atravesar el Core sin anclar el tiro no concede nada.
- Un tiro fallido no destruye el Core.
- Inventario, carga, Core y efectos activos pueden continuar entre niveles.
- Los temporizadores y la órbita se pausan durante `levelcomplete`.
- Game Over reinicia todo el estado de Power-Ups y Power Core.
- No se persiste estado de Power-Ups en LocalStorage entre partidas.
- `collision.js` no se modifica.
- La hitbox permanece exactamente `fp.radius * 0.35`.

## Versión

- `APP_VERSION = '1.3.2'`
- `APP_CODENAME = 'Power Core Update'`
- Tag previsto: `aws-game-v1.3.2`
