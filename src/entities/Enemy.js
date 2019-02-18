/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vehicle } from '../lib/yuka.module.js';

class Enemy extends Vehicle {

	constructor( navMesh, mixer ) {

		super();

		this.navMesh = navMesh;

		this.currentTime = 0;

		this.mixer = mixer;
		this.animations = new Map();

	}

	start() {

		// const idle = this.animations.get( 'idle' );
		// idle.enabled = true;

		const run = this.animations.get( 'run' );
		run.enabled = true;

	}

	update( delta ) {

		this.currentTime += delta;

		this.mixer.update( delta );

	}

}

export { Enemy };
