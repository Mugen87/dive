
import { CONFIG } from '../core/Config.js';
import { GameEntity } from '../lib/yuka.module.js';
/**
 * A game entity which represents a health pack.
 * @author robp94 / https://github.com/robp94
 */
class HealthPack extends GameEntity {

	/**
	 * Constructs a new health pack
	 * @param world
	 */
	constructor( world ) {

		super();
		this.world = world; //remove

		/**
		 * The amount of health which the health pack gives when it's collected.
		 * @type {number}
		 */
		this.health = CONFIG.HEALTHPACK.HEALTH;
		/**
		 * THe current time.
		 * @type {number}
		 */
		this.currentTime = 0;
		/**
		 * The time for the next respawn of this entity.
		 * @type {number}
		 */
		this.nextSpawnTime = 0;
		/**
		 * If this entity needs to be respawned.
		 * @type {boolean}
		 */
		this.needsRespawn = true;

		this.dontTrigger = true; //remove after update lib




	}
	/**
	 * Updates the internal state of this game entity. Normally called by {@link EntityManager#update}
	 * in each simulation step.
	 *
	 * @param {Number} delta - The time delta.
	 * @return {GameEntity} A reference to this game entity.
	 */
	update( delta ) {

		this.currentTime += delta;

		if ( ! this.needsRespawn ) {

			if ( this.currentTime >= this.nextSpawnTime ) {

				this.world.spawningManager.respawnHealthPack( this );

			}

		}

	}

}
export { HealthPack };
