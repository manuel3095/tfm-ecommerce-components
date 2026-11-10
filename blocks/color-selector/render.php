<?php
/**
 * Renderizado dinámico del bloque Selector de Colores
 * Se ejecuta en cada solicitud de página en el frontend.
 *
 * Variables disponibles desde render_callback:
 * @var array $attributes Atributos del bloque
 *
 * @package TFM_Ecommerce_Components
 * @since 1.1.0
 */

defined( 'ABSPATH' ) || exit;

// Sanitizar los atributos de entrada
$product_id      = isset( $attributes['productId'] ) ? absint( $attributes['productId'] ) : 0;
$show_stock      = isset( $attributes['showStock'] ) ? (bool) $attributes['showStock'] : true;
$show_price      = isset( $attributes['showPrice'] ) ? (bool) $attributes['showPrice'] : true;
$show_color_name = isset( $attributes['showColorName'] ) ? (bool) $attributes['showColorName'] : true;
$swatch_size     = isset( $attributes['swatchSize'] ) ? sanitize_key( $attributes['swatchSize'] ) : 'medium';
$swatch_shape    = isset( $attributes['swatchShape'] ) ? sanitize_key( $attributes['swatchShape'] ) : 'circle';
$show_label      = isset( $attributes['showLabel'] ) ? (bool) $attributes['showLabel'] : true;
$label_text      = isset( $attributes['labelText'] ) ? sanitize_text_field( $attributes['labelText'] ) : __( 'Selecciona un color', 'tfm-ecommerce' );
$align           = isset( $attributes['align'] ) ? sanitize_key( $attributes['align'] ) : 'left';
$color_map       = isset( $attributes['colorMap'] ) && is_array( $attributes['colorMap'] ) ? $attributes['colorMap'] : array();

if ( ! in_array( $swatch_size, array( 'small', 'medium', 'large' ), true ) ) {
    $swatch_size = 'medium';
}
if ( ! in_array( $swatch_shape, array( 'circle', 'square', 'rounded' ), true ) ) {
    $swatch_shape = 'circle';
}
if ( ! in_array( $align, array( 'left', 'center', 'right' ), true ) ) {
    $align = 'left';
}

if ( ! $product_id ) {
    return;
}

$product = wc_get_product( $product_id );

if ( ! $product || ! $product->is_type( 'variable' ) ) {
    return;
}

$variations = $product->get_available_variations();

if ( empty( $variations ) ) {
    return;
}

// Extraer colores únicos de las variaciones
$colors = array();
$seen   = array();

foreach ( $variations as $variation ) {
    $color_value = '';

    foreach ( array( 'attribute_pa_color', 'attribute_color', 'attribute_pa_colour', 'attribute_colour' ) as $key ) {
        if ( ! empty( $variation['attributes'][ $key ] ) ) {
            $color_value = $variation['attributes'][ $key ];
            break;
        }
    }

    if ( '' === $color_value ) {
        continue;
    }

    // Un color está disponible si alguna de sus variaciones tiene stock
    $existing = array_search( $color_value, $seen, true );

    if ( false !== $existing ) {
        if ( $colors[ $existing ]['in_stock'] || ! $variation['is_in_stock'] ) {
            continue;
        }
    } else {
        $existing = count( $seen );
        $seen[]   = $color_value;
    }

    // Nombre legible: término de la taxonomía si existe, si no el valor
    $term       = taxonomy_exists( 'pa_color' ) ? get_term_by( 'slug', $color_value, 'pa_color' ) : false;
    $color_name = $term ? $term->name : ucfirst( str_replace( '-', ' ', $color_value ) );

    // Código de color desde el mapa configurable del bloque
    $map_key = strtolower( remove_accents( $color_name ) );
    $hex     = isset( $color_map[ $map_key ] ) ? $color_map[ $map_key ] : ( isset( $color_map[ $color_value ] ) ? $color_map[ $color_value ] : '#cccccc' );
    $hex     = sanitize_hex_color( $hex ) ? sanitize_hex_color( $hex ) : '#cccccc';

    $colors[ $existing ] = array(
        'color'        => sanitize_text_field( $color_value ),
        'name'         => sanitize_text_field( $color_name ),
        'hex'          => $hex,
        'in_stock'     => (bool) $variation['is_in_stock'],
        'stock_qty'    => isset( $variation['max_qty'] ) && '' !== $variation['max_qty'] ? absint( $variation['max_qty'] ) : null,
        'variation_id' => absint( $variation['variation_id'] ),
        'price_html'   => $variation['price_html'],
        'price'        => floatval( $variation['display_price'] ),
    );
}

