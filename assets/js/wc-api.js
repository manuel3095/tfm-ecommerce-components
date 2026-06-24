/**
 * Capa de abstracción sobre la API REST de WooCommerce
 * Implementa el patrón Facade para desacoplar los componentes
 * de la interfaz de los detalles de la API subyacente
 *
 * Patrones implementados:
 * - Facade: interfaz simplificada sobre la API REST
 * - Cache: almacenamiento en memoria de respuestas frecuentes
 * - Retry: reintentos automáticos ante fallos de red
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

( function( window ) {

    'use strict';

    /**
     * Objeto de configuración global
     * Los valores son inyectados por PHP mediante wp_localize_script
     */
    const config = window.tfmData || {
        nonce:   '',
        restUrl: '/wp-json/',
        wcUrl:   '/wp-json/wc/v3/',
    };

    /**
     * Caché en memoria para respuestas de la API
     * Evita peticiones repetidas para el mismo producto
     *
     * @type {Map<string, {data: any, timestamp: number}>}
     */
    const cache = new Map();

    /**
     * Tiempo de expiración de la caché en milisegundos (5 minutos)
     *
     * @type {number}
     */
    const CACHE_TTL = 5 * 60 * 1000;

    /**
     * Número máximo de reintentos ante fallos de red
     *
     * @type {number}
     */
    const MAX_RETRIES = 3;

    /**
     * Verificar si una entrada de caché es válida
     *
     * @param {string} key Clave de caché a verificar
     * @return {boolean} True si la entrada existe y no ha expirado
     */
    function isCacheValid( key ) {
        if ( ! cache.has( key ) ) {
            return false;
        }
        const entry = cache.get( key );
        return ( Date.now() - entry.timestamp ) < CACHE_TTL;
    }

    /**
     * Realizar petición HTTP con reintentos automáticos
     *
     * @param {string} url URL de la petición
     * @param {Object} options Opciones de fetch
     * @param {number} retries Número de reintentos restantes
     * @return {Promise<Response>} Promesa con la respuesta HTTP
     */
    async function fetchWithRetry( url, options = {}, retries = MAX_RETRIES ) {
        try {
            const response = await fetch( url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce':   config.nonce,
                    ...( options.headers || {} ),
                },
            } );

            if ( ! response.ok ) {
                throw new Error(
                    `HTTP Error: ${ response.status } ${ response.statusText }`
                );
            }

            return response;

        } catch ( error ) {
            if ( retries > 0 ) {
                // Esperar antes de reintentar (backoff exponencial)
                await new Promise(
                    resolve => setTimeout( resolve, ( MAX_RETRIES - retries + 1 ) * 300 )
                );
                return fetchWithRetry( url, options, retries - 1 );
            }
            throw error;
        }
    }

    /**
     * API pública del módulo WC API
     * Expuesta globalmente como window.TFMWcApi
     */
    const TFMWcApi = {

        /**
         * Obtener todas las variaciones disponibles de un producto variable
         * Implementa caché en memoria para evitar peticiones repetidas
         *
         * @param {number} productId ID del producto WooCommerce
         * @return {Promise<Array>} Promesa con array de variaciones
         */
        async getProductVariations( productId ) {
            const cacheKey = `variations_${ productId }`;

            // Retornar datos desde caché si están disponibles y vigentes
            if ( isCacheValid( cacheKey ) ) {
                return cache.get( cacheKey ).data;
            }

            try {
                const response = await fetchWithRetry(
                    `${ config.restUrl }tfm-ecommerce/v1/variations/${ productId }`
                );

                const data = await response.json();

                // Guardar en caché
                cache.set( cacheKey, {
                    data:      data,
                    timestamp: Date.now(),
                } );

                return data;

            } catch ( error ) {
                console.error(
                    `TFM WC API: Error al obtener variaciones del producto ${ productId }:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Verificar el stock actual de una variación específica
         * No usa caché para garantizar datos en tiempo real
         *
         * @param {number} variationId ID de la variación WooCommerce
         * @return {Promise<Object>} Promesa con datos de stock
         */
        async checkVariationStock( variationId ) {
            try {
                const response = await fetchWithRetry(
                    `${ config.restUrl }tfm-ecommerce/v1/stock/${ variationId }`
                );

                return await response.json();

            } catch ( error ) {
                console.error(
                    `TFM WC API: Error al verificar stock de variación ${ variationId }:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Obtener el precio formateado de una variación específica
         *
         * @param {number} productId ID del producto padre
         * @param {number} variationId ID de la variación
         * @return {Promise<string>} Promesa con el precio formateado en HTML
         */
        async getVariationPrice( productId, variationId ) {
            try {
                const variations = await this.getProductVariations( productId );
                const variation  = variations.find( v => v.id === variationId );

                if ( ! variation ) {
                    throw new Error(
                        `Variación ${ variationId } no encontrada en producto ${ productId }`
                    );
                }

                return variation.price;

            } catch ( error ) {
                console.error(
                    'TFM WC API: Error al obtener precio de variación:',
                    error
                );
                throw error;
            }
        },

        /**
         * Encontrar la variación que coincide con los atributos seleccionados
         *
         * @param {number} productId ID del producto
         * @param {Object} selectedAttributes Atributos seleccionados por el usuario
         * @return {Promise<Object|null>} Promesa con la variación coincidente o null
         */
        async findMatchingVariation( productId, selectedAttributes ) {
            try {
                const variations = await this.getProductVariations( productId );

                return variations.find( variation => {
                    return Object.entries( selectedAttributes ).every(
                        ( [ key, value ] ) => {
                            const attrKey = key.startsWith( 'attribute_' )
                                ? key
                                : `attribute_${ key }`;

                            return variation.attributes[ attrKey ] === value ||
                                   variation.attributes[ attrKey ] === '';
                        }
                    );
                } ) || null;

            } catch ( error ) {
                console.error(
                    'TFM WC API: Error al buscar variación coincidente:',
                    error
                );
                return null;
            }
        },

        /**
         * Limpiar la caché de un producto específico
         *
         * @param {number} productId ID del producto a limpiar
         */
        clearProductCache( productId ) {
            cache.delete( `variations_${ productId }` );
        },

        /**
         * Limpiar toda la caché del módulo
         */
        clearAllCache() {
            cache.clear();
        },

    };

    // Exponer el módulo globalmente
    window.TFMWcApi = TFMWcApi;

} )( window );
