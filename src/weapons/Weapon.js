/**
* Base class for all weapons.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Weapon {

	/**
	* Constructs a new weapon with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		this.owner = owner;

	}

	/**
	* Shoots at the given position.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {Weapon} A reference to this weapon.
	*/
	shootAt() {

	}

}

export { Weapon };
