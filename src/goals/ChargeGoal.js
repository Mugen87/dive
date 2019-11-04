import { Goal, CompositeGoal, Vector3 } from 'yuka';
import { FollowPathGoal } from './FollowPathGoal.js';
import { FindPathGoal } from './FindPathGoal.js';

/**
* Sub-goal for seeking the enemy's target during a battle.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class ChargeGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		this.clearSubgoals();

		const owner = this.owner;

		// seek to the current position of the target

		const target = owner.targetSystem.getTarget();

		// it's important to use path finding since an enemy might be visible
		// but not directly reachable via a seek behavior because of an obstacle

		const from = new Vector3().copy( owner.position );
		const to = new Vector3().copy( target.position );

		// setup subgoals

		this.addSubgoal( new FindPathGoal( owner, from, to ) );
		this.addSubgoal( new FollowPathGoal( owner ) );

	}

	execute() {

		// stop executing if the traget is not visible anymore

		if ( this.owner.targetSystem.isTargetShootable() === false ) {

			this.status = Goal.STATUS.COMPLETED;

		} else {

			this.status = this.executeSubgoals();

			this.replanIfFailed();

		}

	}

	terminate() {

		this.clearSubgoals();

	}

}

export { ChargeGoal };
