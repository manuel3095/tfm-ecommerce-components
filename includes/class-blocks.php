<?php
/**
 * Clase principal para el registro y gestión de bloques Gutenberg
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

defined( 'ABSPATH' ) || exit;

class TFM_Blocks {

    /**
     * Instancia única de la clase (patrón Singleton)
     *
     * @var TFM_Blocks|null
     */
    private static $instance = null;

    /**
     * Obtener la instancia única de la clase
     *
     * @return TFM_Blocks
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor privado: inicializa los hooks de WordPress
     */
    private function __construct() {
        add_action( 'init', array( $this, 'register_assets' ), 5 );
        add_action( 'init', array( $this, 'register_blocks' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
    }

    /**
     * Registrar hojas de estilo y scripts compartidos.
     * Se ejecuta antes que register_blocks para que block.json
     * pueda referenciar los handles en editorStyle.
     */
    public function register_assets() {
        wp_register_style(
            'tfm-tokens',
            TFM_PLUGIN_URL . 'assets/css/tokens.css',
            array(),
            TFM_VERSION
        );

        wp_register_style(
            'tfm-components',
            TFM_PLUGIN_URL . 'assets/css/components.css',
            array( 'tfm-tokens' ),
            TFM_VERSION
        );

        wp_register_style(
            'tfm-size-selector',
            TFM_PLUGIN_URL . 'blocks/size-selector/style.css',
            array( 'tfm-tokens' ),
            TFM_VERSION
        );

        wp_register_script(
            'tfm-wc-api',
            TFM_PLUGIN_URL . 'assets/js/wc-api.js',
            array(),
            TFM_VERSION,
            true
        );

        wp_register_script(
            'tfm-frontend',
            TFM_PLUGIN_URL . 'assets/js/frontend.js',
            array( 'tfm-wc-api' ),
            TFM_VERSION,
            true
        );
    }

    /**
     * Registrar todos los bloques del plugin
     */
    public function register_blocks() {
        register_block_type(
            TFM_PLUGIN_DIR . 'blocks/size-selector',
            array(
                'render_callback' => array( $this, 'render_size_selector' ),
            )
        );

        register_block_type(
            TFM_PLUGIN_DIR . 'blocks/color-selector',
            array(
                'render_callback' => array( $this, 'render_color_selector' ),
            )
        );
    }

    /**
     * Renderizar el bloque selector de tallas en el frontend.
     * La plantilla render.php valida el producto y genera el HTML.
     *
     * @param array $attributes Atributos del bloque configurados en el editor
     * @return string HTML del componente
     */
    public function render_size_selector( $attributes ) {
        return $this->render_template( 'size-selector', $attributes );
    }

    /**
     * Renderizar el bloque selector de colores en el frontend
     *
     * @param array $attributes Atributos del bloque configurados en el editor
     * @return string HTML del componente
     */
    public function render_color_selector( $attributes ) {
        return $this->render_template( 'color-selector', $attributes );
    }

    /**
     * Matriz completa de variaciones de un producto.
     *
     * Cada selector agrupa las variaciones por su propio atributo; el script
     * del frontend necesita además todas las combinaciones para resolver la
     * variación exacta cuando el usuario elige talla y color.
     *
     * @param WC_Product_Variable $product Producto variable
     * @return array Lista de variaciones con atributos, stock y precio
     */
    public static function get_variation_matrix( $product ) {
        $matrix = array();

        foreach ( $product->get_available_variations() as $variation ) {
            $attributes = array();

            foreach ( (array) $variation['attributes'] as $key => $value ) {
                $attributes[ sanitize_key( $key ) ] = sanitize_title( $value );
            }

            $matrix[] = array(
                'id'         => absint( $variation['variation_id'] ),
                'attributes' => $attributes,
                'in_stock'   => (bool) $variation['is_in_stock'],
                'stock_qty'  => isset( $variation['max_qty'] ) && '' !== $variation['max_qty'] ? absint( $variation['max_qty'] ) : null,
                'price'      => floatval( $variation['display_price'] ),
                'price_html' => wp_kses_post( $variation['price_html'] ),
            );
        }

        return $matrix;
    }

    /**
     * Incluir la plantilla de renderizado de un bloque
     *
     * @param string $block      Carpeta del bloque
     * @param array  $attributes Atributos del bloque
     * @return string HTML generado
     */
    private function render_template( $block, $attributes ) {
        if ( ! function_exists( 'wc_get_product' ) ) {
            return '';
        }

        $attributes = is_array( $attributes ) ? $attributes : array();

        ob_start();
        include TFM_PLUGIN_DIR . 'blocks/' . $block . '/render.php';
        return ob_get_clean();
    }

    /**
     * Cargar assets del frontend solo en páginas que contienen
     * los bloques del plugin (carga condicional con has_block)
     */
    public function enqueue_frontend_assets() {
        global $post;

        if ( ! is_singular() || ! $post ) {
            return;
        }

        $has_size_selector  = has_block( 'tfm-ecommerce/size-selector', $post );
        $has_color_selector = has_block( 'tfm-ecommerce/color-selector', $post );

        if ( ! $has_size_selector && ! $has_color_selector ) {
            return;
        }

        wp_enqueue_style( 'tfm-components' );

        if ( $has_size_selector ) {
            wp_enqueue_style( 'tfm-size-selector' );
        }

        wp_enqueue_script( 'tfm-frontend' );

        // Pasar datos del servidor al JavaScript (nonce y rutas de la API)
        wp_localize_script(
            'tfm-wc-api',
            'tfmData',
            array(
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'restUrl' => esc_url_raw( rest_url() ),
            )
        );
    }
}
