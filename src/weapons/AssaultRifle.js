import { Weapon } from './Weapon.js';

/**
* Class for representing a assault rifle.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class AssaultRifle extends Weapon {

	/**
	* Constructs a new assault rifle with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		super( owner );

	}

}

export { AssaultRifle };
