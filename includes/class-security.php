<?php
/**
 * Clase de seguridad del plugin
 * Gestiona la sanitización de datos, validación de nonces
 * y protección contra ataques XSS y CSRF
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

defined( 'ABSPATH' ) || exit;

class TFM_Security {

    /**
     * Instancia única de la clase (patrón Singleton)
     *
     * @var TFM_Security
     */
    private static $instance = null;

    /**
     * Obtener la instancia única de la clase
     *
     * @return TFM_Security
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor privado - inicializa los hooks de seguridad
     */
    private function __construct() {
        // Añadir cabeceras de seguridad HTTP
        add_action( 'send_headers', array( $this, 'add_security_headers' ) );

        // Verificar permisos en solicitudes AJAX
        add_action( 'wp_ajax_tfm_get_variations', array( $this, 'verify_ajax_request' ) );
        add_action( 'wp_ajax_nopriv_tfm_get_variations', array( $this, 'verify_ajax_request' ) );
    }

    /**
     * Sanitizar el ID de producto
     * Garantiza que el valor sea un entero positivo
     *
     * @param mixed $product_id Valor a sanitizar
     * @return int ID sanitizado o 0 si no es válido
     */
    public static function sanitize_product_id( $product_id ) {
        $sanitized = absint( $product_id );
        return $sanitized > 0 ? $sanitized : 0;
    }

    /**
     * Sanitizar texto visible al usuario
     * Previene ataques XSS en contenido de texto
     *
     * @param string $text Texto a sanitizar
     * @return string Texto sanitizado
     */
    public static function sanitize_display_text( $text ) {
        return esc_html( sanitize_text_field( $text ) );
    }

    /**
     * Sanitizar valor de atributo HTML
     * Para uso en atributos como data-*, aria-*, class
     *
     * @param string $attr Atributo a sanitizar
     * @return string Atributo sanitizado
     */
    public static function sanitize_html_attribute( $attr ) {
        return esc_attr( sanitize_text_field( $attr ) );
    }

    /**
     * Sanitizar URL
     * Verifica que la URL sea válida y segura
     *
     * @param string $url URL a sanitizar
     * @return string URL sanitizada
     */
    public static function sanitize_url( $url ) {
        return esc_url( $url );
    }

    /**
     * Sanitizar array de atributos de variación
     * Procesa el array de pa_size, pa_color, etc.
     *
     * @param array $attributes Array de atributos a sanitizar
     * @return array Array sanitizado
     */
    public static function sanitize_variation_attributes( $attributes ) {
        if ( ! is_array( $attributes ) ) {
            return array();
        }

        $sanitized = array();
        foreach ( $attributes as $key => $value ) {
            $clean_key             = sanitize_key( $key );
            $sanitized[ $clean_key ] = sanitize_text_field( $value );
        }

        return $sanitized;
    }

    /**
     * Verificar nonce de WordPress para solicitudes AJAX
     * Protege contra ataques CSRF
     *
     * @param string $nonce Nonce a verificar
     * @param string $action Acción asociada al nonce
     * @return bool True si el nonce es válido
     */
    public static function verify_nonce( $nonce, $action = 'wp_rest' ) {
        return (bool) wp_verify_nonce( $nonce, $action );
    }

    /**
     * Generar nonce para uso en el frontend
     *
     * @param string $action Acción del nonce
     * @return string Nonce generado
     */
    public static function create_nonce( $action = 'wp_rest' ) {
        return wp_create_nonce( $action );
    }

    /**
     * Verificar solicitud AJAX con nonce
     * Termina la ejecución si el nonce no es válido
     */
    public function verify_ajax_request() {
        $nonce = isset( $_REQUEST['nonce'] ) ? sanitize_text_field( $_REQUEST['nonce'] ) : '';

        if ( ! self::verify_nonce( $nonce, 'tfm_ajax' ) ) {
            wp_send_json_error(
                array(
                    'message' => __( 'Solicitud no autorizada.', 'tfm-ecommerce' ),
                    'code'    => 'invalid_nonce',
                ),
                403
            );
            exit;
        }
    }

    /**
     * Añadir cabeceras de seguridad HTTP
     * Protege contra ataques de tipo clickjacking y XSS
     */
    public function add_security_headers() {
        if ( is_admin() ) {
            return;
        }

        header( 'X-Content-Type-Options: nosniff' );
        header( 'X-Frame-Options: SAMEORIGIN' );
        header( 'Referrer-Policy: strict-origin-when-cross-origin' );
    }

    /**
     * Escapar output HTML completo del componente
     * Para uso en render_callback de bloques dinámicos
     *
     * @param string $html HTML a escapar
     * @return string HTML con tags permitidos
     */
    public static function escape_component_html( $html ) {
        $allowed_tags = array(
            'div'    => array(
                'class'           => true,
                'id'              => true,
                'data-product-id' => true,
                'data-variation'  => true,
                'role'            => true,
                'aria-label'      => true,
                'aria-live'       => true,
                'aria-atomic'     => true,
            ),
            'button' => array(
                'class'        => true,
                'type'         => true,
                'data-size'    => true,
                'data-color'   => true,
                'data-id'      => true,
                'role'         => true,
                'aria-pressed' => true,
                'aria-checked' => true,
                'aria-disabled'=> true,
                'aria-label'   => true,
                'disabled'     => true,
                'tabindex'     => true,
            ),
            'span'   => array(
                'class'     => true,
                'aria-live' => true,
                'role'      => true,
            ),
            'p'      => array(
                'class' => true,
            ),
            'strong' => array(),
            'em'     => array(),
        );

        return wp_kses( $html, $allowed_tags );
    }
}
