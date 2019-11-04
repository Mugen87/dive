import { Goal, Vector3 } from 'yuka';

/**
* Sub-goal for seeking a target position.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class SeekToPositionGoal extends Goal {

	constructor( owner, target = new Vector3() ) {

		super( owner );

		this.target = target;

	}

	activate() {

		const owner = this.owner;

		const seekBehavior = owner.steering.behaviors[ 2 ];
		seekBehavior.target.copy( this.target );
		seekBehavior.active = true;

	}

	execute() {

		if ( this.owner.atPosition( this.target ) ) {

			this.status = Goal.STATUS.COMPLETED;

		}

	}

	terminate() {

		const seekBehavior = this.owner.steering.behaviors[ 2 ];
		seekBehavior.active = false;

	}

}

export { SeekToPositionGoal };
