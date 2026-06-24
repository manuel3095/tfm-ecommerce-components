# TFM Ecommerce Components

Plugin de WordPress con bloques nativos de Gutenberg para plataformas de Ecommerce basadas en WooCommerce.

Desarrollado como Trabajo de Fin de Máster en **Diseño y Desarrollo de Interfaz de Usuario Web** — Universidad Internacional de La Rioja (UNIR) 2024.

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
git clone https://github.com/TU-USUARIO/tfm-ecommerce-components.git
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

---

## Desarrollo local

### Requisitos previos

- [LocalWP](https://localwp.com/) o cualquier entorno local de WordPress
- Node.js 16.0 o superior
- npm 8.0 o superior
- WooCommerce instalado y activo

### Configuración del entorno de desarrollo

**1.** Clona el repositorio en la carpeta de plugins de tu instalación local:

```bash
cd /ruta/a/tu/wordpress/wp-content/plugins/
git clone https://github.com/TU-USUARIO/tfm-ecommerce-components.git
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
| `npm run lint:php` | Análisis estático de PHP (WordPress Coding Standards) |

---

## Arquitectura del sistema
