import { GameEntity, MovingEntity, Vector3, AABB, MathUtils } from '../lib/yuka.module.js';
import { LoopOnce } from '../lib/three.module.js';
import { WeaponSystem } from '../core/WeaponSystem.js';
import { CONFIG } from '../core/Config.js';
import { Projectile } from '../weapons/Projectile.js';
import { STATUS_ALIVE, WEAPON_TYPES_ASSAULT_RIFLE, MESSAGE_HIT, MESSAGE_DEAD, STATUS_DYING, STATUS_DEAD } from '../core/Constants.js';

const intersectionPoint = new Vector3();
const targetPosition = new Vector3();
const projectile = new Projectile();
const attackDirection = new Vector3();
const lookDirection = new Vector3();
const cross = new Vector3();

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

		this.currentTime = 0;
		this.boundingRadius = CONFIG.PLAYER.BOUNDING_RADIUS;
		this.height = CONFIG.PLAYER.HEAD_HEIGHT;
		this.updateOrientation = false;
		this.maxSpeed = CONFIG.PLAYER.MAX_SPEED;
		this.health = CONFIG.PLAYER.MAX_HEALTH;
		this.maxHealth = CONFIG.PLAYER.MAX_HEALTH;
		this.isPlayer = true;

		this.status = STATUS_ALIVE;

		// the camera is attached to the player's head

		this.head = new GameEntity();
		this.head.forward.set( 0, 0, - 1 );
		this.add( this.head );

		// death animation

		this.endTimeDying = Infinity;
		this.dyingTime = CONFIG.PLAYER.DYING_TIME;

		// the weapons are attached to the following container entity

		this.weaponContainer = new GameEntity();
		this.head.add( this.weaponContainer );

		// the player uses the weapon system, too

		this.weaponSystem = new WeaponSystem( this );
		this.weaponSystem.init();

		// the player's bounds (using a single AABB is sufficient for now)

		this.bounds = new AABB();
		this.boundsDefinition = new AABB( new Vector3( - 0.25, 0, - 0.25 ), new Vector3( 0.25, 1.8, 0.25 ) );

		// current convex region of the navmesh the entity is in

		this.currentRegion = null;
		this.currentPosition = new Vector3();
		this.previousPosition = new Vector3();

		// audio

		this.audios = new Map();

		// animation

		this.mixer = null;
		this.animations = new Map();

		// ui
		this.ui = {

			health: document.getElementById( 'health' ),

		};

		this.name = 'Player';

	}

	/**
	* Updates the internal state of this game entity.
	*
	* @param {Number} delta - The time delta.
	* @return {Player} A reference to this game entity.
	*/
	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

		// ensure the enemy never leaves the level

		this.stayInLevel();

		//

		if ( this.status === STATUS_ALIVE ) {

			// update weapon system

			this.weaponSystem.updateWeaponChange();

			// update bounds

			this.bounds.copy( this.boundsDefinition ).applyMatrix4( this.worldMatrix );

		}

		//

		if ( this.status === STATUS_DYING ) {

			if ( this.currentTime >= this.endTimeDying ) {

				this.status = STATUS_DEAD;
				this.endTimeDying = Infinity;

			}

		}

		//

		if ( this.status === STATUS_DEAD ) {

			if ( this.world.debug ) console.log( 'DIVE.Player: Player died.' );

			this.reset();

			this.world.spawningManager.respawnCompetitor( this );
			this.world.fpsControls.sync();

		}

		//

		this.mixer.update( delta );

		return this;

	}

	/**
	* Resets the player after a death.
	*
	* @return {Player} A reference to this game entity.
	*/
	reset() {

		this.health = this.maxHealth;
		this.status = STATUS_ALIVE;

		this.weaponSystem.reset();

		this.world.fpsControls.reset();

		this.world.uiManager.showFPSInterface();

		const animation = this.animations.get( 'player_death' );
		animation.stop();

		return this;

	}

	/**
	* Inits the death of the player.
	*
	* @return {Player} A reference to this game entity.
	*/
	initDeath() {

		this.status = STATUS_DYING;
		this.endTimeDying = this.currentTime + this.dyingTime;

		this.velocity.set( 0, 0, 0 );

		const animation = this.animations.get( 'player_death' );
		animation.play();

		this.weaponSystem.hideCurrentWeapon();

		this.world.fpsControls.active = false;
		this.world.uiManager.hideFPSInterface();

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

		// update UI

		world.uiManager.updateAmmoStatus();

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
	* Returns true if the player has a weapon of the given type.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {Boolean} Whether the player has a weapon of the given type or not.
	*/
	hasWeapon( type ) {

		return this.weaponSystem.getWeapon( type ) !== null;

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
	* Returns the intesection point if a projectile intersects with this entity.
	* If no intersection is detected, null is returned.
	*
	* @param {Ray} ray - The ray that defines the trajectory of this bullet.
	* @param {Vector3} intersectionPoint - The intersection point.
	* @return {Vector3} The intersection point.
	*/
	checkProjectileIntersection( ray, intersectionPoint ) {

		return ray.intersectAABB( this.bounds, intersectionPoint );

	}

	/**
	* Ensures the player never leaves the level.
	*
	* @return {Player} A reference to this game entity.
	*/
	stayInLevel() {

		// "currentPosition" represents the final position after the movement for a single
		// simualation step. it's now necessary to check if this point is still on
		// the navMesh

		this.currentPosition.copy( this.position );

		this.currentRegion = this.world.navMesh.clampMovement(
			this.currentRegion,
			this.previousPosition,
			this.currentPosition,
			this.position // this is the result vector that gets clamped
		);

		// save this position for the next method invocation

		this.previousPosition.copy( this.position );

		// adjust height of the entity according to the ground

		const distance = this.currentRegion.plane.distanceToPoint( this.position );

		this.position.y -= distance * CONFIG.NAVMESH.HEIGHT_CHANGE_FACTOR; // smooth transition

		return this;

	}

	/*
	* Adds the given health points to this entity.
	*
	* @param {Number} amount - The amount of health to add.
	* @return {Player} A reference to this game entity.
	*/
	addHealth( amount ) {

		this.health += amount;

		this.health = Math.min( this.health, this.maxHealth ); // ensure that health does not exceed maxHealth

		this.world.uiManager.updateHealthStatus();

		//

		if ( this.world.debug ) {

			console.log( 'DIVE.Player: Entity with ID %s receives %i health points.', this.uuid, amount );

		}

		return this;

	}

	/*
	* Adds the given weapon to the internal weapon system.
	*
	* @param {WEAPON_TYPES} type - The weapon type.
	* @return {Player} A reference to this game entity.
	*/
	addWeapon( type ) {

		this.weaponSystem.addWeapon( type );

		// if the entity already has the weapon, increase the ammo

		this.world.uiManager.updateAmmoStatus();

		return this;

	}

	/**
	* Sets the animations of this game entity by creating a
	* series of animation actions.
	*
	* @param {AnimationMixer} mixer - The animation mixer.
	* @param {Array} clips - An array of animation clips.
	* @return {Player} A reference to this game entity.
	*/
	setAnimations( mixer, clips ) {

		this.mixer = mixer;

		// actions

		for ( const clip of clips ) {

			const action = mixer.clipAction( clip );
			action.loop = LoopOnce;
			action.name = clip.name;

			this.animations.set( action.name, action );

		}

		return this;

	}

	/**
	* Holds the implementation for the message handling of this game entity.
	*
	* @param {Telegram} telegram - The telegram with the message data.
	* @return {Boolean} Whether the message was processed or not.
	*/
	handleMessage( telegram ) {

		switch ( telegram.message ) {

			case MESSAGE_HIT:

				// play audio

				const audio = this.audios.get( 'impact' + MathUtils.randInt( 1, 7 ) );
				if ( audio.isPlaying === true ) audio.stop();
				audio.play();

				// reduce health

				this.health -= telegram.data.damage;

				// update UI

				this.world.uiManager.updateHealthStatus();

				// logging

				if ( this.world.debug ) {

					console.log( 'DIVE.Player: Player hit by Game Entity with ID %s receiving %i damage.', telegram.sender.uuid, telegram.data.damage );

				}

				// check if the player is dead

				if ( this.health <= 0 && this.status === STATUS_ALIVE ) {

					this.initDeath();

					// inform all other competitors about its death

					const competitors = this.world.competitors;

					for ( let i = 0, l = competitors.length; i < l; i ++ ) {

						const competitor = competitors[ i ];

						if ( this !== competitor ) this.sendMessage( competitor, MESSAGE_DEAD );

					}

					// update UI

					this.world.uiManager.addFragMessage( telegram.sender, this );

				} else {

					const angle = this.computeAngleToAttacker( telegram.data.direction );
					this.world.uiManager.showDamageIndication( angle );

				}

				break;

		}

		return true;

	}

	/**
	* Computes the angle between the current look direction and the attack direction in
	* the range of [-π, π].
	*
	* @param {Vector3} projectileDirection - The direction of the projectile.
	* @return {Number} The angle in radians.
	*/
	computeAngleToAttacker( projectileDirection ) {

		attackDirection.copy( projectileDirection ).multiplyScalar( - 1 );
		attackDirection.y = 0; // project plane on (0,1,0) plane
		attackDirection.normalize();

		this.head.getWorldDirection( lookDirection );
		lookDirection.y = 0;
		lookDirection.normalize();

		// since both direction vectors lie in the same plane, use the following formula
		//
		// dot = a * b
		// det = n * (a x b)
		// angle = atan2(det, dot)
		//
		// Note: We can't use Vector3.angleTo() since the result is always in the range [0,π]

		const dot = attackDirection.dot( lookDirection );
		const det = this.up.dot( cross.crossVectors( attackDirection, lookDirection ) ); // triple product

		return Math.atan2( det, dot );

	}

}

export { Player };
