import { Vector3 } from '../lib/yuka.module.js';

/**
 * @author robp94 / https://github.com/robp94
 */
class SpawningManager {

	constructor() {

		this.spawningPoints = new Array();
		this.spawningPoints.push( new Vector3( 0, 0, 0 ) );
		this.spawningPoints.push( new Vector3( - 40, 0, 15 ) );

	}


	respawnEnemy( enemy ) {

		const spwanPoint = this.getSpawnPoint( enemy );
		enemy.position.copy( spwanPoint );

	}

	getSpawnPoint( entity ) {

		return this.spawningPoints[ Math.floor( Math.random() * this.spawningPoints.length ) ];

	}

}
export { SpawningManager };
