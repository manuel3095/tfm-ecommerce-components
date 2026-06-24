/**
 * Componente React para el editor de bloques Gutenberg
 * Selector de Tallas - Vista de edición (backend)
 *
 * @package TFM_Ecommerce_Components
 * @since 1.0.0
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    PanelRow,
    TextControl,
    ToggleControl,
    SelectControl,
    RangeControl,
    Notice,
    Spinner,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Componente principal de edición del bloque
 *
 * @param {Object} props Propiedades del bloque
 * @param {Object} props.attributes Atributos actuales del bloque
 * @param {Function} props.setAttributes Función para actualizar atributos
 * @return {JSX.Element} Interfaz de edición del bloque
 */
export default function Edit( { attributes, setAttributes } ) {
    const {
        productId,
        showStock,
        showPrice,
        style,
        columns,
        buttonSize,
        showLabel,
        labelText,
        align,
    } = attributes;

    // Estado local para las variaciones del producto
    const [ variations, setVariations ] = useState( [] );
    const [ isLoading, setIsLoading ]   = useState( false );
    const [ error, setError ]           = useState( null );
    const [ selectedSize, setSelectedSize ] = useState( null );

    const blockProps = useBlockProps( {
        className: `tfm-size-selector tfm-size-selector--${ style } tfm-size-selector--${ buttonSize } align-${ align }`,
    } );

    /**
     * Cargar variaciones del producto cuando cambia el productId
     * Utiliza la API REST personalizada del plugin
     */
    useEffect( () => {
        if ( ! productId ) {
            setVariations( [] );
            return;
        }

        setIsLoading( true );
        setError( null );

        apiFetch( {
            path: `/tfm-ecommerce/v1/variations/${ productId }`,
        } )
            .then( ( data ) => {
                setVariations( data );
                setIsLoading( false );
            } )
            .catch( ( err ) => {
                setError(
                    __(
                        'Error al cargar las variaciones. Verifica el ID del producto.',
                        'tfm-ecommerce'
                    )
                );
                setIsLoading( false );
            } );
    }, [ productId ] );

    /**
     * Extraer tallas únicas de las variaciones disponibles
     *
     * @param {Array} vars Array de variaciones del producto
     * @return {Array} Array de objetos con talla, stock y variationId
     */
    const getSizes = ( vars ) => {
        const sizes = [];
        const seen  = new Set();

        vars.forEach( ( variation ) => {
            const sizeAttr =
                variation.attributes[ 'attribute_pa_size' ] ||
                variation.attributes[ 'attribute_talla' ] ||
                variation.attributes[ 'attribute_pa_talla' ];

            if ( sizeAttr && ! seen.has( sizeAttr ) ) {
                seen.add( sizeAttr );
                sizes.push( {
                    size:        sizeAttr,
                    inStock:     variation.in_stock,
                    variationId: variation.id,
                    price:       variation.price,
                } );
            }
        } );

        return sizes;
    };

    const sizes = getSizes( variations );

    return (
        <>
            { /* Panel de configuración lateral (InspectorControls) */ }
            <InspectorControls>
                <PanelBody
                    title={ __( 'Configuración del producto', 'tfm-ecommerce' ) }
                    initialOpen={ true }
                >
                    <PanelRow>
                        <TextControl
                            label={ __( 'ID del producto WooCommerce', 'tfm-ecommerce' ) }
                            help={ __( 'Introduce el ID del producto variable de WooCommerce', 'tfm-ecommerce' ) }
                            value={ productId || '' }
                            onChange={ ( value ) =>
                                setAttributes( { productId: parseInt( value ) || 0 } )
                            }
                            type="number"
                            min="1"
                        />
                    </PanelRow>
                    <PanelRow>
                        <ToggleControl
                            label={ __( 'Mostrar disponibilidad de stock', 'tfm-ecommerce' ) }
                            checked={ showStock }
                            onChange={ ( value ) =>
                                setAttributes( { showStock: value } )
                            }
                        />
                    </PanelRow>
                    <PanelRow>
                        <ToggleControl
                            label={ __( 'Mostrar precio actualizado', 'tfm-ecommerce' ) }
                            checked={ showPrice }
                            onChange={ ( value ) =>
                                setAttributes( { showPrice: value } )
                            }
                        />
                    </PanelRow>
                </PanelBody>

                <PanelBody
                    title={ __( 'Apariencia', 'tfm-ecommerce' ) }
                    initialOpen={ false }
                >
                    <PanelRow>
                        <SelectControl
                            label={ __( 'Estilo visual', 'tfm-ecommerce' ) }
                            value={ style }
                            options={ [
                                { label: __( 'Por defecto', 'tfm-ecommerce' ), value: 'default' },
                                { label: __( 'Minimalista', 'tfm-ecommerce' ), value: 'minimal' },
                                { label: __( 'Con borde', 'tfm-ecommerce' ), value: 'outlined' },
                            ] }
                            onChange={ ( value ) =>
                                setAttributes( { style: value } )
                            }
                        />
                    </PanelRow>
                    <PanelRow>
                        <SelectControl
                            label={ __( 'Tamaño de botones', 'tfm-ecommerce' ) }
                            value={ buttonSize }
                            options={ [
                                { label: __( 'Pequeño', 'tfm-ecommerce' ), value: 'small' },
                                { label: __( 'Mediano', 'tfm-ecommerce' ), value: 'medium' },
                                { label: __( 'Grande', 'tfm-ecommerce' ), value: 'large' },
                            ] }
                            onChange={ ( value ) =>
                                setAttributes( { buttonSize: value } )
                            }
                        />
                    </PanelRow>
                    <PanelRow>
                        <RangeControl
                            label={ __( 'Columnas', 'tfm-ecommerce' ) }
                            value={ columns }
                            onChange={ ( value ) =>
                                setAttributes( { columns: value } )
                            }
                            min={ 2 }
                            max={ 8 }
                        />
                    </PanelRow>
                    <PanelRow>
                        <SelectControl
                            label={ __( 'Alineación', 'tfm-ecommerce' ) }
                            value={ align }
                            options={ [
                                { label: __( 'Izquierda', 'tfm-ecommerce' ), value: 'left' },
                                { label: __( 'Centro', 'tfm-ecommerce' ), value: 'center' },
                                { label: __( 'Derecha', 'tfm-ecommerce' ), value: 'right' },
                            ] }
                            onChange={ ( value ) =>
                                setAttributes( { align: value } )
                            }
                        />
                    </PanelRow>
                </PanelBody>

                <PanelBody
                    title={ __( 'Etiqueta', 'tfm-ecommerce' ) }
                    initialOpen={ false }
                >
                    <PanelRow>
                        <ToggleControl
                            label={ __( 'Mostrar etiqueta', 'tfm-ecommerce' ) }
                            checked={ showLabel }
                            onChange={ ( value ) =>
                                setAttributes( { showLabel: value } )
                            }
                        />
                    </PanelRow>
                    { showLabel && (
                        <PanelRow>
                            <TextControl
                                label={ __( 'Texto de la etiqueta', 'tfm-ecommerce' ) }
                                value={ labelText }
                                onChange={ ( value ) =>
                                    setAttributes( { labelText: value } )
                                }
                            />
                        </PanelRow>
                    ) }
                </PanelBody>
            </InspectorControls>

            { /* Vista previa del bloque en el editor */ }
            <div { ...blockProps }>
                { ! productId && (
                    <Notice status="warning" isDismissible={ false }>
                        { __(
                            'Introduce el ID de un producto variable de WooCommerce en el panel lateral para previsualizar el selector.',
                            'tfm-ecommerce'
                        ) }
                    </Notice>
                ) }

                { productId && isLoading && (
                    <div className="tfm-size-selector__loading">
                        <Spinner />
                        <span>
                            { __( 'Cargando variaciones...', 'tfm-ecommerce' ) }
                        </span>
                    </div>
                ) }

                { error && (
                    <Notice status="error" isDismissible={ false }>
                        { error }
                    </Notice>
                ) }

                { productId && ! isLoading && ! error && sizes.length > 0 && (
                    <div className="tfm-size-selector__wrapper">
                        { showLabel && (
                            <p className="tfm-size-selector__label">
                                { labelText }
                            </p>
                        ) }

                        <div
                            className="tfm-size-selector__grid"
                            role="radiogroup"
                            aria-label={ labelText }
                            style={ {
                                gridTemplateColumns: `repeat(${ columns }, 1fr)`,
                            } }
                        >
                            { sizes.map( ( item ) => (
                                <button
                                    key={ item.size }
                                    className={ [
                                        'tfm-size-selector__button',
                                        ! item.inStock
                                            ? 'tfm-size-selector__button--out-of-stock'
                                            : '',
                                        selectedSize === item.size
                                            ? 'tfm-size-selector__button--selected'
                                            : '',
                                    ].join( ' ' ) }
                                    role="radio"
                                    aria-checked={ selectedSize === item.size }
                                    aria-disabled={ ! item.inStock }
                                    aria-label={
                                        item.inStock
                                            ? `Talla ${ item.size }`
                                            : `Talla ${ item.size } - Agotada`
                                    }
                                    data-size={ item.size }
                                    data-variation-id={ item.variationId }
                                    disabled={ ! item.inStock }
                                    onClick={ () => {
                                        if ( item.inStock ) {
                                            setSelectedSize( item.size );
                                        }
                                    } }
                                    type="button"
                                >
                                    { item.size }
                                </button>
                            ) ) }
                        </div>

                        { showPrice && selectedSize && (
                            <div
                                className="tfm-size-selector__price"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                { sizes.find( ( s ) => s.size === selectedSize )
                                    ?.price }
                            </div>
                        ) }
                    </div>
                ) }
            </div>
        </>
    );
}
