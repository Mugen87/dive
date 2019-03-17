import { CONFIG } from './Config.js';
import { WEAPON_TYPES_BLASTER, WEAPON_TYPES_SHOTGUN, WEAPON_TYPES_ASSAULT_RIFLE } from './Constants.js';

/**
* Class for calculating influencing factors in context of inference logic.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/

class Feature {

	/**
	* Computes the total weapon score.
	*
	* @param {Enemy} enemy - The enemy this score is computed for.
	* @return {Number} The total weapon score.
	*/
	static totalWeaponStrength( enemy ) {

		const weaponSystem = enemy.weaponSystem;

		const ammoBlaster = weaponSystem.getRemainingAmmoForWeapon( WEAPON_TYPES_BLASTER );
		const ammoShotgun = weaponSystem.getRemainingAmmoForWeapon( WEAPON_TYPES_SHOTGUN );
		const ammoAssaultRifle = weaponSystem.getRemainingAmmoForWeapon( WEAPON_TYPES_ASSAULT_RIFLE );

		const f1 = ammoBlaster / CONFIG.BLASTER.MAX_AMMO;
		const f2 = ammoShotgun / CONFIG.SHOTGUN.MAX_AMMO;
		const f3 = ammoAssaultRifle / CONFIG.ASSAULT_RIFLE.MAX_AMMO;

		return ( f1 + f2 + f3 ) / 3;

	}

	/**
	* Computes the health score.
	*
	* @param {Enemy} enemy - The enemy this score is computed for.
	* @return {Number} The health score.
	*/
	static health( enemy ) {

		return enemy.health / enemy.maxHealth;

	}

}

export { Feature };
