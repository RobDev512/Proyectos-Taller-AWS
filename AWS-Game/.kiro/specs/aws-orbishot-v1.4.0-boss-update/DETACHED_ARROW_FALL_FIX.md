# v1.4.0 — Detached Arrow Fall Fix

- La pausa de transición sigue durando ~1.18 s.
- Las flechas expulsadas ya no comparten esa duración visual.
- Continúan bajo gravedad, rotando y visibles hasta salir por debajo del canvas.
- La jugabilidad de la siguiente fase puede reanudarse mientras los restos anteriores terminan de caer.
- Si una nueva transición comienza antes de que terminen de caer, los restos anteriores se conservan.
- No modifica `collision.js` ni la hitbox `fp.radius * 0.35`.
