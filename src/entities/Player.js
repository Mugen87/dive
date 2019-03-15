import { GameEntity, MovingEntity, Vector3 } from '../lib/yuka.module.js';
import { WeaponSystem } from './WeaponSystem.js';
import { CONFIG } from '../core/Config.js';
import { Projectile } from '../weapons/Projectile.js';
import { STATUS_ALIVE, WEAPON_TYPES_ASSAULT_RIFLE } from '../core/Constants.js';

const startPosition = new Vector3();
const endPosition = new Vector3();
const intersectionPoint = new Vector3();
const targetPosition = new Vector3();
const projectile = new Projectile();

/**
* Class for representing the human player of the game.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Player extends MovingEntity {

	/**
	* Constructs a new player object.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		super();

		this.world = world;

		this.height = CONFIG.PLAYER.HEAD_HEIGHT;
		this.updateOrientation = false;
		this.maxSpeed = CONFIG.PLAYER.MAX_SPEED;

		this.status = STATUS_ALIVE;

		// the camera is attached to the player's head

		this.head = new GameEntity();
		this.head.forward.set( 0, 0, - 1 );
		this.add( this.head );

		// the weapons are attached to the following container entity

		this.weaponContainer = new GameEntity();
		this.head.add( this.weaponContainer );

		//

		this.weaponSystem = new WeaponSystem( this, true );
		this.weaponSystem.init();

		//

		this.audios = new Map();

		//

		this.currentRegion = null;

		// TODO: Only for dev

		this.deactivate();

	}

	/**
	* Updates the internal state of this game entity.
	*
	* @param {Number} delta - The time delta.
	* @return {Player} A reference to this game entity.
	*/
	update( delta ) {

		startPosition.copy( this.position );

		super.update( delta );

		endPosition.copy( this.position );

		// ensure the player stays inside its navmesh

		this.currentRegion = this.world.navMesh.clampMovement(
			this.currentRegion,
			startPosition,
			endPosition,
			this.position
		);

		//

		this.weaponSystem.updateWeaponChange();

		return this;

	}

	/**
	* Fires a round at the player's target with the current armed weapon.
	*
	* @return {Player} A reference to this game entity.
	*/
	shoot() {

		const head = this.head;
		const world = this.world;

		// simulate a shot in order to retrieve the closest intersection point

		const ray = projectile.ray;

		head.getWorldPosition( ray.origin );
		head.getWorldDirection( ray.direction );

		projectile.owner = this;

		const result = world.checkProjectileIntersection( projectile, intersectionPoint );

		// now calculate the distance to the closest intersection point. if no point was found,
		// choose a point on the ray far away from the origin

		const distance = ( result === null ) ? 1000 : ray.origin.distanceTo( intersectionPoint );
		targetPosition.copy( ray.origin ).add( ray.direction.multiplyScalar( distance ) );

		// fire

		this.weaponSystem.shoot( targetPosition );

		return this;

	}

	/**
	* Reloads the current weapon of the player.
	*
	* @return {Player} A reference to this game entity.
	*/
	reload() {

		this.weaponSystem.reload();

		return this;

	}

	/**
	* Changes the weapon to the defined type.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {Player} A reference to this game entity.
	*/
	changeWeapon( type ) {

		this.weaponSystem.setNextWeapon( type );

		return this;

	}

	/**
	* Indicates if the player does currently use an automatic weapon.
	*
	* @return {Boolean} Whether an automatic weapon is used or not.
	*/
	isAutomaticWeaponUsed() {

		return ( this.weaponSystem.currentWeapon.type === WEAPON_TYPES_ASSAULT_RIFLE );

	}

	/**
	* Activates this game entity. Enemies will shot at the player and
	* the current weapon is rendered.
	*
	* @return {Player} A reference to this game entity.
	*/
	activate() {

		this.active = true;
		this.weaponSystem.currentWeapon._renderComponent.visible = true;

		return this;

	}

	/**
	* Deactivates this game entity. Enemies will not shot at the player and
	* the current weapon is not rendered.
	*
	* @return {Player} A reference to this game entity.
	*/
	deactivate() {

		this.active = false;
		this.weaponSystem.currentWeapon._renderComponent.visible = false;

		return this;

	}

	/**
	 * Adds the amount ot the health points of this entity.
	 * @param {Number} amount - The amount of health to add.
	 * @return {Player} A reference to this game entity.
	 */
	giveHealth( amount ) {

		this.health += amount;
		( this.health > CONFIG.PLAYER.MAX_HEALTH ) ? this.health = CONFIG.PLAYER.MAX_HEALTH : this.health; // prevent health to excel max health

		return this;

	}

}


export { Player };
