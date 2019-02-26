import { GameEntity, MathUtils } from '../lib/yuka.module.js';
import { WEAPON_STATUS_READY } from '../core/Constants.js';

/**
* Base class for all weapons.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Weapon extends GameEntity {

	/**
	* Constructs a new weapon with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		super();

		this.owner = owner;

		this.type = null;
		this.status = WEAPON_STATUS_READY;

		this.fuzzyModule = null;

		this.roundsLeft = 0;
		this.roundsPerClip = 0;
		this.ammo = 0;
		this.maxAmmo = 0;

		// times are in seconds

		this.currentTime = 0;
		this.shotTime = Infinity;
		this.reloadTime = Infinity;

		this.currentDesirability = 0;

		this.endTimeShot = Infinity;
		this.endTimeReload = Infinity;

	}

	/**
	* Adds the given amount of rounds to the ammo.
	*
	* @param {Number} rounds - The amount of ammo.
	* @return {Weapon} A reference to this weapon.
	*/
	addRounds( rounds ) {

		this.ammo = MathUtils.clamp( this.ammo + rounds, 0, this.maxAmmo );

		return this;

	}

	/**
	* Returns a value representing the desirability of using the weapon.
	*
	* @param {Number} distance - The distance to the target.
	* @return {Number} A score between 0 and 1 representing the desirability.
	*/
	getDesirability() {

		return 0;

	}

	/**
	* Reloads the weapon.
	*
	* @return {Weapon} A reference to this weapon.
	*/
	reload() {}

	/**
	* Shoots at the given position.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {Weapon} A reference to this weapon.
	*/
	shoot() {}

	/**
	* Update method of this weapon.
	*
	* @param {Number} delta - The time delta value;
	* @return {Weapon} A reference to this weapon.
	*/
	update( delta ) {

		this.currentTime += delta;

		return this;

	}

}

export { Weapon };
