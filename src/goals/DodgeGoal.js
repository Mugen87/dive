import { Goal, CompositeGoal } from '../lib/yuka.module.js';

/**
* Sub-goal which makes the enemy dodge from side to side.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class DodgeGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		// TODO

	}

	execute() {

		if ( this.active() ) {

			const owner = this.owner;

			// stop executing if the traget is not visible anymore

			if ( owner.targetSystem.isTargetShootable() === false ) {

				this.status = Goal.STATUS.COMPLETED;

			} else {

				this.status = this.executeSubgoals();

			}

		}

	}

}

export { DodgeGoal };
