/**
 * @author robp94 / https://github.com/robp94
 */
import { GameEntity } from '../lib/yuka.module.js';

class Level extends GameEntity {

	constructor( geometry ) {

		super();

		this.geometry = geometry;

	}

	handleMessage() {

		// do nothing

		return true;

	}

	lineOfSightTest( ray, intersectionPoint ) {

		return this.geometry.intersectRay( ray, this.worldMatrix, intersectionPoint );

	}

}

export { Level };
