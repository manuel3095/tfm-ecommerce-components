/**
 * Componente React para el editor de bloques Gutenberg
 * Selector de Colores - Vista de edición (backend)
 *
 * @package TFM_Ecommerce_Components
 * @since 1.1.0
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
    PanelBody,
    TextControl,
    ToggleControl,
    SelectControl,
    Notice,
    Spinner,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const COLOR_KEYS = [ 'attribute_pa_color', 'attribute_color', 'attribute_pa_colour', 'attribute_colour' ];

/**
 * Normalizar un texto para buscarlo en el mapa de colores
 *
 * @param {string} value Valor del atributo
 * @return {string} Clave normalizada
 */
const normalize = ( value ) =>
    String( value || '' )
        .toLowerCase()
        .normalize( 'NFD' )
        .replace( /[̀-ͯ]/g, '' )
        .replace( /-/g, ' ' );

/**
 * Extraer colores únicos de las variaciones
 *
 * @param {Array}  variations Variaciones devueltas por la API del plugin
 * @param {Object} colorMap   Mapa nombre → hexadecimal
 * @return {Array} Colores únicos
 */
const getColors = ( variations, colorMap ) => {
    const seen   = new Set();
    const colors = [];

    variations.forEach( ( variation ) => {
        const key   = COLOR_KEYS.find( ( k ) => variation.attributes && variation.attributes[ k ] );
        const value = key ? variation.attributes[ key ] : '';

        if ( ! value ) {
            return;
        }

        // Un color está disponible si alguna de sus variaciones tiene stock
        if ( seen.has( value ) ) {
            if ( variation.in_stock ) {
                colors.find( ( c ) => c.value === value ).inStock = true;
            }
            return;
        }

        seen.add( value );
        colors.push( {
            value,
            hex:     colorMap[ normalize( value ) ] || colorMap[ value ] || '#cccccc',
            inStock: variation.in_stock,
        } );
    } );

    return colors;
};

