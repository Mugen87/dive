import { Weapon } from './Weapon.js';

/**
* Class for representing a shotgun.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Shotgun extends Weapon {

	/**
	* Constructs a new shotgun with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		super( owner );

	}

}

export { Shotgun };
