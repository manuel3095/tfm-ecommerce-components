/**
 * JavaScript de interactividad del frontend
 * Gestiona los eventos de usuario en los selectores de variantes del plugin.
 *
 * Patrones implementados:
 * - Strategy: cada tipo de selector (tallas, colores) define su propia
 *   configuración (clases, atributo de datos, textos) y comparte la lógica común.
 * - Observer: comunicación entre el selector y el resto de la página
 *   mediante eventos personalizados (CustomEvent).
 * - Module: encapsulación mediante IIFE.
 *
 * @package TFM_Ecommerce_Components
 * @since 1.1.0
 */

( function( window, document ) {

    'use strict';

    /**
     * Estrategias por tipo de selector
     */
    const STRATEGIES = {
        size: {
            root:        '.tfm-size-selector',
            prefix:      'tfm-size-selector',
            option:      'tfm-size-selector__button',
            valueKey:    'size',
            eventName:   'tfm:sizeSelected',
            describe:    button => button.dataset.size,
        },
        color: {
            root:        '.tfm-color-selector',
            prefix:      'tfm-color-selector',
            option:      'tfm-color-selector__swatch',
            valueKey:    'color',
            eventName:   'tfm:colorSelected',
            describe:    button => button.dataset.label || button.dataset.value,
        },
    };

    /** Intervalo mínimo entre revalidaciones de stock (ms) */
    const VALIDATION_INTERVAL = 30000;

    const TFMVariantSelector = {

        /**
         * Inicializar todos los selectores presentes en la página
         */
        init() {
            Object.keys( STRATEGIES ).forEach( type => {
                const strategy = STRATEGIES[ type ];
                document.querySelectorAll( strategy.root ).forEach( component => {
                    if ( component.dataset.tfmReady ) {
                        return;
                    }
                    component.dataset.tfmReady = 'true';
                    this.initComponent( component, strategy );
                } );
            } );
        },

        /**
         * Inicializar un componente individual
         *
         * @param {HTMLElement} component Elemento raíz del componente
         * @param {Object} strategy Estrategia del tipo de selector
         */
        initComponent( component, strategy ) {
            const productId  = parseInt( component.dataset.productId, 10 );
            const variations = this.parseVariations( component );

            if ( ! productId || ! variations.length ) {
                return;
            }

            this.initOptions( component, strategy, variations );
            this.initStockValidation( component, strategy, productId );
        },

        /**
         * Leer las variaciones serializadas por PHP en data-variations
         *
         * @param {HTMLElement} component Elemento del componente
         * @return {Array} Variaciones
         */
        parseVariations( component ) {
            try {
                const raw = component.dataset.variations;
                return raw ? JSON.parse( raw ) : [];
            } catch ( error ) {
                console.error( 'TFM Frontend: error al leer las variaciones:', error );
                return [];
            }
        },

        /**
         * Registrar los eventos de clic y teclado de cada opción
         *
         * @param {HTMLElement} component Elemento del componente
         * @param {Object} strategy Estrategia del selector
         * @param {Array} variations Variaciones disponibles
         */
        initOptions( component, strategy, variations ) {
            const options   = component.querySelectorAll( '.' + strategy.option );
            const priceEl   = component.querySelector( '.' + strategy.prefix + '__price' );
            const stockEl   = component.querySelector( '.' + strategy.prefix + '__stock-message' );
            const nameEl    = component.querySelector( '.' + strategy.prefix + '__selected-name' );
            const showPrice = component.dataset.showPrice === 'true';
            const showStock = component.dataset.showStock === 'true';

            options.forEach( option => {
                option.addEventListener( 'click', event => {
                    event.preventDefault();

                    if ( option.disabled || option.getAttribute( 'aria-disabled' ) === 'true' ) {
                        return;
                    }

                    const variationId = parseInt( option.dataset.variationId, 10 );
                    const priceHtml   = option.dataset.priceHtml;
                    const price       = parseFloat( option.dataset.price );
                    const variation   = variations.find( v => v.variation_id === variationId );

                    this.updateOptionStates( options, option, strategy );

                    if ( nameEl ) {
                        nameEl.textContent = strategy.describe( option );
                    }

                    if ( showPrice && priceEl ) {
                        this.updatePrice( priceEl, priceHtml );
                    }

                    if ( showStock && stockEl && variation ) {
                        this.updateStockMessage( stockEl, strategy, variation.in_stock, variation.stock_qty );
                    }

                    this.dispatchSelectionEvent( component, strategy, {
                        productId:   parseInt( component.dataset.productId, 10 ),
                        variationId: variationId,
                        attribute:   strategy.valueKey,
                        value:       option.dataset[ strategy.valueKey ] || option.dataset.value,
                        price:       price,
                        priceHtml:   priceHtml,
                    } );
                } );

                option.addEventListener( 'keydown', event => {
                    this.handleKeyboardNavigation( event, options, option );
                } );
            } );
        },

        /**
         * Marcar la opción seleccionada (aria-checked y clase visual)
         */
        updateOptionStates( options, selected, strategy ) {
            options.forEach( option => {
                const isSelected = option === selected;
                option.setAttribute( 'aria-checked', isSelected ? 'true' : 'false' );
                option.classList.toggle( strategy.option + '--selected', isSelected );
            } );
        },

        /**
         * Actualizar el precio; la región aria-live lo anuncia
         */
        updatePrice( priceEl, priceHtml ) {
            priceEl.innerHTML = priceHtml;
            priceEl.classList.add( 'tfm-price-updated' );
            window.setTimeout( () => priceEl.classList.remove( 'tfm-price-updated' ), 300 );
        },

        /**
         * Actualizar el mensaje de disponibilidad
         */
        updateStockMessage( stockEl, strategy, inStock, stockQty ) {
            const base = strategy.prefix + '__stock-message';

            stockEl.classList.remove( base + '--in-stock', base + '--low-stock', base + '--out-of-stock' );

            if ( ! inStock ) {
                stockEl.classList.add( base + '--out-of-stock' );
                stockEl.textContent = 'Agotado';
                return;
            }

            if ( typeof stockQty === 'number' && stockQty > 0 && stockQty <= 5 ) {
                stockEl.classList.add( base + '--low-stock' );
                stockEl.textContent = stockQty === 1
                    ? '¡Solo queda 1 unidad!'
                    : `¡Solo quedan ${ stockQty } unidades!`;
                return;
            }

            stockEl.classList.add( base + '--in-stock' );
            stockEl.textContent = 'En stock';
        },

        /**
         * Navegación por teclado del patrón ARIA radiogroup
         */
        handleKeyboardNavigation( event, options, current ) {
            const enabled = Array.from( options ).filter( option => ! option.disabled );
            const index   = enabled.indexOf( current );
            let next      = null;

            switch ( event.key ) {
                case 'ArrowRight':
                case 'ArrowDown':
                    next = ( index + 1 ) % enabled.length;
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    next = ( index - 1 + enabled.length ) % enabled.length;
                    break;
                case 'Home':
                    next = 0;
                    break;
                case 'End':
                    next = enabled.length - 1;
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    current.click();
                    return;
                default:
                    return;
            }

            event.preventDefault();
            enabled[ next ].focus();
        },

        /**
         * Emitir eventos personalizados de selección (patrón Observer)
         */
        dispatchSelectionEvent( component, strategy, detail ) {
            component.dispatchEvent( new CustomEvent( strategy.eventName, {
                bubbles:    true,
                cancelable: true,
                detail:     detail,
            } ) );

            document.dispatchEvent( new CustomEvent( 'tfm:variationSelected', {
                detail: detail,
            } ) );
        },

        /**
         * Revalidar el stock contra la API cuando el componente recibe el foco
         */
        initStockValidation( component, strategy, productId ) {
            let lastValidated = 0;

            component.addEventListener( 'focusin', async () => {
                const now = Date.now();

                if ( ! window.TFMWcApi || now - lastValidated < VALIDATION_INTERVAL ) {
                    return;
                }

                lastValidated = now;

                try {
                    const fresh = await window.TFMWcApi.getProductVariations( productId );

                    if ( ! Array.isArray( fresh ) || ! fresh.length ) {
                        return;
                    }

                    component.querySelectorAll( '.' + strategy.option ).forEach( option => {
                        const variation = fresh.find(
                            v => v.id === parseInt( option.dataset.variationId, 10 )
                        );

                        if ( ! variation ) {
                            return;
                        }

                        const available = Boolean( variation.in_stock );

                        option.disabled = ! available;
                        option.setAttribute( 'aria-disabled', available ? 'false' : 'true' );
                        option.setAttribute( 'tabindex', available ? '0' : '-1' );
                        option.classList.toggle( strategy.option + '--out-of-stock', ! available );
                    } );
                } catch ( error ) {
                    console.warn( 'TFM Frontend: no se pudo revalidar el stock:', error );
                }
            } );
        },
    };

    /**
     * Integración con el formulario de variaciones de WooCommerce:
     * actualiza el campo variation_id para que «Añadir al carrito» funcione.
     */
    document.addEventListener( 'tfm:variationSelected', event => {
        const { variationId, productId } = event.detail;
        const form = document.querySelector( `form.cart[data-product_id="${ productId }"]` );

        if ( ! form ) {
            return;
        }

        const input = form.querySelector( 'input[name="variation_id"]' );

        if ( input ) {
            input.value = variationId;
            input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
        }
    } );

    if ( document.readyState === 'loading' ) {
        document.addEventListener( 'DOMContentLoaded', () => TFMVariantSelector.init() );
    } else {
        TFMVariantSelector.init();
    }

    // Exponer el módulo para extensibilidad (alias retrocompatible)
    window.TFMVariantSelector = TFMVariantSelector;
    window.TFMSizeSelector    = TFMVariantSelector;

} )( window, document );
