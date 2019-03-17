import { CONFIG } from '../core/Config.js';
import { GameEntity } from '../lib/yuka.module.js';

/**
* A game entity which represents a health pack.
*
* @author {@link https://github.com/robp94|robp94}
*/
class HealthPack extends GameEntity {

	/**
	* Constructs a new health pack.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		super();

		this.world = world; //remove

		/**
		* The amount of health which the health pack gives when it's collected.
		* @type {Number}
		*/
		this.health = CONFIG.HEALTHPACK.HEALTH;

		/**
		* THe current time.
		* @type {Number}
		*/
		this.currentTime = 0;

		/**
		* The time for the next respawn of this entity.
		* @type {Number}
		*/
		this.nextSpawnTime = 0;

		/**
		* Whether the entity needs a respawn or not.
		* @type {Boolean}
		*/
		this.needsRespawn = true;

		// TODO: remove after update lib

		this._dontTrigger = true;

	}

	/**
	* Updates the internal state of this game entity. Normally called by {@link EntityManager#update}
	* in each simulation step.
	*
	* @param {Number} delta - The time delta.
	* @return {HealthPack} A reference to this game entity.
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
