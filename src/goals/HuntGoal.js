import { Goal, CompositeGoal, Vector3 } from '../lib/yuka.module.js';
import { FollowPathGoal } from './FollowPathGoal.js';
import { FindPathGoal } from './FindPathGoal.js';

/**
* Sub-goal for searching the current target of an enemy.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class HuntGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;

		// seek to the last sensed position

		const targetPosition = owner.targetSystem.getLastSensedPosition();

		// it's important to use path finding since an enemy might visibile
		// but not directly reachable via a seek behavior

		const from = new Vector3().copy( owner.position );
		const to = new Vector3().copy( targetPosition );

		//

		this.addSubgoal( new FindPathGoal( owner, from, to ) );
		this.addSubgoal( new FollowPathGoal( owner ) );

	}

	execute() {

		// hunting is not necessary if the target becomes visible again

		if ( this.owner.targetSystem.isTargetShootable() ) {

			this.status = Goal.STATUS.COMPLETED;

		} else {

			this.status = this.executeSubgoals();

		}

	}

}

export { HuntGoal };
