<?php
/**
 * Plugin Name:       TFM Tienda de prueba
 * Description:       Crea en un clic la tienda de demostración para las pruebas de usabilidad (SUS) y la auditoría Lighthouse del plugin TFM Ecommerce Components: producto variable con tallas y colores, productos de relleno, página de prueba con los bloques y página de inicio.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Requires Plugins:  woocommerce
 * Author:            Manuel Jose Passo Pacheco
 * License:           GPL-2.0-or-later
 * Text Domain:       tfm-tienda-prueba
 *
 * @package TFM_Tienda_Prueba
 */

defined( 'ABSPATH' ) || exit;

final class TFM_Tienda_Prueba {

    const OPTION = 'tfm_tienda_prueba';

    /** Tallas del producto: slug => nombre */
    const SIZES = array( 's' => 'S', 'm' => 'M', 'l' => 'L', 'xl' => 'XL' );

    /** Colores del producto: slug => [nombre, hexadecimal, precio] */
    const COLORS = array(
        'azul-marino' => array( 'Azul Marino', '#1F2A44', '27.90' ),
        'blanco'      => array( 'Blanco', '#FFFFFF', '24.90' ),
        'negro'       => array( 'Negro', '#111111', '24.90' ),
    );

    /**
     * Stock por combinación talla-color. La talla S está agotada en todos los
     * colores (tarea 3 del protocolo) y L en negro tiene pocas unidades.
     */
    const STOCK = array(
        's'  => array( 'azul-marino' => 0, 'blanco' => 0, 'negro' => 0 ),
        'm'  => array( 'azul-marino' => 12, 'blanco' => 8, 'negro' => 10 ),
        'l'  => array( 'azul-marino' => 9, 'blanco' => 6, 'negro' => 3 ),
        'xl' => array( 'azul-marino' => 5, 'blanco' => 0, 'negro' => 7 ),
    );

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
        add_action( 'admin_post_tfm_tienda_crear', array( __CLASS__, 'handle_create' ) );
        add_action( 'admin_post_tfm_tienda_eliminar', array( __CLASS__, 'handle_delete' ) );

