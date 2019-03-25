import { Vector3, MathUtils } from '../lib/yuka.module.js';
import { FuzzyVariable, LeftShoulderFuzzySet, TriangularFuzzySet, RightShoulderFuzzySet, FuzzyRule, FuzzyAND, FuzzyModule } from '../lib/yuka.module.js';
import { CONFIG } from '../core/Config.js';
import { WEAPON_TYPES_BLASTER, WEAPON_TYPES_SHOTGUN, WEAPON_TYPES_ASSAULT_RIFLE, WEAPON_STATUS_OUT_OF_AMMO } from '../core/Constants.js';
import { WEAPON_STATUS_EMPTY, WEAPON_STATUS_READY, WEAPON_STATUS_UNREADY } from '../core/Constants.js';
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

		// represents the next weapon type the enemy wants to use

		this.nextWeaponType = null;

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

		// manages the fuzzy modules for the weapons. they are going to be used to
		// determine the best weapon for a given situation

		this.fuzzyModules = {
			blaster: null,
			shotGun: null,
			assaultRifle: null
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

		// init fuzzy modules (only necessary for bots)

		if ( this.owner.isPlayer === false ) {

			this._initFuzzyModules();

		}

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

		for ( let i = ( this.weapons.length - 1 ); i >= 0; i -- ) {

			const weapon = this.weapons[ i ];

			this.removeWeapon( weapon.type );

		}

		// add weapons to inventory

		this.addWeapon( WEAPON_TYPES_BLASTER );
		this.addWeapon( WEAPON_TYPES_SHOTGUN );
		this.addWeapon( WEAPON_TYPES_ASSAULT_RIFLE );

		// change to initial weapon

		this.changeWeapon( WEAPON_TYPES_BLASTER );

		// reset next weapon

		this.nextWeaponType = null;

		// the initial weapon is always ready to use

		this.currentWeapon.status = WEAPON_STATUS_READY;

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
			let bestWeaponType = WEAPON_TYPES_BLASTER;

			// calculate the distance to the target

			const distanceToTarget = this.owner.position.distanceTo( target.position );

			// for each weapon in the inventory calculate its desirability given the
			// current situation. The most desirable weapon is selected

			for ( let i = 0, l = this.weapons.length; i < l; i ++ ) {

				const weapon = this.weapons[ i ];

				let desirability = ( weapon.roundsLeft === 0 ) ? 0 : weapon.getDesirability( distanceToTarget );

				// if weapon is different than currentWeapon, decrease the desirability in order to respect the
				// cost of changing a weapon

				if ( this.currentWeapon !== weapon ) desirability -= CONFIG.BOT.WEAPON.CHANGE_COST;

				//

				if ( desirability > highestDesirability ) {

					highestDesirability = desirability;
					bestWeaponType = weapon.type;

				}

			}

			// select the best weapon

			this.setNextWeapon( bestWeaponType );

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

			// adjust render components. only a single weapon can be visible

			switch ( weapon.type ) {

				case WEAPON_TYPES_BLASTER:
					this.renderComponents.blaster.mesh.visible = true;
					this.renderComponents.shotgun.mesh.visible = false;
					this.renderComponents.assaultRifle.mesh.visible = false;
					if ( this.owner.isPlayer ) weapon.setRenderComponent( this.renderComponents.blaster.mesh, sync );
					break;

				case WEAPON_TYPES_SHOTGUN:
					this.renderComponents.blaster.mesh.visible = false;
					this.renderComponents.shotgun.mesh.visible = true;
					this.renderComponents.assaultRifle.mesh.visible = false;
					if ( this.owner.isPlayer ) weapon.setRenderComponent( this.renderComponents.shotgun.mesh, sync );
					break;

				case WEAPON_TYPES_ASSAULT_RIFLE:
					this.renderComponents.blaster.mesh.visible = false;
					this.renderComponents.shotgun.mesh.visible = false;
					this.renderComponents.assaultRifle.mesh.visible = true;
					if ( this.owner.isPlayer ) weapon.setRenderComponent( this.renderComponents.assaultRifle.mesh, sync );
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
				weapon.fuzzyModule = this.fuzzyModules.blaster;
				weapon.muzzle = this.renderComponents.blaster.muzzle;
				weapon.audios = this.renderComponents.blaster.audios;
				break;

			case WEAPON_TYPES_SHOTGUN:
				weapon = new Shotgun( owner );
				weapon.fuzzyModule = this.fuzzyModules.shotGun;
				weapon.muzzle = this.renderComponents.shotgun.muzzle;
				weapon.audios = this.renderComponents.shotgun.audios;
				break;

			case WEAPON_TYPES_ASSAULT_RIFLE:
				weapon = new AssaultRifle( owner );
				weapon.fuzzyModule = this.fuzzyModules.assaultRifle;
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

			owner.weaponContainer.add( weapon );

			if ( owner.isPlayer ) {

				weapon.scale.set( 2, 2, 2 );
				weapon.position.set( 0.3, - 0.3, - 1 );
				weapon.rotation.fromEuler( 0, Math.PI, 0 );
				weapon.initAnimations();

			} else {

				weapon.position.set( - 0.1, - 0.2, 0.5 );

			}

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

			this.owner.weaponContainer.remove( weapon );

		}

	}

	/**
	* Sets the next weapon type the owner should use.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	setNextWeapon( type ) {

		// no need for action if the current weapon is already of the given type

		if ( this.currentWeapon.type !== type ) {

			this.nextWeaponType = type;

		}

		return this;

	}

	/**
	* Returns the weapon of the given type. If no weapon is present, null is returned.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {Weapon} A weapon.
	*/
	getWeapon( type ) {

		return this.weaponsMap.get( type );

	}

	/**
	* Ensures that the current equiped weapon is rendered.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	showCurrentWeapon() {

		const type = this.currentWeapon.type;

		switch ( type ) {

			case WEAPON_TYPES_BLASTER:
				this.renderComponents.blaster.mesh.visible = true;
				break;

			case WEAPON_TYPES_SHOTGUN:
				this.renderComponents.shotgun.mesh.visible = true;
				break;

			case WEAPON_TYPES_ASSAULT_RIFLE:
				this.renderComponents.assaultRifle.mesh.visible = true;
				break;

			default:
				console.error( 'DIVE.WeaponSystem: Invalid weapon type:', type );
				break;

		}

		return this;

	}

	/**
	* Ensures that the current equipped weapon is not rendered.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	hideCurrentWeapon() {

		const type = this.currentWeapon.type;

		switch ( type ) {

			case WEAPON_TYPES_BLASTER:
				this.renderComponents.blaster.mesh.visible = false;
				break;

			case WEAPON_TYPES_SHOTGUN:
				this.renderComponents.shotgun.mesh.visible = false;
				break;

			case WEAPON_TYPES_ASSAULT_RIFLE:
				this.renderComponents.assaultRifle.mesh.visible = false;
				break;

			default:
				console.error( 'DIVE.WeaponSystem: Invalid weapon type:', type );
				break;

		}

		return this;

	}

	/**
	* Returns the amount of ammo remaining for the specified weapon.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {Number} The amount of ammo.
	*/
	getRemainingAmmoForWeapon( type ) {

		const weapon = this.weaponsMap.get( type );

		return weapon ? weapon.getRemainingRounds() : 0;

	}

	/**
	* Updates method of the weapon system. Called each simulation step if the owner is alive.
	*
	* @param {Number} delta - The time delta value.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	update( delta ) {

		this.updateWeaponChange();
		this.updateAimAndShot( delta );

		return this;

	}

	/**
	* Updates weapon changing logic.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	updateWeaponChange() {

		if ( this.nextWeaponType !== null ) {

			// if the current weapon is in certain states, hide it in order to start the weapon change

			if ( this.currentWeapon.status === WEAPON_STATUS_READY ||
					this.currentWeapon.status === WEAPON_STATUS_EMPTY ||
					this.currentWeapon.status === WEAPON_STATUS_OUT_OF_AMMO ) {

				this.currentWeapon.hide();

			}

			// as soon as the current weapon becomes unready, change to the defined next weapon type

			if ( this.currentWeapon.status === WEAPON_STATUS_UNREADY ) {

				this.changeWeapon( this.nextWeaponType );
				this.currentWeapon.equip();
				this.nextWeaponType = null;

			}

		}

		return this;

	}

	/**
	* Updates the aiming and shooting of the enemy.
	*
	* @param {Number} delta - The time delta value.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	updateAimAndShot( delta ) {

		const owner = this.owner;
		const targetSystem = owner.targetSystem;
		const target = targetSystem.getTarget();

		if ( target ) {

			// if the target is visible, directly rotate towards it and then
			// fire a round

			if ( targetSystem.isTargetShootable() ) {

				// stop search for the attacker if the target is shootable

				owner.resetSearch();

				// the bot can fire a round if it is headed towards its target
				// and after a certain reaction time

				const targeted = owner.rotateTo( target.position, delta, 0.05 ); // "targeted" is true if the enemy is faced to the target
				const timeBecameVisible = targetSystem.getTimeBecameVisible();

				if ( targeted === true && timeBecameVisible >= this.reactionTime ) {

					target.bounds.getCenter( targetPosition );

					this.addNoiseToAim( targetPosition );

					this.shoot( targetPosition );

				}

			} else {

				// the target might not be shootable but the enemy is still attacked.
				// in this case, search for the attacker

				if ( owner.searchAttacker ) {

					targetPosition.copy( owner.position ).add( owner.attackDirection );
					owner.rotateTo( targetPosition, delta );

				} else {

					// otherwise rotate to the latest recorded position

					owner.rotateTo( targetSystem.getLastSensedPosition(), delta );

				}

			}

		} else {

			// if the enemy has no target, look for an attacker if necessary

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

		const maxDistance = CONFIG.BOT.WEAPON.NOISE_MAX_DISTANCE; // this distance produces the maximum amount of offset/noise
		const f = Math.min( distance, maxDistance ) / maxDistance;

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
				currentWeapon.reload();
				break;

			case WEAPON_STATUS_READY:
				currentWeapon.shoot( targetPosition );
				break;

			default:
				break;

		}

		return this;

	}

	/**
	* Reloads the current weapon.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	reload() {

		const currentWeapon = this.currentWeapon;

		if ( currentWeapon.status === WEAPON_STATUS_READY || currentWeapon.status === WEAPON_STATUS_EMPTY ) {

			currentWeapon.reload();

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

		let blasterMesh;

		if ( this.owner.isPlayer === false ) {

			// pick the low resolution model for the enemies

			blasterMesh = assetManager.models.get( 'blaster_low' ).clone();

			blasterMesh.scale.set( 100, 100, 100 );
			blasterMesh.rotation.set( Math.PI * 0.5, Math.PI, 0 );
			blasterMesh.position.set( 0, 15, 5 );
			blasterMesh.updateMatrix();

			// add the mesh to the right hand of the enemy

			const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
			rightHand.add( blasterMesh );

		} else {

			blasterMesh = assetManager.models.get( 'blaster_high' );

			this.owner.world.scene.add( blasterMesh );

		}

		// add muzzle sprite to the blaster mesh

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.material = muzzleSprite.material.clone(); // this is necessary since Mesh.clone() is not deep and SpriteMaterial.rotation is going to be changed
		muzzleSprite.position.set( 0, 0.05, 0.2 );
		muzzleSprite.scale.set( 0.3, 0.3, 0.3 );
		muzzleSprite.updateMatrix();
		blasterMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'blaster_shot' ) );
		shot.setRolloffFactor( 0.5 );
		shot.setVolume( 0.4 );
		blasterMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
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

		let shotgunMesh;

		if ( this.owner.isPlayer === false ) {

			// pick the low resolution model for the enemies

			shotgunMesh = assetManager.models.get( 'shotgun_low' ).clone();

			shotgunMesh.scale.set( 100, 100, 100 );
			shotgunMesh.rotation.set( Math.PI * 0.5, Math.PI * 1.05, 0 );
			shotgunMesh.position.set( - 5, 30, 2 );
			shotgunMesh.updateMatrix();

			// add the mesh to the right hand of the enemy

			const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
			rightHand.add( shotgunMesh );

		} else {

			shotgunMesh = assetManager.models.get( 'shotgun_high' );

			this.owner.world.scene.add( shotgunMesh );

		}

		// add muzzle sprite

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.material = muzzleSprite.material.clone();
		muzzleSprite.position.set( 0, 0.05, 0.3 );
		muzzleSprite.scale.set( 0.4, 0.4, 0.4 );
		muzzleSprite.updateMatrix();
		shotgunMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'shotgun_shot' ) );
		shot.setRolloffFactor( 0.5 );
		shot.setVolume( 0.4 );
		shotgunMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
		reload.setVolume( 0.1 );
		shotgunMesh.add( reload );
		const shotReload = assetManager.cloneAudio( assetManager.audios.get( 'shotgun_shot_reload' ) );
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

		let assaultRifleMesh;

		if ( this.owner.isPlayer === false ) {

			// pick the low resolution model for the enemies

			assaultRifleMesh = assetManager.models.get( 'assaultRifle_low' ).clone();

			assaultRifleMesh.scale.set( 100, 100, 100 );
			assaultRifleMesh.rotation.set( Math.PI * 0.5, Math.PI * 1, 0 );
			assaultRifleMesh.position.set( - 5, 20, 7 );
			assaultRifleMesh.updateMatrix();

			// add the mesh to the right hand of the enemy

			const rightHand = this.owner._renderComponent.getObjectByName( 'Armature_mixamorigRightHand' );
			rightHand.add( assaultRifleMesh );

		} else {

			assaultRifleMesh = assetManager.models.get( 'assaultRifle_high' );

			this.owner.world.scene.add( assaultRifleMesh );

		}

		// add muzzle sprite

		const muzzleSprite = assetManager.models.get( 'muzzle' ).clone();
		muzzleSprite.material = muzzleSprite.material.clone();
		muzzleSprite.position.set( 0, 0, 0.5 );
		muzzleSprite.scale.set( 0.4, 0.4, 0.4 );
		muzzleSprite.updateMatrix();
		assaultRifleMesh.add( muzzleSprite );

		// add positional audios

		const shot = assetManager.cloneAudio( assetManager.audios.get( 'assault_rifle_shot' ) );
		shot.setRolloffFactor( 0.5 );
		shot.setVolume( 0.8 );
		assaultRifleMesh.add( shot );
		const reload = assetManager.cloneAudio( assetManager.audios.get( 'reload' ) );
		reload.setVolume( 0.1 );
		assaultRifleMesh.add( reload );

		// store this configuration

		this.renderComponents.assaultRifle.mesh = assaultRifleMesh;
		this.renderComponents.assaultRifle.audios.set( 'shot', shot );
		this.renderComponents.assaultRifle.audios.set( 'reload', reload );
		this.renderComponents.assaultRifle.muzzle = muzzleSprite;

		return this;

	}

	/**
	* Inits the fuzzy modules for all weapons.
	*
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initFuzzyModules() {

		this.fuzzyModules.assaultRifle = new FuzzyModule();
		this.fuzzyModules.blaster = new FuzzyModule();
		this.fuzzyModules.shotGun = new FuzzyModule();

		const fuzzyModuleAssaultRifle = this.fuzzyModules.assaultRifle;
		const fuzzyModuleBlaster = this.fuzzyModules.blaster;
		const fuzzyModuleShotGun = this.fuzzyModules.shotGun;

		// the following FLVs are equal for all modules

		// FLV distance to target

		const distanceToTarget = new FuzzyVariable();

		const targetClose = new LeftShoulderFuzzySet( 0, 10, 20 );
		const targetMedium = new TriangularFuzzySet( 10, 20, 40 );
		const targetFar = new RightShoulderFuzzySet( 20, 40, 1000 );

		distanceToTarget.add( targetClose );
		distanceToTarget.add( targetMedium );
		distanceToTarget.add( targetFar );

		// FLV desirability

		const desirability = new FuzzyVariable();

		const undesirable = new LeftShoulderFuzzySet( 0, 25, 50 );
		const desirable = new TriangularFuzzySet( 25, 50, 75 );
		const veryDesirable = new RightShoulderFuzzySet( 50, 75, 100 );

		desirability.add( undesirable );
		desirability.add( desirable );
		desirability.add( veryDesirable );

		//

		fuzzyModuleAssaultRifle.addFLV( 'desirability', desirability );
		fuzzyModuleAssaultRifle.addFLV( 'distanceToTarget', distanceToTarget );

		fuzzyModuleBlaster.addFLV( 'desirability', desirability );
		fuzzyModuleBlaster.addFLV( 'distanceToTarget', distanceToTarget );

		fuzzyModuleShotGun.addFLV( 'desirability', desirability );
		fuzzyModuleShotGun.addFLV( 'distanceToTarget', distanceToTarget );

		//

		const fuzzySets = {
			targetClose: targetClose,
			targetMedium: targetMedium,
			targetFar: targetFar,
			undesirable: undesirable,
			desirable: desirable,
			veryDesirable: veryDesirable
		};

		this._initAssaultRifleFuzzyModule( fuzzySets );
		this._initBlasterFuzzyModule( fuzzySets );
		this._initShotgunFuzzyModule( fuzzySets );

		return this;

	}

	/**
	* Inits the fuzzy module for the blaster.
	*
	* @param {Object} fuzzySets - An object with predefined fuzzy sets.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initBlasterFuzzyModule( fuzzySets ) {

		// FLV ammo status

		const fuzzyModuleBlaster = this.fuzzyModules.blaster;
		const ammoStatusBlaster = new FuzzyVariable();

		const lowBlaster = new LeftShoulderFuzzySet( 0, 8, 15 );
		const okayBlaster = new TriangularFuzzySet( 8, 20, 30 );
		const LoadsBlaster = new RightShoulderFuzzySet( 20, 30, 48 );

		ammoStatusBlaster.add( lowBlaster );
		ammoStatusBlaster.add( okayBlaster );
		ammoStatusBlaster.add( LoadsBlaster );

		fuzzyModuleBlaster.addFLV( 'ammoStatus', ammoStatusBlaster );

		// rules

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, lowBlaster ), fuzzySets.undesirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, okayBlaster ), fuzzySets.desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, LoadsBlaster ), fuzzySets.desirable ) );

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, lowBlaster ), fuzzySets.desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, okayBlaster ), fuzzySets.desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, LoadsBlaster ), fuzzySets.desirable ) );

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, lowBlaster ), fuzzySets.desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, okayBlaster ), fuzzySets.desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, LoadsBlaster ), fuzzySets.desirable ) );

		return this;

	}

	/**
	* Inits the fuzzy module for the shotgun.
	*
	* @param {Object} fuzzySets - An object with predefined fuzzy sets.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initShotgunFuzzyModule( fuzzySets ) {

		// FLV ammo status

		const fuzzyModuleShotGun = this.fuzzyModules.shotGun;
		const ammoStatusShotgun = new FuzzyVariable();

		const lowShot = new LeftShoulderFuzzySet( 0, 2, 4 );
		const okayShot = new TriangularFuzzySet( 2, 7, 10 );
		const LoadsShot = new RightShoulderFuzzySet( 7, 10, 12 );

		ammoStatusShotgun.add( lowShot );
		ammoStatusShotgun.add( okayShot );
		ammoStatusShotgun.add( LoadsShot );

		fuzzyModuleShotGun.addFLV( 'ammoStatus', ammoStatusShotgun );

		// rules

		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, lowShot ), fuzzySets.desirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, okayShot ), fuzzySets.veryDesirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, LoadsShot ), fuzzySets.veryDesirable ) );

		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, lowShot ), fuzzySets.desirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, okayShot ), fuzzySets.veryDesirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, LoadsShot ), fuzzySets.veryDesirable ) );

		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, lowShot ), fuzzySets.undesirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, okayShot ), fuzzySets.undesirable ) );
		fuzzyModuleShotGun.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, LoadsShot ), fuzzySets.undesirable ) );

		return this;

	}

	/**
	* Inits the fuzzy module for the assault rifle.
	*
	* @param {Object} fuzzySets - An object with predefined fuzzy sets.
	* @return {WeaponSystem} A reference to this weapon system.
	*/
	_initAssaultRifleFuzzyModule( fuzzySets ) {

		// FLV ammo status

		const fuzzyModuleAssaultRifle = this.fuzzyModules.assaultRifle;
		const ammoStatusAssaultRifle = new FuzzyVariable();

		const lowAssault = new LeftShoulderFuzzySet( 0, 2, 8 );
		const okayAssault = new TriangularFuzzySet( 2, 10, 20 );
		const LoadsAssault = new RightShoulderFuzzySet( 10, 20, 30 );

		ammoStatusAssaultRifle.add( lowAssault );
		ammoStatusAssaultRifle.add( okayAssault );
		ammoStatusAssaultRifle.add( LoadsAssault );

		fuzzyModuleAssaultRifle.addFLV( 'ammoStatus', ammoStatusAssaultRifle );

		// rules

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, lowAssault ), fuzzySets.undesirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, okayAssault ), fuzzySets.desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetClose, LoadsAssault ), fuzzySets.desirable ) );

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, lowAssault ), fuzzySets.desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, okayAssault ), fuzzySets.desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, LoadsAssault ), fuzzySets.veryDesirable ) );

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetMedium, lowAssault ), fuzzySets.desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, okayAssault ), fuzzySets.veryDesirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( fuzzySets.targetFar, LoadsAssault ), fuzzySets.veryDesirable ) );

		return this;

	}

}

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}

export { WeaponSystem };
