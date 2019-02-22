/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Regulator, Think, FollowPathBehavior, Vector3, Vision, MemorySystem, GameEntity } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';
import { CONFIG } from '../core/Config.js';

const displacement = new Vector3();
const targetPosition = new Vector3();
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

		// const idle = this.animations.get( 'idle' );
		// idle.enabled = true;

		const run = this.animations.get( 'run' );
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

		// update goals

		this.brain.execute();

		if ( this.goalArbitrationRegulator.ready() ) {

			this.brain.arbitrate();

		}

		// update animations

		const run = this.animations.get( 'run' );
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

}

export { Enemy };
