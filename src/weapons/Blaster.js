import {
	FuzzyAND,
	FuzzyRule,
	FuzzyVariable,
	LeftShoulderFuzzySet,
	Ray,
	RightShoulderFuzzySet,
	TriangularFuzzySet
} from '../lib/yuka.module.js';
import { Weapon } from './Weapon.js';
import { WEAPON_STATUS_READY, WEAPON_STATUS_SHOT, WEAPON_STATUS_RELOAD, WEAPON_STATUS_EMPTY, WEAPON_STATUS_OUT_OF_AMMO, WEAPON_TYPES_BLASTER } from '../core/Constants.js';
import { CONFIG } from '../core/Config.js';

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

		this.type = WEAPON_TYPES_BLASTER;

		// common weapon properties

		this.roundsLeft = CONFIG.BLASTER.ROUNDS_LEFT;
		this.roundsPerClip = CONFIG.BLASTER.ROUNDS_PER_CLIP;
		this.ammo = CONFIG.BLASTER.AMMO;
		this.maxAmmo = CONFIG.BLASTER.MAX_AMMO;

		this.shotTime = CONFIG.BLASTER.SHOT_TIME;
		this.reloadTime = CONFIG.BLASTER.RELOAD_TIME;

		// blaster specific properties

		this.muzzleFireTime = CONFIG.BLASTER.MUZZLE_TIME;
		this.endTimeMuzzleFire = Infinity;

		// render specific stuff

		this.muzzle = null;
		this.audios = null;

	}

	/**
	* Update method of this weapon.
	*
	* @param {Number} delta - The time delta value;
	* @return {Blaster} A reference to this weapon.
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
	* @return {Blaster} A reference to this weapon.
	*/
	reload() {

		this.status = WEAPON_STATUS_RELOAD;

		const audio = this.audios.get( 'reload' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		this.endTimeReload = this.currentTime + this.reloadTime;

		return this;

	}

	/**
	* Shoots at the given position.
	*
	* @param {Vector3} targetPosition - The target position.
	* @return {Blaster} A reference to this weapon.
	*/
	shoot( targetPosition ) {

		this.status = WEAPON_STATUS_SHOT;

		// audio

		const audio = this.audios.get( 'shot' );
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		// muzzle fire

		this.muzzle.visible = true;
		this.muzzle.material.rotation = Math.random() * Math.PI;

		this.endTimeMuzzleFire = this.currentTime + this.muzzleFireTime;

		// create bullet

		const ray = new Ray();

		this.getWorldPosition( ray.origin );
		ray.direction.subVectors( targetPosition, ray.origin ).normalize();

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

		this.fuzzy.fuzzify( 'distanceToTarget', distance );

		this.fuzzy.fuzzify( 'ammoStatus', this.roundsLeft );

		return this.fuzzy.defuzzify( 'desirability' );

	}

	_initFuzzyModule() {

		const fuzzyModuleBlaster = this.fuzzy;

		// FLV distance to target

		const distanceToTarget = new FuzzyVariable();

		const targetClose = new LeftShoulderFuzzySet( 0, 5, 10 );
		const targetMedium = new TriangularFuzzySet( 5, 10, 15 );
		const targetFar = new RightShoulderFuzzySet( 10, 15, 20 );

		distanceToTarget.add( targetClose );
		distanceToTarget.add( targetMedium );
		distanceToTarget.add( targetFar );

		fuzzyModuleBlaster.addFLV( 'distanceToTarget', distanceToTarget );

		// FLV desirability

		const desirability = new FuzzyVariable();

		const undesirable = new LeftShoulderFuzzySet( 0, 25, 50 );
		const desirable = new TriangularFuzzySet( 25, 50, 75 );
		const veryDesirable = new RightShoulderFuzzySet( 50, 75, 100 );

		desirability.add( undesirable );
		desirability.add( desirable );
		desirability.add( veryDesirable );

		fuzzyModuleBlaster.addFLV( 'desirability', desirability );

		// FLV ammo status blaster

		const ammoStatusAssaultRifle = new FuzzyVariable();

		const lowBlaster = new LeftShoulderFuzzySet( 0, 8, 15 );
		const okayBlaster = new TriangularFuzzySet( 8, 20, 30 );
		const LoadsBlaster = new RightShoulderFuzzySet( 20, 30, this.maxAmmo );

		ammoStatusAssaultRifle.add( lowBlaster );
		ammoStatusAssaultRifle.add( okayBlaster );
		ammoStatusAssaultRifle.add( LoadsBlaster );

		fuzzyModuleBlaster.addFLV( 'ammoStatus', ammoStatusAssaultRifle );

		// rules blaster

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetClose, lowBlaster ), undesirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetClose, okayBlaster ), desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetClose, LoadsBlaster ), desirable ) );

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetMedium, lowBlaster ), desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetMedium, okayBlaster ), desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetMedium, LoadsBlaster ), desirable ) );

		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetFar, lowBlaster ), desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetFar, okayBlaster ), desirable ) );
		fuzzyModuleBlaster.addRule( new FuzzyRule( new FuzzyAND( targetFar, LoadsBlaster ), desirable ) );

	}

}

export { Blaster };
