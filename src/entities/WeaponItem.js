import { Item } from './Item.js';

/**
* A game entity which represents a collectable weapon item.
*
* @author {@link https://github.com/robp94|robp94}
*/
class WeaponItem extends Item {

	/**
	* Constructs a new weapon item.
	*
	* @param {Number} type - The weapon type.
	* @param {Number} respawnTime - The respawn time.
	* @param {Number} ammo - The amount of ammo.
	*/
	constructor( type, respawnTime, ammo ) {

		super( type, respawnTime );

		/**
		* The amount of ammo which the weapon gives when it's collected.
		* @type {Number}
		*/
		this.ammo = ammo;

	}

	/**
	* Adds the weapon to the given entity.
	*
	* @param {GameEntity} entity - The entity that receives this item.
	* @return {WeaponItem} A reference to this item.
	*/
	addItemToEntity( entity ) {

		entity.addWeapon( this.type ); // we assume .addWeapon() is implemented by the game entity

		return this;

	}

}

export { WeaponItem };
