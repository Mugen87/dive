import { Trigger } from '../lib/yuka.module.js';
import { CONFIG } from '../core/Config.js';

/**
* Gives an entity health if it touches the trigger region.
*
* @author {@link https://github.com/robp94|robp94}
*/
class HealthGiver extends Trigger {

	/**
	* Constructs a new trigger with the given values.
	*
	* @param {TriggerRegion} region - The region of the trigger.
	* @param {HealthPack} healthPack - The connected healthPack.
	*/
	constructor( region, healthPack ) {

		super( region );

		/**
		* The healthPack of the trigger.
		* @type {HealthPack}
		*/
		this.healthPack = healthPack;

		//debug

		this.regionHelper = null;

	}

	/**
	* This method is called when the trigger should execute its action.
	*
	* @param {GameEntity} entity - The entity that touched the trigger region.
	* @return {Trigger} A reference to this trigger.
	*/
	execute( entity ) {

		if ( entity.isHealthPack ) return this; // TODO: Move this check to EntityManager via GameEntity.canActivateTrigger

		// deactivate trigger since it's only executed once

		this.active = false;

		// add health points to entity

		entity.addHealth( this.healthPack.health );

		// configure health pack

		this.healthPack._renderComponent.visible = false;
		this.healthPack.nextSpawnTime = this.healthPack.currentTime + CONFIG.HEALTHPACK.TIME;

		// debugging

		if ( this.healthPack.world.debug ) {

			console.log( 'DIVE.HealthGiver: Entity with ID %s receives %i health points.', this.uuid, this.healthPack.health );

			this.regionHelper.visible = false;

		}

		return this;

	}

}
export { HealthGiver };
