# TFM Ecommerce Components

Plugin de WordPress con bloques nativos de Gutenberg para plataformas de Ecommerce basadas en WooCommerce.

Desarrollado como Trabajo de Fin de Máster en **Diseño y Desarrollo de Interfaz de Usuario Web** — Universidad Internacional de La Rioja (UNIR).

**Autor:** Manuel Jose Passo Pacheco  
**Director/a:** Alejandra Zuleta Medina  
**Institución:** Universidad Internacional de La Rioja (UNIR)

---

## Descripción

Sistema de componentes interactivos reutilizables que implementa:

- Bloques dinámicos nativos de Gutenberg (sin Page Builders)
- Arquitectura basada en Atomic Design (Frost, 2016)
- Design Tokens como CSS Custom Properties
- Accesibilidad WCAG 2.1 nivel AA completa
- Integración con API REST de WooCommerce
- Rendimiento optimizado mediante carga condicional de assets

---

## Componentes incluidos

### 1. Selector de Tallas (`tfm-ecommerce/size-selector`)

Componente interactivo para la selección de tallas en productos variables de WooCommerce.

**Características:**
- Cuadrícula de botones con estados visuales diferenciados
- Indicadores de disponibilidad de stock en tiempo real
- Actualización dinámica del precio al seleccionar talla
- Navegación completa por teclado (ARIA radiogroup)
- Notificaciones accesibles mediante aria-live
- Diseño responsive Mobile First
- Soporte modo oscuro

