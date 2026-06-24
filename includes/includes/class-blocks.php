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
     * @var TFM_Blocks
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
     * Constructor privado - inicializa los hooks de WordPress
     */
    private function __construct() {
        add_action( 'init', array( $this, 'register_blocks' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
    }

    /**
     * Registrar todos los bloques del plugin
     * Se ejecuta en el hook 'init' de WordPress
     */
    public function register_blocks() {
        // Registrar bloque selector de tallas
        register_block_type(
            TFM_PLUGIN_DIR . 'blocks/size-selector',
            array(
                'render_callback' => array( $this, 'render_size_selector' ),
            )
        );

        // Registrar bloque selector de colores
        register_block_type(
            TFM_PLUGIN_DIR . 'blocks/color-selector',
            array(
                'render_callback' => array( $this, 'render_color_selector' ),
            )
        );
    }

    /**
     * Renderizar el bloque selector de tallas en el frontend
     * La función de renderizado se ejecuta en cada carga de página
     *
     * @param array $attributes Atributos del bloque configurados en el editor
     * @return string HTML sanitizado del componente
     */
    public function render_size_selector( $attributes ) {
        // Sanitizar atributos de entrada
        $product_id = isset( $attributes['productId'] ) ? absint( $attributes['productId'] ) : 0;
        $show_stock  = isset( $attributes['showStock'] ) ? (bool) $attributes['showStock'] : true;
        $style       = isset( $attributes['style'] ) ? sanitize_text_field( $attributes['style'] ) : 'default';

        // Verificar que el producto existe y es variable
        if ( ! $product_id ) {
            return '';
        }

        $product = wc_get_product( $product_id );

        if ( ! $product || ! $product->is_type( 'variable' ) ) {
            return '';
        }

        // Obtener variaciones disponibles
        $variations = $product->get_available_variations();

        if ( empty( $variations ) ) {
            return '';
        }

        // Cargar template de renderizado
        ob_start();
        include TFM_PLUGIN_DIR . 'blocks/size-selector/render.php';
        return ob_get_clean();
    }

    /**
     * Renderizar el bloque selector de colores en el frontend
     *
     * @param array $attributes Atributos del bloque configurados en el editor
     * @return string HTML sanitizado del componente
     */
    public function render_color_selector( $attributes ) {
        $product_id = isset( $attributes['productId'] ) ? absint( $attributes['productId'] ) : 0;
        $show_stock  = isset( $attributes['showStock'] ) ? (bool) $attributes['showStock'] : true;

        if ( ! $product_id ) {
            return '';
        }

        $product = wc_get_product( $product_id );

        if ( ! $product || ! $product->is_type( 'variable' ) ) {
            return '';
        }

        $variations = $product->get_available_variations();

        if ( empty( $variations ) ) {
            return '';
        }

        ob_start();
        include TFM_PLUGIN_DIR . 'blocks/color-selector/render.php';
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

        // Verificar si la página contiene alguno de los bloques
        $has_size_selector  = has_block( 'tfm-ecommerce/size-selector', $post );
        $has_color_selector = has_block( 'tfm-ecommerce/color-selector', $post );

        if ( ! $has_size_selector && ! $has_color_selector ) {
            return;
        }

        // Cargar CSS de Design Tokens y componentes
        wp_enqueue_style(
            'tfm-tokens',
            TFM_PLUGIN_URL . 'assets/css/tokens.css',
            array(),
            TFM_VERSION
        );

        wp_enqueue_style(
            'tfm-components',
            TFM_PLUGIN_URL . 'assets/css/components.css',
            array( 'tfm-tokens' ),
            TFM_VERSION
        );

        // Cargar JavaScript del frontend
        wp_enqueue_script(
            'tfm-wc-api',
            TFM_PLUGIN_URL . 'assets/js/wc-api.js',
            array( 'jquery' ),
            TFM_VERSION,
            true
        );

        wp_enqueue_script(
            'tfm-frontend',
            TFM_PLUGIN_URL . 'assets/js/frontend.js',
            array( 'tfm-wc-api' ),
            TFM_VERSION,
            true
        );

        // Pasar datos del servidor al JavaScript (nonce para seguridad)
        wp_localize_script(
            'tfm-frontend',
            'tfmData',
            array(
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'restUrl' => esc_url_raw( rest_url() ),
                'wcUrl'   => esc_url_raw( rest_url( 'wc/v3/' ) ),
            )
        );
    }

    /**
     * Cargar assets del editor de bloques Gutenberg
     */
    public function enqueue_editor_assets() {
        wp_enqueue_style(
            'tfm-editor-styles',
            TFM_PLUGIN_URL . 'assets/css/tokens.css',
            array(),
            TFM_VERSION
        );
    }
}
