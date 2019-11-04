import { Ray, Vector3 } from 'yuka';
import { AnimationMixer, LoopOnce } from 'three';
import { Weapon } from './Weapon.js';
import { WEAPON_STATUS_READY, WEAPON_STATUS_SHOT, WEAPON_STATUS_RELOAD, WEAPON_STATUS_EMPTY, WEAPON_STATUS_OUT_OF_AMMO, WEAPON_TYPES_ASSAULT_RIFLE } from '../core/Constants.js';
import { CONFIG } from '../core/Config.js';

const spread = new Vector3();

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

		this.type = WEAPON_TYPES_ASSAULT_RIFLE;

		// common weapon properties

		this.roundsLeft = CONFIG.ASSAULT_RIFLE.ROUNDS_LEFT;
		this.roundsPerClip = CONFIG.ASSAULT_RIFLE.ROUNDS_PER_CLIP;
		this.ammo = CONFIG.ASSAULT_RIFLE.AMMO;
		this.maxAmmo = CONFIG.ASSAULT_RIFLE.MAX_AMMO;

		this.shotTime = CONFIG.ASSAULT_RIFLE.SHOT_TIME;
		this.reloadTime = CONFIG.ASSAULT_RIFLE.RELOAD_TIME;
		this.equipTime = CONFIG.ASSAULT_RIFLE.EQUIP_TIME;
		this.hideTime = CONFIG.ASSAULT_RIFLE.HIDE_TIME;
		this.muzzleFireTime = CONFIG.ASSAULT_RIFLE.MUZZLE_TIME;

	}

	/**
	* Update method of this weapon.
	*
	* @param {Number} delta - The time delta value;
	* @return {AssaultRifle} A reference to this weapon.
	*/
	update( delta ) {

		super.update( delta );

		// check reload

		if ( this.currentTime >= this.endTimeReload ) {

			const toReload = this.roundsPerClip - this.roundsLeft;

			if ( this.ammo >= toReload ) {

				this.roundsLeft = this.roundsPerClip;
				this.ammo -= toReload;

			} else {

				this.roundsLeft += this.ammo;
				this.ammo = 0;

			}

			// update UI

			if ( this.owner.isPlayer ) {

				this.owner.world.uiManager.updateAmmoStatus();

			}

			this.status = WEAPON_STATUS_READY;

			this.endTimeReload = Infinity;

		}

		// check muzzle fire

		if ( this.currentTime >= this.endTimeMuzzleFire ) {

			this.muzzle.visible = false;

			this.endTimeMuzzleFire = Infinity;

		}

		// check shoot

		if ( this.currentTime >= this.endTimeShot ) {

			if ( this.roundsLeft === 0 ) {

				if ( this.ammo === 0 ) {

					this.status = WEAPON_STATUS_OUT_OF_AMMO;

				} else {

					this.status = WEAPON_STATUS_EMPTY;

				}

			} else {

				this.status = WEAPON_STATUS_READY;

			}

			this.endTimeShot = Infinity;

		}

		return this;

	}

	/**
	* Reloads the weapon.
	*
	* @return {AssaultRifle} A reference to this weapon.
	*/
	reload() {

		this.status = WEAPON_STATUS_RELOAD;

		// audio

		const audio = this.audios.get( 'reload' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		// animation

		if ( this.mixer ) {

			const animation = this.animations.get( 'reload' );
			animation.stop();
			animation.play();

		}

		this.endTimeReload = this.currentTime + this.reloadTime;

		return this;

	}

	/**
	* Shoots at the given position.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {AssaultRifle} A reference to this weapon.
	*/
	shoot( targetPosition ) {

		this.status = WEAPON_STATUS_SHOT;

		// audio

		const audio = this.audios.get( 'shot' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		// animation

		if ( this.mixer ) {

			const animation = this.animations.get( 'shot' );
			animation.stop();
			animation.play();

		}

		// muzzle fire

		this.muzzle.visible = true;
		this.muzzle.material.rotation = Math.random() * Math.PI;

		this.endTimeMuzzleFire = this.currentTime + this.muzzleFireTime;

		// create bullet

		const ray = new Ray();

		this.getWorldPosition( ray.origin );
		ray.direction.subVectors( targetPosition, ray.origin ).normalize();

		// add spread

		spread.x = ( 1 - Math.random() * 2 ) * 0.01;
		spread.y = ( 1 - Math.random() * 2 ) * 0.01;
		spread.z = ( 1 - Math.random() * 2 ) * 0.01;

		ray.direction.add( spread ).normalize();

		// add bullet to world

		this.owner.world.addBullet( this.owner, ray );

		// adjust ammo

		this.roundsLeft --;

		this.endTimeShot = this.currentTime + this.shotTime;

		return this;

	}

	/**
	* Returns a value representing the desirability of using the weapon.
	*
	* @param {Number} distance - The distance to the target.
	* @return {Number} A score between 0 and 1 representing the desirability.
	*/
	getDesirability( distance ) {

		this.fuzzyModule.fuzzify( 'distanceToTarget', distance );
		this.fuzzyModule.fuzzify( 'ammoStatus', this.roundsLeft );

		return this.fuzzyModule.defuzzify( 'desirability' ) / 100;

	}

	/**
	* Inits animations for this weapon. Only used for the player.
	*
	* @return {AssaultRifle} A reference to this weapon.
	*/
	initAnimations() {

		const assetManager = this.owner.world.assetManager;

		const mixer = new AnimationMixer( this );
		const animations = new Map();

		const shotClip = assetManager.animations.get( 'assaultRifle_shot' );
		const reloadClip = assetManager.animations.get( 'assaultRifle_reload' );
		const hideClip = assetManager.animations.get( 'assaultRifle_hide' );
		const equipClip = assetManager.animations.get( 'assaultRifle_equip' );

		const shotAction = mixer.clipAction( shotClip );
		shotAction.loop = LoopOnce;

		const reloadAction = mixer.clipAction( reloadClip );
		reloadAction.loop = LoopOnce;

		const hideAction = mixer.clipAction( hideClip );
		hideAction.loop = LoopOnce;
		hideAction.clampWhenFinished = true;

		const equipAction = mixer.clipAction( equipClip );
		equipAction.loop = LoopOnce;

		animations.set( 'shot', shotAction );
		animations.set( 'reload', reloadAction );
		animations.set( 'hide', hideAction );
		animations.set( 'equip', equipAction );

		this.animations = animations;
		this.mixer = mixer;

		return this;

	}

}

export { AssaultRifle };
