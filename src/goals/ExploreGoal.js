import { CompositeGoal } from '../lib/yuka.module.js';
import { FollowPathGoal } from './FollowPathGoal.js';
import { FindNextDestinationGoal } from './FindNextDestintationGoal.js';


/**
* Top-Level goal that is used to manage the map exploration
* of the enemy.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class ExploreGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;

		this.addSubgoal( new FindNextDestinationGoal( owner ) );
		this.addSubgoal( new FollowPathGoal( owner ) );

	}

	execute() {

		this.activateIfInactive();

		this.status = this.executeSubgoals();

	}

}

export { ExploreGoal };
