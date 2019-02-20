/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Regulator, Think, FollowPathBehavior, Vector3 } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';
import { CONFIG } from '../core/Config.js';

class Enemy extends Vehicle {

	constructor( navMesh, mixer, world ) {

		super();

		this.navMesh = navMesh;

		this.currentTime = 0;
		this.maxSpeed = 3;

		this.mixer = mixer;
		this.animations = new Map();
		this.index = - 1;
		this.path = null;
		this.from = new Vector3();
		this.to = new Vector3();
		this.world = world;

		// goal-driven agent design

		this.brain = new Think( this );
		this.brain.addEvaluator( new ExploreEvaluator() );

		this.goalArbitrationRegulator = new Regulator( CONFIG.BOT.GOAL.ARBITRATION_UPDATE_FREQUENCY );



		this.steering.add( new FollowPathBehavior() );
		this.steering.behaviors[ 0 ].active = false;
		this.steering.behaviors[ 0 ]._arrive.deceleration = 1;
		this.steering.behaviors[ 0 ]._arrive.tolerance = 2;

	}

	start() {

		// const idle = this.animations.get( 'idle' );
		// idle.enabled = true;

		const run = this.animations.get( 'run' );
		run.enabled = true;

	}

	update( delta ) {

		super.update( delta );

		this.currentTime += delta;

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

}

export { Enemy };
