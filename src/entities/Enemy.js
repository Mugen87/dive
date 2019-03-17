import { Vehicle, Regulator, Think, FollowPathBehavior, OnPathBehavior, SeekBehavior, Vector3, Vision, MemorySystem, GameEntity, Quaternion, MathUtils } from '../lib/yuka.module.js';
import { MESSAGE_HIT, MESSAGE_DEAD, STATUS_ALIVE, STATUS_DYING, STATUS_DEAD } from '../core/Constants.js';
import { AttackEvaluator } from '../evaluators/AttackEvaluator.js';
import { ExploreEvaluator } from '../evaluators/ExploreEvaluator.js';
import { CharacterBounds } from './CharacterBounds.js';
import { WeaponSystem } from './WeaponSystem.js';
import { TargetSystem } from './TargetSystem.js';
import { CONFIG } from '../core/Config.js';
import { GetHealthEvaluator } from '../evaluators/GetHealthEvaluator.js';

const positiveWeightings = new Array();
const weightings = [ 0, 0, 0, 0 ];
const directions = [
	{ direction: new Vector3( 0, 0, 1 ), name: 'soldier_forward' },
	{ direction: new Vector3( 0, 0, - 1 ), name: 'soldier_backward' },
	{ direction: new Vector3( - 1, 0, 0 ), name: 'soldier_left' },
	{ direction: new Vector3( 1, 0, 0 ), name: 'soldier_right' }
];
const lookDirection = new Vector3();
const moveDirection = new Vector3();
const quaternion = new Quaternion();
const transformedDirection = new Vector3();
const worldPosition = new Vector3();
const customTarget = new Vector3();