        if ( defined( 'WP_CLI' ) && WP_CLI ) {
            WP_CLI::add_command( 'tfm-tienda', 'TFM_Tienda_Prueba_CLI' );
        }
    }

    public static function menu() {
        add_management_page(
            'TFM: tienda de prueba',
            'TFM: tienda de prueba',
            'manage_woocommerce',
            'tfm-tienda-prueba',
            array( __CLASS__, 'page' )
        );
    }

    /** Requisitos: WooCommerce y el plugin de componentes activos */
    public static function missing_requirements() {
        $missing = array();

        if ( ! class_exists( 'WooCommerce' ) ) {
            $missing[] = 'WooCommerce';
        }

        if ( ! class_exists( 'TFM_Blocks' ) ) {
            $missing[] = 'TFM Ecommerce Components';
        }

        return $missing;
    }

    public static function page() {
        $data    = get_option( self::OPTION );
        $missing = self::missing_requirements();
        $notice  = isset( $_GET['tfm'] ) ? sanitize_key( wp_unslash( $_GET['tfm'] ) ) : '';
        ?>
        <div class="wrap">
            <h1>TFM: tienda de prueba</h1>

            <?php if ( 'creada' === $notice ) : ?>
                <div class="notice notice-success"><p>La tienda de prueba se ha creado.</p></div>
            <?php elseif ( 'eliminada' === $notice ) : ?>
                <div class="notice notice-success"><p>Los datos de prueba se han eliminado.</p></div>
            <?php endif; ?>

            <?php if ( $missing ) : ?>
                <div class="notice notice-error"><p>Active antes estos plugins: <?php echo esc_html( implode( ', ', $missing ) ); ?>.</p></div>
            <?php endif; ?>

            <p>Este asistente prepara la tienda que usan las pruebas de usabilidad del TFM:</p>
            <ul style="list-style:disc;padding-left:20px">
                <li>Producto variable <strong>Camiseta Algodón Orgánico</strong> con tallas S, M, L y XL y colores Azul Marino, Blanco y Negro (12 variaciones). La talla S está agotada; Azul Marino cuesta 27.90 y el resto 24.90.</li>
                <li>Dos productos de relleno: Sudadera Básica y Gorra Deportiva.</li>
                <li>Página <strong>Camiseta Algodón Orgánico</strong> (dirección /prueba-camiseta/) con los selectores de color y de talla y el botón «Añadir al carrito».</li>
                <li>Página <strong>Inicio de la tienda</strong>, que se establece como portada y muestra los tres productos.</li>
                <li>Desactiva el modo «Próximamente» de WooCommerce para que los participantes vean la tienda sin iniciar sesión.</li>
            </ul>

            <?php if ( $data ) : ?>
                <h2>Tienda creada</h2>
                <p>
                    <a class="button" href="<?php echo esc_url( get_permalink( $data['home'] ) ); ?>" target="_blank">Ver la portada</a>
                    <a class="button button-primary" href="<?php echo esc_url( get_permalink( $data['test_page'] ) ); ?>" target="_blank">Ver la página de prueba</a>
                </p>
                <p>URL para la auditoría Lighthouse: <code><?php echo esc_html( get_permalink( $data['test_page'] ) ); ?></code></p>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('¿Eliminar los productos y páginas de prueba?');">
                    <input type="hidden" name="action" value="tfm_tienda_eliminar">
                    <?php wp_nonce_field( 'tfm_tienda_eliminar' ); ?>
                    <p><button class="button button-link-delete">Eliminar los datos de prueba</button></p>
                </form>
            <?php else : ?>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="tfm_tienda_crear">
                    <?php wp_nonce_field( 'tfm_tienda_crear' ); ?>
                    <p><button class="button button-primary button-hero" <?php disabled( (bool) $missing ); ?>>Crear la tienda de prueba</button></p>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }

    public static function handle_create() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( 'Permisos insuficientes.' );
        }
        check_admin_referer( 'tfm_tienda_crear' );
        $result = self::create();
        if ( is_wp_error( $result ) ) {
            wp_die( esc_html( $result->get_error_message() ) );
        }
        wp_safe_redirect( admin_url( 'tools.php?page=tfm-tienda-prueba&tfm=creada' ) );
        exit;
    }

    public static function handle_delete() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( 'Permisos insuficientes.' );
        }
        check_admin_referer( 'tfm_tienda_eliminar' );
        self::delete();
        wp_safe_redirect( admin_url( 'tools.php?page=tfm-tienda-prueba&tfm=eliminada' ) );
        exit;
    }

    /**
     * Crear (o recuperar) un atributo global y sus términos
     *
     * @return array [taxonomía, creado por este plugin]
     */
    private static function ensure_attribute( $slug, $label, $terms ) {
        $created  = false;
        $taxonomy = wc_attribute_taxonomy_name( $slug );

        if ( ! wc_attribute_taxonomy_id_by_name( $slug ) ) {
            $id = wc_create_attribute(
                array(
                    'name'         => $label,
                    'slug'         => $slug,
                    'type'         => 'select',
                    'order_by'     => 'menu_order',
                    'has_archives' => false,
                )
            );
            if ( is_wp_error( $id ) ) {
                return $id;
            }
            $created = true;
        }

        // La taxonomía de un atributo nuevo no existe hasta la siguiente carga
        if ( ! taxonomy_exists( $taxonomy ) ) {
            register_taxonomy( $taxonomy, array( 'product', 'product_variation' ), array( 'hierarchical' => false, 'show_ui' => false, 'query_var' => true, 'rewrite' => false ) );
        }

        $order = 0;
        foreach ( $terms as $term_slug => $name ) {
            if ( ! term_exists( $term_slug, $taxonomy ) ) {
                wp_insert_term( $name, $taxonomy, array( 'slug' => $term_slug ) );
            }
            $term = get_term_by( 'slug', $term_slug, $taxonomy );
            if ( $term ) {
                update_term_meta( $term->term_id, 'order', $order++ );
            }
        }

        return array( $taxonomy, $created );
    }

    private static function simple_product( $name, $price, $description ) {
        $product = new WC_Product_Simple();
        $product->set_name( $name );
        $product->set_status( 'publish' );
        $product->set_regular_price( $price );
        $product->set_short_description( $description );
        $product->set_manage_stock( true );
        $product->set_stock_quantity( 20 );
        return $product->save();
    }

    public static function create() {
        if ( self::missing_requirements() ) {
            return new WP_Error( 'tfm_requisitos', 'Active WooCommerce y TFM Ecommerce Components antes de crear la tienda.' );
        }

        if ( get_option( self::OPTION ) ) {
            return get_option( self::OPTION );
        }

        $size_names  = self::SIZES;
        $color_names = array_map( function ( $c ) { return $c[0]; }, self::COLORS );

        $size  = self::ensure_attribute( 'size', 'Talla', $size_names );
        $color = self::ensure_attribute( 'color', 'Color', $color_names );
        if ( is_wp_error( $size ) ) {
            return $size;
        }
        if ( is_wp_error( $color ) ) {
            return $color;
        }
        list( $size_tax, $size_created )   = $size;
        list( $color_tax, $color_created ) = $color;

        // Producto variable
        $product = new WC_Product_Variable();
        $product->set_name( 'Camiseta Algodón Orgánico' );
        $product->set_slug( 'camiseta-algodon-organico-prueba' );
        $product->set_status( 'publish' );
        $product->set_short_description( 'Camiseta de algodón orgánico certificado, corte regular y cuello redondo.' );

        $attributes = array();
        foreach ( array( array( $size_tax, array_keys( $size_names ) ), array( $color_tax, array_keys( $color_names ) ) ) as $pos => $def ) {
            $attr = new WC_Product_Attribute();
            $attr->set_id( wc_attribute_taxonomy_id_by_name( $def[0] ) );
            $attr->set_name( $def[0] );
            $ids = array();
            foreach ( $def[1] as $slug ) {
                $ids[] = get_term_by( 'slug', $slug, $def[0] )->term_id;
            }
            $attr->set_options( $ids );
            $attr->set_position( $pos );
            $attr->set_visible( true );
            $attr->set_variation( true );
            $attributes[] = $attr;
        }
        $product->set_attributes( $attributes );
        $product_id = $product->save();

        foreach ( self::STOCK as $size_slug => $by_color ) {
            foreach ( $by_color as $color_slug => $qty ) {
                $variation = new WC_Product_Variation();
                $variation->set_parent_id( $product_id );
                $variation->set_attributes( array( $size_tax => $size_slug, $color_tax => $color_slug ) );
                $variation->set_regular_price( self::COLORS[ $color_slug ][2] );
                $variation->set_manage_stock( true );
                $variation->set_stock_quantity( $qty );
                $variation->set_stock_status( $qty > 0 ? 'instock' : 'outofstock' );
                $variation->set_sku( 'TFM-CAM-' . strtoupper( $size_slug . '-' . $color_slug ) );
                $variation->save();
            }
        }
        WC_Product_Variable::sync( $product_id );
        wc_delete_product_transients( $product_id );

        $sweatshirt = self::simple_product( 'Sudadera Básica', '39.90', 'Sudadera de felpa con capucha.' );
        $cap        = self::simple_product( 'Gorra Deportiva', '14.90', 'Gorra ajustable de tejido transpirable.' );

        // Página de prueba con los bloques del plugin
        $color_map = array();
        foreach ( self::COLORS as $c ) {
            $color_map[ strtolower( remove_accents( $c[0] ) ) ] = $c[1];
        }
        $color_attrs = wp_json_encode( array( 'productId' => $product_id, 'colorMap' => $color_map, 'labelText' => 'Elige un color' ), JSON_UNESCAPED_UNICODE );
        $size_attrs  = wp_json_encode( array( 'productId' => $product_id, 'showPrice' => false, 'labelText' => 'Elige tu talla' ), JSON_UNESCAPED_UNICODE );

        $content = '<!-- wp:woocommerce/single-product {"productId":' . $product_id . '} -->'
            . '<div class="wp-block-woocommerce-single-product">'
            . '<!-- wp:woocommerce/product-summary {"isDescendentOfSingleProductBlock":true} /-->'
            . '<!-- wp:tfm-ecommerce/color-selector ' . $color_attrs . ' /-->'
            . '<!-- wp:tfm-ecommerce/size-selector ' . $size_attrs . ' /-->'
            . '<!-- wp:woocommerce/add-to-cart-form /-->'
            . '</div><!-- /wp:woocommerce/single-product -->';

        $test_page = wp_insert_post(
            array(
                'post_type'    => 'page',
                'post_status'  => 'publish',
                'post_title'   => 'Camiseta Algodón Orgánico',
                'post_name'    => 'prueba-camiseta',
                'post_content' => $content,
            )
        );

        // Portada con las tres tarjetas de producto
        $cards = array(
            array( 'Camiseta Algodón Orgánico', 'Desde 24.90', get_permalink( $test_page ) ),
            array( 'Sudadera Básica', '39.90', get_permalink( $sweatshirt ) ),
            array( 'Gorra Deportiva', '14.90', get_permalink( $cap ) ),
        );
        $columns = '';
        foreach ( $cards as $card ) {
            $columns .= '<!-- wp:column --><div class="wp-block-column">'
                . '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">' . esc_html( $card[0] ) . '</h3><!-- /wp:heading -->'
                . '<!-- wp:paragraph --><p>' . esc_html( $card[1] ) . '</p><!-- /wp:paragraph -->'
                . '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="' . esc_url( $card[2] ) . '">Ver producto</a></div><!-- /wp:button --></div><!-- /wp:buttons -->'
                . '</div><!-- /wp:column -->';
        }
        $home_content = '<!-- wp:paragraph --><p>Bienvenido a nuestra tienda de ropa sostenible. Estos son nuestros productos destacados.</p><!-- /wp:paragraph -->'
            . '<!-- wp:columns --><div class="wp-block-columns">' . $columns . '</div><!-- /wp:columns -->';

        $home = wp_insert_post(
            array(
                'post_type'    => 'page',
                'post_status'  => 'publish',
                'post_title'   => 'Inicio de la tienda',
                'post_name'    => 'inicio-tienda',
                'post_content' => $home_content,
            )
        );

        $data = array(
            'product'         => $product_id,
            'simple'          => array( $sweatshirt, $cap ),
            'test_page'       => $test_page,
            'home'            => $home,
            'created_tax'     => array_values( array_filter( array( $size_created ? 'size' : '', $color_created ? 'color' : '' ) ) ),
            'prev_show'       => get_option( 'show_on_front' ),
            'prev_coming'     => get_option( 'woocommerce_coming_soon', 'no' ),
            'prev_front_page' => get_option( 'page_on_front' ),
        );

        update_option( 'woocommerce_coming_soon', 'no' );
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $home );
        update_option( self::OPTION, $data, false );

        return $data;
    }

    public static function delete() {
        $data = get_option( self::OPTION );
        if ( ! $data ) {
            return;
        }

        $product = wc_get_product( $data['product'] );
        if ( $product ) {
            foreach ( $product->get_children() as $child ) {
                wp_delete_post( $child, true );
            }
            $product->delete( true );
        }
        foreach ( $data['simple'] as $id ) {
            $simple = wc_get_product( $id );
            if ( $simple ) {
                $simple->delete( true );
            }
        }
        wp_delete_post( $data['test_page'], true );
        wp_delete_post( $data['home'], true );

        update_option( 'show_on_front', $data['prev_show'] );
        update_option( 'page_on_front', $data['prev_front_page'] );
        if ( isset( $data['prev_coming'] ) ) {
            update_option( 'woocommerce_coming_soon', $data['prev_coming'] );
        }

        foreach ( $data['created_tax'] as $slug ) {
            $id = wc_attribute_taxonomy_id_by_name( $slug );
            if ( $id ) {
                wc_delete_attribute( $id );
            }
        }

        delete_option( self::OPTION );
    }
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    /**
     * Crea o elimina la tienda de prueba del TFM desde la línea de comandos.
     */
    class TFM_Tienda_Prueba_CLI {
        /**
         * Crea la tienda de prueba.
         */
        public function crear() {
            $data = TFM_Tienda_Prueba::create();
            if ( is_wp_error( $data ) ) {
                WP_CLI::error( $data->get_error_message() );
            }
            WP_CLI::success( 'Tienda creada. Página de prueba: ' . get_permalink( $data['test_page'] ) );
        }

        /**
         * Elimina los datos de prueba.
         */
        public function eliminar() {
            TFM_Tienda_Prueba::delete();
            WP_CLI::success( 'Datos de prueba eliminados.' );
        }
    }
}

add_action( 'plugins_loaded', array( 'TFM_Tienda_Prueba', 'init' ) );
