/**
 * @author robp94 / https://github.com/robp94
 */
import { Trigger } from '../../lib/yuka.module.js';
import { CONFIG } from '../../core/Config.js';

class HealthGiver extends Trigger {

	constructor( region, healthPack ) {

		super( region );
		this.healthPack = healthPack;

		//debug
		this.regionHelper = null;

	}

	execute( entity ) {

		if ( entity.dontTrigger ) {

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
