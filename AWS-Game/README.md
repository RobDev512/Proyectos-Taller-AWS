# AWS ORBISHOT

Juego arcade de timing y precisión con temática AWS, desarrollado originalmente durante un workshop utilizando Kiro y un flujo de Spec-Driven Development. Desde v1.4.0 el proyecto adopta oficialmente el nombre **AWS ORBISHOT**.

- Normal Stability: fuera de Boss Levels, las colisiones ya no son instakill. STABILITY empieza en 100%, las colisiones restan 40%, los aciertos recuperan 8% y completar un nivel recupera 30%. Al llegar a 0% termina la partida.

🎮 **Jugar ahora:**
https://robdev512.github.io/Proyectos-Taller-AWS/AWS-Game/

## Versión actual

**v1.4.0 - Boss Update**

## Gameplay

El objetivo es lanzar proyectiles hacia un elemento central en rotación sin golpear los proyectiles que ya se encuentran colocados.

Cada lanzamiento exitoso aumenta la puntuación y permite avanzar progresivamente a nuevos niveles.

Fuera de los Boss Levels, una colisión provoca Game Over, salvo cuando existe una carga de Shield disponible.

El juego está diseñado alrededor de un control sencillo de una sola acción, por lo que puede jugarse fácilmente con mouse, pantalla táctil o teclado.

## Boss Levels

Cada quinto nivel se convierte en un **Boss Level**. El control principal no cambia: esperar, calcular y disparar; lo que cambia es el objetivo y la condición de derrota.

- Bosses en Levels 5, 10, 15, 20...
- Tres capas por encuentro: **Armor → Exposed → Core**.
- **Armor:** 6 piezas orbitantes exteriores.
- **Exposed:** 4 piezas más cercanas y rápidas.
- **Core:** 3 capas internas del núcleo.
- Las piezas de Armor/Exposed orbitan siempre en un solo sentido y también rotan sobre sí mismas.
- Al romper una capa hay screen shake, flash y transición; las flechas clavadas y fragmentos de la armadura se desprenden y caen hasta salir de la pantalla.
- Seis familias visuales: Firewall, Triad, Dynamo, Prism, Pentacore y Core Nexus.
- Siluetas: círculo, triángulo, cuadrado, estrella, pentágono y hexágono.
- Las formas visuales no endurecen la hitbox física original; `collision.js` permanece intacto.
- Durante bosses, chocar con una flecha anclada **ya no causa Game Over instantáneo**. Los errores cargan el medidor **OVERLOAD**.
- Un tiro bloqueado carga `+25 %` de Overload; una colisión con una flecha carga `+30 %`. Los aciertos y cambios de fase descargan parte del medidor.
- Si Overload llega a `100 %`, el boss gana el combate y termina la partida.
- Shield sigue absorbiendo una colisión y evita que ese error cargue Overload.
- Durante bosses, Power Core funciona como **pickup shot**: atravesarlo concede el Power-Up inmediatamente y la flecha se disipa.
- Cada boss entrega un ranking `S/A/B/C/D` y un bonus de score.
- Nuevas estadísticas persistentes: bosses derrotados y mejor Boss Rank.

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

- **FRZ — Freeze:** detiene temporalmente la rotación y habilita **Stack Shots**, permitiendo apilar flechas en el mismo punto sin sumar Overload mientras dure el efecto.
- **SHD — Shield:** absorbe una colisión.
- **2X — Double Score:** duplica los puntos de los siguientes 3 aciertos.
- **CLR — Cleanup:** elimina la flecha anclada más antigua.

## Características

- Sistema de puntuación.
- High Score persistente.
- Sistema de combos.
- Perfect Shots.
- Sistema de Power-Ups.
- Boss Levels con capas destructibles, Overload y rankings.
- Varias siluetas de boss sin alterar la hitbox base.
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

### v1.4.0 - Boss Update

Primera actualización mayor bajo la identidad **AWS ORBISHOT**:

- Rebranding del juego, página, título y logo.
- Boss Level cada cinco niveles.
- Tres fases físicas: 6 Armor, 4 Exposed y 3 Core.
- Capas orbitantes destructibles y transición con shake, flechas y escombros cayendo.
- Seis familias de boss con formas visuales distintas.
- Nueva condición de derrota de Boss Levels mediante **OVERLOAD**, en lugar de morir instantáneamente por una colisión con flechas ancladas.
- Boss rankings y bonus por desempeño.
- Estadísticas locales de bosses.
- Integración completa con Power-Ups y Power Cores.
- Renderizado Canvas HiDPI para textos y líneas más nítidos al escalar.
- Corrección del Level Bonus en niveles normales.

## GitHub Pages

La versión estable del juego se publica mediante GitHub Pages:

https://robdev512.github.io/Proyectos-Taller-AWS/AWS-Game/

Este repositorio público funciona también como versión desplegable del proyecto.

### Bosses por capas

Los Boss Levels usan capas físicas visibles en lugar de un marcador `HIT`: Armor y Exposed son coronas de piezas geométricas que se destruyen una por una, mientras Core queda expuesto al final con tres capas internas. Al completar cada fase, la capa se rompe, la arena tiembla y tanto las flechas clavadas como los escombros continúan cayendo hasta abandonar la pantalla.

En móviles verticales el Dock de Power-Ups cambia a cuatro botones circulares táctiles, con Power Charge/Core en una barra separada. El corredor central queda libre para que la flecha preparada no compita visualmente con la interfaz.

### Revisión de jugabilidad — dirección, Power Cores y Overload

- Las piezas vulnerables de Armor/Exposed mantienen siempre un único sentido orbital; los reversals no cambian su dirección.
- Firewall no usa reversal, para que el primer boss enseñe el sistema sin interrupciones.
- Los reversals de bosses posteriores afectan al cuerpo/rotación central, no a la corona vulnerable.
- Durante bosses, Power Core funciona como **pickup shot** y no exige alineación con la armadura.
- Los pickup shots no penalizan la precisión del ranking del boss.
- Las colisiones durante un boss cargan Overload en vez de terminar la partida de inmediato.
- El Canvas usa un backing store HiDPI independiente de las coordenadas lógicas 600×700 para mantener texto y trazos nítidos en pantallas grandes y móviles.
- El viewport sigue al `VisualViewport` para evitar que pinch-zoom/pan deje el juego fuera de pantalla.


## Próximos parches planificados

- **v1.4.1 — Audio Update / Soundtrack Patch:** música para niveles y bosses, más SFX y mejor identidad sonora.
- **v1.4.2 — Economy & Lives Update:** monedas obtenidas jugando, tienda inicial y sistema de vidas con corazones (tope propuesto de 5), reutilizando la misma economía para futuras mejoras y cosméticos.

El detalle de estas ideas está en `ROADMAP.md` y puede ajustarse durante su implementación.
