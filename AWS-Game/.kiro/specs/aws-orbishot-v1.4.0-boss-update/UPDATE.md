# AWS ORBISHOT v1.4.0 — Boss Update

Esta versión se implementa como una sola entrega, sin dividirla en Tasks.

## Objetivos

1. Adoptar oficialmente el nombre **AWS ORBISHOT** y su logo.
2. Introducir Boss Levels sin abandonar el loop de esperar, calcular y disparar.
3. Convertir cada boss en una estructura por capas visuales y destructibles.
4. Mejorar la adaptación del HUD a móviles sin alterar la física base.
5. Mantener intacta la hitbox permisiva existente.

## Boss Levels

- Cada quinto nivel es un boss: 5, 10, 15, 20...
- Tres capas consecutivas: **ARMOR → EXPOSED → CORE**.
- ARMOR contiene 6 piezas exteriores orbitantes.
- EXPOSED revela 4 piezas más cercanas y rápidas.
- CORE deja 2 capas internas del núcleo.
- Las piezas de ARMOR y EXPOSED usan la misma familia geométrica del boss, orbitan alrededor del centro y rotan sobre sí mismas.
- Una flecha debe atravesar una pieza activa y después completar un anchor válido para destruirla.
- Al destruir todas las piezas de una capa, esa capa desaparece y se revela la siguiente.
- En CORE cualquier anchor válido daña la capa interna actual del núcleo expuesto.
- Los tiros que alcanzan el boss sin atravesar una pieza válida son bloqueados, descartan la flecha y reinician combo sin Game Over.
- Los tiros correctos se anclan y continúan siendo obstáculos.
- Las reversas siguen estando telegráficas antes de cambiar de dirección.

## Familias visuales

1. Firewall — círculo.
2. Triad — triángulo.
3. Dynamo — cuadrado.
4. Prism — estrella.
5. Pentacore — pentágono.
6. Core Nexus — hexágono.

Las formas son visuales; el radio físico central no cambia.

## Ranking

- S / A / B / C / D.
- Considera precisión, tiempo y Perfect Shots.
- Otorga bonus de score.
- Estadísticas persistentes de bosses derrotados y mejor rango.

## Power-Ups

- Freeze pausa boss y capas orbitantes.
- Shield protege de colisiones normales.
- Double Score no duplica daño al boss.
- Cleanup elimina la flecha anclada más antigua.
- Power Core continúa funcionando durante bosses.

## Rebranding

- APP_NAME: `AWS ORBISHOT`.
- APP_VERSION: `1.4.0`.
- APP_CODENAME: `Boss Update`.
- Logo transparente en `assets/branding/aws-orbishot-logo.png`.
- El logo se renderiza dentro del HUD superior del juego.
- Actualización de título, favicon, landing, Game Over y documentación.
- Se conservan nombres históricos de folder/tags para compatibilidad.

## Responsive

- `VisualViewport` se usa cuando está disponible para responder a barras móviles, orientación y safe areas.
- En móviles verticales el Dock de Power-Ups cambia a una fila horizontal compacta en la parte inferior.
- Los hit targets del Dock comparten exactamente la misma geometría entre render e input.
- Overlays y modales permanecen alineados con el canvas escalado.

## Invariante absoluto

`collision.js` no se modifica y debe continuar usando exactamente:

```js
const d = Math.hypot(fp.x - apX, fp.y - apY);
if (d < fp.radius * 0.35) return 'collision';
```

### Revisión de jugabilidad — dirección y Power Cores

- Las piezas vulnerables de Armor/Exposed mantienen siempre un único sentido orbital; los reversals ya no cambian su dirección.
- Firewall no usa reversal, para que el primer boss enseñe el sistema sin interrupciones.
- Los reversals de bosses posteriores afectan al cuerpo/rotación central, no a la corona vulnerable.
- Durante bosses, Power Core funciona como **pickup shot**: atravesarlo concede el Power-Up inmediatamente y la flecha se disipa, sin exigir alineación con la armadura.
- Los pickup shots de Power Core no penalizan la precisión del ranking del boss.
- El Power Core usa una órbita propia ligeramente exterior durante bosses.
- El viewport sigue al `VisualViewport` para evitar que pinch-zoom/pan deje el juego fuera de pantalla.



## Normal Stability polish

Fuera de Boss Levels, una colisión deja de ser derrota instantánea. El jugador dispone de un medidor STABILITY de 100%. Una colisión consume 40%, un impacto correcto recupera 8% y completar un nivel recupera 30%. Al llegar a 0% se produce Game Over. Shield sigue absorbiendo la colisión antes de afectar STABILITY. Los Boss Levels conservan OVERLOAD como sistema independiente.

## Planned patch v1.4.1

La primera revisión posterior a la publicación de v1.4.0 queda reservada para audio: ampliar efectos de sonido, dar identidad sonora a eventos/bosses y añadir música al juego sin alterar el gameplay base.

## Final UX polish

- En móvil, los cuatro Power-Ups se muestran como botones circulares con decoración orbital segmentada; se conserva el estilo visual sin dar la impresión de dos botones superpuestos.
- La ayuda contextual móvil se integra dentro del panel Power/Core, entre el encabezado y la barra, para evitar recortes o superposición con el borde inferior.
- Freeze habilita **Stack Shots** durante su duración: si una flecha coincide con otra anclada, la colisión original sigue detectándose, pero se convierte en un anchor válido y no añade Overload.
- La flecha preparada y su punto real de lanzamiento se desplazan ligeramente hacia abajo de forma sincronizada para distinguirla mejor de las flechas ya clavadas.
- `collision.js` permanece intacto y conserva la condición `d < fp.radius * 0.35`.
## Cierre final de v1.4.0

- `APP_CODENAME` permanece en inglés como `Boss Update`.
- La UI visible del juego queda en español; la selección de idioma se reserva para una versión futura.
- La superficie visual del boss se reduce entre ARMADURA, EXPUESTO y NÚCLEO, evitando que el disco exterior permanezca intacto entre fases.
- Los aros de las capas rotas generan fragmentos curvos que caen junto con flechas y escombros.
- Las puntas de flechas ancladas se ocultan parcialmente detrás de la superficie del jefe para reforzar la sensación de penetración.

