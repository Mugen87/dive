/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { GoalEvaluator } from '../lib/yuka.module.js';

import { ExploreGoal } from './Goals.js';



class ExploreEvaluator extends GoalEvaluator {

	calculateDesirability() {

		return 0.5;

	}

	setGoal( enemy ) {

		const currentSubgoal = enemy.brain.currentSubgoal();

		if ( ( currentSubgoal instanceof ExploreGoal ) === false ) {

			enemy.brain.clearSubgoals();

			enemy.brain.addSubgoal( new ExploreGoal( enemy) );

		}

	}

}

export {
	ExploreEvaluator
};
