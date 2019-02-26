import { GoalEvaluator } from '../lib/yuka.module.js';
import { ExploreGoal } from './Goals.js';

/**
* Class for representing the explore goal.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class ExploreEvaluator extends GoalEvaluator {

	/**
	* Calculates the desirability. It's a score between 0 and 1 representing the desirability
	* of a goal.
	*
	* @param {GameEntity} owner - The owner of this goal evaluator.
	* @return {Number} The desirability.
	*/
	calculateDesirability( /* owner */ ) {

		return 0.5;

	}

	/**
	* Executed if this goal evaluator produces the highest desirability.
	*
	* @param {GameEntity} owner - The owner of this goal evaluator.
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
