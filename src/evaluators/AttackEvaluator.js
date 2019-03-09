import { GoalEvaluator } from '../lib/yuka.module.js';
import { AttackGoal } from '../goals/AttackGoal.js';
import { Feature } from '../core/Feature.js';

/**
* Class for representing the attack goal.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class AttackEvaluator extends GoalEvaluator {

	/**
	* Constructs a new attack goal evaluator.
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

		let desirability = 0;

		if ( owner.targetSystem.hasTarget() ) {

			desirability = Feature.totalWeaponStrength( owner ) * Feature.health( owner );

			// bias the value according to the personality of the bot

			desirability *= this.characterBias;

			// TODO: set desirability to 1 for testing

			desirability = 1;

		}

		return desirability;

	}

	/**
	* Executed if this goal evaluator produces the highest desirability.
	*
	* @param {Enemy} owner - The owner of this goal evaluator.
	*/
	setGoal( owner ) {

		const currentSubgoal = owner.brain.currentSubgoal();

		if ( ( currentSubgoal instanceof AttackGoal ) === false ) {

			owner.brain.clearSubgoals();

			owner.brain.addSubgoal( new AttackGoal( owner ) );

		}

	}

}

export { AttackEvaluator };