**Estados visuales del botón:**
| Estado | Descripción |
|--------|-------------|
| Disponible | Borde gris, fondo blanco |
| Hover | Borde azul, fondo azul claro |
| Seleccionado | Fondo azul (#0073aa), texto blanco |
| Agotado | Fondo gris, texto gris, línea diagonal |
| Foco (teclado) | Outline azul de 3px |

### 2. Selector de Colores (`tfm-ecommerce/color-selector`)

Componente interactivo de muestras de color para productos variables de WooCommerce.

**Características:**
- Muestras circulares o cuadradas configurables
- Mapa de colores personalizable desde el editor
- Indicador de selección con marca de verificación
- Stock en tiempo real por variante de color
- Tooltips accesibles con nombre del color
- Diseño responsive Mobile First

---

## Requisitos del sistema

| Requisito | Versión mínima |
|-----------|---------------|
| WordPress | 5.8 o superior |
| WooCommerce | 5.0 o superior |
| PHP | 7.4 o superior |
| Node.js | 16.0 o superior (solo desarrollo) |

---

## Instalación

### Opción A — Instalación manual desde GitHub

**1.** Descarga el repositorio como archivo ZIP:

```bash
# Clonar el repositorio
git clone https://github.com/manuel3095/tfm-ecommerce-components.git
```

**2.** Accede al panel de administración de WordPress.

**3.** Ve a **Plugins → Añadir nuevo → Subir plugin**.

**4.** Selecciona el archivo ZIP descargado y haz clic en **Instalar ahora**.

**5.** Activa el plugin desde **Plugins → Plugins instalados**.

### Opción B — Instalación mediante FTP

**1.** Descarga o clona el repositorio en tu equipo local.

**2.** Sube la carpeta `tfm-ecommerce-components` al directorio:
/wp-content/plugins/

**3.** Activa el plugin desde el panel de WordPress en **Plugins → Plugins instalados**.

---

## Configuración y uso

### Uso del Selector de Tallas

**1.** Abre el editor de WordPress (Gutenberg) en una página o producto.

**2.** Haz clic en el botón **+** para añadir un bloque nuevo.

**3.** Busca **"Selector de Tallas TFM"** en el buscador de bloques.

**4.** Inserta el bloque en la posición deseada de la página.

**5.** En el panel lateral derecho (**Inspector de bloque**) configura:

   - **ID del producto WooCommerce:** Introduce el ID numérico del producto variable. Puedes encontrarlo en WooCommerce → Productos → al pasar el cursor sobre el producto verás el ID.
   - **Mostrar disponibilidad de stock:** Activa o desactiva el indicador de stock.
   - **Mostrar precio actualizado:** Activa o desactiva la actualización dinámica del precio.
   - **Estilo visual:** Por defecto, Minimalista o Con borde.
   - **Tamaño de botones:** Pequeño, Mediano o Grande.
   - **Columnas:** Número de columnas en la cuadrícula (2-8).
   - **Alineación:** Izquierda, Centro o Derecha.
   - **Etiqueta:** Texto visible encima del selector.

**6.** Publica o actualiza la página para ver el componente en el frontend.

### Uso del Selector de Colores

Los pasos son idénticos al Selector de Tallas. Busca **"Selector de Colores TFM"** en el buscador de bloques.

**Configuración adicional del Selector de Colores:**

- **Forma de las muestras:** Circular, Cuadrada o Redondeada.
- **Tamaño de las muestras:** Pequeño (36px), Mediano (44px) o Grande (56px).
- **Mostrar nombre del color:** Activa el tooltip con el nombre del color.
- **Mapa de colores:** Personaliza la asociación entre nombre de atributo y código hexadecimal de color.

### Uso combinado con el carrito

Para que el cliente elija talla y color y añada la combinación al carrito, coloque los dos selectores del mismo producto junto al formulario de WooCommerce. La forma más sencilla es el bloque **Producto individual** de WooCommerce (*Single Product*):

**1.** Inserte el bloque **Producto individual** y elija el producto variable.

**2.** Dentro del bloque, añada **Selector de Colores TFM** y **Selector de Tallas TFM** con el mismo ID de producto.

**3.** Mantenga dentro del bloque el **Formulario de añadir al carrito** (*Add to Cart with Options*).

Desde la versión 1.2.0, el coordinador de producto del plugin:

- combina la talla y el color elegidos y resuelve la variación exacta;
- marca con borde discontinuo las opciones que no existen o están agotadas con la elección del otro selector; siguen siendo pulsables y, si la combinación no tiene stock, se libera el otro atributo y se avisa al usuario;
- rellena los desplegables nativos de WooCommerce, que quedan ocultos y siguen siendo la fuente de verdad del carrito, de modo que «Añadir al carrito» añade la combinación elegida.

### Tienda de prueba para las evaluaciones

La carpeta `herramientas/tfm-tienda-prueba/` contiene un plugin auxiliar, independiente de este, que crea en un clic la tienda de demostración de las pruebas de usabilidad del TFM: el producto variable «Camiseta Algodón Orgánico» (tallas S, M, L y XL, colores Azul Marino, Blanco y Negro, talla S agotada), dos productos de relleno, la ficha de prueba con los bloques y una portada. Se instala como cualquier plugin (archivo `tfm-tienda-prueba-1.0.0.zip` de la release) y se usa en **Herramientas → TFM: tienda de prueba**. También admite WP-CLI: `wp tfm-tienda crear` y `wp tfm-tienda eliminar`.

---

## Desarrollo local

### Requisitos previos

- [LocalWP](https://localwp.com/) o cualquier entorno local de WordPress
- Node.js 18 o superior
- npm 9 o superior
- WooCommerce instalado y activo

### Configuración del entorno de desarrollo

**1.** Clona el repositorio en la carpeta de plugins de tu instalación local:

```bash
cd /ruta/a/tu/wordpress/wp-content/plugins/
git clone https://github.com/manuel3095/tfm-ecommerce-components.git
cd tfm-ecommerce-components
```

**2.** Instala las dependencias de Node.js:

```bash
npm install
```

**3.** Compila los assets en modo desarrollo con recarga automática:

```bash
npm run start
```

**4.** Para compilar en modo producción:

```bash
npm run build
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start` | Compilación en modo desarrollo con watch |
| `npm run build` | Compilación optimizada para producción |
| `npm run lint:js` | Análisis estático de JavaScript (WPCS) |
| `npm run lint:css` | Análisis estático de CSS |
| `npm run plugin-zip` | Genera el ZIP instalable del plugin |

---

## Arquitectura del sistema

```
tfm-ecommerce-components/
├── tfm-components.php            # Punto de entrada: constantes, carga de clases e inicialización
├── includes/
│   ├── class-blocks.php          # Registro de bloques y recursos; carga condicional con has_block()
│   ├── class-wc-integration.php  # Endpoints REST públicos tfm-ecommerce/v1 (variaciones y stock)
│   └── class-security.php        # Sanitización, escapado y verificación de nonces
├── blocks/
│   ├── size-selector/            # block.json, render.php (renderizado dinámico) y style.css
│   └── color-selector/           # block.json y render.php
├── src/                          # Código fuente React de los bloques (editor)
├── build/                        # Scripts del editor compilados con @wordpress/scripts
└── assets/
    ├── css/tokens.css            # Design Tokens (CSS Custom Properties)
    ├── css/components.css        # Estilos compartidos y del selector de colores
    ├── js/wc-api.js              # Fachada sobre la API REST del plugin (caché y reintentos)
    └── js/frontend.js            # Interactividad (patrones Strategy y Observer)
```

### API REST del plugin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/wp-json/tfm-ecommerce/v1/variations/{id}` | Variaciones de un producto variable (precio, stock, atributos). Pública, con caché de 1 h. |
| GET | `/wp-json/tfm-ecommerce/v1/stock/{id}` | Stock actual de una variación. Pública, sin caché. |

Los endpoints son de solo lectura y exponen únicamente datos que ya son públicos en la ficha de producto.

### Verificación

La versión 1.2.0 se ha verificado sobre WordPress 6.8.3 y WooCommerce 10.3.4:

- Los dos bloques se registran y validan en el editor.
- El frontend renderiza las tallas y colores, actualiza el precio, anuncia el stock y admite navegación por teclado.
- Con los dos selectores y el formulario de WooCommerce en la misma página, la combinación elegida (por ejemplo, M + Azul Marino) es la que llega al carrito.
- Las páginas sin bloques no cargan ningún recurso del plugin.
- Lighthouse 12.8 (móvil, cinco ejecuciones) sobre la ficha de prueba: accesibilidad 100/100; rendimiento 61/100 frente a 60/100 en la misma ficha con los desplegables nativos de WooCommerce.

---

## Licencia

GPL v2 o posterior. Consulta el archivo `LICENSE`.
