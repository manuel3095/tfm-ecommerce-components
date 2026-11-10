# Registro de cambios

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
