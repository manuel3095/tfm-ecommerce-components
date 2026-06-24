<?php
/**
 * Renderizado dinámico del bloque Selector de Tallas
 * Este archivo se ejecuta en cada solicitud de página en el frontend
 * reemplazando el modelo de bloques estáticos serializados
 *
 * Variables disponibles desde render_callback:
 * @var array  $attributes Atributos del bloque sanitizados
 * @var string $content    Contenido interno del bloque (no usado en bloques dinámicos)
 * @var WP_Block $block    Instancia del bloque actual
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

defined( 'ABSPATH' ) || exit;

// Sanitizar todos los atributos de entrada antes de usarlos
$product_id  = isset( $attributes['productId'] ) ? absint( $attributes['productId'] ) : 0;
$show_stock  = isset( $attributes['showStock'] ) ? (bool) $attributes['showStock'] : true;
$show_price  = isset( $attributes['showPrice'] ) ? (bool) $attributes['showPrice'] : true;
$style       = isset( $attributes['style'] ) ? sanitize_text_field( $attributes['style'] ) : 'default';
$columns     = isset( $attributes['columns'] ) ? absint( $attributes['columns'] ) : 4;
$button_size = isset( $attributes['buttonSize'] ) ? sanitize_text_field( $attributes['buttonSize'] ) : 'medium';
$show_label  = isset( $attributes['showLabel'] ) ? (bool) $attributes['showLabel'] : true;
$label_text  = isset( $attributes['labelText'] ) ? sanitize_text_field( $attributes['labelText'] ) : __( 'Selecciona tu talla', 'tfm-ecommerce' );
$align       = isset( $attributes['align'] ) ? sanitize_text_field( $attributes['align'] ) : 'left';

// Verificar que el ID de producto es válido
if ( ! $product_id ) {
    return;
}

// Obtener el producto de WooCommerce
$product = wc_get_product( $product_id );

// Verificar que el producto existe y es de tipo variable
if ( ! $product || ! $product->is_type( 'variable' ) ) {
    return;
}

// Obtener variaciones disponibles del producto
$variations = $product->get_available_variations();

if ( empty( $variations ) ) {
    return;
}

// Procesar variaciones para extraer tallas únicas
$sizes = array();
$seen  = array();

foreach ( $variations as $variation ) {
    // Buscar el atributo de talla en diferentes nomenclaturas posibles
    $size_value = '';

    if ( isset( $variation['attributes']['attribute_pa_size'] ) ) {
        $size_value = $variation['attributes']['attribute_pa_size'];
    } elseif ( isset( $variation['attributes']['attribute_talla'] ) ) {
        $size_value = $variation['attributes']['attribute_talla'];
    } elseif ( isset( $variation['attributes']['attribute_pa_talla'] ) ) {
        $size_value = $variation['attributes']['attribute_pa_talla'];
    }

    if ( empty( $size_value ) || in_array( $size_value, $seen, true ) ) {
        continue;
    }

    $seen[]  = $size_value;
    $sizes[] = array(
        'size'         => sanitize_text_field( $size_value ),
        'in_stock'     => (bool) $variation['is_in_stock'],
        'variation_id' => absint( $variation['variation_id'] ),
        'price_html'   => $variation['price_html'],
        'price'        => floatval( $variation['display_price'] ),
    );
}

if ( empty( $sizes ) ) {
    return;
}

// Serializar variaciones para JavaScript (datos iniciales sin petición AJAX)
$variations_json = wp_json_encode( $sizes );

// Generar ID único para este bloque (permite múltiples bloques en la misma página)
$block_id = 'tfm-size-selector-' . uniqid();

// Clases CSS del contenedor principal
$wrapper_classes = implode(
    ' ',
    array(
        'tfm-size-selector',
        'tfm-size-selector--' . esc_attr( $style ),
        'tfm-size-selector--' . esc_attr( $button_size ),
        'tfm-align-' . esc_attr( $align ),
    )
);
?>

<div
    id="<?php echo esc_attr( $block_id ); ?>"
    class="<?php echo esc_attr( $wrapper_classes ); ?>"
    data-product-id="<?php echo esc_attr( $product_id ); ?>"
    data-variations="<?php echo esc_attr( $variations_json ); ?>"
    data-show-stock="<?php echo esc_attr( $show_stock ? 'true' : 'false' ); ?>"
    data-show-price="<?php echo esc_attr( $show_price ? 'true' : 'false' ); ?>"
>
    <?php if ( $show_label ) : ?>
        <p class="tfm-size-selector__label">
            <?php echo esc_html( $label_text ); ?>
        </p>
    <?php endif; ?>

    <div
        class="tfm-size-selector__grid"
        role="radiogroup"
        aria-label="<?php echo esc_attr( $label_text ); ?>"
        style="grid-template-columns: repeat(<?php echo absint( $columns ); ?>, 1fr);"
    >
        <?php foreach ( $sizes as $item ) : ?>
            <?php
            // Determinar clases del botón según estado
            $button_classes = array( 'tfm-size-selector__button' );

            if ( ! $item['in_stock'] ) {
                $button_classes[] = 'tfm-size-selector__button--out-of-stock';
            }

            // Texto accesible para lectores de pantalla
            $aria_label = $item['in_stock']
                ? sprintf(
                    /* translators: %s: talla del producto */
                    __( 'Talla %s', 'tfm-ecommerce' ),
                    $item['size']
                )
                : sprintf(
                    /* translators: %s: talla del producto */
                    __( 'Talla %s - Agotada', 'tfm-ecommerce' ),
                    $item['size']
                );
            ?>
            <button
                class="<?php echo esc_attr( implode( ' ', $button_classes ) ); ?>"
                type="button"
                role="radio"
                aria-checked="false"
                aria-disabled="<?php echo $item['in_stock'] ? 'false' : 'true'; ?>"
                aria-label="<?php echo esc_attr( $aria_label ); ?>"
                data-size="<?php echo esc_attr( $item['size'] ); ?>"
                data-variation-id="<?php echo absint( $item['variation_id'] ); ?>"
                data-price="<?php echo esc_attr( $item['price'] ); ?>"
                data-price-html="<?php echo esc_attr( $item['price_html'] ); ?>"
                <?php disabled( ! $item['in_stock'] ); ?>
                tabindex="<?php echo $item['in_stock'] ? '0' : '-1'; ?>"
            >
                <?php echo esc_html( $item['size'] ); ?>
            </button>
        <?php endforeach; ?>
    </div>

    <?php if ( $show_price ) : ?>
        <div
            class="tfm-size-selector__price"
            aria-live="polite"
            aria-atomic="true"
            id="<?php echo esc_attr( $block_id ); ?>-price"
        >
            <span class="tfm-size-selector__price-placeholder">
                <?php esc_html_e( 'Selecciona una talla para ver el precio', 'tfm-ecommerce' ); ?>
            </span>
        </div>
    <?php endif; ?>

    <?php if ( $show_stock ) : ?>
        <div
            class="tfm-size-selector__stock-message"
            aria-live="polite"
            aria-atomic="true"
            id="<?php echo esc_attr( $block_id ); ?>-stock"
        >
        </div>
    <?php endif; ?>

</div>
