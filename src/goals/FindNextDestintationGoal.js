import { Goal } from '../lib/yuka.module.js';

/**
* Sub-goal for finding the next random destintation
* on the map that the enemy is going to seek.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class FindNextDestinationGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;
		const pathPlanner = owner.world.pathPlanner;

		// select closest collectible

		owner.from.copy( owner.position );
		owner.to.copy( owner.navMesh.getRandomRegion().centroid );

		owner.path = null;

		pathPlanner.findPath( owner, owner.from, owner.to, onPathFound );

	}

	execute() {

		const owner = this.owner;

		if ( owner.path ) this.status = Goal.STATUS.COMPLETED;

	}

}

//

function onPathFound( owner, path ) {

	owner.path = path;

}

export { FindNextDestinationGoal };