ksort( $colors );
$colors = array_values( $colors );

if ( empty( $colors ) ) {
    return;
}

$variations_json = wp_json_encode( $colors );
$block_id        = 'tfm-color-selector-' . wp_unique_id();

$wrapper_classes = implode(
    ' ',
    array(
        'tfm-color-selector',
        'tfm-color-selector--' . $swatch_size,
        'tfm-color-selector--' . $swatch_shape,
        'tfm-align-' . $align,
    )
);
?>

<div
    id="<?php echo esc_attr( $block_id ); ?>"
    class="<?php echo esc_attr( $wrapper_classes ); ?>"
    data-tfm-selector="color"
    data-product-id="<?php echo esc_attr( $product_id ); ?>"
    data-variations="<?php echo esc_attr( $variations_json ); ?>"
    data-show-stock="<?php echo esc_attr( $show_stock ? 'true' : 'false' ); ?>"
    data-show-price="<?php echo esc_attr( $show_price ? 'true' : 'false' ); ?>"
>
    <?php if ( $show_label ) : ?>
        <p class="tfm-color-selector__label" id="<?php echo esc_attr( $block_id ); ?>-label">
            <?php echo esc_html( $label_text ); ?>
        </p>
    <?php endif; ?>

    <div
        class="tfm-color-selector__grid"
        role="radiogroup"
        aria-label="<?php echo esc_attr( $label_text ); ?>"
    >
        <?php foreach ( $colors as $item ) : ?>
            <?php
            $swatch_classes = array( 'tfm-color-selector__swatch' );

            if ( ! $item['in_stock'] ) {
                $swatch_classes[] = 'tfm-color-selector__swatch--out-of-stock';
            }

            $aria_label = $item['in_stock']
                ? sprintf(
                    /* translators: %s: nombre del color */
                    __( 'Color %s', 'tfm-ecommerce' ),
                    $item['name']
                )
                : sprintf(
                    /* translators: %s: nombre del color */
                    __( 'Color %s - Agotado', 'tfm-ecommerce' ),
                    $item['name']
                );
            ?>
            <button
                class="<?php echo esc_attr( implode( ' ', $swatch_classes ) ); ?>"
                type="button"
                role="radio"
                aria-checked="false"
                aria-disabled="<?php echo $item['in_stock'] ? 'false' : 'true'; ?>"
                aria-label="<?php echo esc_attr( $aria_label ); ?>"
                <?php if ( $show_color_name ) : ?>
                    title="<?php echo esc_attr( $item['name'] ); ?>"
                <?php endif; ?>
                style="background-color: <?php echo esc_attr( $item['hex'] ); ?>;"
                data-value="<?php echo esc_attr( $item['color'] ); ?>"
                data-label="<?php echo esc_attr( $item['name'] ); ?>"
                data-variation-id="<?php echo absint( $item['variation_id'] ); ?>"
                data-price="<?php echo esc_attr( $item['price'] ); ?>"
                data-price-html="<?php echo esc_attr( $item['price_html'] ); ?>"
                <?php disabled( ! $item['in_stock'] ); ?>
                tabindex="<?php echo $item['in_stock'] ? '0' : '-1'; ?>"
            >
                <span class="tfm-sr-only"><?php echo esc_html( $item['name'] ); ?></span>
            </button>
        <?php endforeach; ?>
    </div>

    <?php if ( $show_color_name ) : ?>
        <p class="tfm-color-selector__selected-name" aria-hidden="true"></p>
    <?php endif; ?>

    <?php if ( $show_price ) : ?>
        <div
            class="tfm-color-selector__price tfm-price-display"
            aria-live="polite"
            aria-atomic="true"
        >
            <span class="tfm-price-display__placeholder">
                <?php esc_html_e( 'Selecciona un color para ver el precio', 'tfm-ecommerce' ); ?>
            </span>
        </div>
    <?php endif; ?>

    <?php if ( $show_stock ) : ?>
        <div
            class="tfm-color-selector__stock-message"
            aria-live="polite"
            aria-atomic="true"
        ></div>
    <?php endif; ?>
</div>
