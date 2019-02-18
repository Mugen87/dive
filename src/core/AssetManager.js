/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { LoadingManager, AudioLoader, AudioListener, TextureLoader, DoubleSide } from '../lib/three.module.js';
import { GLTFLoader } from '../lib/GLTFLoader.module.js';
import { NavMeshLoader } from '../lib/yuka.module.js';

class AssetManager {

	constructor() {

		this.loadingManager = new LoadingManager();

		this.audioLoader = new AudioLoader( this.loadingManager );
		this.textureLoader = new TextureLoader( this.loadingManager );
		this.gltfLoader = new GLTFLoader( this.loadingManager );
		this.navMeshLoader = new NavMeshLoader();

		this.listener = new AudioListener();

		this.animations = new Map();
		this.audios = new Map();
		this.models = new Map();

		this.navMesh = null;

	}

	init() {

		this._loadAudios();
		this._loadModels();
		this._loadNavMesh();

		const loadingManager = this.loadingManager;

		return new Promise( ( resolve ) => {

			loadingManager.onLoad = () => {

				resolve();

			};

		} );

	}

	_loadAudios() {

	}

	_loadModels() {

		const gltfLoader = this.gltfLoader;
		const models = this.models;
		const animations = this.animations;

		// soldier

		gltfLoader.load( './models/soldier.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.animations = gltf.animations;

			renderComponent.updateMatrixWorld();
			renderComponent.matrixAutoUpdate = false;

			renderComponent.traverse( ( object ) => {

				if ( object.isMesh ) {

					object.material.side = DoubleSide;
					object.matrixAutoUpdate = false;


				}

			} );

			models.set( 'soldier', renderComponent );

			for ( let animation of gltf.animations ) {

				animations.set( animation.name, animation );

			}

		} );

		// ground

		gltfLoader.load( './models/ground.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.updateMatrixWorld();
			renderComponent.matrixAutoUpdate = false;

			renderComponent.traverse( ( object ) => {

				object.matrixAutoUpdate = false;

			} );

			models.set( 'ground', renderComponent );

		} );

	}

	_loadNavMesh() {

		const navMeshLoader = this.navMeshLoader;
		const loadingManager = this.loadingManager;

		loadingManager.itemStart( 'navmesh' );

		navMeshLoader.load( './navmeshes/navmesh.glb' ).then( ( navMesh ) => {

			this.navMesh = navMesh;

			loadingManager.itemEnd( 'navmesh' );

		} );

	}

}

export { AssetManager };
