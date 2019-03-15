/**
 *
 */
import { Trigger } from '../../lib/yuka.module.js';
import { CONFIG } from '../../core/Config.js';

/**
 * A HealthGiver trigger. Gives an entity health if it touches the trigger region.
 *
 * @author robp94 / https://github.com/robp94
 */
class HealthGiver extends Trigger {

	/**
	 * Constructs a new HealthGiver trigger with the given values.
	 *
	 * @param {TriggerRegion} region - The region of the trigger.
	 * @param {HealthPack} healthPack - The connected healthPack.
	 *
	 */
	constructor( region, healthPack ) {

		super( region );
		/**
		 * The healthPack of the trigger
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

		if ( entity.dontTrigger ) { //todo remove

			return this;

		}

		this.active = false;
		this.healthPack.needsRespawn = false;
		this.healthPack._renderComponent.visible = false;

		this.healthPack.nextSpawnTime = this.healthPack.currentTime + CONFIG.HEALTHPACK.TIME;

		entity.giveHealth( this.healthPack.health );

		if ( this.healthPack.world.debug ) {

			this.regionHelper.visible = false;

		}

		return this;

	}

}
export { HealthGiver };
