
import { CompositeGoal, Vector3, Goal, Regulator } from 'yuka';
import { FindPathGoal } from './FindPathGoal.js';
import { FollowPathGoal } from './FollowPathGoal.js';
import { CONFIG } from '../core/Config.js';

const result = { distance: Infinity, item: null };

/**
* Goal to get an item of the given item type.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class GetItemGoal extends CompositeGoal {

	/**
	* Constructs a new GetItemGoal with the given values.
	*
	* @param owner - The owner of this goal.
	* @param itemType - The type of the item.
	* @param item - The exact item to get.
	*/
	constructor( owner, itemType, item = null ) {

		super( owner );

		this.itemType = itemType;
		this.item = item;

		this.regulator = new Regulator( CONFIG.BOT.GOAL.ITEM_VISIBILITY_UPDATE_FREQUENCY );

	}

	activate() {

		const owner = this.owner;

		// if this goal is reactivated then there may be some existing subgoals that must be removed

		this.clearSubgoals();

		// get closest available item of the given type

		owner.world.getClosestItem( owner, this.itemType, result );

		this.item = result.item;

		if ( this.item ) {

			// if an item was found, try to pick it up

			const from = new Vector3().copy( owner.position );
			const to = new Vector3().copy( this.item.position );

			// setup subgoals

			this.addSubgoal( new FindPathGoal( owner, from, to ) );
			this.addSubgoal( new FollowPathGoal( owner ) );

		} else {

			// if no item was returned, there is nothing to pick up.
			// mark the goal as failed

			this.status = Goal.STATUS.FAILED;

			// ensure the bot does not look for this type of item for a while

			owner.ignoreItem( this.itemType );

		}

	}

	execute() {

		if ( this.active() ) {

			// only check the availability of the item if it is visible for the enemy

			if ( this.regulator.ready() && this.owner.vision.visible( this.item.position ) ) {

				// if it was picked up by somebody else, mark the goal as failed

				if ( this.item.active === false ) {

					this.status = Goal.STATUS.FAILED;

				} else {

					this.status = this.executeSubgoals();

				}

			} else {

				this.status = this.executeSubgoals();

			}

			// replan the goal means the bot tries to find another item of the same type

			this.replanIfFailed();

		}

	}

	terminate() {

		this.clearSubgoals();

	}

}

export { GetItemGoal };
