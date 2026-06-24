<?php
/**
 * Clase de integración con WooCommerce
 * Gestiona la comunicación con la API REST de WooCommerce
 * y la obtención de datos de productos variables
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

defined( 'ABSPATH' ) || exit;

class TFM_WC_Integration {

    /**
     * Instancia única de la clase (patrón Singleton)
     *
     * @var TFM_WC_Integration
     */
    private static $instance = null;

    /**
     * Tiempo de caché para variaciones de producto en segundos
     * Por defecto 1 hora (3600 segundos)
     *
     * @var int
     */
    private $cache_expiration = 3600;

    /**
     * Obtener la instancia única de la clase
     *
     * @return TFM_WC_Integration
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
        // Registrar endpoints de la API REST personalizada
        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

        // Limpiar caché cuando se actualiza un producto
        add_action( 'woocommerce_update_product', array( $this, 'clear_product_cache' ) );
        add_action( 'woocommerce_update_product_variation', array( $this, 'clear_variation_cache' ) );
    }

    /**
     * Registrar rutas personalizadas en la API REST de WordPress
     * Namespace: tfm-ecommerce/v1
     */
    public function register_rest_routes() {
        // Endpoint para obtener variaciones de un producto
        register_rest_route(
            'tfm-ecommerce/v1',
            '/variations/(?P<id>\d+)',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_product_variations' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function( $param ) {
                            return is_numeric( $param );
                        },
                        'sanitize_callback' => 'absint',
                    ),
                ),
            )
        );

        // Endpoint para verificar stock de una variación específica
        register_rest_route(
            'tfm-ecommerce/v1',
            '/stock/(?P<id>\d+)',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_variation_stock' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'id' => array(
                        'validate_callback' => function( $param ) {
                            return is_numeric( $param );
                        },
                        'sanitize_callback' => 'absint',
                    ),
                ),
            )
        );
    }

    /**
     * Obtener todas las variaciones disponibles de un producto variable
     * Implementa caché mediante WordPress Transients API
     *
     * @param WP_REST_Request $request Objeto de la solicitud REST
     * @return WP_REST_Response|WP_Error
     */
    public function get_product_variations( $request ) {
        $product_id = $request->get_param( 'id' );

        // Intentar obtener datos desde caché
        $cache_key  = 'tfm_variations_' . $product_id;
        $variations = get_transient( $cache_key );

        if ( false === $variations ) {
            $product = wc_get_product( $product_id );

            if ( ! $product ) {
                return new WP_Error(
                    'product_not_found',
                    __( 'Producto no encontrado.', 'tfm-ecommerce' ),
                    array( 'status' => 404 )
                );
            }

            if ( ! $product->is_type( 'variable' ) ) {
                return new WP_Error(
                    'not_variable_product',
                    __( 'El producto no es de tipo variable.', 'tfm-ecommerce' ),
                    array( 'status' => 400 )
                );
            }

            // Obtener y formatear variaciones
            $raw_variations = $product->get_available_variations();
            $variations     = array();

            foreach ( $raw_variations as $variation ) {
                $variation_obj = wc_get_product( $variation['variation_id'] );

                if ( ! $variation_obj ) {
                    continue;
                }

                $variations[] = array(
                    'id'            => absint( $variation['variation_id'] ),
                    'price'         => esc_html( $variation_obj->get_price_html() ),
                    'price_raw'     => floatval( $variation_obj->get_price() ),
                    'in_stock'      => (bool) $variation_obj->is_in_stock(),
                    'stock_qty'     => absint( $variation_obj->get_stock_quantity() ),
                    'attributes'    => array_map( 'sanitize_text_field', $variation['attributes'] ),
                    'image'         => array(
                        'url' => esc_url( $variation['image']['url'] ),
                        'alt' => esc_attr( $variation['image']['alt'] ),
                    ),
                    'sku'           => esc_html( $variation_obj->get_sku() ),
                    'is_purchasable' => (bool) $variation_obj->is_purchasable(),
                );
            }

            // Guardar en caché por 1 hora
            set_transient( $cache_key, $variations, $this->cache_expiration );
        }

        return rest_ensure_response( $variations );
    }

    /**
     * Verificar el stock actual de una variación específica
     * No usa caché para garantizar datos en tiempo real
     *
     * @param WP_REST_Request $request Objeto de la solicitud REST
     * @return WP_REST_Response|WP_Error
     */
    public function get_variation_stock( $request ) {
        $variation_id = $request->get_param( 'id' );
        $variation    = wc_get_product( $variation_id );

        if ( ! $variation || ! $variation->is_type( 'variation' ) ) {
            return new WP_Error(
                'variation_not_found',
                __( 'Variación no encontrada.', 'tfm-ecommerce' ),
                array( 'status' => 404 )
            );
        }

        return rest_ensure_response(
            array(
                'id'        => absint( $variation_id ),
                'in_stock'  => (bool) $variation->is_in_stock(),
                'stock_qty' => absint( $variation->get_stock_quantity() ),
                'status'    => esc_html( $variation->get_stock_status() ),
            )
        );
    }

    /**
     * Limpiar caché de variaciones cuando se actualiza un producto
     *
     * @param int $product_id ID del producto actualizado
     */
    public function clear_product_cache( $product_id ) {
        delete_transient( 'tfm_variations_' . absint( $product_id ) );
    }

    /**
     * Limpiar caché cuando se actualiza una variación específica
     *
     * @param int $variation_id ID de la variación actualizada
     */
    public function clear_variation_cache( $variation_id ) {
        $variation = wc_get_product( $variation_id );
        if ( $variation ) {
            $parent_id = $variation->get_parent_id();
            delete_transient( 'tfm_variations_' . absint( $parent_id ) );
        }
    }
}
