# AWS ORBISHOT — Roadmap de parches posteriores a v1.4.0

Este archivo registra ideas ya acordadas para después de publicar **v1.4.0 — Boss Update**. No forman parte del release 1.4.0 salvo que se indique expresamente.

## v1.4.1 — Audio Update / Soundtrack Patch

Objetivo: mejorar la identidad sonora sin rehacer el gameplay.

- Música de fondo para niveles normales.
- Música específica para Boss Levels.
- Más efectos de sonido para impactos, Perfect Shots, Power Core, Power-Ups, Overload, Level Complete y transiciones de fase.
- Sonidos de ruptura de Armor/Exposed/Core y caída de escombros.
- Mejor mezcla entre música y SFX, respetando la preferencia de sonido existente.
- Mantener controles y balance de v1.4.0.

## v1.4.2 — Economy & Lives Update

Objetivo: añadir una primera economía interna reutilizable por sistemas futuros.

### Monedas
- Moneda obtenida al jugar, completar niveles, derrotar bosses y rendir bien.
- Saldo persistente localmente.
- Primera tienda dentro del juego.
- La economía debe poder reutilizarse después para mejoras, cosméticos y otros desbloqueables.

### Vidas
- Sistema de vidas visible mediante corazones.
- Límite inicial propuesto: **5 corazones**.
- Alcanzar el límite de derrota de la partida consume una vida en vez de cerrar necesariamente toda la run de inmediato.
- Las monedas podrán utilizarse para recuperar/comprar vidas, sujeto a balance durante la implementación.
- Definir durante el desarrollo si la capacidad máxima parte por debajo de 5 y puede ampliarse, o si 5 es simplemente el tope de recarga del primer parche.

### Tienda y expansión futura
- La tienda de v1.4.2 comienza con vidas y elementos disponibles en ese momento.
- La misma moneda quedará preparada para comprar mejoras más adelante.
- Cosméticos, skins, trails, cores, fondos, marcos y otros desbloqueables previstos para versiones posteriores podrán integrarse en la misma economía.
- Evitar convertir la economía en una ventaja injusta: las mejoras futuras deberán balancearse con el modo y la progresión correspondiente.

## Más adelante

Se mantiene el roadmap mayor ya planteado: Challenge, Mastery, Modes, Visual/Cosmetics, Events y Campaign. La economía de v1.4.2 debe diseñarse como base compatible con esos sistemas, no como una tienda aislada.
