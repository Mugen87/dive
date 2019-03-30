import { SphericalTriggerRegion, Vector3 } from '../lib/yuka.module.js';
import { HealthPack } from '../entities/HealthPack.js';
import { ItemGiver } from '../triggers/ItemGiver.js';
import { SceneUtils } from '../etc/SceneUtils.js';
import { HEALTH_PACK, WEAPON_TYPES_ASSAULT_RIFLE, WEAPON_TYPES_BLASTER, WEAPON_TYPES_SHOTGUN } from './Constants.js';
import { WeaponItem } from '../entities/WeaponItem.js';
import { CONFIG } from './Config.js';

/**
* This class is responsible for (re)spawning enemies.
*
* @author {@link https://github.com/robp94|robp94}
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class SpawningManager {

	/**
	* Constructor to create a new SpawningManager.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		this.world = world;

		// spawning points for competitors

		this.spawningPoints = new Array();

		// items

		this.itemTriggerMap = new Map(); // for mapping item -> trigger

		// health packs

		this.healthPacks = new Array();
		this.healthPackSpawningPoints = new Array();

		// weapons

		this.blasters = new Array();
		this.blasterSpawningPoints = new Array();

		this.shotguns = new Array();
		this.shotgunSpawningPoints = new Array();

		this.assaultRilfles = new Array();
		this.assaultRilflesSpawningPoints = new Array();

	}

	/**
	* Update method of this manager. Called per simluation step.
	*
	* @param {Number} delta - The time delta.
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	update( delta ) {

		this.updateItemList( this.healthPacks, delta );
		this.updateItemList( this.blasters, delta );
		this.updateItemList( this.shotguns, delta );
		this.updateItemList( this.assaultRilfles, delta );

		return this;

	}

	/**
	* Updates the given item list.
	*
	* @param {Array} itemsList - A list of items.
	* @param {Number} delta - The time delta.
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	updateItemList( itemsList, delta ) {

		// check if a respawn is necessary

		for ( let i = 0, il = itemsList.length; i < il; i ++ ) {

			const item = itemsList[ i ];

			item.currentTime += delta;

			if ( item.currentTime >= item.nextSpawnTime ) {

				this._respawnItem( item );

			}

		}

		return this;

	}

	/**
	* Returns an array with items of the given type.
	*
	* @param {Number} type - The requested item type.
	* @return {Array} An array with items (game entities).
	*/
	getItemList( type ) {

		let itemList = null;

		switch ( type ) {

			case HEALTH_PACK:
				itemList = this.healthPacks;
				break;

			case WEAPON_TYPES_BLASTER:
				itemList = this.blasters;
				break;

			case WEAPON_TYPES_SHOTGUN:
				itemList = this.shotguns;
				break;

			case WEAPON_TYPES_ASSAULT_RIFLE:
				itemList = this.assaultRilfles;
				break;

			default:
				console.error( 'DIVE.SpawningManager: Invalid item type:', type );
				break;

		}

		return itemList;

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
	* Inits the spawning manager.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	init() {

		this.initSpawningPoints();
		this.initHealthPacks();
		this.initWeapons();

		return this;

	}

	/**
	* Inits the spawning points from the parsed configuration file.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	initSpawningPoints() {

		const levelConfig = this.world.assetManager.configs.get( 'level' );

		for ( const spawningPoint of levelConfig.competitorSpawningPoints ) {

			this.spawningPoints.push( new Vector3().fromArray( spawningPoint ) );

		}

		for ( const spawningPoint of levelConfig.healthPackSpawningPoints ) {

			this.healthPackSpawningPoints.push( new Vector3().fromArray( spawningPoint ) );

		}

		for ( const spawningPoint of levelConfig.shotgunSpawningPoints ) {

			this.shotgunSpawningPoints.push( new Vector3().fromArray( spawningPoint ) );

		}

		for ( const spawningPoint of levelConfig.assaultRilflesSpawningPoints ) {

			this.assaultRilflesSpawningPoints.push( new Vector3().fromArray( spawningPoint ) );

		}

		return this;

	}

	/**
	* Inits the collectable health packs.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	initHealthPacks() {

		const world = this.world;
		const assetManager = world.assetManager;

		for ( let spawningPoint of this.healthPackSpawningPoints ) {

			// health pack entity

			const healthPack = new HealthPack();
			healthPack.position.copy( spawningPoint );

			const renderComponent = world.assetManager.models.get( 'healthPack' ).clone();
			renderComponent.position.copy( healthPack.position );
			healthPack.setRenderComponent( renderComponent, sync );

			this.healthPacks.push( healthPack );
			world.add( healthPack );

			// navigation

			healthPack.currentRegion = world.navMesh.getRegionForPoint( healthPack.position, 1 );

			// audio

			const audio = assetManager.cloneAudio( assetManager.audios.get( 'health' ) );
			healthPack.audio = audio;
			renderComponent.add( audio );

			// trigger

			this.createTrigger( healthPack, CONFIG.HEALTH_PACK.RADIUS );

		}

		return this;

	}

	/**
	* Inits the collectable weapons.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	initWeapons() {

		const world = this.world;
		const assetManager = world.assetManager;

		for ( let spawningPoint of this.blasterSpawningPoints ) {

			// blaster item

			const blasterItem = new WeaponItem( WEAPON_TYPES_BLASTER, CONFIG.BLASTER.RESPAWN_TIME, CONFIG.BLASTER.AMMO );
			blasterItem.position.copy( spawningPoint );

			const renderComponent = assetManager.models.get( 'blasterItem' ).clone();
			renderComponent.position.copy( blasterItem.position );
			blasterItem.setRenderComponent( renderComponent, sync );

			this.blasters.push( blasterItem );
			world.add( blasterItem );

			// navigation

			blasterItem.currentRegion = world.navMesh.getRegionForPoint( blasterItem.position, 1 );

			// audio

			const audio = assetManager.cloneAudio( assetManager.audios.get( 'ammo' ) );
			blasterItem.audio = audio;
			audio.setVolume( 0.5 );
			renderComponent.add( audio );

			// trigger

			this.createTrigger( blasterItem, CONFIG.BLASTER.RADIUS );

		}

		for ( let spawningPoint of this.shotgunSpawningPoints ) {

			// shotgun item

			const shotgunItem = new WeaponItem( WEAPON_TYPES_SHOTGUN, CONFIG.SHOTGUN.RESPAWN_TIME, CONFIG.SHOTGUN.AMMO );
			shotgunItem.position.copy( spawningPoint );

			const renderComponent = assetManager.models.get( 'shotgunItem' ).clone();
			renderComponent.position.copy( shotgunItem.position );
			shotgunItem.setRenderComponent( renderComponent, sync );

			this.shotguns.push( shotgunItem );
			world.add( shotgunItem );

			// navigation

			shotgunItem.currentRegion = world.navMesh.getRegionForPoint( shotgunItem.position, 1 );

			// audio

			const audio = assetManager.cloneAudio( assetManager.audios.get( 'ammo' ) );
			shotgunItem.audio = audio;
			audio.setVolume( 0.5 );
			renderComponent.add( audio );

			// trigger

			this.createTrigger( shotgunItem, CONFIG.SHOTGUN.RADIUS );

		}

		for ( let spawningPoint of this.assaultRilflesSpawningPoints ) {

			// assault rifle item

			const assaultRilfleItem = new WeaponItem( WEAPON_TYPES_ASSAULT_RIFLE, CONFIG.ASSAULT_RIFLE.RESPAWN_TIME, CONFIG.ASSAULT_RIFLE.AMMO );
			assaultRilfleItem.position.copy( spawningPoint );

			const renderComponent = assetManager.models.get( 'assaultRifleItem' ).clone();
			renderComponent.position.copy( assaultRilfleItem.position );
			assaultRilfleItem.setRenderComponent( renderComponent, sync );

			this.assaultRilfles.push( assaultRilfleItem );
			this.world.add( assaultRilfleItem );

			// navigation

			assaultRilfleItem.currentRegion = world.navMesh.getRegionForPoint( assaultRilfleItem.position, 1 );

			// audio

			const audio = assetManager.cloneAudio( assetManager.audios.get( 'ammo' ) );
			audio.setVolume( 0.5 );
			assaultRilfleItem.audio = audio;
			renderComponent.add( audio );

			// trigger

			this.createTrigger( assaultRilfleItem, CONFIG.ASSAULT_RIFLE.RADIUS );

		}

		return this;

	}

	/**
	* Creates a trigger for the given item.
	*
	* @param {Item} item - The collectable item.
	* @param {Number} radius - The radius of the trigger.
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	createTrigger( item, radius ) {

		const sphericalTriggerRegion = new SphericalTriggerRegion();
		sphericalTriggerRegion.position.copy( item.position );
		sphericalTriggerRegion.radius = radius;

		const trigger = new ItemGiver( sphericalTriggerRegion, item );
		this.world.entityManager.addTrigger( trigger );
		this.itemTriggerMap.set( item, trigger );

		// debugging

		if ( this.world.debug ) {

			const triggerHelper = SceneUtils.createTriggerHelper( trigger );

			this.world.helpers.itemHelpers.push( triggerHelper );
			this.world.scene.add( triggerHelper );

		}

		return this;

	}

	/**
	* Respawns the given item.
	*
	* @return {SpawningManager} A reference to this spawning manager.
	*/
	_respawnItem( item ) {

		// reactivate trigger

		const trigger = this.itemTriggerMap.get( item );
		trigger.active = true;

		// reactivate item

		item.finishRespawn();

		return this;

	}

}
export { SpawningManager };

// used to sync Yuka Game Entities with three.js objects

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}
