import { MovingEntity, GameEntity, Vector3 } from '../lib/yuka.module.js';
import { CONFIG } from '../core/Config.js';

const startPosition = new Vector3();
const endPosition = new Vector3();

/**
* Class for representing the human player of the game.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Player extends MovingEntity {

	/**
	* Constructs a new player object.
	*/
	constructor() {

		super();

		this.height = CONFIG.PLAYER.HEAD_HEIGHT;
		this.updateOrientation = false;
		this.maxSpeed = CONFIG.PLAYER.MAX_SPEED;

		//

		this.head = new GameEntity();
		this.add( this.head );

		this.world = null;

		this.audios = new Map();

		//

		this.currentRegion = null;

	}

	/**
	* Updates the internal state of this game entity.
	*
	* @param {Number} delta - The time delta.
	* @return {Player} A reference to this game entity.
	*/
	update( delta ) {

		startPosition.copy( this.position );

		super.update( delta );

		endPosition.copy( this.position );

		// ensure the player stays inside its navmesh

		this.currentRegion = this.world.navMesh.clampMovement(
			this.currentRegion,
			startPosition,
			endPosition,
			this.position
		);

	}

}


export { Player };
