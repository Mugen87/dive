import { SphericalTriggerRegion, Vector3 } from '../lib/yuka.module.js';
import { HealthPack } from '../entities/HealthPack.js';
import { HealthGiver } from '../entities/trigger/HealthGiver.js';
import { CONFIG } from './Config.js';
import {
	Mesh,
	SphereBufferGeometry,
	MeshBasicMaterial,
	BufferGeometry,
	BoxBufferGeometry
} from '../lib/three.module.js';

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

		this.healthPackPoints = new Array();
		this.healthPackPoints.push( new Vector3( - 40, 0, 0 ) );
		this.healthPackMap = new Map();
		this.world = world;

	}

	/**
	* Respawns the given enemy.
	*
	* @param {Enemy} enemy - The enemy to respawn.
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	respawnEnemy( enemy ) {

		const spawnPoint = this.getSpawnPoint( enemy );
		enemy.position.copy( spawnPoint );

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

		const entities = this.world.entityManager.entities;
		const spawningPoints = this.spawningPoints;

		// searching for the spawning point furthest away from an enemy

		for ( let i = 0, il = spawningPoints.length; i < il; i ++ ) {

			const spawningPoint = spawningPoints[ i ];

			let closestDistance = Infinity;

			for ( let j = 0, jl = entities.length; j < jl; j ++ ) {

				const entity = entities[ j ];

				// only consider game entites of type "Enemy"

				if ( entity.isEnemy && entity !== enemy ) {

					const distance = spawningPoint.squaredDistanceTo( entity.position );

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

	/**
	 * Initialize the healthPacks.
	 */
	initHealthPacks() {

		const sphereGeometry = new SphereBufferGeometry( CONFIG.HEALTHPACK.RADIUS, 16, 16 );
		const boxGeometry = new BoxBufferGeometry( 0.5, 2, 0.5, 1, 1, 1 );
		const sphereMaterial = new MeshBasicMaterial( { color: 0x6083c2, wireframe: true } );
		const boxMaterial = new MeshBasicMaterial( { color: 0x00FF00 } );

		for ( let point of this.healthPackPoints ) {

			const healthPack = new HealthPack( this.world );
			healthPack.position.set( point.x, point.y, point.z );

			const sphericalTriggerRegion = new SphericalTriggerRegion();
			sphericalTriggerRegion.position.set( point.x, point.y, point.z );
			sphericalTriggerRegion.radius = CONFIG.HEALTHPACK.RADIUS;



			const trigger = new HealthGiver( sphericalTriggerRegion, healthPack );
			this.world.entityManager.addTrigger( trigger );
			this.healthPackMap.set( healthPack, trigger );

			const triggerMesh = new Mesh( sphereGeometry, sphereMaterial );
			triggerMesh.position.copy( sphericalTriggerRegion.position );
			trigger.regionHelper = triggerMesh;

			const boxMesh = new Mesh( boxGeometry, boxMaterial );
			boxMesh.position.copy( healthPack.position );
			healthPack.setRenderComponent( boxMesh, sync );

			this.world.helpers.itemHelpers.push( triggerMesh );
			this.world.add( healthPack );
			this.world.scene.add( triggerMesh );

		}

	}

	/**
	 * Respawns the given health pack
	 * @param healthPack - The health pack to respawn.
	 */
	respawnHealthPack( healthPack ) {

		const trigger = this.healthPackMap.get( healthPack );
		trigger.active = true;

		if ( this.world.debug && this.world.uiManager.debugParameter.showItemRadius ) {

			trigger.regionHelper.visible = true;

		}

		healthPack.displayed = true;
		healthPack._renderComponent.visible = true;

	}

}
export { SpawningManager };

// used to sync Yuka Game Entities with three.js objects

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}
