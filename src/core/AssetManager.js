import { LoadingManager, AnimationLoader, AudioLoader, TextureLoader, Mesh } from '../lib/three.module.js';
import { Sprite, SpriteMaterial, DoubleSide, AudioListener, PositionalAudio } from '../lib/three.module.js';
import { LineSegments, LineBasicMaterial, MeshBasicMaterial, BufferGeometry, Vector3, PlaneBufferGeometry } from '../lib/three.module.js';
import { GLTFLoader } from '../lib/GLTFLoader.module.js';
import { NavMeshLoader } from '../lib/yuka.module.js';
import { CONFIG } from './Config.js';

/**
* Class for representing the global asset manager. It is responsible
* for loading and parsing all assets from the backend and provide
* the result in a series of maps.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class AssetManager {

	/**
	* Constructs a new asset manager with the given values.
	*/
	constructor() {

		this.loadingManager = new LoadingManager();

		this.animationLoader = new AnimationLoader( this.loadingManager );
		this.audioLoader = new AudioLoader( this.loadingManager );
		this.textureLoader = new TextureLoader( this.loadingManager );
		this.gltfLoader = new GLTFLoader( this.loadingManager );
		this.navMeshLoader = new NavMeshLoader();

		this.listener = new AudioListener();

		this.animations = new Map();
		this.audios = new Map();
		this.models = new Map();
		this.textures = new Map();

		this.navMesh = null;

	}

	/**
	* Initializes the asset manager. All assets are prepared so they
	* can be used by the game.
	*
	* @return {Promise} Resolves when all assets are ready.
	*/
	init() {

		this._loadAnimations();
		this._loadAudios();
		this._loadModels();
		this._loadTextures();
		this._loadNavMesh();

		return new Promise( ( resolve ) => {

			this.loadingManager.onLoad = () => {

				resolve();

			};

		} );

	}

	/**
	* Clones the given audio source.
	*
	* @param {PositionalAudio} source - A positional audio.
	* @return {PositionalAudio} A clone of the given audio.
	*/
	cloneAudio( source ) {

		const audio = new source.constructor( source.listener );
		audio.buffer = source.buffer;

		return audio;

	}

	/**
	* Loads all external animations from the backend.
	*
	* @return {AssetManager} A reference to this asset manager.
	*/
	_loadAnimations() {

		const animationLoader = this.animationLoader;

		// player

		animationLoader.load( './animations/player.json', ( clips ) => {

			for ( const clip of clips ) {

				this.animations.set( clip.name, clip );

			}

		} );

		// blaster

		animationLoader.load( './animations/blaster.json', ( clips ) => {

			for ( const clip of clips ) {

				this.animations.set( clip.name, clip );

			}

		} );

		// shotgun

		animationLoader.load( './animations/shotgun.json', ( clips ) => {

			for ( const clip of clips ) {

				this.animations.set( clip.name, clip );

			}

		} );

		// assault rifle

		animationLoader.load( './animations/assaultRifle.json', ( clips ) => {

			for ( const clip of clips ) {

				this.animations.set( clip.name, clip );

			}

		} );

		return this;

	}

	/**
	* Loads all audios from the backend.
	*
	* @return {AssetManager} A reference to this asset manager.
	*/
	_loadAudios() {

		const audioLoader = this.audioLoader;
		const audios = this.audios;
		const listener = this.listener;

		const blasterShot = new PositionalAudio( listener );
		blasterShot.matrixAutoUpdate = false;

		const shotgunShot = new PositionalAudio( listener );
		shotgunShot.matrixAutoUpdate = false;

		const assaultRifleShot = new PositionalAudio( listener );
		assaultRifleShot.matrixAutoUpdate = false;

		const reload = new PositionalAudio( listener );
		reload.matrixAutoUpdate = false;

		const shotgunShotReload = new PositionalAudio( listener );
		shotgunShotReload.matrixAutoUpdate = false;

		const step1 = new PositionalAudio( listener );
		step1.matrixAutoUpdate = false;

		const step2 = new PositionalAudio( listener );
		step2.matrixAutoUpdate = false;

		const impact1 = new PositionalAudio( listener );
		impact1.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact1.matrixAutoUpdate = false;

		const impact2 = new PositionalAudio( listener );
		impact2.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact2.matrixAutoUpdate = false;

		const impact3 = new PositionalAudio( listener );
		impact3.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact3.matrixAutoUpdate = false;

		const impact4 = new PositionalAudio( listener );
		impact4.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact4.matrixAutoUpdate = false;

		const impact5 = new PositionalAudio( listener );
		impact5.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact5.matrixAutoUpdate = false;

		const impact6 = new PositionalAudio( listener );
		impact6.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact6.matrixAutoUpdate = false;

		const impact7 = new PositionalAudio( listener );
		impact7.setVolume( CONFIG.AUDIO.VOLUME_IMPACT );
		impact7.matrixAutoUpdate = false;

		audioLoader.load( './audios/blaster_shot.ogg', buffer => blasterShot.setBuffer( buffer ) );
		audioLoader.load( './audios/shotgun_shot.ogg', buffer => shotgunShot.setBuffer( buffer ) );
		audioLoader.load( './audios/assault_rifle_shot.ogg', buffer => assaultRifleShot.setBuffer( buffer ) );
		audioLoader.load( './audios/reload.ogg', buffer => reload.setBuffer( buffer ) );
		audioLoader.load( './audios/shotgun_shot_reload.ogg', buffer => shotgunShotReload.setBuffer( buffer ) );
		audioLoader.load( './audios/step1.ogg', buffer => step1.setBuffer( buffer ) );
		audioLoader.load( './audios/step2.ogg', buffer => step2.setBuffer( buffer ) );
		audioLoader.load( './audios/impact1.ogg', buffer => impact1.setBuffer( buffer ) );
		audioLoader.load( './audios/impact2.ogg', buffer => impact2.setBuffer( buffer ) );
		audioLoader.load( './audios/impact3.ogg', buffer => impact3.setBuffer( buffer ) );
		audioLoader.load( './audios/impact4.ogg', buffer => impact4.setBuffer( buffer ) );
		audioLoader.load( './audios/impact5.ogg', buffer => impact5.setBuffer( buffer ) );
		audioLoader.load( './audios/impact6.ogg', buffer => impact6.setBuffer( buffer ) );
		audioLoader.load( './audios/impact7.ogg', buffer => impact7.setBuffer( buffer ) );

		audios.set( 'blaster_shot', blasterShot );
		audios.set( 'shotgun_shot', shotgunShot );
		audios.set( 'assault_rifle_shot', assaultRifleShot );
		audios.set( 'reload', reload );
		audios.set( 'shotgun_shot_reload', shotgunShotReload );
		audios.set( 'step1', step1 );
		audios.set( 'step2', step2 );
		audios.set( 'impact1', impact1 );
		audios.set( 'impact2', impact2 );
		audios.set( 'impact3', impact3 );
		audios.set( 'impact4', impact4 );
		audios.set( 'impact5', impact5 );
		audios.set( 'impact6', impact6 );
		audios.set( 'impact7', impact7 );

		return this;

	}

	/**
	* Loads all models from the backend.
	*
	* @return {AssetManager} A reference to this asset manager.
	*/
	_loadModels() {

		const gltfLoader = this.gltfLoader;
		const textureLoader = this.textureLoader;
		const models = this.models;
		const animations = this.animations;

		// shadow for soldiers

		const shadowTexture = textureLoader.load( './textures/shadow.png' );
		const planeGeometry = new PlaneBufferGeometry();
		const planeMaterial = new MeshBasicMaterial( { map: shadowTexture, transparent: true, opacity: 0.4 } );

		const shadowPlane = new Mesh( planeGeometry, planeMaterial );
		shadowPlane.position.set( 0, 0.05, 0 );
		shadowPlane.rotation.set( - Math.PI * 0.5, 0, 0 );
		shadowPlane.scale.multiplyScalar( 2 );
		shadowPlane.matrixAutoUpdate = false;
		shadowPlane.updateMatrix();

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

			renderComponent.add( shadowPlane );

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

		// shotgun

		gltfLoader.load( './models/shotgun.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.matrixAutoUpdate = false;
			renderComponent.updateMatrix();

			renderComponent.traverse( ( object ) => {

				object.matrixAutoUpdate = false;
				object.updateMatrix();

			} );

			models.set( 'shotgun', renderComponent );

		} );

		// assault rifle

		gltfLoader.load( './models/assaultRifle.glb', ( gltf ) => {

			const renderComponent = gltf.scene;
			renderComponent.matrixAutoUpdate = false;
			renderComponent.updateMatrix();

			renderComponent.traverse( ( object ) => {

				object.matrixAutoUpdate = false;
				object.updateMatrix();

			} );

			models.set( 'assault-rifle', renderComponent );

		} );

		// muzzle sprite

		const muzzleTexture = textureLoader.load( './textures/muzzle.png' );
		muzzleTexture.matrixAutoUpdate = false;

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

		return this;

	}

	/**
	* Loads all textures from the backend.
	*
	* @return {AssetManager} A reference to this asset manager.
	*/
	_loadTextures() {

		const textureLoader = this.textureLoader;

		let texture = textureLoader.load( './textures/crosshairs.png' );
		texture.matrixAutoUpdate = false;
		this.textures.set( 'crosshairs', texture );

		texture = textureLoader.load( './textures/damageIndicatorFront.png' );
		texture.matrixAutoUpdate = false;
		this.textures.set( 'damageIndicatorFront', texture );

		texture = textureLoader.load( './textures/damageIndicatorRight.png' );
		texture.matrixAutoUpdate = false;
		this.textures.set( 'damageIndicatorRight', texture );

		texture = textureLoader.load( './textures/damageIndicatorLeft.png' );
		texture.matrixAutoUpdate = false;
		this.textures.set( 'damageIndicatorLeft', texture );

		texture = textureLoader.load( './textures/damageIndicatorBack.png' );
		texture.matrixAutoUpdate = false;
		this.textures.set( 'damageIndicatorBack', texture );

		return this;

	}

	/**
	* Loads the navigation mesh from the backend.
	*
	* @return {AssetManager} A reference to this asset manager.
	*/
	_loadNavMesh() {

		const navMeshLoader = this.navMeshLoader;
		const loadingManager = this.loadingManager;

		loadingManager.itemStart( 'navmesh' );

		navMeshLoader.load( './navmeshes/navmesh.glb' ).then( ( navMesh ) => {

			this.navMesh = navMesh;

			loadingManager.itemEnd( 'navmesh' );

		} );

		return this;

	}

}

export { AssetManager };
