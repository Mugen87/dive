/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { LoadingManager, AudioLoader, TextureLoader } from '../lib/three.module.js';
import { Sprite, SpriteMaterial, DoubleSide, AudioListener, PositionalAudio } from '../lib/three.module.js';
import { LineSegments, LineBasicMaterial, BufferGeometry, Vector3 } from '../lib/three.module.js';
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

	cloneAudio( source ) {

		const audio = new source.constructor( source.listener );
		audio.buffer = source.buffer;
		audio.setRolloffFactor( source.getRolloffFactor() );
		audio.setVolume( source.getVolume() );

		return audio;

	}

	_loadAudios() {

		const audioLoader = this.audioLoader;
		const audios = this.audios;
		const listener = this.listener;

		const blasterShot = new PositionalAudio( listener );
		blasterShot.setRolloffFactor( 4 );
		blasterShot.setVolume( 0.3 );

		audioLoader.load( './audios/blaster_shot.ogg', buffer => blasterShot.setBuffer( buffer ) );

		audios.set( 'blaster_shot', blasterShot );

	}

	_loadModels() {

		const gltfLoader = this.gltfLoader;
		const textureLoader = this.textureLoader;
		const models = this.models;
		const animations = this.animations;

		// soldier

		gltfLoader.load( './models/soldier.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.animations = gltf.animations;

			renderComponent.matrixAutoUpdate = false;
			renderComponent.updateMatrix();

			renderComponent.traverse( ( object ) => {

				if ( object.isMesh ) {

					object.material.side = DoubleSide;
					object.matrixAutoUpdate = false;
					object.updateMatrix();


				}

			} );

			models.set( 'soldier', renderComponent );

			for ( let animation of gltf.animations ) {

				animations.set( animation.name, animation );

			}

		} );

		// level

		gltfLoader.load( './models/level.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.matrixAutoUpdate = false;
			renderComponent.updateMatrix();

			renderComponent.traverse( ( object ) => {

				object.matrixAutoUpdate = false;
				object.updateMatrix();

			} );

			models.set( 'level', renderComponent );

		} );

		// blaster

		gltfLoader.load( './models/blaster.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.matrixAutoUpdate = false;
			renderComponent.updateMatrix();

			renderComponent.traverse( ( object ) => {

				object.matrixAutoUpdate = false;
				object.updateMatrix();

			} );

			models.set( 'blaster', renderComponent );

		} );

		// muzzle sprite

		const muzzleTexture = textureLoader.load( './textures/muzzle.png' );

		const muzzleMaterial = new SpriteMaterial( { map: muzzleTexture } );
		const muzzle = new Sprite( muzzleMaterial );
		muzzle.matrixAutoUpdate = false;
		muzzle.visible = false;

		models.set( 'muzzle', muzzle );

		// bullet line

		const bulletLineGeometry = new BufferGeometry();
		const bulletLineMaterial = new LineBasicMaterial( { color: 0xfbf8e6 } );

		bulletLineGeometry.setFromPoints( [ new Vector3(), new Vector3( 0, 0, - 1 ) ] );

		const bulletLine = new LineSegments( bulletLineGeometry, bulletLineMaterial );
		bulletLine.matrixAutoUpdate = false;

		models.set( 'bulletLine', bulletLine );

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
