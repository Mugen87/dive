import { GoalEvaluator } from '../lib/yuka.module.js';
import { Feature } from '../core/Feature.js';
import { GetItemGoal } from '../goals/GetItemGoal.js';
import { ITEM_HEALTH_PACK } from '../core/Constants.js';

/**
* Class for representing the explore goal.
*
* @author {@link https://github.com/robp94|robp94}
*/
class GetHealthEvaluator extends GoalEvaluator {

	/**
	* Constructs a new get health goal evaluator.
	*
	* @param {Number} characterBias - Can be used to adjust the preferences of the enemy.
	*/
	constructor( characterBias = 1 ) {

		super( characterBias );

	}

	/**
	* Calculates the desirability. It's a score between 0 and 1 representing the desirability
	* of a goal.
	*
	* @param {Enemy} owner - The owner of this goal evaluator.
	* @return {Number} The desirability.
	*/
	calculateDesirability( owner ) {

		const healthScore = 1 - Feature.health( owner );

		// bias the value according to the personality of the bot

		return healthScore * this.characterBias;

	}

	/**
	* Executed if this goal evaluator produces the highest desirability.
	*
	* @param {Enemy} owner - The owner of this goal evaluator.
	*/
	setGoal( owner ) {

		const currentSubgoal = owner.brain.currentSubgoal();

		if ( ( currentSubgoal instanceof GetItemGoal ) === false ) {

			owner.brain.clearSubgoals();

			owner.brain.addSubgoal( new GetItemGoal( owner, ITEM_HEALTH_PACK ) );

		}

	}

}

export { GetHealthEvaluator };
