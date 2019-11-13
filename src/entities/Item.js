import { GameEntity } from 'yuka';

/**
* A game entity which represents a collectable item.
*
* @author {@link https://github.com/robp94|robp94}
*/
class Item extends GameEntity {

	/**
	* Constructs a new item.
	*/
	constructor( itemType, respawnTime ) {

		super();

		this.canActivateTrigger = false;

		this.currentTime = 0;
		this.nextSpawnTime = Infinity;
		this.respawnTime = respawnTime;

		this.type = itemType;

		this.currentRegion = null;

		//

		this._audio = null;

	}

	/**
	* Prepares the respawn of this item.
	*
	* @return {Item} A reference to this game entity.
	*/
	prepareRespawn( ) {

		this.active = false;
		this._renderComponent.visible = false;

		//

		const audio = this.audio;
		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

		//

		this.nextSpawnTime = this.currentTime + this.respawnTime;

		return this;

	}

	/**
	* Finishes the respawn of this item.
	*
	* @return {Item} A reference to this game entity.
	*/
	finishRespawn() {

		this.active = true;
		this._renderComponent.visible = true;

		this.nextSpawnTime = Infinity;

		return this;

	}

	/**
	* Abstract method that has to be implemented by all concrete item types. It is
	* typically executed by a trigger.
	*
	* @param {GameEntity} entity - The entity that receives this item.
	* @return {Item} A reference to this item.
	*/
	addItemToEntity( /* entity */ ) {}

}

export { Item };
