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
	constructor() {

		super();

		this.canAcitivateTrigger = false;

		/**
		* The amount of health which the health pack gives when it's collected.
		* @type {Number}
		*/
		this.health = CONFIG.HEALTH_PACK.HEALTH;

		/**
		* The current time.
		* @type {Number}
		*/
		this.currentTime = 0;

		/**
		* The time for the next respawn of this entity.
		* @type {Number}
		*/
		this.nextSpawnTime = Infinity;

	}

	/**
	* Prepares the respawn of this health pack.
	*
	* @return {HealthPack} A reference to this game entity.
	*/
	prepareRespawn() {

		this.active = false;
		this._renderComponent.visible = false;

		this.nextSpawnTime = this.currentTime + CONFIG.HEALTH_PACK.RESPAWN_TIME;

		return this;

	}

	/**
	* Finishes the respawn of this health pack.
	*
	* @return {HealthPack} A reference to this game entity.
	*/
	finishRespawn() {

		this.active = true;
		this._renderComponent.visible = true;

		this.nextSpawnTime = Infinity;

		return this;

	}

}

export { HealthPack };
