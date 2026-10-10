# AWS ORBISHOT — Roadmap de transición 1.4.x

Este archivo registra los parches de transición posteriores a **v1.4.0 — Boss Update** antes de entrar de lleno a Challenge/Mastery/Modes y al roadmap mayor.

## v1.4.1 — Audio Update / Soundtrack Patch

Estado: **publicado**.

- Música procedural dinámica para niveles normales y Boss Levels.
- Más SFX para impactos, Perfect Shots, Power-Ups, Power Core, Overload, Level Complete, bosses y transiciones.
- Control independiente de música y efectos, con volumen separado.
- Identidad sonora ampliada sin reescribir el gameplay.

## v1.4.2 — Economy & Lives Update

Estado: **en desarrollo**.

Objetivo: crear una primera economía persistente y un sistema de vidas reutilizable por versiones futuras.

### Monedas
- Saldo persistente localmente.
- Recompensa al completar niveles normales.
- Bonus pequeños por Perfect Shots y mejor combo del nivel.
- Recompensa mayor por derrotar bosses, con bonus por ranking.
- La moneda queda preparada para mejoras, cosméticos y desbloqueables posteriores.

### Vidas
- Cada run comienza con **3 vidas**.
- Agotar Stability o llegar a 100 % de Boss Overload consume un corazón.
- Si quedan vidas, el nivel actual se reinicia y la run continúa.
- El score vuelve al valor con el que comenzó ese nivel para evitar farming por reintentos.
- La capacidad máxima desbloqueada persiste entre sesiones.
- La tienda de v1.4.2 permite mejorar **3 → 4 → 5** vidas.
- **5 no es un límite técnico definitivo:** el HUD ya queda preparado para mostrar más de cinco como `♥ ×N`, pensando especialmente en una campaña/mapa futuro.

### Tienda inicial
- Recargar un corazón para la run actual.
- Ampliar permanentemente la capacidad de vidas.
- Comprar una carga de Freeze, Shield, Double o Cleanup para la run actual.
- Mantener la economía simple y reusable, sin introducir todavía árboles de mejoras ni cosméticos.

## v1.4.3 — UI & Progression Polish

- Redefinir las estrellas de dificultad para que comuniquen información útil.
- Mejorar interfaz y legibilidad en móvil.
- Mejorar distribución responsive en escritorio y pantalla completa.
- Refinar configuración/dificultad para aplicar cambios con menos reinicios bruscos.

## v1.4.4 — Boss Presentation & FX Polish

- Grietas progresivas según el daño de cada capa.
- Caída física del anillo y sus fragmentos al romperse.
- Más pulido visual en transiciones de fase.
- Explorar entradas cinemáticas/mini presentaciones propias de cada familia de boss.

## Más adelante

Se mantiene el roadmap mayor: **Challenge → Mastery → Modes → Visual/Cosmetics → Events → Campaign**.

La economía de v1.4.2 se diseña como una base compatible con esos sistemas, no como una tienda aislada.
