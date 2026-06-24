/**
 * JavaScript de interactividad del frontend
 * Gestiona los eventos de usuario en los componentes del plugin
 * Implementa los patrones Observer y Strategy para la comunicación
 * entre componentes independientes en la misma página
 *
 * Patrones implementados:
 * - Observer: comunicación entre selector y carrito via CustomEvent
 * - Strategy: manejo diferenciado por tipo de atributo
 * - Module: encapsulación mediante IIFE
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

( function( window, document ) {

    'use strict';

    /**
     * Módulo principal de interactividad del Selector de Tallas
     */
    const TFMSizeSelector = {

        /**
         * Selector CSS para identificar los componentes en el DOM
         *
         * @type {string}
         */
        componentSelector: '.tfm-size-selector',

        /**
         * Inicializar todos los selectores de tallas en la página
         * Se ejecuta cuando el DOM está completamente cargado
         */
        init() {
            const components = document.querySelectorAll(
                this.componentSelector
            );

            if ( ! components.length ) {
                return;
            }

            components.forEach( component => {
                this.initComponent( component );
            } );
        },

        /**
         * Inicializar un componente individual
         *
         * @param {HTMLElement} component Elemento raíz del componente
         */
        initComponent( component ) {
            const productId  = component.dataset.productId;
            const variations = this.parseVariations( component );

            if ( ! productId || ! variations.length ) {
                return;
            }

            // Inicializar botones de talla
            this.initSizeButtons( component, variations );

            // Inicializar validación de stock en foco
            this.initStockValidation( component, productId );
        },

        /**
         * Parsear las variaciones desde el atributo data del componente
         *
         * @param {HTMLElement} component Elemento del componente
         * @return {Array} Array de variaciones parseadas
         */
        parseVariations( component ) {
            try {
                const variationsData = component.dataset.variations;
                return variationsData ? JSON.parse( variationsData ) : [];
            } catch ( error ) {
                console.error(
                    'TFM Frontend: Error al parsear variaciones:',
                    error
                );
                return [];
            }
        },

        /**
         * Inicializar los eventos de los botones de talla
         *
         * @param {HTMLElement} component Elemento del componente
         * @param {Array} variations Array de variaciones disponibles
         */
        initSizeButtons( component, variations ) {
            const buttons    = component.querySelectorAll(
                '.tfm-size-selector__button'
            );
            const priceEl    = component.querySelector(
                '.tfm-size-selector__price'
            );
            const stockEl    = component.querySelector(
                '.tfm-size-selector__stock-message'
            );
            const showPrice  = component.dataset.showPrice === 'true';
            const showStock  = component.dataset.showStock === 'true';

            buttons.forEach( button => {
                // Evento de clic
                button.addEventListener( 'click', ( event ) => {
                    event.preventDefault();

                    if ( button.disabled || button.getAttribute( 'aria-disabled' ) === 'true' ) {
                        return;
                    }

                    const selectedSize    = button.dataset.size;
                    const variationId     = parseInt( button.dataset.variationId );
                    const priceHtml       = button.dataset.priceHtml;
                    const price           = parseFloat( button.dataset.price );

                    // Actualizar estado visual de los botones
                    this.updateButtonStates( buttons, button );

                    // Actualizar precio si está habilitado
                    if ( showPrice && priceEl ) {
                        this.updatePrice( priceEl, priceHtml );
                    }

                    // Actualizar mensaje de stock si está habilitado
                    if ( showStock && stockEl ) {
                        const variation = variations.find(
                            v => v.variation_id === variationId
                        );
                        if ( variation ) {
                            this.updateStockMessage(
                                stockEl,
                                variation.in_stock,
                                variation.stock_qty
                            );
                        }
                    }

                    // Emitir evento personalizado para comunicación
                    // con otros componentes (patrón Observer)
                    this.dispatchSelectionEvent( component, {
                        productId:   parseInt( component.dataset.productId ),
                        variationId: variationId,
                        size:        selectedSize,
                        price:       price,
                        priceHtml:   priceHtml,
                    } );
                } );

                // Navegación por teclado dentro del radiogroup
                button.addEventListener( 'keydown', ( event ) => {
                    this.handleKeyboardNavigation(
                        event,
                        buttons,
                        button
                    );
                } );
            } );
        },

        /**
         * Actualizar el estado visual de todos los botones
         * después de una selección
         *
         * @param {NodeList} buttons Lista de todos los botones
         * @param {HTMLElement} selectedButton Botón seleccionado
         */
        updateButtonStates( buttons, selectedButton ) {
            buttons.forEach( btn => {
                const isSelected = btn === selectedButton;

                btn.setAttribute( 'aria-checked', isSelected ? 'true' : 'false' );
                btn.classList.toggle(
                    'tfm-size-selector__button--selected',
                    isSelected
                );
            } );
        },

        /**
         * Actualizar el precio mostrado dinámicamente
         *
         * @param {HTMLElement} priceEl Elemento contenedor del precio
         * @param {string} priceHtml HTML del precio formateado
         */
        updatePrice( priceEl, priceHtml ) {
            // Anunciar cambio a lectores de pantalla via aria-live
            priceEl.innerHTML = priceHtml;
            priceEl.classList.add( 'tfm-price-updated' );

            setTimeout( () => {
                priceEl.classList.remove( 'tfm-price-updated' );
            }, 300 );
        },

        /**
         * Actualizar el mensaje de disponibilidad de stock
         *
         * @param {HTMLElement} stockEl Elemento del mensaje de stock
         * @param {boolean} inStock Si hay stock disponible
         * @param {number} stockQty Cantidad disponible
         */
        updateStockMessage( stockEl, inStock, stockQty ) {
            // Limpiar clases anteriores
            stockEl.classList.remove(
                'tfm-size-selector__stock-message--in-stock',
                'tfm-size-selector__stock-message--low-stock',
                'tfm-size-selector__stock-message--out-of-stock'
            );

            if ( inStock ) {
                if ( stockQty !== null && stockQty <= 5 ) {
                    // Stock bajo
                    stockEl.classList.add(
                        'tfm-size-selector__stock-message--low-stock'
                    );
                    stockEl.textContent = `¡Solo quedan ${ stockQty } unidades!`;
                } else {
                    // Stock disponible
                    stockEl.classList.add(
                        'tfm-size-selector__stock-message--in-stock'
                    );
                    stockEl.textContent = 'En stock';
                }
            } else {
                // Agotado
                stockEl.classList.add(
                    'tfm-size-selector__stock-message--out-of-stock'
                );
                stockEl.textContent = 'Agotado';
            }
        },

        /**
         * Manejar navegación por teclado en el radiogroup
         * Implementa el patrón de navegación ARIA para radiogroup
         *
         * @param {KeyboardEvent} event Evento de teclado
         * @param {NodeList} buttons Lista de botones disponibles
         * @param {HTMLElement} currentButton Botón actualmente enfocado
         */
        handleKeyboardNavigation( event, buttons, currentButton ) {
            const enabledButtons = Array.from( buttons ).filter(
                btn => ! btn.disabled
            );
            const currentIndex   = enabledButtons.indexOf( currentButton );

            let nextIndex = null;

            switch ( event.key ) {
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    nextIndex = ( currentIndex + 1 ) % enabledButtons.length;
                    break;

                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    nextIndex = ( currentIndex - 1 + enabledButtons.length ) %
                        enabledButtons.length;
                    break;

                case 'Home':
                    event.preventDefault();
                    nextIndex = 0;
                    break;

                case 'End':
                    event.preventDefault();
                    nextIndex = enabledButtons.length - 1;
                    break;

                case 'Enter':
                case ' ':
                    event.preventDefault();
                    currentButton.click();
                    return;

                default:
                    return;
            }

            if ( nextIndex !== null ) {
                enabledButtons[ nextIndex ].focus();
            }
        },

        /**
         * Emitir evento personalizado de selección
         * Permite la comunicación con otros componentes (patrón Observer)
         * El carrito de WooCommerce escucha este evento
         *
         * @param {HTMLElement} component Elemento del componente
         * @param {Object} detail Datos de la selección
         */
        dispatchSelectionEvent( component, detail ) {
            const event = new CustomEvent( 'tfm:sizeSelected', {
                bubbles:    true,
                cancelable: true,
                detail:     detail,
            } );

            component.dispatchEvent( event );
            document.dispatchEvent( new CustomEvent( 'tfm:variationSelected', {
                bubbles: false,
                detail:  detail,
            } ) );
        },

        /**
         * Inicializar validación de stock en tiempo real
         * Se activa cuando el componente recibe el foco
         * para verificar disponibilidad antes de la compra
         *
         * @param {HTMLElement} component Elemento del componente
         * @param {number} productId ID del producto
         */
        initStockValidation( component, productId ) {
            let lastValidated = 0;
            const VALIDATION_INTERVAL = 30000; // 30 segundos

            component.addEventListener( 'focusin', async () => {
                const now = Date.now();

                // Evitar validaciones demasiado frecuentes
                if ( now - lastValidated < VALIDATION_INTERVAL ) {
                    return;
                }

                lastValidated = now;

                try {
                    // Revalidar variaciones desde la API
                    const freshVariations = await window.TFMWcApi
                        .getProductVariations( productId );

                    if ( ! freshVariations || ! freshVariations.length ) {
                        return;
                    }

                    // Actualizar estado visual de botones según stock actual
                    const buttons = component.querySelectorAll(
                        '.tfm-size-selector__button'
                    );

                    buttons.forEach( button => {
                        const variationId = parseInt( button.dataset.variationId );
                        const variation   = freshVariations.find(
                            v => v.id === variationId
                        );

                        if ( ! variation ) {
                            return;
                        }

                        if ( ! variation.in_stock ) {
                            button.disabled = true;
                            button.setAttribute( 'aria-disabled', 'true' );
                            button.setAttribute( 'tabindex', '-1' );
                            button.classList.add(
                                'tfm-size-selector__button--out-of-stock'
                            );
                        } else {
                            button.disabled = false;
                            button.setAttribute( 'aria-disabled', 'false' );
                            button.setAttribute( 'tabindex', '0' );
                            button.classList.remove(
                                'tfm-size-selector__button--out-of-stock'
                            );
                        }
                    } );

                } catch ( error ) {
                    // Fallar silenciosamente en validaciones de stock
                    console.warn(
                        'TFM Frontend: No se pudo revalidar stock:',
                        error
                    );
                }
            } );
        },

    };

    /**
     * Escuchar eventos de selección para actualizar el carrito
     * de WooCommerce (integración patrón Observer)
     */
    document.addEventListener( 'tfm:variationSelected', ( event ) => {
        const { variationId, productId } = event.detail;

        // Actualizar el input hidden de variación en el formulario
        // de WooCommerce para que el botón "Añadir al carrito" funcione
        const addToCartForm = document.querySelector(
            `form.cart[data-product_id="${ productId }"]`
        );

        if ( addToCartForm ) {
            const variationInput = addToCartForm.querySelector(
                'input[name="variation_id"]'
            );

            if ( variationInput ) {
                variationInput.value = variationId;

                // Disparar evento change para que WooCommerce
                // actualice el botón de compra
                variationInput.dispatchEvent( new Event( 'change' ) );
            }
        }
    } );

    /**
     * Inicializar cuando el DOM esté listo
     */
    if ( document.readyState === 'loading' ) {
        document.addEventListener(
            'DOMContentLoaded',
            () => TFMSizeSelector.init()
        );
    } else {
        TFMSizeSelector.init();
    }

    // Exponer módulo globalmente para extensibilidad
    window.TFMSizeSelector = TFMSizeSelector;

} )( window, document );
