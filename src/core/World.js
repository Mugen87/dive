import { EntityManager, Time, MeshGeometry, Vector3 } from '../lib/yuka.module.js';
import { WebGLRenderer, Scene, PerspectiveCamera, Color, AnimationMixer, AudioContext, Object3D } from '../lib/three.module.js';
import { HemisphereLight, DirectionalLight } from '../lib/three.module.js';
import { AxesHelper } from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.module.js';

import { AssetManager } from './AssetManager.js';
import { NavMeshUtils } from '../etc/NavMeshUtils.js';
import { SceneUtils } from '../etc/SceneUtils.js';
import { Level } from '../entities/Level.js';
import { Enemy } from '../entities/Enemy.js';
import { Player } from '../entities/Player.js';
import { FirstPersonControls } from '../entities/FirstPersonControls.js';

import { Bullet } from '../weapons/Bullet.js';
import { PathPlanner } from '../etc/PathPlanner.js';

import * as DAT from '../lib/dat.gui.module.js';
import { SpawningManager } from './SpawningManager.js';

const currentIntersectionPoint = new Vector3();

/**
* Class for representing the game world. It's the key point where
* the scene and all game entities are created and managed.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class World {

	/**
	* Constructs a new world object.
	*/
	constructor() {

		this.entityManager = new EntityManager();
		this.time = new Time();

		this.assetManager = new AssetManager();
		this.navMesh = null;
		this.pathPlanner = null;
		this.spawningManager = new SpawningManager( this );

		//

		this.renderer = null;
		this.camera = null;
		this.scene = null;
		this.fpsControls = null;
		this.orbitControls = null;
		this.useFPSControls = false;

		//

		this.player = null;

		//

		this.enemyCount = 2;
		this.enemies = new Array();

		//

		this._animate = animate.bind( this );
		this._onWindowResize = onWindowResize.bind( this );

		//

		this.debug = true;

		this.helpers = {
			convexRegionHelper: null,
			axesHelper: null,
			graphHelper: null,
			pathHelpers: new Array(),
			spawnHelpers: new Array(),
			uuidHelpers: new Array(),
			hitboxHelpers: new Array()
		};

		this.uiParameter = {
			showRegions: true,
			showAxes: true,
			showPaths: true,
			showGraph: false,
			showSpawnPoints: false,
			showUUIDHelpers: false,
			showHitboxes: false,
			enableFPSControls: () => {

				this.fpsControls.connect();

			},
			resumeAudioContext: () => {

				const context = AudioContext.getContext();
				context.resume();

			}
		};

	}

	/**
	* Entry point for the game. It initializes the asset manager and then
	* starts to build the game environment.
	*
	* @return {World} A reference to this world object.
	*/
	init() {

		this.assetManager.init().then( () => {

			this._initScene();
			this._initPlayer();
			this._initEnemies();
			this._initLevel();
			this._initNavMesh();
			this._initControls();
			this._initUI();

			this._animate();

		} );

		return this;

	}

	/**
	* Adds the given game entity to the game world. This means it is
	* added to the entity manager and to the scene if it has a render component.
	*
	* @param {GameEntity} entity - The game entity to add.
	* @return {World} A reference to this world object.
	*/
	add( entity ) {

		this.entityManager.add( entity );

		if ( entity._renderComponent !== null ) {

			this.scene.add( entity._renderComponent );

		}

		return this;

	}

	/**
	* Removes the given game entity from the game world. This means it is
	* removed from the entity manager and from the scene if it has a render component.
	*
	* @param {GameEntity} entity - The game entity to remove.
	* @return {World} A reference to this world object.
	*/
	remove( entity ) {

		this.entityManager.remove( entity );

		if ( entity._renderComponent !== null ) {

			this.scene.remove( entity._renderComponent );

		}

		return this;

	}

	/**
	* Adds a bullet to the game world. The bullet is defined by the given
	* parameters and created by the method.
	*
	* @param {GameEntity} owner - The owner of the bullet.
	* @param {Ray} ray - The ray that defines the trajectory of this bullet.
	* @return {World} A reference to this world object.
	*/
	addBullet( owner, ray ) {

		const bulletLine = this.assetManager.models.get( 'bulletLine' ).clone();

		const bullet = new Bullet( owner, ray );
		bullet.setRenderComponent( bulletLine, sync );

		this.add( bullet );

		return this;

	}

	/**
	* The method checks if compatible game entities intersect with a projectile.
	* The closest hitted game entity is returned. If no intersection is detected,
	* null is returned. A possible intersection point is stored into the second parameter.
	*
	* @param {Projectile} projectile - The projectile.
	* @param {Vector3} intersectionPoint - The intersection point.
	* @return {GameEntity} The hitted game entity.
	*/
	checkProjectileIntersection( projectile, intersectionPoint ) {

		const entities = this.entityManager.entities;
		let minDistance = Infinity;
		let hittedEntitiy = null;

		const owner = projectile.owner;
		const ray = projectile.ray;

		for ( let i = 0, l = entities.length; i < l; i ++ ) {

			const entity = entities[ i ];

			// do not test with the owner entity and only process entities with the correct interface

			if ( entity !== owner && entity.checkProjectileIntersection ) {

				if ( entity.checkProjectileIntersection( ray, currentIntersectionPoint ) !== null ) {

					const squaredDistance = currentIntersectionPoint.squaredDistanceTo( ray.origin );

					if ( squaredDistance < minDistance ) {

						minDistance = squaredDistance;
						hittedEntitiy = entity;

						intersectionPoint.copy( currentIntersectionPoint );

					}

				}


			}

		}

		return hittedEntitiy;

	}

	/**
	* Inits all basic objects of the scene like the scene graph itself, the camera, lights
	* or the renderer.
	*
	* @return {World} A reference to this world object.
	*/
	_initScene() {

		// scene

		this.scene = new Scene();
		this.scene.background = new Color( 0xffffff );

		// camera

		this.camera = new PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera.position.set( 0, 10, 15 );
		this.camera.add( this.assetManager.listener );

		// helpers

		if ( this.debug ) {

			this.helpers.axesHelper = new AxesHelper( 5 );
			this.scene.add( this.helpers.axesHelper );

		}

		// lights

		const hemiLight = new HemisphereLight( 0xffffff, 0x444444, 0.4 );
		hemiLight.position.set( 0, 100, 0 );
		this.scene.add( hemiLight );

		const dirLight = new DirectionalLight( 0xffffff, 0.8 );
		dirLight.position.set( 5, 7.5, 0 );
		this.scene.add( dirLight );

		// renderer

		this.renderer = new WebGLRenderer( { antialias: true } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.shadowMap.enabled = true;
		this.renderer.gammaOutput = true;
		this.renderer.gammaFactor = 2.2;
		document.body.appendChild( this.renderer.domElement );

		// event listeners

		window.addEventListener( 'resize', this._onWindowResize, false );

		return this;

	}

	/**
	* Creates a specific amount of enemies.
	*
	* @return {World} A reference to this world object.
	*/
	_initEnemies() {

		const enemyCount = this.enemyCount;
		const navMesh = this.assetManager.navMesh;

		this.pathPlanner = new PathPlanner( navMesh );

		for ( let i = 0; i < enemyCount; i ++ ) {

			const renderComponent = SceneUtils.cloneWithSkinning( this.assetManager.models.get( 'soldier' ) );

			const enemy = new Enemy();
			enemy.setRenderComponent( renderComponent, sync );

			// set references

			enemy.world = this;

			// set animations

			const mixer = new AnimationMixer( renderComponent );

			const idleClip = this.assetManager.animations.get( 'soldier_idle' );
			const runForwardClip = this.assetManager.animations.get( 'soldier_forward' );
			const runBackwardClip = this.assetManager.animations.get( 'soldier_backward' );
			const strafeLeftClip = this.assetManager.animations.get( 'soldier_left' );
			const strafeRightClip = this.assetManager.animations.get( 'soldier_right' );
			const death1Clip = this.assetManager.animations.get( 'soldier_death1' );
			const death2Clip = this.assetManager.animations.get( 'soldier_death2' );

			const clips = [ idleClip, runForwardClip, runBackwardClip, strafeLeftClip, strafeRightClip, death1Clip, death2Clip ];

			enemy.setAnimations( mixer, clips );

			//

			this.add( enemy );
			this.enemies.push( enemy );

			//

			if ( this.debug ) {

				const pathHelper = NavMeshUtils.createPathHelper();
				enemy.pathHelper = pathHelper;

				this.scene.add( pathHelper );
				this.helpers.pathHelpers.push( pathHelper );

				//

				const uuidHelper = SceneUtils.createUUIDLabel( enemy.uuid );
				uuidHelper.position.y = 2;
				uuidHelper.visible = false;

				renderComponent.add( uuidHelper );
				this.helpers.uuidHelpers.push( uuidHelper );

			}

		}

		return this;

	}

	/**
	* Creates the actual level.
	*
	* @return {World} A reference to this world object.
	*/
	_initLevel() {

		const renderComponent = this.assetManager.models.get( 'level' );
		const mesh = renderComponent.getObjectByName( 'level' );

		const vertices = mesh.geometry.attributes.position.array;
		const indices = mesh.geometry.index.array;

		const geometry = new MeshGeometry( vertices, indices );
		const level = new Level( geometry );
		level.name = 'level';
		level.setRenderComponent( renderComponent, sync );

		this.add( level );

		if ( this.debug ) {

			//

			this.helpers.spawnHelpers = SceneUtils.createSpawnPointHelper( this.spawningManager.spawningPoints );
			this.scene.add( this.helpers.spawnHelpers );

		}

		return this;

	}

	/**
	* Creates the player instance.
	*
	* @return {World} A reference to this world object.
	*/
	_initPlayer() {

		const assetManager = this.assetManager;

		this.player = new Player();
		this.player.world = this;

		// render component

		const body = new Object3D(); // dummy 3D object for adding spatial audios
		body.matrixAutoUpdate = false;
		this.player.setRenderComponent( body, sync );

		// audio

		const step1 = assetManager.cloneAudio( assetManager.audios.get( 'step1' ) );
		const step2 = assetManager.cloneAudio( assetManager.audios.get( 'step2' ) );

		step1.setRolloffFactor( 3 );
		step1.setVolume( 0.5 );

		step2.setRolloffFactor( 3 );
		step2.setVolume( 0.5 );

		body.add( step1 );
		body.add( step2 );

		this.player.audios.set( 'step1', step1 );
		this.player.audios.set( 'step2', step2 );

		//

		this.add( this.player );

		return this;

	}

	/**
	* Inits the navigation mesh.
	*
	* @return {World} A reference to this world object.
	*/
	_initNavMesh() {

		this.navMesh = this.assetManager.navMesh;

		if ( this.debug ) {

			this.helpers.convexRegionHelper = NavMeshUtils.createConvexRegionHelper( this.navMesh );
			this.scene.add( this.helpers.convexRegionHelper );

			//

			this.helpers.graphHelper = NavMeshUtils.createGraphHelper( this.navMesh.graph, 0.2 );
			this.helpers.graphHelper.visible = false;
			this.scene.add( this.helpers.graphHelper );

		}

		return this;

	}

	/**
	* Inits the controls used by the player.
	*
	* @return {World} A reference to this world object.
	*/
	_initControls() {

		this.fpsControls = new FirstPersonControls( this.player );

		this.fpsControls.addEventListener( 'lock', ( ) => {

			this.useFPSControls = true;

			this.orbitControls.enabled = false;
			this.camera.matrixAutoUpdate = false;

			this.player.head.setRenderComponent( this.camera, syncCamera );

		} );

		this.fpsControls.addEventListener( 'unlock', () => {

			this.useFPSControls = false;

			this.orbitControls.enabled = true;
			this.camera.matrixAutoUpdate = true;

			this.player.head.setRenderComponent( null, null );

		} );

		//

		if ( this.debug ) {

			this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );

		}

		return this;

	}

	/**
	* Inits the user interface.
	*
	* @return {World} A reference to this world object.
	*/
	_initUI() {

		if ( this.debug ) {

			const gui = new DAT.GUI( { width: 300 } );
			const params = this.uiParameter;

			// nav mesh folder

			const folderNavMesh = gui.addFolder( 'Navigation Mesh' );
			folderNavMesh.open();

			folderNavMesh.add( params, 'showRegions' ).name( 'show convex regions' ).onChange( ( value ) => {

				this.helpers.convexRegionHelper.visible = value;

			} );

			folderNavMesh.add( params, 'showPaths', 1, 30 ).name( 'show navigation paths' ).onChange( ( value ) => {

				for ( const pathHelper of this.helpers.pathHelpers ) {

					pathHelper.visible = value;

				}

			} );

			folderNavMesh.add( params, 'showGraph' ).name( 'show graph' ).onChange( ( value ) => {

				this.helpers.graphHelper.visible = value;

			} );

			// world folder

			const folderWorld = gui.addFolder( 'World' );
			folderWorld.open();

			folderWorld.add( params, 'showAxes' ).name( 'show axes helper' ).onChange( ( value ) => {

				this.helpers.axesHelper.visible = value;

			} );

			folderWorld.add( params, 'showSpawnPoints' ).name( 'show spawn points' ).onChange( ( value ) => {

				this.helpers.spawnHelpers.visible = value;

			} );

			folderWorld.add( params, 'resumeAudioContext' ).name( 'resume audio context ' );
			folderWorld.add( params, 'enableFPSControls' ).name( 'enable FPS controls' );

			// enemy folder

			const folderEnemy = gui.addFolder( 'Enemy' );
			folderEnemy.open();

			folderEnemy.add( params, 'showUUIDHelpers', 1, 30 ).name( 'show UUID helpers' ).onChange( ( value ) => {

				for ( const uuidHelper of this.helpers.uuidHelpers ) {

					uuidHelper.visible = value;

				}

			} );

			folderEnemy.add( params, 'showHitboxes', 1, 30 ).name( 'show hitboxes' ).onChange( ( value ) => {

				for ( const hitboxHelper of this.helpers.hitboxHelpers ) {

					hitboxHelper.visible = value;

				}

			} );

			gui.open();

		}

	}

}

// used to sync Yuka Game Entities with three.js objects

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}

function syncCamera( entity, camera ) {

	camera.matrixWorld.copy( entity.worldMatrix );

}

// used when the browser window is resized

function onWindowResize() {

	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );

}

// game loop

function animate() {

	requestAnimationFrame( this._animate );

	this.time.update();

	const delta = this.time.getDelta();

	if ( this.debug ) {

		if ( this.useFPSControls ) {

			this.fpsControls.update( delta );

		}

	} else {

		this.fpsControls.update( delta );

	}

	this.entityManager.update( delta );

	this.pathPlanner.update();

	this.renderer.render( this.scene, this.camera );

}

export default World;
