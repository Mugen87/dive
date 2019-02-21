/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Regulator, Think, FollowPathBehavior, Vector3, Vision } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';
import { CONFIG } from '../core/Config.js';

class Enemy extends Vehicle {

	constructor() {

		super();

		this.currentTime = 0;
		this.maxSpeed = 3;

		this.world = null;

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

		// steering

		const followPathBehavior = new FollowPathBehavior();
		followPathBehavior.active = false;
		followPathBehavior.nextWaypointDistance = CONFIG.BOT.NAVIGATION.NEXT_WAYPOINT_DISTANCE;
		followPathBehavior._arrive.deceleration = CONFIG.BOT.NAVIGATION.ARRIVE_DECELERATION;
		this.steering.add( followPathBehavior );

		// vision

		this.vision = new Vision( this );

		this.visionRegulator = new Regulator( CONFIG.BOT.VISION.UPDATE_FREQUENCY );

		// debug

		this.pathHelper = null;

	}

	start() {

		// const idle = this.animations.get( 'idle' );
		// idle.enabled = true;

		const run = this.animations.get( 'run' );
		run.enabled = true;

		const level = this.manager.getEntityByName( 'Level' );
		this.vision.addObstacle( level );

	}

	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

		// update vision

		if ( this.visionRegulator.ready() ) {

			this.updateVision();

		}

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

	updateVision() {

		//const memorySystem = this.memorySystem;
		const vision = this.vision;
		const target = this.target;

		/*if ( memorySystem.hasRecord( target ) === false ) {

			memorySystem.createRecord( target );

		}

		const record = memorySystem.getRecord( target );*/

		const enemies = this.world.enemies;
		const index = enemies.indexOf( this );

		for ( let i = 0, l = enemies.length; i < l; i ++ ) {

			if ( i === index ) {

				continue;

			}
			const enemy = enemies[ i ];

			if ( vision.visible( enemy.position ) === true ) {

				console.log( "Enemy " + index + " sees Enemy " + i );
				/*
				record.timeLastSensed = this.currentTime;
				record.lastSensedPosition.copy( target.position );
				record.visible = true;
	*/

			} else {

				//record.visible = false;

			}

		}


	}

}

export { Enemy };
