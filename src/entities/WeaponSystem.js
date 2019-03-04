import { Vector3, MathUtils } from '../lib/yuka.module.js';
import { CONFIG } from '../core/Config.js';
import { WEAPON_TYPES_BLASTER, WEAPON_TYPES_SHOTGUN, WEAPON_TYPES_ASSAULT_RIFLE } from '../core/Constants.js';
import { WEAPON_STATUS_EMPTY, WEAPON_STATUS_READY, WEAPON_STATUS_OUT_OF_AMMO } from '../core/Constants.js';
import { Blaster } from '../weapons/Blaster.js';
import { Shotgun } from '../weapons/Shotgun.js';
import { AssaultRifle } from '../weapons/AssaultRifle.js';

const displacement = new Vector3();
const targetPosition = new Vector3();
const offset = new Vector3();

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

		// each time the current weapon is fired a certain amount of random noise is
		// added to the target poisition. The lower this value the more accurate
		// a bot's aim will be. The value represents the maximum amount of offset in
		// world units.

		this.aimAccuracy = CONFIG.BOT.WEAPON.AIM_ACCURACY;

		// an array with all weapons the bot has in its inventory

		this.weapons = new Array();

		// this map holds the same data as the weapon array but it ensures only one weapon
		// per type is present in the inventory

		this.weaponsMap = new Map();

		this.weaponsMap.set( WEAPON_TYPES_BLASTER, null );
		this.weaponsMap.set( WEAPON_TYPES_SHOTGUN, null );
		this.weaponsMap.set( WEAPON_TYPES_ASSAULT_RIFLE, null );

		// represents the current hold weapon

		this.currentWeapon = null;

		// manages the render components for the weapons

		this.renderComponents = {
			blaster: {
				mesh: null,
				audios: new Map(),
				muzzle: null
			},
			shotgun: {
				mesh: null,
				audios: new Map(),
				muzzle: null
			},
			assaultRifle: {
				mesh: null,
				audios: new Map(),
				muzzle: null
			}
		};

	}

	/**
	* Inits the weapon system. Should be called once during the creation
	* or startup process of an entity.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	init() {

		// init render components

		this._initRenderComponents();

		// reset the system to its initial state

		this.reset();

		return this;

	}


	/**
	* Resets the internal data structures and sets an initial weapon.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	reset() {

		// remove existing weapons if necessary

		for ( let i = 0, l = this.weapons.length; i < l; i ++ ) {

			const weapon = this.weapons[ i ];

			this.removeWeapon( weapon.type );

		}

		// configure initial setup

		this.addWeapon( WEAPON_TYPES_BLASTER );
		this.addWeapon( WEAPON_TYPES_SHOTGUN );
		this.addWeapon( WEAPON_TYPES_ASSAULT_RIFLE );

		this.currentWeapon = this.weaponsMap.get( WEAPON_TYPES_BLASTER );

		return this;

	}

	/**
	* Determines the most appropriate weapon to use given the current game state.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	selectBestWeapon() {

		const owner = this.owner;
		const target = owner.targetSystem.getTarget();

		if ( target ) {

			let highestDesirability = 0;

			// calculate the distance to the target

			const distanceToTarget = this.owner.position.distanceTo( target.position );

			// for each weapon in the inventory calculate its desirability given the
			// current situation. The most desirable weapon is selected

			for ( let i = 0, l = this.weapons.length; i < l; i ++ ) {

				const weapon = this.weapons[ i ];

				const desirability = ( weapon.roundsLeft === 0 ) ? 0 : weapon.getDesirability( distanceToTarget );

				if ( desirability > highestDesirability ) {

					highestDesirability = desirability;

					this.changeWeapon( weapon.type );

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

		if ( weapon ) {

			this.currentWeapon = weapon;
			switch ( weapon.type ) {

				case WEAPON_TYPES_BLASTER:

					this.renderComponents.blaster.mesh.visible = true;
					this.renderComponents.shotgun.mesh.visible = false;
					this.renderComponents.assaultRifle.mesh.visible = false;
					break;

				case WEAPON_TYPES_SHOTGUN:

					this.renderComponents.blaster.mesh.visible = false;
					this.renderComponents.shotgun.mesh.visible = true;
					this.renderComponents.assaultRifle.mesh.visible = false;
					break;

				case WEAPON_TYPES_ASSAULT_RIFLE:

					this.renderComponents.blaster.mesh.visible = false;
					this.renderComponents.shotgun.mesh.visible = false;
					this.renderComponents.assaultRifle.mesh.visible = true;
					break;

				default:
					console.error( 'DIVE.WeaponSystem: Invalid weapon type:', type );
					break;

			}

		}

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

			case WEAPON_TYPES_BLASTER:
				weapon = new Blaster( owner );
				weapon.position.set( - 0.15, 1.30, 0.5 ); // relative position to the enenmy's body
				weapon.muzzle = this.renderComponents.blaster.muzzle;
				weapon.audios = this.renderComponents.blaster.audios;
				break;

			case WEAPON_TYPES_SHOTGUN:
				weapon = new Shotgun( owner );
				weapon.position.set( - 0.15, 1.30, 0.5 );
				weapon.muzzle = this.renderComponents.shotgun.muzzle;
				weapon.audios = this.renderComponents.shotgun.audios;
				break;

			case WEAPON_TYPES_ASSAULT_RIFLE:
				weapon = new AssaultRifle( owner );
				weapon.position.set( - 0.15, 1.30, 0.5 );
				weapon.muzzle = this.renderComponents.assaultRifle.muzzle;
				weapon.audios = this.renderComponents.assaultRifle.audios;
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

			// also add it to owner entity so the weapon is correctly updated by
			// the entity manager

			owner.add( weapon );

		}

		return this;

	}

	/**
	* Removes the specified weapon type from the bot's inventory.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	removeWeapon( type ) {

		const weapon = this.weaponsMap.get( type );

		if ( weapon ) {

			this.weaponsMap.set( type, null );

			const index = this.weapons.indexOf( weapon );
			this.weapons.splice( index, 1 );

			this.owner.remove( weapon );

		}

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
		const targetSystem = owner.targetSystem;
		const target = targetSystem.getTarget();

		if ( target ) {

			// stop search for attacker if the enemy has a target

			owner.resetSearch();

			// if the game entity is visible, directly rotate towards it. Otherwise, focus
			// the last known position

			if ( targetSystem.isTargetShootable() ) {

				const targeted = owner.rotateTo( target.position, delta, 0.05 );
				const timeBecameVisible = targetSystem.getTimeBecameVisible();

				// "targeted" is true if the entity is faced to the target

				if ( targeted === true && timeBecameVisible >= this.reactionTime ) {

					target.currentHitbox.getCenter( targetPosition );

					this.addNoiseToAim( targetPosition );

					this.shoot( targetPosition );

				}

			} else {

				owner.rotateTo( targetSystem.getLastSensedPosition(), delta );

			}

		} else {

			// of the enemy has no target, look for an attacker if necessary

			if ( owner.searchAttacker ) {

				targetPosition.copy( owner.position ).add( owner.attackDirection );
				owner.rotateTo( targetPosition, delta );

			} else {

				// if the enemy has no target and is not being attacked, just look along
				// the movement direction

				displacement.copy( owner.velocity ).normalize();
				targetPosition.copy( owner.position ).add( displacement );

				owner.rotateTo( targetPosition, delta );

			}

		}

		return this;

	}

	/**
	* Ensures the enemy does not perfectly aim at the given target position. It
	* alters the target position by a certain offset. The offset proportionally
	* increases with the distance between the owner of the weapon and its target.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {Vector3} The target position.
	*/
	addNoiseToAim( targetPosition ) {

		const distance = this.owner.position.distanceTo( targetPosition );

		offset.x = MathUtils.randFloat( - this.aimAccuracy, this.aimAccuracy );
		offset.y = MathUtils.randFloat( - this.aimAccuracy, this.aimAccuracy );
		offset.z = MathUtils.randFloat( - this.aimAccuracy, this.aimAccuracy );

		const f = Math.min( distance, 100 ) / 100; // 100 world units produces the maximum amount of offset

		targetPosition.add( offset.multiplyScalar( f ) );

		return targetPosition;

	}

	/**
	* Shoots at the given position with the current weapon.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	shoot( targetPosition ) {

		const currentWeapon = this.currentWeapon;
		const status = currentWeapon.status;

		switch ( status ) {

			case WEAPON_STATUS_EMPTY:
				this.currentWeapon.reload();
				break;

			case WEAPON_STATUS_READY:
				this.currentWeapon.shoot( targetPosition );
				break;

			case WEAPON_STATUS_OUT_OF_AMMO:
				// TODO: consider to use another weapon
				break;

			default:
				break;

		}

		return this;

	}

	/**
	* Inits the render components of all weapons. Each enemy and the player
	* need a set of individual render components.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initRenderComponents() {

		this._initBlasterRenderComponent();

		this._initShotgunRenderComponent();

		this._initAssaultRifleRenderComponent();

		return this;

	}

	/**
	* Inits the render components for the blaster.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initBlasterRenderComponent() {

		const assetManager = this.owner.world.assetManager;

		// setup copy of blaster mesh

		const blasterMesh = assetManager.models.get( 'blaster' ).clone();
		blasterMesh.scale.set( 100, 100, 100 );
		blasterMesh.rotation.set( Math.PI * 0.5, Math.PI, 0 );
		blasterMesh.position.set( 0, 15, 5 );
		blasterMesh.updateMatrix();

		// add the mesh to the right hand of the enemy

		const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
		rightHand.add( blasterMesh );

		// add muzzle sprite to the blaster mesh

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.position.set( 0, 0.05, 0.2 );
		muzzleSprite.scale.set( 0.3, 0.3, 0.3 );
		muzzleSprite.updateMatrix();
		blasterMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'blaster_shot' ) );
		shot.setRolloffFactor( 3 );
		shot.setVolume( 0.4 );
		blasterMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
		reload.setRolloffFactor( 3 );
		reload.setVolume( 0.1 );
		blasterMesh.add( reload );

		// store this configuration

		this.renderComponents.blaster.mesh = blasterMesh;
		this.renderComponents.blaster.audios.set( 'shot', shot );
		this.renderComponents.blaster.audios.set( 'reload', reload );
		this.renderComponents.blaster.muzzle = muzzleSprite;

		return this;

	}

	/**
	* Inits the render components for the shotgun.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initShotgunRenderComponent() {

		const assetManager = this.owner.world.assetManager;

		// setup copy of shotgun mesh

		const shotgunMesh = assetManager.models.get( 'shotgun' ).clone();
		shotgunMesh.scale.set( 100, 100, 100 );
		shotgunMesh.rotation.set( Math.PI * 0.5, Math.PI * 1.05, 0 );
		shotgunMesh.position.set( - 5, 30, 2 );
		shotgunMesh.updateMatrix();
		shotgunMesh.visible = false; // this weapon is not visible by default

		// add the mesh to the right hand of the enemy

		const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
		rightHand.add( shotgunMesh );

		// add muzzle sprite to the blaster mesh

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.position.set( 0, 0.05, 0.3 );
		muzzleSprite.scale.set( 0.4, 0.4, 0.4 );
		muzzleSprite.updateMatrix();
		shotgunMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'shotgun_shot' ) );
		shot.setRolloffFactor( 3 );
		shot.setVolume( 0.4 );
		shotgunMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
		reload.setRolloffFactor( 3 );
		reload.setVolume( 0.1 );
		shotgunMesh.add( reload );
		const shotReload = assetManager.cloneAudio( assetManager.audios.get( 'shotgun_shot_reload' ) );
		shotReload.setRolloffFactor( 3 );
		shotReload.setVolume( 0.1 );
		shotgunMesh.add( shotReload );

		// store this configuration

		this.renderComponents.shotgun.mesh = shotgunMesh;
		this.renderComponents.shotgun.audios.set( 'shot', shot );
		this.renderComponents.shotgun.audios.set( 'reload', reload );
		this.renderComponents.shotgun.audios.set( 'shot_reload', shotReload );
		this.renderComponents.shotgun.muzzle = muzzleSprite;

		return this;

	}

	/**
	* Inits the render components for the assault rifle.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initAssaultRifleRenderComponent() {

		const assetManager = this.owner.world.assetManager;

		// setup copy of assault rifle mesh

		const assaultRifleMesh = assetManager.models.get( 'assault-rifle' ).clone();
		assaultRifleMesh.scale.set( 100, 100, 100 );
		assaultRifleMesh.rotation.set( Math.PI * 0.5, Math.PI * 1, 0 );
		assaultRifleMesh.position.set( - 5, 20, 7 );
		assaultRifleMesh.updateMatrix();
		assaultRifleMesh.visible = false; // this weapon is not visible by default

		// add the mesh to the right hand of the enemy

		const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
		rightHand.add( assaultRifleMesh );

		// add muzzle sprite to the blaster mesh

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.position.set( 0, 0, 0.5 );
		muzzleSprite.scale.set( 0.4, 0.4, 0.4 );
		muzzleSprite.updateMatrix();
		assaultRifleMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'assault_rifle_shot' ) );
		shot.setRolloffFactor( 3 );
		shot.setVolume( 0.8 );
		assaultRifleMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
		reload.setRolloffFactor( 3 );
		reload.setVolume( 0.1 );
		assaultRifleMesh.add( reload );

		// store this configuration

		this.renderComponents.assaultRifle.mesh = assaultRifleMesh;
		this.renderComponents.assaultRifle.audios.set( 'shot', shot );
		this.renderComponents.assaultRifle.audios.set( 'reload', reload );
		this.renderComponents.assaultRifle.muzzle = muzzleSprite;

		return this;

	}

}

export { WeaponSystem };
