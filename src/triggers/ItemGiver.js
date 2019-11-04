import { Trigger } from 'yuka';

/**
* Gives an entity an item if it touches the trigger region.
*
* @author {@link https://github.com/robp94|robp94}
*/
class ItemGiver extends Trigger {

	/**
	* Constructs a new trigger with the given values.
	*
	* @param {TriggerRegion} region - The region of the trigger.
	* @param {Item} item - The item.
	*/
	constructor( region, item ) {

		super( region );

		/**
		* The item of the trigger.
		* @type {Item}
		*/
		this.item = item;

	}

	/**
	* This method is called when the trigger should execute its action.
	*
	* @param {GameEntity} entity - The entity that touched the trigger region.
	* @return {Trigger} A reference to this trigger.
	*/
	execute( entity ) {

		const item = this.item;

		// deactivate trigger since it's only executed once

		this.active = false;

		// add item to entity

		item.addItemToEntity( entity );

		// prepare respawn

		item.prepareRespawn();

		return this;

	}

}
export { ItemGiver };
