<?php
/**
 * Plugin Name: TFM Ecommerce Components
 * Plugin URI: https://github.com/TU-USUARIO/tfm-ecommerce-components
 * Description: Sistema de componentes interactivos reutilizables para plataformas de Ecommerce basadas en WordPress. Desarrollado como Trabajo de Fin de Máster en Diseño y Desarrollo de Interfaz de Usuario Web - UNIR 2024.
 * Version: 1.0.0
 * Author: Manuel Jose Passo Pacheco
 * Author URI: https://uniguajira.edu.co
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: tfm-ecommerce
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 */

defined( 'ABSPATH' ) || exit;

define( 'TFM_VERSION', '1.0.0' );
define( 'TFM_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'TFM_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Cargar las clases principales del plugin
 */
require_once TFM_PLUGIN_DIR . 'includes/class-blocks.php';
require_once TFM_PLUGIN_DIR . 'includes/class-wc-integration.php';
require_once TFM_PLUGIN_DIR . 'includes/class-security.php';

/**
 * Inicializar el plugin cuando WordPress esté listo
 */
add_action( 'plugins_loaded', 'tfm_init_plugin' );

function tfm_init_plugin() {
    // Verificar que WooCommerce está activo
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', 'tfm_woocommerce_missing_notice' );
        return;
    }

    // Inicializar clases
    TFM_Blocks::get_instance();
    TFM_WC_Integration::get_instance();
    TFM_Security::get_instance();
}

/**
 * Aviso de administración si WooCommerce no está instalado
 */
function tfm_woocommerce_missing_notice() {
    echo '<div class="error"><p>';
    echo esc_html__( 'TFM Ecommerce Components requiere WooCommerce para funcionar. Por favor instala y activa WooCommerce.', 'tfm-ecommerce' );
    echo '</p></div>';
}

/**
 * Acciones de activación y desactivación del plugin
 */
register_activation_hook( __FILE__, 'tfm_activate' );
register_deactivation_hook( __FILE__, 'tfm_deactivate' );

function tfm_activate() {
    flush_rewrite_rules();
}

function tfm_deactivate() {
    flush_rewrite_rules();
}
