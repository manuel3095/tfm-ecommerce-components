# Registro de cambios

## 1.2.0

- Nuevo coordinador de producto (patrón Mediator) en `frontend.js`: cuando una página contiene el selector de tallas y el de colores del mismo producto, combina ambas selecciones y resuelve la variación exacta. En la versión 1.1.0 cada selector enviaba su propia variación representativa, de modo que la talla y el color elegidos podían no coincidir con la variación añadida al carrito.
- Disponibilidad cruzada: al elegir un color se marcan las tallas que no existen o están agotadas en ese color, y viceversa. Las opciones siguen siendo pulsables; si la combinación no tiene stock, se libera el otro atributo y se avisa al usuario.
- Precio y stock se actualizan con los datos de la combinación completa.
- Sincronización con el formulario de variaciones de WooCommerce: los selectores del plugin rellenan los desplegables nativos, que quedan ocultos y siguen funcionando como fuente de verdad del carrito. «Añadir al carrito» añade la combinación elegida.
- Los bloques exponen la matriz completa de variaciones (`data-matrix`) y la clave del atributo (`data-attribute-key`), generadas por `TFM_Blocks::get_variation_matrix()`.
- El evento `tfm:variationSelected` se emite al resolverse la combinación e incluye `attributes`, `inStock`, `price` y `priceHtml`.

## 1.1.0

- Estructura de carpetas corregida: las clases PHP se cargan desde `includes/` y cada bloque tiene su `block.json` en `blocks/<bloque>/`. La versión 1.0.0 del repositorio no podía activarse por rutas inexistentes.
- Añadidos `package.json`, el código fuente del editor en `src/` y los scripts compilados en `build/`.
- Nuevo `blocks/color-selector/render.php` y vista de editor del selector de colores, que faltaban.
- `frontend.js` reescrito con el patrón Strategy: un único módulo gestiona tallas y colores.
- Una talla o un color se muestran disponibles si alguna de sus variaciones tiene stock (antes se tomaba solo la primera variación).
- Las etiquetas muestran el nombre del término (por ejemplo «M») en lugar del slug.
- Los estilos del selector de tallas se cargan en el frontend y en el editor (antes no se encolaban).
- Reset CSS con `:where()` para no anular bordes y fondos de los componentes.
- Contraste del texto de ayuda elevado a 4.6:1 (WCAG 1.4.3).
- El precio que devuelve la API se filtra con `wp_kses_post` en lugar de escaparse como texto.
- Eliminada la dependencia de jQuery y la configuración sin uso de `wc/v3`.
- Cabecera del plugin con la URL real del repositorio.
