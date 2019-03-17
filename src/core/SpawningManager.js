import { SphericalTriggerRegion, Vector3 } from '../lib/yuka.module.js';
import { HealthPack } from '../entities/HealthPack.js';
import { HealthGiver } from '../triggers/HealthGiver.js';
import { CONFIG } from './Config.js';
import { SceneUtils } from '../etc/SceneUtils.js';

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

		this.world = world;

		// spawning points

		this.spawningPoints = new Array();
		this.spawningPoints.push( new Vector3( 0, 0, 0 ) );
		this.spawningPoints.push( new Vector3( - 40, 0, 15 ) );
		this.spawningPoints.push( new Vector3( - 30, 0, - 25 ) );

		// health packs

		this.healthPacks = new Array();
		this.healthPackSpawningPoints = new Array();
		this.healthPackSpawningPoints.push( new Vector3( - 40, 0, 0 ) );
		this.healthPackTriggerMap = new Map(); // for mapping healthPack -> trigger

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

		// ensure all world matrices of the competitor are immediately up to date

		competitor.updateWorldMatrix( true, true );

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

	/**
	* Inits the health packs.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	initHealthPacks() {

		for ( let spawningPoint of this.healthPackSpawningPoints ) {

			// health pack entity

			const healthPack = new HealthPack( this.world );
			healthPack.position.copy( spawningPoint );

			const renderComponent = this.world.assetManager.models.get( 'healthPack' ).clone();
			renderComponent.position.copy( healthPack.position );
			healthPack.setRenderComponent( renderComponent, sync );

			this.healthPacks.push( healthPack );
			this.world.add( healthPack );

			// trigger

			const sphericalTriggerRegion = new SphericalTriggerRegion();
			sphericalTriggerRegion.position.copy( spawningPoint );
			sphericalTriggerRegion.radius = CONFIG.HEALTH_PACK.RADIUS;

			const trigger = new HealthGiver( sphericalTriggerRegion, healthPack );
			this.world.entityManager.addTrigger( trigger );
			this.healthPackTriggerMap.set( healthPack, trigger );

			// debugging

			if ( this.world.debug ) {

				const triggerHelper = SceneUtils.createTriggerHelper( trigger );

				this.world.helpers.itemHelpers.push( triggerHelper );
				this.world.scene.add( triggerHelper );

			}

		}

	}

	/**
	* Respawns the given health packs.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	respawnHealthPack( healthPack ) {

		const trigger = this.healthPackTriggerMap.get( healthPack );

		trigger.active = true;

		healthPack._renderComponent.visible = true;

	}

}
export { SpawningManager };

// used to sync Yuka Game Entities with three.js objects

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}
