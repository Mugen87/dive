import { Vector3 } from '../lib/yuka.module.js';

import { CONFIG } from '../core/Config.js';
import { Blaster } from '../weapons/Blaster.js';

const displacement = new Vector3();
const target = new Vector3();

/**
* Class to manage all operations specific to weapons and their deployment.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class WeaponSystem {

	/**
	* Constructs a new weapon system with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon system.
	*/
	constructor( owner ) {

		this.owner = owner;

		// this is the minimum amount of time in seconds an enemy needs to
		// see an opponent before it can react to it. This variable is used
		// to prevent an enemy shooting at an opponent the instant it becomes visible.

		this.reactionTime = CONFIG.BOT.WEAPON.REACTION_TIME;

		// an array with all weapons the bot has in its inventory

		this.weapons = new Array();

		// this map holds the same data as the weapon array but it ensures only one weapon
		// per type is present in the inventory

		this.weaponsMap = new Map();

		// represents the current hold weapon

		this.currentWeapon = null;

		//

		this.init();

	}

	/**
	* Inits the internal data structures and sets an initial weapon.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	init() {

		this.weapons.length = 0;
		this.weaponsMap.clear();

		this.weaponsMap.set( WEAPON_TYPES.BLASTER, null );
		this.weaponsMap.set( WEAPON_TYPES.SHOTGUN, null );
		this.weaponsMap.set( WEAPON_TYPES.ASSAULT_RIFLE, null );

		this.addWeapon( WEAPON_TYPES.BLASTER );

		this.currentWeapon = this.weaponsMap.get( WEAPON_TYPES.BLASTER );

		return this;

	}

	/**
	* Determines the most appropriate weapon to use given the current game state.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	selectBestWeapon() {

		const owner = this.owner;

		if ( owner.targetSystem.hasTarget() ) {

			let highestDesirability = 0;

			// calculate the distance to the target

			const target = owner.targetSystem.getTarget();
			const distanceToTarget = this.owner.position.distanceTo( target.position );

			// for each weapon in the inventory calculate its desirability given the
			// current situation. The most desirable weapon is selected

			for ( let i = 0, l = this.weapons.length; i < l; i ++ ) {

				const weapon = this.weapons[ i ];

				const desirability = weapon.getDesirability( distanceToTarget );

				if ( desirability > highestDesirability ) {

					highestDesirability = desirability;

					this.currentWeapon = weapon;

				}

			}


		}

		return this;

	}

	/**
	* Changes the current weapon to one of the specified type.
	*
    * @param {WEAPON_TYPES} type - The weapon type.
    * @return {WeaponSystem} A reference to this weapon system.
	*/
	changeWeapon( type ) {

		const weapon = this.weaponsMap.get( type );

		if ( weapon ) this.currentWeapon = weapon;

		return this;

	}

	/**
    * Adds a weapon of the specified type to the bot's inventory.
    * If the bot already has a weapon of this type only the ammo is added.
	*
    * @param {WEAPON_TYPES} type - The weapon type.
    * @return {WeaponSystem} A reference to this weapon system.
	*/
	addWeapon( type ) {

		const owner = this.owner;

		let weapon;

		switch ( type ) {

			case WEAPON_TYPES.BLASTER:
				weapon = new Blaster( owner );
				break;

			case WEAPON_TYPES.SHOTGUN:
				// weapon = new Shotgun( owner );
				break;

			case WEAPON_TYPES.ASSAULT_RIFLE:
				// weapon = new AssaultRifle( owner );
				break;

			default:
				console.error( 'DIVE.WeaponSystem: Invalid weapon type:', type );
				break;

		}

		// check inventory

		const weaponInventory = this.weaponsMap.get( type );

		if ( weaponInventory !== null ) {

			// if the bot already holds a weapon of this type, just add its ammo

			weaponInventory.addRounds( weapon.getRemainingRounds() );

		} else {

			// if not already present, add to inventory

			this.weaponsMap.set( type, weapon );
			this.weapons.push( weapon );

		}

		return this;

	}

	/**
	* Returns the amount of ammo remaining for the specified weapon
	*
    * @param {WEAPON_TYPES} type - The weapon type.
	* @return {Number} The amount of ammo.
	*/
	getRemainingAmmoForWeapon( type ) {

		const weapon = this.weaponsMap.get( type );

		return weapon ? weapon.getRemainingRounds() : 0;

	}

	/**
    * Aims the enemy's current weapon at the target (if there is a target)
    * and, if aimed correctly, fires a round.
	*
	* @param {Number} delta - The time delta value.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	aimAndShoot( delta ) {

		const owner = this.owner;

		// TODO: Use trageting system here

		if ( owner.memoryRecords.length > 0 ) {

			const record = owner.memoryRecords[ 0 ];
			const entity = record.entity;

			// if the game entity is visible, directly rotate towards it. Otherwise, focus
			// the last known position

			if ( record.visible === true ) {

				const targeted = owner.rotateTo( entity.position, delta );

				// "targeted" is true if the entity is faced to the target

				if ( targeted ) {

					// TODO: Use this.reactionTime here

					this.shootAt( entity.position );

				}

			} else {

				// only rotate to the last sensed position if the entity was seen at least once

				if ( record.timeLastSensed !== - 1 ) {

					owner.rotateTo( record.lastSensedPosition, delta );

				}

			}

		} else {

			// no target so rotate towards the movement direction

			displacement.copy( owner.velocity ).normalize();
			target.copy( owner.position ).add( displacement );

			owner.rotateTo( target, delta );


		}

		return this;

	}

	/**
	* Shoots at the given position with the current weapon.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	shootAt( targetPosition ) {

		this.currentWeapon.shootAt( targetPosition );

		return this;

	}

}

//

const WEAPON_TYPES = Object.freeze( {
	BLASTER: 0,
	SHOTGUN: 1,
	ASSAULT_RIFLE: 2
} );

WeaponSystem.WEAPON_TYPES = WEAPON_TYPES;

export { WeaponSystem };
