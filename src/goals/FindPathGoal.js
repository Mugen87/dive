import { Goal } from 'yuka';

/**
* Sub-goal for finding the next random location
* on the map that the enemy is going to seek.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class FindPathGoal extends Goal {

	constructor( owner, from, to ) {

		super( owner );

		this.from = from;
		this.to = to;

	}

	activate() {

		const owner = this.owner;
		const pathPlanner = owner.world.pathPlanner;

		owner.path = null; // reset previous path

		// perform async path finding

		pathPlanner.findPath( owner, this.from, this.to, onPathFound );

	}

	execute() {

		const owner = this.owner;

		if ( owner.path ) {

			// when a path was found, mark this goal as completed

			this.status = Goal.STATUS.COMPLETED;


		}

	}

}

//

function onPathFound( owner, path ) {

	owner.path = path;

}

export { FindPathGoal };