/**
* Class for representing the opponent bots in this game.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Enemy extends Vehicle {

	/**
	* Constructs a new enemy.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		super();

		this.world = world;

		this.currentTime = 0;
		this.boundingRadius = CONFIG.BOT.BOUNDING_RADIUS;
		this.maxSpeed = CONFIG.BOT.MOVEMENT.MAX_SPEED;
		this.updateOrientation = false;

		this.health = CONFIG.BOT.MAX_HEALTH;
		this.status = STATUS_ALIVE;

		// current convex region of the navmesh the entity is in

		this.currentRegion = null;
		this.currentPosition = new Vector3();
		this.previousPosition = new Vector3();

		// searching for attackers

		this.searchAttacker = false;
		this.attackDirection = new Vector3();
		this.endTimeSearch = Infinity;
		this.searchTime = CONFIG.BOT.SEARCH_FOR_ATTACKER_TIME;

		// death animation

		this.endTimeDying = Infinity;
		this.dyingTime = CONFIG.BOT.DYING_TIME;

		// head

		this.head = new GameEntity();
		this.head.position.y = CONFIG.BOT.HEAD_HEIGHT;
		this.add( this.head );

		// the weapons are attached to the following container entity

		this.weaponContainer = new GameEntity();
		this.head.add( this.weaponContainer );

		// bounds

		this.bounds = new CharacterBounds( this );

		// animation

		this.mixer = null;
		this.animations = new Map();

		// navigation path

		this.path = null;

		// goal-driven agent design

		this.brain = new Think( this );
		this.brain.addEvaluator( new AttackEvaluator() );
		this.brain.addEvaluator( new ExploreEvaluator() );
		this.brain.addEvaluator( new GetHealthEvaluator() );

		this.goalArbitrationRegulator = new Regulator( CONFIG.BOT.GOAL.UPDATE_FREQUENCY );

		// memory

		this.memorySystem = new MemorySystem();
		this.memorySystem.memorySpan = CONFIG.BOT.MEMORY.SPAN;
		this.memoryRecords = new Array();

		// steering

		const followPathBehavior = new FollowPathBehavior();
		followPathBehavior.active = false;
		followPathBehavior.nextWaypointDistance = CONFIG.BOT.NAVIGATION.NEXT_WAYPOINT_DISTANCE;
		followPathBehavior._arrive.deceleration = CONFIG.BOT.NAVIGATION.ARRIVE_DECELERATION;
		this.steering.add( followPathBehavior );

		const onPathBehavior = new OnPathBehavior();
		onPathBehavior.active = false;
		onPathBehavior.path = followPathBehavior.path;
		onPathBehavior.radius = CONFIG.BOT.NAVIGATION.PATH_RADIUS;
		onPathBehavior.weight = CONFIG.BOT.NAVIGATION.ONPATH_WEIGHT;
		this.steering.add( onPathBehavior );

		const seekBehavior = new SeekBehavior();
		seekBehavior.active = false;
		this.steering.add( seekBehavior );

		// vision

		this.vision = new Vision( this.head );
		this.visionRegulator = new Regulator( CONFIG.BOT.VISION.UPDATE_FREQUENCY );

		// target system

		this.targetSystem = new TargetSystem( this );
		this.targetSystemRegulator = new Regulator( CONFIG.BOT.TARGET_SYSTEM.UPDATE_FREQUENCY );

		// weapon system

		this.weaponSystem = new WeaponSystem( this );
		this.weaponSelectionRegulator = new Regulator( CONFIG.BOT.WEAPON.UPDATE_FREQUENCY );

		// debug

		this.pathHelper = null;
		this.hitboxHelper = null;

	}

	/**
	* Executed when this game entity is updated for the first time by its entity manager.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	start() {

		const run = this.animations.get( 'soldier_forward' );
		run.enabled = true;

		const level = this.manager.getEntityByName( 'level' );
		this.vision.addObstacle( level );

		this.bounds.init();
		this.weaponSystem.init();

		return this;

	}

	/**
	* Updates the internal state of this game entity.
	*
	* @param {Number} delta - The time delta.
	* @return {Enemy} A reference to this game entity.
	*/
	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

		// ensure the enemy never leaves the level

		this.stayInLevel();

		// only update the core logic of the enemy if it is alive

		if ( this.status === STATUS_ALIVE ) {

			// update hitbox

			this.bounds.update();

			// update perception

			if ( this.visionRegulator.ready() ) {

				this.updateVision();

			}

			// update memory system

			this.memorySystem.getValidMemoryRecords( this.currentTime, this.memoryRecords );

			// update target system

			if ( this.targetSystemRegulator.ready() ) {

				this.targetSystem.update();

			}

			// update goals

			this.brain.execute();

			if ( this.goalArbitrationRegulator.ready() ) {

				this.brain.arbitrate();

			}

			// update weapon selection

			if ( this.weaponSelectionRegulator.ready() ) {

				this.weaponSystem.selectBestWeapon();

			}

			// stop search for attacker if necessary

			if ( this.currentTime >= this.endTimeSearch ) {

				this.resetSearch();

			}

			// updating the weapon system means updating the aiming and shooting.
			// so this call will change the actual heading/orientation of the enemy

			this.weaponSystem.update( delta );

		}

		// handle dying

		if ( this.status === STATUS_DYING ) {

			if ( this.currentTime >= this.endTimeDying ) {

				this.status = STATUS_DEAD;
				this.endTimeDying = Infinity;

			}

		}

		// handle death

		if ( this.status === STATUS_DEAD ) {

			if ( this.world.debug ) {

				console.log( 'DIVE.Enemy: Enemy with ID %s died.', this.uuid );

			}

			this.world.spawningManager.respawnCompetitor( this );
			this.reset();

		}

		// always update animations

		this.updateAnimations( delta );

		return this;

	}

	/**
	* Ensures the enemy never leaves the level.
	*
	* @return {Enemy} A reference to this game entity.
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

	/**
	* Updates the vision component of this game entity and stores
	* the result in the respective memory system.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	updateVision() {

		const memorySystem = this.memorySystem;
		const vision = this.vision;

		const competitors = this.world.competitors;

		for ( let i = 0, l = competitors.length; i < l; i ++ ) {

			const competitor = competitors[ i ];

			// ignore own entity and consider only living enemies

			if ( competitor === this || competitor.status !== STATUS_ALIVE ) continue;

			if ( memorySystem.hasRecord( competitor ) === false ) {

				memorySystem.createRecord( competitor );

			}

			const record = memorySystem.getRecord( competitor );

			competitor.head.getWorldPosition( worldPosition );

			if ( vision.visible( worldPosition ) === true && competitor.active ) {

				record.timeLastSensed = this.currentTime;
				record.lastSensedPosition.copy( competitor.position ); // it's intended to use the body's position here
				if ( record.visible === false ) record.timeBecameVisible = this.currentTime;
				record.visible = true;

			} else {

				record.visible = false;

			}

		}

		return this;

	}

	/**
	* Updates the animations of this game entity.
	*
	* @param {Number} delta - The time delta.
	* @return {Enemy} A reference to this game entity.
	*/
	updateAnimations( delta ) {

		if ( this.status === STATUS_ALIVE ) {

			// directions

			this.getDirection( lookDirection );
			moveDirection.copy( this.velocity ).normalize();

			// rotation

			quaternion.lookAt( this.forward, moveDirection, this.up );

			// calculate weightings for movement animations

			positiveWeightings.length = 0;
			let sum = 0;

			for ( let i = 0, l = directions.length; i < l; i ++ ) {

				transformedDirection.copy( directions[ i ].direction ).applyRotation( quaternion );
				const dot = transformedDirection.dot( lookDirection );
				weightings[ i ] = ( dot < 0 ) ? 0 : dot;
				const animation = this.animations.get( directions[ i ].name );

				if ( weightings[ i ] > 0.001 ) {

					animation.enabled = true;
					positiveWeightings.push( i );
					sum += weightings[ i ];

				} else {

					animation.enabled = false;
					animation.weight = 0;

				}

			}

			// the weightings for enabled animations have to be calculated in an additional
			// loop since the sum of weightings of all enabled animations has to be 1

			for ( let i = 0, l = positiveWeightings.length; i < l; i ++ ) {

				const index = positiveWeightings[ i ];
				const animation = this.animations.get( directions[ index ].name );
				animation.weight = weightings[ index ] / sum;

				// scale the animtion based on the actual velocity

				animation.timeScale = this.getSpeed() / this.maxSpeed;

			}

		}

		this.mixer.update( delta );

		return this;

	}

	/**
	* Adds the given health points to this entity.
	*
	* @param {Number} amount - The amount of health to add.
	* @return {Enemy} A reference to this game entity.
	*/
	addHealth( amount ) {

		this.health += amount;

		this.health = Math.min( this.health, CONFIG.BOT.MAX_HEALTH ); // ensure that health does not exceed MAX_HEALTH

		if ( this.world.debug ) {

			console.log( 'DIVE.Enemy: Entity with ID %s receives %i health points.', this.uuid, amount );

		}

		return this;

	}

	/**
	* Sets the animations of this game entity by creating a
	* series of animation actions.
	*
	* @param {AnimationMixer} mixer - The animation mixer.
	* @param {Array} clips - An array of animation clips.
	* @return {Enemy} A reference to this game entity.
	*/
	setAnimations( mixer, clips ) {

		this.mixer = mixer;

		// actions

		for ( const clip of clips ) {

			const action = mixer.clipAction( clip );
			action.play();
			action.enabled = false;
			action.name = clip.name;

			this.animations.set( action.name, action );

		}

		return this;

	}

	/**
	* Resets the enemy after a death.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	reset() {

		this.rotation.set( 0, 0, 0, 1 );

		this.health = CONFIG.BOT.MAX_HEALTH;
		this.status = STATUS_ALIVE;

		// reset search for attacker

		this.resetSearch();

		// clear brain and memory

		this.brain.clearSubgoals();

		this.memoryRecords.length = 0;
		this.memorySystem.clear();

		// reset target and weapon system

		this.targetSystem.reset();
		this.weaponSystem.reset();

		// reset all animations

		this.resetAnimations();

		// set default animation

		const run = this.animations.get( 'soldier_forward' );
		run.enabled = true;

		return this;

	}

	/**
	* Resets all animations.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	resetAnimations() {

		for ( let animation of this.animations.values() ) {

			animation.enabled = false;
			animation.time = 0;
			animation.timeScale = 1;

		}

		return this;

	}

	/**
	* Resets the search for an attacker.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	resetSearch() {

		this.searchAttacker = false;
		this.attackDirection.set( 0, 0, 0 );
		this.endTimeSearch = Infinity;

	}

	/**
	* Inits the death of an entity.
	*
	* @return {Enemy} A reference to this game entity.
	*/
	initDeath() {

		this.status = STATUS_DYING;
		this.endTimeDying = this.currentTime + this.dyingTime;

		this.velocity.set( 0, 0, 0 );

		// reset all steering behaviors

		for ( let behavior of this.steering.behaviors ) {

			behavior.active = false;

		}

		// reset all animations

		this.resetAnimations();

		// start death animation

		const index = MathUtils.randInt( 1, 2 );
		const dying = this.animations.get( 'soldier_death' + index );
		dying.enabled = true;

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

		return this.bounds.intersectRay( ray, intersectionPoint );

	}

	/**
	* Returns true if the enemy is at the given target position. The result of the test
	* can be influenced with a configurable tolerance value.
	*
	* @param {Vector3} position - The target position.
	* @return {Boolean} Whether the enemy is at the given target position or not.
	*/
	atPosition( position ) {

		const tolerance = CONFIG.BOT.NAVIGATION.ARRIVE_TOLERANCE * CONFIG.BOT.NAVIGATION.ARRIVE_TOLERANCE;

		const distance = this.position.squaredDistanceTo( position );

		return distance <= tolerance;

	}

	/**
	* Returns true if the enemy can move a step to the given dirction without
	* leaving the level. The new position vector is stored into the given vector.
	*
	* @param {Vector3} direction - The direction vector.
	* @param {Vector3} position - The new position vector.
	* @return {Boolean} Whether the enemy can move a bit to the left or not.
	*/
	canMoveInDirection( direction, position ) {

		position.copy( direction ).applyRotation( this.rotation ).normalize();
		position.multiplyScalar( CONFIG.BOT.MOVEMENT.DODGE_SIZE ).add( this.position );

		const navMesh = this.world.navMesh;
		const region = navMesh.getRegionForPoint( position, 1 );

		return region !== null;

	}

	/**
	* Ensure the enemy only changes it rotation around its y-axis by consider the target
	* in a logical xz-plane which has the same height as the current position.
	* In this way, the enemy never "tilts" its body. Necessary for levels with different heights.
	*
	* @param {Vector3} target - The target position.
	* @param {Number} delta - The time delta.
	* @param {Number} tolerance - A tolerance value in radians to tweak the result
	* when a game entity is considered to face a target.
	* @return {Boolean} Whether the entity is faced to the target or not.
	*/
	rotateTo( target, delta, tolerance ) {

		customTarget.copy( target );
		customTarget.y = this.position.y;

		return super.rotateTo( customTarget, delta, tolerance );

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

				// reduce health

				this.health -= telegram.data.damage;

				// logging

				if ( this.world.debug ) {

					console.log( 'DIVE.Enemy: Enemy with ID %s hit by Game Entity with ID %s receiving %i damage.', this.uuid, telegram.sender.uuid, telegram.data.damage );

				}

				// if the player is the sender and if the enemy still lives, change the style of the crosshairs

				if ( telegram.sender.isPlayer && this.status === STATUS_ALIVE ) {

					this.world.uiManager.showHitIndication();

				}

				// check if the enemy is death

				if ( this.health <= 0 && this.status === STATUS_ALIVE ) {

					this.initDeath();

					// inform all other competitors about its death

					const competitors = this.world.competitors;

					for ( let i = 0, l = competitors.length; i < l; i ++ ) {

						const competitor = competitors[ i ];

						if ( this !== competitor ) this.sendMessage( competitor, MESSAGE_DEAD );

					}

				} else {

					// if not, search for attacker if he is still alive

					if ( telegram.sender.status === STATUS_ALIVE ) {

						this.searchAttacker = true;
						this.endTimeSearch = this.currentTime + this.searchTime; // only search for a specific amount of time
						this.attackDirection.copy( telegram.data.direction ).multiplyScalar( - 1 ); // negate the vector

					}

				}

				break;

			case MESSAGE_DEAD:

				const sender = telegram.sender;
				const memoryRecord = this.memorySystem.getRecord( sender );

				// delete the dead enemy from the memory system when it was visible.
				// also update the target system so the bot looks for a different target

				if ( memoryRecord && memoryRecord.visible ) {

					this.memorySystem.deleteRecord( sender );
					this.targetSystem.update();

				}

				break;

		}

		return true;

	}

}

export { Enemy };
