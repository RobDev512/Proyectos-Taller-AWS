# v1.4.0 — Responsive + Overload polish

Pre-release polish for AWS ORBISHOT v1.4.0.

## Normal-level Overload

- Normal levels keep the internal stability value for compatibility, but the player-facing meter is now **OVERLOAD**.
- It starts at 0% and rises when an arrow collides.
- 100% causes Game Over.
- Successful anchors and level completion reduce Overload through the existing recovery rules.
- Boss Levels keep their own Boss Overload rules.

## Portrait / mobile layout

- Portrait layout is selected by viewport aspect ratio instead of a brittle 640 px breakpoint.
- The logical canvas height follows the real portrait viewport aspect ratio (clamped for safety), while gameplay physics remain on the original 600×700 coordinate system.
- The gameplay scene is vertically offset inside the taller canvas without changing collision geometry.
- Power-Ups become a stable horizontal dock near the bottom; Power Charge sits directly below it.
- HUD and overlays stay screen-space elements and remain centered.
- Detached boss arrows/debris use the extended visible height before being culled.

## Feedback positioning

- Notification banners use the current logical canvas width instead of a fixed assumption.
- World-space floating feedback follows the portrait scene offset; banners remain screen-space.
- The renderer resets its logical transform every frame to avoid drift after resize or viewport changes.
