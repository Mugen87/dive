import { Goal, CompositeGoal } from '../lib/yuka.module.js';
import { HuntGoal } from './HuntGoal.js';

/**
* Top-Level goal that is used to manage the attack on a target.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class AttackGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		// if this goal is reactivated then there may be some existing subgoals that must be removed

		this.clearSubgoals();

		const owner = this.owner;

		if ( owner.targetSystem.isTargetShootable() === true ) {

			// if the bot is able to shoot the target (there is line of sight between bot and
			// target), then select a tactic to follow while shooting




		} else {

			// if the target is not visible, go hunt it

			this.addSubgoal( new HuntGoal( owner ) );

		}

	}

	execute() {

		// it is possible for a enemy's target to die while this goal is active so we
		// must test to make sure the enemy always has an active target

		const owner = this.owner;

		if ( owner.targetSystem.hasTarget() === false ) {

			this.status = Goal.STATUS.COMPLETED;

		} else {

			if ( this.active() ) {

				this.status = this.executeSubgoals();

				this.replanIfFailed();

			}

		}

	}

}

export { AttackGoal };
