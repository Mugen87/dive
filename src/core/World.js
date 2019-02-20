/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { EntityManager, Time, GameEntity } from '../lib/yuka.module.js';
import { WebGLRenderer, Scene, PerspectiveCamera, Color, AnimationMixer } from '../lib/three.module.js';
import { HemisphereLight, DirectionalLight } from '../lib/three.module.js';
import { AxesHelper } from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.module.js';

import { AssetManager } from './AssetManager.js';
import { NavMeshUtils } from '../etc/NavMeshUtils.js';
import { SceneUtils } from '../etc/SceneUtils.js';

import { Enemy } from '../entities/Enemy.js';

import * as DAT from '../lib/dat.gui.module.js';

class World {

	constructor() {

		this.entityManager = new EntityManager();
		this.time = new Time();

		this.assetManager = new AssetManager();

		//

		this.renderer = null;
		this.camera = null;
		this.scene = null;
		this.orbitControls = null;

		//

		this.enemyCount = 3;

		//

		this._animate = animate.bind( this );
		this._onWindowResize = onWindowResize.bind( this );

		//

		this.debug = true;

		this.helpers = {
			convexRegionHelper: null,
			axesHelper: null,
			pathHelpers: null
		};

		this.uiParameter = {
			showRegions: true,
			showAxes: true,
			showPaths: true
		};

		this.enemies = new Array();

	}

	init() {

		this.assetManager.init().then( () => {

			this._initScene();
			this._initEnemies();
			this._initGround();
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

		for ( let i = 0; i < enemyCount; i ++ ) {

			const renderComponent = SceneUtils.cloneWithSkinning( this.assetManager.models.get( 'soldier' ) );
			const mixer = new AnimationMixer( renderComponent );

			const enemy = new Enemy( navMesh, mixer, this );
			enemy.setRenderComponent( renderComponent, sync );

			//

			const idleClip = this.assetManager.animations.get( 'soldier_Idle' );
			const idleAction = mixer.clipAction( idleClip );
			idleAction.play();
			idleAction.enabled = false;

			enemy.animations.set( 'idle', idleAction );

			//

			const runClip = this.assetManager.animations.get( 'soldier_Run' );
			const runAction = mixer.clipAction( runClip );
			runAction.play();
			runAction.enabled = false;

			enemy.animations.set( 'run', runAction );

			//

			enemy.position.x = i;

			this.add( enemy );
			this.enemies.push( enemy );
			enemy.index = this.enemies.indexOf( enemy );

		}

	}

	_initGround() {

		const renderComponent = this.assetManager.models.get( 'ground' );

		const ground = new GameEntity();
		ground.setRenderComponent( renderComponent, sync );

		this.add( ground );

	}

	_initNavMesh() {

		const navMesh = this.assetManager.navMesh;

		if ( this.debug ) {

			this.helpers.convexRegionHelper = NavMeshUtils.createConvexRegionHelper( navMesh );
			this.scene.add( this.helpers.convexRegionHelper );

			//

			this.helpers.pathHelpers = new Array();
			NavMeshUtils.pathHelpers = this.helpers.pathHelpers;

			for ( let i = 0; i < this.enemyCount; i ++ ) {

				const pathHelper = NavMeshUtils.createPathHelper();
				this.scene.add( pathHelper );
				this.helpers.pathHelpers.push( pathHelper );

			}

		}

	}

	_initControls() {

		if ( this.debug ) {

			this.orbitControls = new OrbitControls( this.camera, this.renderer.domElement );

		}

	}

	_initUI() {

		if ( this.debug ) {

			const gui = new DAT.GUI();
			const params = this.uiParameter;

			// nav mesh folder

			const folderNavMesh = gui.addFolder( 'Navigation Mesh' );
			folderNavMesh.open();

			folderNavMesh.add( params, 'showRegions' ).name( 'show convex regions' ).onChange( ( value ) => {

				this.helpers.convexRegionHelper.visible = value;

			} );

			folderNavMesh.add( params, 'showPaths', 1, 30 ).name( 'show navigation paths' ).onChange( ( value ) => {

				for ( let i = 0, l = this.helpers.pathHelpers.length; i < l; i ++ ) {

					this.helpers.pathHelpers[ i ].visible = value;

				}

			} );

			// scene folder

			const folderScene = gui.addFolder( 'Scene' );
			folderScene.open();

			folderScene.add( params, 'showAxes' ).name( 'show axes helper' ).onChange( ( value ) => {

				this.helpers.axesHelper.visible = value;

			} );

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

	this.entityManager.update( delta );

	this.renderer.render( this.scene, this.camera );

}

export default World;
