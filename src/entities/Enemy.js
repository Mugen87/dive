/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle, Think, FollowPathBehavior } from '../lib/yuka.module.js';
import { ExploreEvaluator } from './Evaluators.js';

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
		this.world = world;

		// goal-driven agent design

		this.brain = new Think( this );

		this.brain.addEvaluator( new ExploreEvaluator() );

		const followPath = new FollowPathBehavior();
		followPath.active = false;
		followPath._arrive.deceleration = 1;
		followPath._arrive.tolerance = 2;
		this.steering.add( followPath );

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

		this.brain.execute();

		this.brain.arbitrate();

		this.mixer.update( delta );

	}

}

export { Enemy };
