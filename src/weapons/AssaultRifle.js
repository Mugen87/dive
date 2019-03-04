import { Ray, FuzzyVariable, FuzzyRule, LeftShoulderFuzzySet, RightShoulderFuzzySet, TriangularFuzzySet, FuzzyAND, FuzzyModule } from '../lib/yuka.module.js';
import { Weapon } from './Weapon.js';
import { WEAPON_STATUS_READY, WEAPON_STATUS_SHOT, WEAPON_STATUS_RELOAD, WEAPON_STATUS_EMPTY, WEAPON_STATUS_OUT_OF_AMMO, WEAPON_TYPES_ASSAULT_RIFLE } from '../core/Constants.js';
import { CONFIG } from '../core/Config.js';

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

		// assault rifle specific properties

		this.muzzleFireTime = CONFIG.ASSAULT_RIFLE.MUZZLE_TIME;
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
	* @return {AssaultRifle} A reference to this weapon.
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

		const fuzzyModuleAssaultRifle = this.fuzzy;

		// FLV distance to target

		const distanceToTarget = new FuzzyVariable();

		const targetClose = new LeftShoulderFuzzySet( 0, 5, 10 );
		const targetMedium = new TriangularFuzzySet( 5, 10, 15 );
		const targetFar = new RightShoulderFuzzySet( 10, 15, 20 );

		distanceToTarget.add( targetClose );
		distanceToTarget.add( targetMedium );
		distanceToTarget.add( targetFar );

		fuzzyModuleAssaultRifle.addFLV( 'distanceToTarget', distanceToTarget );

		// FLV desirability

		const desirability = new FuzzyVariable();

		const undesirable = new LeftShoulderFuzzySet( 0, 25, 50 );
		const desirable = new TriangularFuzzySet( 25, 50, 75 );
		const veryDesirable = new RightShoulderFuzzySet( 50, 75, 100 );

		desirability.add( undesirable );
		desirability.add( desirable );
		desirability.add( veryDesirable );

		fuzzyModuleAssaultRifle.addFLV( 'desirability', desirability );

		// FLV ammo status assault rifle

		const ammoStatusAssaultRifle = new FuzzyVariable();

		const lowAssault = new LeftShoulderFuzzySet( 0, 2, 8 );
		const okayAssault = new TriangularFuzzySet( 2, 10, 20 );
		const LoadsAssault = new RightShoulderFuzzySet( 10, 20, this.maxAmmo );

		ammoStatusAssaultRifle.add( lowAssault );
		ammoStatusAssaultRifle.add( okayAssault );
		ammoStatusAssaultRifle.add( LoadsAssault );

		fuzzyModuleAssaultRifle.addFLV( 'ammoStatus', ammoStatusAssaultRifle );

		// rules assault rifle

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetClose, lowAssault ), undesirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetClose, okayAssault ), desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetClose, LoadsAssault ), desirable ) );

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetMedium, lowAssault ), desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetMedium, okayAssault ), desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetMedium, LoadsAssault ), veryDesirable ) );

		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetFar, lowAssault ), desirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetFar, okayAssault ), veryDesirable ) );
		fuzzyModuleAssaultRifle.addRule( new FuzzyRule( new FuzzyAND( targetFar, LoadsAssault ), veryDesirable ) );

	}

}

export { AssaultRifle };
