/**
 * JavaScript de interactividad del frontend
 * Gestiona los eventos de usuario en los selectores de variantes del plugin.
 *
 * Patrones implementados:
 * - Strategy: cada tipo de selector (tallas, colores) define su propia
 *   configuración (clases, atributo de datos, textos) y comparte la lógica común.
 * - Observer: comunicación entre el selector y el resto de la página
 *   mediante eventos personalizados (CustomEvent).
 * - Mediator: el coordinador de producto combina las selecciones de todos
 *   los selectores de un mismo producto y resuelve la variación exacta.
 * - Module: encapsulación mediante IIFE.
 *
 * @package TFM_Ecommerce_Components
 * @since 1.1.0
 * @version 1.2.0
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
            ProductCoordinator.register( component, strategy );
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

                    const value = option.dataset[ strategy.valueKey ] || option.dataset.value;

                    this.dispatchSelectionEvent( component, strategy, {
                        productId:   parseInt( component.dataset.productId, 10 ),
                        variationId: variationId,
                        attribute:   strategy.valueKey,
                        value:       value,
                        price:       price,
                        priceHtml:   priceHtml,
                    } );

                    ProductCoordinator.select( component, value );
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
         * Emitir el evento de selección del componente (patrón Observer).
         * El evento global tfm:variationSelected lo emite el coordinador
         * cuando la combinación de atributos identifica una variación.
         */
        dispatchSelectionEvent( component, strategy, detail ) {
            component.dispatchEvent( new CustomEvent( strategy.eventName, {
                bubbles:    true,
                cancelable: true,
                detail:     detail,
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
     * Coordinador de producto (patrón Mediator)
     *
     * Cada selector conoce solo su atributo. El coordinador agrupa los
     * selectores de un mismo producto, guarda la selección de cada atributo
     * y, a partir de la matriz completa de variaciones (data-matrix):
     * 1. marca las opciones que no existen o están agotadas con la selección
     *    actual del otro atributo (disponibilidad cruzada);
     * 2. resuelve la variación exacta y actualiza precio y stock;
     * 3. sincroniza el formulario de variaciones de WooCommerce para que
     *    «Añadir al carrito» añada la combinación elegida.
     */
    const ProductCoordinator = {

        groups: {},

        /**
         * Registrar un componente en el grupo de su producto
         */
        register( component, strategy ) {
            const productId = component.dataset.productId;
            const key       = component.dataset.attributeKey;
            let matrix      = [];

            try {
                matrix = JSON.parse( component.dataset.matrix || '[]' );
            } catch ( error ) {
                matrix = [];
            }

            if ( ! key || ! matrix.length ) {
                return;
            }

            if ( ! this.groups[ productId ] ) {
                this.groups[ productId ] = { matrix, components: [], selection: {} };
            }

            this.groups[ productId ].components.push( { el: component, strategy, key } );
            this.markManagedForm( productId );
        },

        /**
         * Valor de una opción según la estrategia del selector
         */
        optionValue( option, strategy ) {
            return option.dataset[ strategy.valueKey ] || option.dataset.value;
        },

        /**
         * ¿La variación coincide con la selección? Un atributo vacío en la
         * variación significa «cualquier valor» en WooCommerce.
         */
        matches( variation, selection ) {
            return Object.keys( selection ).every( key => {
                const wanted = selection[ key ];
                const actual = variation.attributes[ key ];
                return ! wanted || ! actual || actual === wanted;
            } );
        },

        /**
         * Registrar la selección de un componente y recalcular el grupo
         */
        select( component, value ) {
            const group = this.groups[ component.dataset.productId ];

            if ( ! group ) {
                return;
            }

            const entry = group.components.find( item => item.el === component );
            group.selection[ entry.key ] = value;

            // Si la combinación no tiene stock, se libera el otro atributo
            const available = group.matrix.some( v => v.in_stock && this.matches( v, group.selection ) );

            if ( ! available ) {
                group.components.forEach( item => {
                    if ( item.key !== entry.key && group.selection[ item.key ] ) {
                        group.selection[ item.key ] = null;
                        this.clearComponent( item );
                    }
                } );
            }

            this.refreshAvailability( group );
            this.resolve( component.dataset.productId, group );
        },

        /**
         * Quitar la selección visual de un componente y avisar al usuario
         */
        clearComponent( item ) {
            item.el.querySelectorAll( '.' + item.strategy.option ).forEach( option => {
                option.setAttribute( 'aria-checked', 'false' );
                option.classList.remove( item.strategy.option + '--selected' );
            } );

            const nameEl  = item.el.querySelector( '.' + item.strategy.prefix + '__selected-name' );
            const stockEl = item.el.querySelector( '.' + item.strategy.prefix + '__stock-message' );

            const priceEl = item.el.querySelector( '.' + item.strategy.prefix + '__price' );

            if ( nameEl ) {
                nameEl.textContent = '';
            }

            if ( priceEl ) {
                priceEl.textContent = item.strategy.valueKey === 'size'
                    ? 'Selecciona una talla para ver el precio'
                    : 'Selecciona un color para ver el precio';
            }

            if ( stockEl ) {
                stockEl.className = item.strategy.prefix + '__stock-message';
                stockEl.textContent = item.strategy.valueKey === 'size'
                    ? 'Esa talla no está disponible en este color. Elige otra talla.'
                    : 'Ese color no está disponible en esta talla. Elige otro color.';
            }
        },

        /**
         * Disponibilidad cruzada: una opción sigue activa si existe alguna
         * variación con stock para ella; se marca como no disponible si no
         * la hay con la selección actual del resto de atributos.
         */
        refreshAvailability( group ) {
            group.components.forEach( item => {
                const others = Object.assign( {}, group.selection );
                delete others[ item.key ];

                item.el.querySelectorAll( '.' + item.strategy.option ).forEach( option => {
                    if ( option.disabled ) {
                        return;
                    }

                    const value = this.optionValue( option, item.strategy );
                    const combo = group.matrix.some( v =>
                        v.in_stock &&
                        ( ! v.attributes[ item.key ] || v.attributes[ item.key ] === value ) &&
                        this.matches( v, others )
                    );

                    if ( ! option.dataset.baseLabel ) {
                        option.dataset.baseLabel = option.getAttribute( 'aria-label' ) || '';
                    }

                    option.classList.toggle( item.strategy.option + '--unavailable', ! combo );
                    option.setAttribute(
                        'aria-label',
                        combo ? option.dataset.baseLabel : option.dataset.baseLabel + ' - No disponible con la selección actual'
                    );
                } );
            } );
        },

        /**
         * Resolver la variación y propagar precio, stock y formulario
         */
        resolve( productId, group ) {
            const complete = group.components.every( item => group.selection[ item.key ] );
            const candidates = group.matrix.filter( v => this.matches( v, group.selection ) );
            const variation = candidates.find( v => v.in_stock ) || candidates[ 0 ];

            this.syncForm( productId, group.selection );

            if ( ! complete || ! variation ) {
                return;
            }

            group.components.forEach( item => {
                const priceEl = item.el.querySelector( '.' + item.strategy.prefix + '__price' );
                const stockEl = item.el.querySelector( '.' + item.strategy.prefix + '__stock-message' );

                if ( priceEl && item.el.dataset.showPrice === 'true' ) {
                    TFMVariantSelector.updatePrice( priceEl, variation.price_html );
                }

                if ( stockEl && item.el.dataset.showStock === 'true' ) {
                    TFMVariantSelector.updateStockMessage( stockEl, item.strategy, variation.in_stock, variation.stock_qty );
                }
            } );

            document.dispatchEvent( new CustomEvent( 'tfm:variationSelected', {
                detail: {
                    productId:   parseInt( productId, 10 ),
                    variationId: variation.id,
                    attributes:  Object.assign( {}, group.selection ),
                    inStock:     variation.in_stock,
                    price:       variation.price,
                    priceHtml:   variation.price_html,
                },
            } ) );
        },

        /**
         * Formulario de variaciones de WooCommerce del mismo producto
         */
        findForm( productId ) {
            return document.querySelector( `form.variations_form[data-product_id="${ productId }"]` );
        },

        /**
         * Los selectores del plugin sustituyen a los desplegables nativos:
         * se ocultan los de WooCommerce, que siguen funcionando por debajo.
         */
        markManagedForm( productId ) {
            const form = this.findForm( productId );

            if ( form ) {
                form.classList.add( 'tfm-managed-form' );
            }
        },

        /**
         * Copiar la selección a los <select> de WooCommerce y notificarles
         * el cambio; WooCommerce calcula entonces variation_id y habilita
         * el botón «Añadir al carrito».
         */
        syncForm( productId, selection ) {
            const form = this.findForm( productId );

            if ( ! form ) {
                return;
            }

            Object.keys( selection ).forEach( key => {
                const select = form.querySelector( `select[name="${ key }"]` );

                if ( ! select ) {
                    return;
                }

                select.value = selection[ key ] || '';

                if ( window.jQuery ) {
                    window.jQuery( select ).trigger( 'change' );
                } else {
                    select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
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
    window.TFMVariantSelector  = TFMVariantSelector;
    window.TFMSizeSelector     = TFMVariantSelector;
    window.TFMProductCoordinator = ProductCoordinator;

} )( window, document );
