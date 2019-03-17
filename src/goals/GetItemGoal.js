
import { CompositeGoal, Vector3, Goal } from '../lib/yuka.module.js';
import { FindPathGoal } from './FindPathGoal.js';
import { FollowPathGoal } from './FollowPathGoal.js';

/**
* Goal to get an item of the given item type.
*
* @author {@link https://github.com/robp94|robp94}
*/
class GetItemGoal extends CompositeGoal {

	/**
	* Constructs a new GetItemGoal with the given values.
	*
	* @param owner - The owner of this goal.
	* @param itemType - The type of the item.
	*/
	constructor( owner, itemType ) {

		super( owner );

		this.itemType = itemType;

	}

	activate() {

		const owner = this.owner;

		// if this goal is reactivated then there may be some existing subgoals that must be removed

		this.clearSubgoals();

		const item = owner.world.getClosestItem( owner, this.itemType );

		if ( item ) {

			const from = new Vector3().copy( owner.position );
			const to = new Vector3().copy( item.position );

			// setup subgoals

			this.addSubgoal( new FindPathGoal( owner, from, to ) );
			this.addSubgoal( new FollowPathGoal( owner ) );

		} else {

			this.status = Goal.STATUS.FAILED;

		}

	}

	execute() {

		if ( this.active() ) {

			this.status = this.executeSubgoals();

		}

		this.replanIfFailed();

	}

	terminate() {

		this.clearSubgoals();

	}

}

export { GetItemGoal };