export default function Edit( { attributes, setAttributes } ) {
    const {
        productId,
        showStock,
        showPrice,
        showColorName,
        swatchSize,
        swatchShape,
        showLabel,
        labelText,
        align,
        colorMap,
    } = attributes;

    const [ variations, setVariations ] = useState( [] );
    const [ isLoading, setIsLoading ]   = useState( false );
    const [ error, setError ]           = useState( null );

    const blockProps = useBlockProps( {
        className: `tfm-color-selector tfm-color-selector--${ swatchSize } tfm-color-selector--${ swatchShape } tfm-align-${ align }`,
    } );

    useEffect( () => {
        if ( ! productId ) {
            setVariations( [] );
            return;
        }

        setIsLoading( true );
        setError( null );

        apiFetch( { path: `/tfm-ecommerce/v1/variations/${ productId }` } )
            .then( ( data ) => {
                setVariations( Array.isArray( data ) ? data : [] );
                setIsLoading( false );
            } )
            .catch( () => {
                setError( __( 'Error al cargar las variaciones. Verifica el ID del producto.', 'tfm-ecommerce' ) );
                setIsLoading( false );
            } );
    }, [ productId ] );

    const colors = getColors( variations, colorMap || {} );

    return (
        <>
            <InspectorControls>
                <PanelBody title={ __( 'Configuración del producto', 'tfm-ecommerce' ) } initialOpen={ true }>
                    <TextControl
                        label={ __( 'ID del producto WooCommerce', 'tfm-ecommerce' ) }
                        help={ __( 'Introduce el ID del producto variable de WooCommerce', 'tfm-ecommerce' ) }
                        type="number"
                        min="1"
                        value={ productId || '' }
                        onChange={ ( value ) => setAttributes( { productId: parseInt( value, 10 ) || 0 } ) }
                    />
                    <ToggleControl
                        label={ __( 'Mostrar disponibilidad de stock', 'tfm-ecommerce' ) }
                        checked={ showStock }
                        onChange={ ( value ) => setAttributes( { showStock: value } ) }
                    />
                    <ToggleControl
                        label={ __( 'Mostrar precio actualizado', 'tfm-ecommerce' ) }
                        checked={ showPrice }
                        onChange={ ( value ) => setAttributes( { showPrice: value } ) }
                    />
                    <ToggleControl
                        label={ __( 'Mostrar nombre del color', 'tfm-ecommerce' ) }
                        checked={ showColorName }
                        onChange={ ( value ) => setAttributes( { showColorName: value } ) }
                    />
                </PanelBody>
                <PanelBody title={ __( 'Apariencia', 'tfm-ecommerce' ) } initialOpen={ false }>
                    <SelectControl
                        label={ __( 'Forma de las muestras', 'tfm-ecommerce' ) }
                        value={ swatchShape }
                        options={ [
                            { label: __( 'Circular', 'tfm-ecommerce' ), value: 'circle' },
                            { label: __( 'Cuadrada', 'tfm-ecommerce' ), value: 'square' },
                            { label: __( 'Redondeada', 'tfm-ecommerce' ), value: 'rounded' },
                        ] }
                        onChange={ ( value ) => setAttributes( { swatchShape: value } ) }
                    />
                    <SelectControl
                        label={ __( 'Tamaño de las muestras', 'tfm-ecommerce' ) }
                        value={ swatchSize }
                        options={ [
                            { label: __( 'Pequeño (36 px)', 'tfm-ecommerce' ), value: 'small' },
                            { label: __( 'Mediano (44 px)', 'tfm-ecommerce' ), value: 'medium' },
                            { label: __( 'Grande (56 px)', 'tfm-ecommerce' ), value: 'large' },
                        ] }
                        onChange={ ( value ) => setAttributes( { swatchSize: value } ) }
                    />
                    <SelectControl
                        label={ __( 'Alineación', 'tfm-ecommerce' ) }
                        value={ align }
                        options={ [
                            { label: __( 'Izquierda', 'tfm-ecommerce' ), value: 'left' },
                            { label: __( 'Centro', 'tfm-ecommerce' ), value: 'center' },
                            { label: __( 'Derecha', 'tfm-ecommerce' ), value: 'right' },
                        ] }
                        onChange={ ( value ) => setAttributes( { align: value } ) }
                    />
                    <ToggleControl
                        label={ __( 'Mostrar etiqueta', 'tfm-ecommerce' ) }
                        checked={ showLabel }
                        onChange={ ( value ) => setAttributes( { showLabel: value } ) }
                    />
                    { showLabel && (
                        <TextControl
                            label={ __( 'Texto de la etiqueta', 'tfm-ecommerce' ) }
                            value={ labelText }
                            onChange={ ( value ) => setAttributes( { labelText: value } ) }
                        />
                    ) }
                </PanelBody>
            </InspectorControls>

            <div { ...blockProps }>
                { ! productId && (
                    <Notice status="warning" isDismissible={ false }>
                        { __( 'Introduce el ID de un producto variable en el panel lateral.', 'tfm-ecommerce' ) }
                    </Notice>
                ) }

                { isLoading && <Spinner /> }

                { error && (
                    <Notice status="error" isDismissible={ false }>
                        { error }
                    </Notice>
                ) }

                { ! isLoading && ! error && productId > 0 && (
                    <>
                        { showLabel && <p className="tfm-color-selector__label">{ labelText }</p> }
                        <div className="tfm-color-selector__grid" role="radiogroup" aria-label={ labelText }>
                            { colors.map( ( item ) => (
                                <button
                                    key={ item.value }
                                    type="button"
                                    role="radio"
                                    aria-checked="false"
                                    aria-disabled={ ! item.inStock }
                                    aria-label={ item.value }
                                    title={ showColorName ? item.value : undefined }
                                    className={ `tfm-color-selector__swatch${ item.inStock ? '' : ' tfm-color-selector__swatch--out-of-stock' }` }
                                    style={ { backgroundColor: item.hex } }
                                    disabled={ ! item.inStock }
                                />
                            ) ) }
                        </div>
                        { colors.length === 0 && (
                            <Notice status="info" isDismissible={ false }>
                                { __( 'El producto no tiene un atributo de color.', 'tfm-ecommerce' ) }
                            </Notice>
                        ) }
                    </>
                ) }
            </div>
        </>
    );
}
