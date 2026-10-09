# v1.4.0 — Boss Phase Break Transition

Revisión de transición entre capas del boss.

- Al destruir la última pieza de ARMOR o EXPOSED se activa una transición de ~1.18 s.
- El gameplay se pausa durante la ruptura; no se pueden lanzar flechas ni activar Power-Ups.
- El canvas recibe un screen shake decreciente y un flash breve.
- Todas las flechas clavadas de la fase anterior se desprenden, salen despedidas, caen con gravedad y se desvanecen.
- Las flechas desprendidas dejan de formar parte de `anchoredProjectiles`, por lo que la nueva fase empieza limpia.
- La siguiente capa aparece con un reveal progresivo.
- Cada fase usa una profundidad visual de clavado distinta para sus nuevas flechas.
- La lógica física de `collision.js` no cambia.
- La hitbox histórica `fp.radius * 0.35` permanece intacta.
