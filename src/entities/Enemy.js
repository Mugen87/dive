/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Regulator, Think, FollowPathBehavior, Vector3, Vision, MemorySystem, GameEntity, Quaternion } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';
import { CONFIG } from '../core/Config.js';

const displacement = new Vector3();
const targetPosition = new Vector3();
const worldPosition = new Vector3();

const positiveWeightings = new Array();
const weightings = [ 0, 0, 0, 0 ];
const directions = [
	{ direction: new Vector3( 0, 0, 1 ), name: "soldier_forward" },
	{ direction: new Vector3( 0, 0, - 1 ), name: "soldier_backward" },
	{ direction: new Vector3( - 1, 0, 0 ), name: "soldier_left" },
	{ direction: new Vector3( 1, 0, 0 ), name: "soldier_right" }
];
const lookDirection = new Vector3();
const moveDirection = new Vector3();
const quaternion = new Quaternion();
const vector = new Vector3();

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

		//memory
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

		// debug

		this.pathHelper = null;

	}

	start() {

		const run = this.animations.get( 'soldier_forward' );
		run.enabled = true;

		const level = this.manager.getEntityByName( 'level' );
		this.vision.addObstacle( level );

	}

	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

		// update vision

		if ( this.visionRegulator.ready() ) {

			this.updateVision();

		}

		// update memory records

		this.memorySystem.getValidMemoryRecords( this.currentTime, this.memoryRecords );

		//

		this.updateHeading( delta );

		this.updateAnimations();

		// update goals

		this.brain.execute();

		if ( this.goalArbitrationRegulator.ready() ) {

			this.brain.arbitrate();

		}

		// update animations

		const run = this.animations.get( 'soldier_forward' );
		run.timeScale = Math.min( 0.75, this.getSpeed() / this.maxSpeed );

		this.mixer.update( delta );

	}

	updateHeading( delta ) {

		if ( this.memoryRecords.length > 0 ) {

			// TODO: We should pick the target on criterias like distance or health
			// For now, let's use the first entry

			const record = this.memoryRecords[ 0 ];
			const entity = record.entity;

			// if the game entity is visible, directly rotate towards it. Otherwise, focus
			// the last known position

			if ( record.visible === true ) {

				this.rotateTo( entity.position, delta );

			} else {

				// only rotate to the last sensed position if the entity was seen at least once

				if ( record.timeLastSensed !== - 1 ) {

					this.rotateTo( record.lastSensedPosition, delta );

				}

			}

		} else {

			// rotate back to default

			displacement.copy( this.velocity ).normalize();
			targetPosition.copy( this.position ).add( displacement );

			this.rotateTo( targetPosition, delta );

		}

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

	updateAnimations() {

		//directions
		this.getDirection( lookDirection );
		moveDirection.copy( this.velocity ).normalize();

		//rotation
		const localForward = this.forward;
		const localUp = this.up;
		quaternion.lookAt( localForward, moveDirection, localUp );

		// calculate animation weighting for forward
		// at most there can be 2 grater than 0

		positiveWeightings.length = 0;

		for ( let i = 0, l = directions.length; i < l; i ++ ) {

			vector.copy( directions[ i ].direction ).applyRotation( quaternion );
			const dot = vector.dot( lookDirection );
			weightings[ i ] = ( dot < 0 ) ? 0 : dot;
			const animation = this.animations.get( directions[ i ].name );
			if ( weightings[ i ] > 0 ) {

				animation.enabled = true;
				positiveWeightings.push( i );

			} else {

				animation.enabled = false;

			}


		}

		let sum = 0;
		const l = positiveWeightings.length;
		for ( let i = 0; i < l; i ++ ) {

			sum += weightings[ positiveWeightings[ i ] ];

		}

		for ( let i = 0; i < l; i ++ ) {

			const index = positiveWeightings[ i ];
			const animation = this.animations.get( directions[ index ].name );
			animation.weight = weightings[ index ] / sum;

		}

	}

}

export { Enemy };
