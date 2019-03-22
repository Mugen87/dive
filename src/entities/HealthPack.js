import { CONFIG } from '../core/Config.js';
import { Item } from './Item.js';
import { HEALTH_PACK } from '../core/Constants.js';

/**
* A game entity which represents a collectable health pack.
*
* @author {@link https://github.com/robp94|robp94}
*/
class HealthPack extends Item {

	/**
	* Constructs a new health pack.
	*/
	constructor() {

		super( HEALTH_PACK, CONFIG.HEALTH_PACK.RESPAWN_TIME );

		/**
		* The amount of health which the health pack gives when it's collected.
		* @type {Number}
		*/
		this.health = CONFIG.HEALTH_PACK.HEALTH;

	}

	/**
	* Adds the health to the given entity.
	*
	* @param {GameEntity} entity - The entity that receives this item.
	* @return {HealthPack} A reference to this item.
	*/
	addItemToEntity( entity ) {

		entity.addHealth( this.health ); // we assume .addHealth() is implemented by the game entity

		return this;

	}

}

export { HealthPack };
