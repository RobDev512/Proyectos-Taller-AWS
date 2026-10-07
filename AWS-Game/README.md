# AWS-Game

Juego arcade con temática de AWS desarrollado originalmente durante un workshop utilizando Kiro y un flujo de Spec-Driven Development.

🎮 **Jugar ahora:**
https://robdev512.github.io/Proyectos-Taller-AWS/AWS-Game/

## Versión actual

**v1.3.2 - Power Core Update**

## Gameplay

El objetivo es lanzar proyectiles hacia un elemento central en rotación sin golpear los proyectiles que ya se encuentran colocados.

Cada lanzamiento exitoso aumenta la puntuación y permite avanzar progresivamente a nuevos niveles.

Una colisión provoca Game Over, salvo cuando existe una carga de Shield disponible.

El juego está diseñado alrededor de un control sencillo de una sola acción, por lo que puede jugarse fácilmente con mouse, pantalla táctil o teclado.

## Power-Ups

Desde v1.3.2 los Power-Ups se ganan mediante **Power Charge + Power Core** en lugar de aparecer gratis en flechas especiales.

- Los aciertos, Perfect Shots, combos y Level Complete llenan Power Charge.
- Al llegar a 100 % aparece un Power Core orbitando alrededor del disco.
- El Core cambia entre **FRZ**, **SHD**, **2X** y **CLR**.
- Debes atravesar el Core con una flecha y luego anclar ese mismo tiro correctamente.
- Si el tiro termina en colisión, el Core no se pierde y puedes intentarlo de nuevo.
- La recompensa capturada entra al Power-Up Dock.
- El Dock permite guardar hasta 2 unidades por tipo y activarlas con clic/tap o teclas `1–4`.

Los efectos siguen siendo:

- **FRZ — Freeze:** detiene temporalmente la rotación.
- **SHD — Shield:** absorbe una colisión.
- **2X — Double Score:** duplica los puntos de los siguientes 3 aciertos.
- **CLR — Cleanup:** elimina la flecha anclada más antigua.

## Características

- Sistema de puntuación.
- High Score persistente.
- Sistema de combos.
- Perfect Shots.
- Sistema de Power-Ups.
- HUD de efectos activos.
- Feedback visual de puntuación, Power-Ups e impactos.
- Partículas y efectos visuales.
- Sistema de niveles.
- Cantidad creciente de proyectiles por nivel.
- Cambios de velocidad y dificultad.
- Cambios visuales entre niveles.
- Estadísticas persistentes, incluyendo Power-Ups y Shield Saves.
- Configuración de sonido, efectos, combos y dificultad.
- Iconografía inspirada en servicios de AWS.
- Game Over y opción para volver a jugar.

## Tecnologías

El juego está construido sin frameworks externos utilizando:

- HTML5
- CSS3
- JavaScript
- JavaScript Modules
- HTML5 Canvas
- LocalStorage

El desarrollo original utilizó Kiro y un flujo basado en especificaciones.

## Versiones

### v1.0.0 - Workshop Build

Versión original desarrollada durante el workshop.

### v1.1.0 - Progression Update

Introdujo sistemas de progresión y mejoras generales, incluyendo:

- High Score persistente.
- Configuración persistente.
- Perfect Shots.
- Feedback de puntuación.
- Estadísticas.
- Mejoras visuales.

### v1.2.0 - Level Update

Introdujo el sistema de niveles, incluyendo:

- Objetivos de proyectiles por nivel.
- Pantallas de Level Complete.
- Bonificaciones por completar niveles.
- Incremento progresivo de dificultad.
- Cambios visuales por nivel.
- Nuevas estadísticas relacionadas con niveles.

### v1.2.1 - HUD Fix

Patch de interfaz que corrige el HUD superior:

- Separación correcta entre las estrellas de Tier y el progreso de nivel.
- Mejor espaciado de la barra de progreso.
- Sin cambios en gameplay ni dificultad.

### v1.3.0 - Power-Ups Update

Añade cuatro Power-Ups automáticos sin cambiar el control principal:

- Freeze.
- Shield.
- Double Score.
- Cleanup.

También incorpora HUD de efectos activos, sonidos y feedback específicos y nuevas estadísticas persistentes.

### v1.3.1 - Interactive Power-Ups Patch

Parche grande de interfaz y jugabilidad:

- Corrige la superposición de mensajes, Combo y Power-Ups.
- Añade un Power-Up Dock interactivo.
- Permite guardar y activar Power-Ups manualmente.
- Añade activación por clic/tap y teclas `1–4`.
- Introduce Power Charge como sistema adicional de recompensas.

### v1.3.2 - Power Core Update

Reemplaza la adquisición pasiva por una recompensa de habilidad:

- Power Charge por buen juego.
- Power Core orbitante al alcanzar 100 %.
- Captura mediante timing: atravesar el Core y anclar el tiro.
- Tipo de Power-Up cambiante en tiempo real.
- Integración completa con el Power-Up Dock de v1.3.1.

## GitHub Pages

La versión estable del juego se publica mediante GitHub Pages:

https://robdev512.github.io/Proyectos-Taller-AWS/AWS-Game/

Este repositorio público funciona también como versión desplegable del proyecto.
