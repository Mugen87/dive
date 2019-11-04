import { CONFIG } from './Config.js';
import { WEAPON_TYPES_BLASTER, WEAPON_TYPES_SHOTGUN, WEAPON_TYPES_ASSAULT_RIFLE } from './Constants.js';
import { MathUtils } from 'yuka';

const result = { distance: Infinity, item: null };

/**
* Class for calculating influencing factors in context of inference logic.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
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
	* Computes the individual weapon score.
	*
	* @param {Enemy} enemy - The enemy this score is computed for.
	* @param {Number} weaponType - The type of weapon.
	* @return {Number} The individual weapon score.
	*/
	static individualWeaponStrength( enemy, weaponType ) {

		const weapon = enemy.weaponSystem.getWeapon( weaponType );

		return ( weapon ) ? ( weapon.ammo / weapon.maxAmmo ) : 0;

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

	/**
	* Computes a score between 0 and 1 based on the bot's closeness to the given item.
	* The further the item, the higher the rating. If there is no item of the given type
	* present in the game world at the time this method is called the value returned is 1.
	*
	* @param {Enemy} enemy - The enemy this score is computed for.
	* @param {Number} itemType - The type of the item.
	* @return {Number} The distance score.
	*/
	static distanceToItem( enemy, itemType ) {

		let score = 1;

		enemy.world.getClosestItem( enemy, itemType, result );

		if ( result.item ) {

			let distance = result.distance;

			distance = MathUtils.clamp( distance, CONFIG.BOT.MIN_ITEM_RANGE, CONFIG.BOT.MAX_ITEM_RANGE );

			score = distance / CONFIG.BOT.MAX_ITEM_RANGE;

		}

		return score;

	}

}

export { Feature };
