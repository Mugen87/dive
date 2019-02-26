/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Regulator, Think, FollowPathBehavior, Vector3, Vision, MemorySystem, GameEntity, Quaternion, AABB } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';
import { WeaponSystem } from './WeaponSystem.js';
import { TargetSystem } from './TargetSystem.js';
import { CONFIG } from '../core/Config.js';

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

class Enemy extends Vehicle {

	constructor() {

		super();

		this.currentTime = 0;
		this.maxSpeed = CONFIG.BOT.MOVEMENT.MAXSPEED;
		this.updateOrientation = false;

		this.world = null;

		// head

		this.head = new GameEntity();
		this.head.position.y = CONFIG.BOT.HEAD.HEIGHT;
		this.add( this.head );

		// hitbox

		this.defaultHitbox = new AABB( new Vector3( - 0.4, 0, - 0.4 ), new Vector3( 0.4, 1.8, 0.4 ) );
		this.currentHitbox = new AABB();

		// animation

		this.mixer = null;
		this.animations = new Map();

		// navigation

		this.navMesh = null;
		this.path = null;
		this.from = new Vector3();
		this.to = new Vector3();

		// goal-driven agent design

		this.brain = new Think( this );
		this.brain.addEvaluator( new ExploreEvaluator() );

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

	start() {

		const run = this.animations.get( 'soldier_forward' );
		run.enabled = true;

		const level = this.manager.getEntityByName( 'level' );
		this.vision.addObstacle( level );

		this.weaponSystem.init();

	}

	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

		// update hitbox

		this.currentHitbox.copy( this.defaultHitbox ).applyMatrix4( this.worldMatrix );

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

		// update weapon system

		if ( this.weaponSelectionRegulator.ready() ) {

			this.weaponSystem.selectBestWeapon();

		}

		// try to aim and shoot at a target

		this.weaponSystem.aimAndShoot( delta );

		// update animations

		this.updateAnimations( delta );

	}

	updateVision() {

		const memorySystem = this.memorySystem;
		const vision = this.vision;

		const enemies = this.world.enemies;

		for ( let i = 0, l = enemies.length; i < l; i ++ ) {

			const enemy = enemies[ i ];

			if ( enemy === this ) continue;

			if ( memorySystem.hasRecord( enemy ) === false ) {

				memorySystem.createRecord( enemy );

			}

			const record = memorySystem.getRecord( enemy );

			enemy.head.getWorldPosition( worldPosition );

			if ( vision.visible( worldPosition ) === true ) {

				record.timeLastSensed = this.currentTime;
				record.lastSensedPosition.copy( enemy.position ); // it's intended to use the body's position here
				record.visible = true;

			} else {

				record.visible = false;

			}

		}

	}

	updateAnimations( delta ) {

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

		this.mixer.update( delta );

	}

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

	}

	checkProjectileIntersection( ray, intersectionPoint ) {

		return ray.intersectAABB( this.currentHitbox, intersectionPoint );

	}

	handleMessage( telegram ) {

		if ( this.world.debug === true ) {

			console.log( 'DIVE.Enemy: Enemy with ID %s hit by Game Entity with ID %s receiving %i damage.', this.uuid, telegram.sender.uuid, telegram.data.damage );

		}

		return true;

	}

}

export { Enemy };
