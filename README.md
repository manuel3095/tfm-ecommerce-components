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
