import { Vector3 } from '../lib/yuka.module.js';

/**
 * The SpawningManager spqans/respawns an entity for example after its death.
 * Therefore it has an array of span points.
 *
 * @author robp94 / https://github.com/robp94
 */
class SpawningManager {

	/**
	 * Constructor to create a new SpawningManager.
	 * @param {World} world - A reference to the world.
	 */
	constructor( world ) {

		this.spawningPoints = new Array();
		this.spawningPoints.push( new Vector3( 0, 0, 0 ) );
		this.spawningPoints.push( new Vector3( - 40, 0, 15 ) );
		this.world = world;

	}


	/**
	 * Respawns the given enemy.
	 *
	 * @param {Enemy} enemy - The enemy to respawn.
	 */
	reSpawnEnemy( enemy ) {

		const spawnPoint = this.getSpawnPoint( enemy );
		enemy.position.copy( spawnPoint );

	}

	/**
	 * Gets a suitable respawn point for the given entity.
	 *
	 * @param {GameEntity} entity - The entity for which a suitable point is searched.
	 * @returns {Vector3}
	 */
	getSpawnPoint( entity ) {

		let largestDistance = 0;
		const spawnPoint = new Vector3().copy( this.spawningPoints[ 0 ] );
		const enemies = this.world.enemies.slice(); //todo entities with player
		enemies.splice( enemies.indexOf( entity, 1 ) );


		for ( let point of this.spawningPoints ) {

			let closestDistance = Infinity;
			for ( let enemy of enemies ) {

				const distance = point.squaredDistanceTo( enemy.position );
				if ( distance < closestDistance ) {

					closestDistance = distance;

				}

			}
			if ( closestDistance > largestDistance ) {

				largestDistance = closestDistance;
				spawnPoint.copy( point );

			}



		}

		return spawnPoint;

	}

}
export { SpawningManager };
