import { Vector3 } from '../lib/yuka.module.js';

/**
* This class is responsible for (re)spawning enemies.
*
* @author {@link https://github.com/robp94|robp94}
*/
class SpawningManager {

	/**
	* Constructor to create a new SpawningManager.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		this.spawningPoints = new Array();
		this.spawningPoints.push( new Vector3( 0, 0, 0 ) );
		this.spawningPoints.push( new Vector3( - 40, 0, 15 ) );
		this.spawningPoints.push( new Vector3( - 30, 0, - 25 ) );
		this.world = world;

	}

	/**
	* Respawns the given competitor.
	*
	* @param {GameEntity} competitor - The entity to respawn.
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	respawnCompetitor( competitor ) {

		const spawnPoint = this.getSpawnPoint( competitor );
		competitor.position.copy( spawnPoint );

		return this;

	}

	/**
	 * Gets a suitable respawn point for the given enemy.
	 *
	 * @param {Enemy} enemy - The enemy for which a suitable point is searched.
	 * @returns {Vector3} The spawning point.
	 */
	getSpawnPoint( enemy ) {

		let maxDistance = - Infinity;

		let bestSpawningPoint = this.spawningPoints[ 0 ];

		const competitors = this.world.competitors;
		const spawningPoints = this.spawningPoints;

		// searching for the spawning point furthest away from an enemy

		for ( let i = 0, il = spawningPoints.length; i < il; i ++ ) {

			const spawningPoint = spawningPoints[ i ];

			let closestDistance = Infinity;

			for ( let j = 0, jl = competitors.length; j < jl; j ++ ) {

				const competitor = competitors[ j ];

				if ( competitor !== enemy ) {

					const distance = spawningPoint.squaredDistanceTo( competitor.position );

					if ( distance < closestDistance ) {

						closestDistance = distance;

					}

				}

			}

			if ( closestDistance > maxDistance ) {

				maxDistance = closestDistance;
				bestSpawningPoint = spawningPoint;

			}

		}

		return bestSpawningPoint;

	}

}
export { SpawningManager };
