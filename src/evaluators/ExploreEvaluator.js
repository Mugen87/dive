import { GoalEvaluator } from 'yuka';
import { ExploreGoal } from '../goals/ExploreGoal.js';

/**
* Class for representing the explore goal evaluator. Can be used to compute a score that
* represents the desirability of the respective top-level goal.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class ExploreEvaluator extends GoalEvaluator {

	/**
	* Constructs a new explore goal evaluator.
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
	calculateDesirability( /* owner */ ) {

		return 0.1;

	}

	/**
	* Executed if this goal evaluator produces the highest desirability.
	*
	* @param {Enemy} owner - The owner of this goal evaluator.
	*/
	setGoal( owner ) {

		const currentSubgoal = owner.brain.currentSubgoal();

		if ( ( currentSubgoal instanceof ExploreGoal ) === false ) {

			owner.brain.clearSubgoals();

			owner.brain.addSubgoal( new ExploreGoal( owner ) );

		}

	}

}

export { ExploreEvaluator };
