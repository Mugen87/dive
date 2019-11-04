import { Goal, CompositeGoal, Vector3 } from 'yuka';
import { HuntGoal } from './HuntGoal.js';
import { DodgeGoal } from './DodgeGoal.js';
import { ChargeGoal } from './ChargeGoal.js';

const left = new Vector3( - 1, 0, 0 );
const right = new Vector3( 1, 0, 0 );
const targetPosition = new Vector3();

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

		// if the enemy is able to shoot the target (there is line of sight between enemy and
		// target), then select a tactic to follow while shooting

		if ( owner.targetSystem.isTargetShootable() === true ) {

			// if the enemy has space to strafe then do so

			if ( owner.canMoveInDirection( left, targetPosition ) ) {

				this.addSubgoal( new DodgeGoal( owner, false ) );

			} else if ( owner.canMoveInDirection( right, targetPosition ) ) {

				this.addSubgoal( new DodgeGoal( owner, true ) );

			} else {

				// if not able to strafe, charge at the target's position

				this.addSubgoal( new ChargeGoal( owner ) );

			}


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

			const currentSubgoal = this.currentSubgoal();
			const status = this.executeSubgoals();

			if ( currentSubgoal instanceof DodgeGoal && currentSubgoal.inactive() ) {

				// inactive dogde goals should be reactivated but without reactivating the enire attack goal

				this.status = Goal.STATUS.ACTIVE;

			} else {

				this.status = status;

				this.replanIfFailed();

			}

		}

	}

	terminate() {

		this.clearSubgoals();

	}

}

export { AttackGoal };
