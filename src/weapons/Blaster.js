import { Weapon } from './Weapon.js';

/**
* Class for representing a blaster.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Blaster extends Weapon {

	/**
	* Constructs a new blaster with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon.
	*/
	constructor( owner ) {

		super( owner );

	}

}

export { Blaster };
