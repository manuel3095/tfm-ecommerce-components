/**
 * Registro del bloque Selector de Colores en el editor
 *
 * @package TFM_Ecommerce_Components
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../blocks/color-selector/block.json';
import Edit from './edit';

// Bloque dinámico: el HTML lo genera PHP (render.php), por eso save devuelve null
registerBlockType( metadata.name, {
    edit: Edit,
    save: () => null,
} );
