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

		this.clearSubgoals();

		const owner = this.owner;

		// seek to the last sensed position

		const targetPosition = owner.targetSystem.getLastSensedPosition();

		// it's important to use path finding since an enemy might visible
		// but not directly reachable via a seek behavior

		if ( owner.atPosition( targetPosition ) ) {

			// if the enemy is already at the last sensed positition, forget about
			// the bot, update the target system and consider this goal as completed

			const target = owner.targetSystem.getTarget();
			owner.memorySystem.deleteRecord( target );
			owner.targetSystem.update();

			this.status = Goal.STATUS.COMPLETED;

		} else {

			const from = new Vector3().copy( owner.position );
			const to = new Vector3().copy( targetPosition );

			// setup subgoals

			this.addSubgoal( new FindPathGoal( owner, from, to ) );
			this.addSubgoal( new FollowPathGoal( owner ) );

		}

	}

	execute() {

		if ( this.active() ) {

			// hunting is not necessary if the target becomes visible again

			if ( this.owner.targetSystem.isTargetShootable() ) {

				this.status = Goal.STATUS.COMPLETED;

			} else {

				this.status = this.executeSubgoals();

				this.replanIfFailed();

			}

		}

	}

	terminate() {

		this.clearSubgoals();

	}

}

export { HuntGoal };
