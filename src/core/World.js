/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { EntityManager, Time, MeshGeometry } from '../lib/yuka.module.js';
import { WebGLRenderer, Scene, PerspectiveCamera, Color, AnimationMixer } from '../lib/three.module.js';
import { HemisphereLight, DirectionalLight } from '../lib/three.module.js';
import { AxesHelper } from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.module.js';

import { AssetManager } from './AssetManager.js';
import { NavMeshUtils } from '../etc/NavMeshUtils.js';
import { SceneUtils } from '../etc/SceneUtils.js';
import { Level } from '../entities/Level.js';

import { Enemy } from '../entities/Enemy.js';
import { PathPlanner } from '../etc/PathPlanner.js';

import * as DAT from '../lib/dat.gui.module.js';

class World {

	constructor() {

		this.entityManager = new EntityManager();
		this.time = new Time();

		this.assetManager = new AssetManager();
		this.pathPlanner = null;

		//

		this.renderer = null;
		this.camera = null;
		this.scene = null;
		this.orbitControls = null;

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
			uuidHelpers: new Array()
		};

		this.uiParameter = {
			showRegions: true,
			showAxes: true,
			showPaths: true,
			showGraph: false,
			showUUIDHelpers: false,
			enableSimulation: true,
			printMemoryRecords: () => {

				SceneUtils.printMemoryRecords( this.enemies );

			}
		};

	}

	init() {

		this.assetManager.init().then( () => {

			this._initScene();
			this._initEnemies();
			this._initLevel();
			this._initNavMesh();
			this._initControls();
			this._initUI();

			this._animate();

		} );

	}

	add( entity ) {

		this.entityManager.add( entity );

		if ( entity._renderComponent !== null ) {

			this.scene.add( entity._renderComponent );

		}

	}

	remove( entity ) {

		this.entityManager.remove( entity );

		if ( entity._renderComponent !== null ) {

			this.scene.remove( entity._renderComponent );

		}

	}

	_initScene() {

		// scene

		this.scene = new Scene();
		this.scene.background = new Color( 0xffffff );

		// camera

		this.camera = new PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera.position.set( 0, 10, 15 );
		this.camera.add( this.assetManager.listener );
		this.camera.lookAt( this.scene.position );

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

	}

	_initEnemies() {

		const enemyCount = this.enemyCount;
		const navMesh = this.assetManager.navMesh;

		this.pathPlanner = new PathPlanner( navMesh );

		for ( let i = 0; i < enemyCount; i ++ ) {

			const renderComponent = SceneUtils.cloneWithSkinning( this.assetManager.models.get( 'soldier' ) );

			const enemy = new Enemy();
			enemy.setRenderComponent( renderComponent, sync );

			// set references

			enemy.navMesh = navMesh;
			enemy.world = this;

			// setup animations

			// idle

			const mixer = new AnimationMixer( renderComponent );

			const idleClip = this.assetManager.animations.get( 'soldier_idle' );
			const runForwardClip = this.assetManager.animations.get( 'soldier_forward' );
			const runBackwardClip = this.assetManager.animations.get( 'soldier_backward' );
			const strafeLeftClip = this.assetManager.animations.get( 'soldier_left' );
			const strafeRightClip = this.assetManager.animations.get( 'soldier_right' );

			const clips = [ idleClip, runForwardClip, runBackwardClip, strafeLeftClip, strafeRightClip ];

			enemy.setupAnimations( mixer, clips );

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

	}

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

	}

	_initNavMesh() {

		const navMesh = this.assetManager.navMesh;

		if ( this.debug ) {

			this.helpers.convexRegionHelper = NavMeshUtils.createConvexRegionHelper( navMesh );
			this.scene.add( this.helpers.convexRegionHelper );

			//

			this.helpers.graphHelper = NavMeshUtils.createGraphHelper( navMesh.graph, 0.2 );
			this.helpers.graphHelper.visible = false;
			this.scene.add( this.helpers.graphHelper );

		}

	}

	_initControls() {

		if ( this.debug ) {

			this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );

		}

	}

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

			const folderScene = gui.addFolder( 'World' );
			folderScene.open();

			folderScene.add( params, 'showAxes' ).name( 'show axes helper' ).onChange( ( value ) => {

				this.helpers.axesHelper.visible = value;

			} );

			folderScene.add( params, 'enableSimulation' ).name( 'enable simulation' );

			// enemy folder

			const folderEnemy = gui.addFolder( 'Enemy' );
			folderEnemy.open();

			folderEnemy.add( params, 'showUUIDHelpers', 1, 30 ).name( 'show UUID helpers' ).onChange( ( value ) => {

				for ( const uuidHelper of this.helpers.uuidHelpers ) {

					uuidHelper.visible = value;

				}

			} );

			folderEnemy.add( params, 'printMemoryRecords' ).name( 'print memory records' );

			gui.open();

		}

	}

}

//

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}

function onWindowResize() {

	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( this._animate );

	this.time.update();

	const delta = this.time.getDelta();

	if ( this.debug ) {

		if ( this.uiParameter.enableSimulation ) {

			this.entityManager.update( delta );

			this.pathPlanner.update();

		}

	} else {

		this.entityManager.update( delta );

		this.pathPlanner.update();

	}

	this.renderer.render( this.scene, this.camera );

}

export default World;
