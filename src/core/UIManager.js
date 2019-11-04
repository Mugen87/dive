import { AudioContext, OrthographicCamera, Scene, Sprite, SpriteMaterial } from 'three';
import { CONFIG } from './Config.js';
import * as DAT from 'dat.gui';

const PI25 = Math.PI * 0.25;
const PI75 = Math.PI * 0.75;

/**
* Used to manage the state of the user interface.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class UIManager {

	/**
	* Constructs a new UI manager with the given values.
	*
	* @param {World} world - A reference to the world.
	*/
	constructor( world ) {

		this.world = world;
		this.currentTime = 0;

		this.hitIndicationTime = CONFIG.UI.CROSSHAIRS.HIT_TIME;
		this.endTimeHitIndication = Infinity;

		this.damageIndicationTime = CONFIG.UI.DAMAGE_INDICATOR.TIME;
		this.endTimeDamageIndicationFront = Infinity;
		this.endTimeDamageIndicationRight = Infinity;
		this.endTimeDamageIndicationLeft = Infinity;
		this.endTimeDamageIndicationBack = Infinity;
		this.fragMessages = new Array();

		this.html = {
			loadingScreen: document.getElementById( 'loadingScreen' ),
			hudAmmo: document.getElementById( 'hudAmmo' ),
			hudHealth: document.getElementById( 'hudHealth' ),
			roundsLeft: document.getElementById( 'roundsLeft' ),
			ammo: document.getElementById( 'ammo' ),
			health: document.getElementById( 'health' ),
			hudFragList: document.getElementById( 'hudFragList' ),
			fragList: document.getElementById( 'fragList' ),
		};

		this.sprites = {
			crosshairs: null,
			frontIndicator: null,
			rightIndicator: null,
			leftIndicator: null,
			backIndicator: null
		};

		// for rendering HUD sprites

		const width = window.innerWidth;
		const height = window.innerHeight;

		this.camera = new OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
		this.camera.position.z = 10;

		this.scene = new Scene();

		// debugging

		this.datGui = null;

		this.debugParameter = {
			showRegions: false,
			showAxes: false,
			showPaths: false,
			showGraph: false,
			showSpawnPoints: false,
			showUUIDHelpers: false,
			showSkeletons: false,
			showItemRadius: false,
			showWireframe: false,
			showSpatialIndex: false,
			enableFPSControls: () => {

				this.world.fpsControls.connect();

			},
			resumeAudioContext: () => {

				const context = AudioContext.getContext();
				context.resume();

			}
		};

	}

	/**
	* Initializes the UI manager.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	init() {

		this._buildFPSInterface();

		//

		const world = this.world;

		if ( world.debug ) {

			const gui = new DAT.GUI( { width: 300 } );
			const params = this.debugParameter;

			// nav mesh folder

			const folderNavMesh = gui.addFolder( 'Navigation Mesh' );
			folderNavMesh.open();

			folderNavMesh.add( params, 'showRegions' ).name( 'show convex regions' ).onChange( ( value ) => {

				world.helpers.convexRegionHelper.visible = value;

			} );

			folderNavMesh.add( params, 'showSpatialIndex', 1, 30 ).name( 'show spatial index' ).onChange( ( value ) => {

				world.helpers.spatialIndexHelper.visible = value;

			} );

			folderNavMesh.add( params, 'showPaths', 1, 30 ).name( 'show navigation paths' ).onChange( ( value ) => {

				for ( const pathHelper of world.helpers.pathHelpers ) {

					pathHelper.visible = value;

				}

			} );

			folderNavMesh.add( params, 'showGraph' ).name( 'show graph' ).onChange( ( value ) => {

				world.helpers.graphHelper.visible = value;

			} );

			// world folder

			const folderWorld = gui.addFolder( 'World' );
			folderWorld.open();

			folderWorld.add( params, 'showAxes' ).name( 'show axes helper' ).onChange( ( value ) => {

				world.helpers.axesHelper.visible = value;

			} );

			folderWorld.add( params, 'showSpawnPoints' ).name( 'show spawn points' ).onChange( ( value ) => {

				world.helpers.spawnHelpers.visible = value;

			} );

			folderWorld.add( params, 'showItemRadius' ).name( 'show item radius' ).onChange( ( value ) => {

				for ( const itemHelper of world.helpers.itemHelpers ) {

					itemHelper.visible = value;

				}

			} );

			folderWorld.add( params, 'showWireframe' ).name( 'show wireframe' ).onChange( ( value ) => {

				const levelMesh = this.world.scene.getObjectByName( 'level' );
				levelMesh.material.wireframe = value;

			} );

			folderWorld.add( params, 'resumeAudioContext' ).name( 'resume audio context ' );
			folderWorld.add( params, 'enableFPSControls' ).name( 'enable FPS controls' );

			// enemy folder

			const folderEnemy = gui.addFolder( 'Enemy' );
			folderEnemy.open();

			folderEnemy.add( params, 'showUUIDHelpers', 1, 30 ).name( 'show UUID helpers' ).onChange( ( value ) => {

				for ( const uuidHelper of world.helpers.uuidHelpers ) {

					uuidHelper.visible = value;

				}

			} );

			folderEnemy.add( params, 'showSkeletons', 1, 30 ).name( 'show skeletons' ).onChange( ( value ) => {

				for ( const skeletonHelper of world.helpers.skeletonHelpers ) {

					skeletonHelper.visible = value;

				}

			} );

			gui.open();

			this.datGui = gui;

		}

		// ensure to completely remove the loading screen from the DOM when it is not visible anymore

		this.html.loadingScreen.addEventListener( 'transitionend', ( event ) => {

			event.target.remove();
			this.html.loadingScreen = null;

		} );

		return this;

	}

	/**
	* Update method of this manager. Called each simulation step.
	*
	* @param {Number} delta - The time delta.
	* @return {UIManager} A reference to this UI manager.
	*/
	update( delta ) {

		this.currentTime += delta;

		if ( this.currentTime >= this.endTimeHitIndication ) {

			this.hideHitIndication();

		}

		// damage indicators

		if ( this.currentTime >= this.endTimeDamageIndicationFront ) {

			this.sprites.frontIndicator.visible = false;

		}

		if ( this.currentTime >= this.endTimeDamageIndicationRight ) {

			this.sprites.rightIndicator.visible = false;

		}

		if ( this.currentTime >= this.endTimeDamageIndicationLeft ) {

			this.sprites.leftIndicator.visible = false;

		}

		if ( this.currentTime >= this.endTimeDamageIndicationBack ) {

			this.sprites.backIndicator.visible = false;

		}

		// frag list

		this._updateFragList();

		// render UI

		this._render();

		return this;

	}

	/**
	* Changes the style of the crosshairs in order to show a
	* sucessfull hit.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	showHitIndication() {

		this.sprites.crosshairs.material.color.set( 0xff0000 );
		this.endTimeHitIndication = this.currentTime + this.hitIndicationTime;

		return this;

	}

	/**
	* Removes the hit indication of the crosshairs in order to show its
	* default state.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	hideHitIndication() {

		this.sprites.crosshairs.material.color.set( 0xffffff );
		this.endTimeHitIndication = Infinity;

		return this;

	}

	/**
	* Shows radial elements around the crosshairs to visualize the attack direction
	* for a certain amount of time.
	*
	* @param {Number} angle - The angle that determines the radial element.
	* @return {UIManager} A reference to this UI manager.
	*/
	showDamageIndication( angle ) {

		if ( angle >= - PI25 && angle <= PI25 ) {

			this.sprites.frontIndicator.visible = true;
			this.endTimeDamageIndicationFront = this.currentTime + this.damageIndicationTime;

		} else if ( angle > PI25 && angle <= PI75 ) {

			this.sprites.rightIndicator.visible = true;
			this.endTimeDamageIndicationRight = this.currentTime + this.damageIndicationTime;

		} else if ( angle >= - PI75 && angle < - PI25 ) {

			this.sprites.leftIndicator.visible = true;
			this.endTimeDamageIndicationLeft = this.currentTime + this.damageIndicationTime;

		} else {

			this.sprites.backIndicator.visible = true;
			this.endTimeDamageIndicationBack = this.currentTime + this.damageIndicationTime;

		}

		return this;

	}

	/**
	* Shows the FPS interface.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	showFPSInterface() {

		this.sprites.crosshairs.visible = true;

		this.html.hudAmmo.classList.remove( 'hidden' );
		this.html.hudHealth.classList.remove( 'hidden' );

		this.updateAmmoStatus();
		this.updateHealthStatus();

		return this;

	}

	/**
	* Hides the FPS interface.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	hideFPSInterface() {

		this.html.hudAmmo.classList.add( 'hidden' );
		this.html.hudHealth.classList.add( 'hidden' );

		this.sprites.crosshairs.visible = false;
		this.sprites.frontIndicator.visible = false;
		this.sprites.rightIndicator.visible = false;
		this.sprites.leftIndicator.visible = false;
		this.sprites.backIndicator.visible = false;

		return this;

	}

	/**
	* Removes the loading screen. After removing, the loading screen can not
	* be restored anymore. So it's only allowed to call this method once.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	removeLoadingScreen() {

		if ( this.html.loadingScreen !== null ) {

			this.html.loadingScreen.classList.add( 'fade-out' );

		}

		return this;

	}

	/**
	* Sets the size of the UI manager.
	*
	* @param {Number} width - The width in pixels.
	* @param {Number} height - The height in pixels.
	* @return {UIManager} A reference to this UI manager.
	*/
	setSize( width, height ) {

		this.camera.left = - width / 2;
		this.camera.right = width / 2;
		this.camera.top = height / 2;
		this.camera.bottom = - height / 2;
		this.camera.updateProjectionMatrix();

		return this;

	}

	/**
	 * Updates the UI element that displays the frags.
	 *
	 * @return {UIManager} A reference to this UI manager.
	 */
	_updateFragList() {

		const fragMessages = this.fragMessages;

		// check for expired messages (new messages are at the end of the array)

		for ( let i = ( fragMessages.length - 1 ); i >= 0; i -- ) {

			const message = fragMessages[ i ];

			if ( this.currentTime >= message.endTime ) {

				fragMessages.splice( i, 1 );

				// remove the visual representation of the frag message

				const fragList = this.html.fragList;
				fragList.removeChild( message.html );

			}

		}

		// hide html element if there are no elements

		if ( fragMessages.length === 0 ) {

			this.html.hudFragList.classList.add( 'hidden' );

		}

		return this;

	}

	/**
	 * Adds a kill message to the kill message display.
	 * @param {GameEntity} fragger - The fragger.
	 * @param {GameEntity} victim - The defeated game entity.
	 * @return {UIManager} A reference to this UI manager.
	 */
	addFragMessage( fragger, victim ) {

		// make the list visible

		this.html.hudFragList.classList.remove( 'hidden' );

		// create the frag message

		const string = fragger.name + ' fragged ' + victim.name;

		const fraggerSpan = document.createElement( 'span' );
		fraggerSpan.style.color = '#00ff00';
		fraggerSpan.textContent = fragger.name;

		const middleSpan = document.createElement( 'span' );
		middleSpan.textContent = ' fragged ';

		const victimSpan = document.createElement( 'span' );
		victimSpan.style.color = '#ff0000';
		victimSpan.textContent = victim.name;

		// create the respective HTML

		const frag = document.createElement( 'li' );
		frag.appendChild( fraggerSpan );
		frag.appendChild( middleSpan );
		frag.appendChild( victimSpan );

		// save everything in a new message object

		const fragMessage = {
			text: string,
			endTime: this.currentTime + CONFIG.UI.FRAGS.TIME,
			html: frag
		};

		this.fragMessages.push( fragMessage );

		// append the HTML to the list

		const fragList = this.html.fragList;
		fragList.appendChild( frag );

		return this;

	}

	/**
	* Updates the UI with current ammo data.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	updateAmmoStatus() {

		const player = this.world.player;
		const weapon = player.weaponSystem.currentWeapon;

		this.html.roundsLeft.textContent = weapon.roundsLeft;
		this.html.ammo.textContent = weapon.ammo;

		return this;

	}

	/**
	* Updates the UI with current health data.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	updateHealthStatus() {

		const player = this.world.player;

		this.html.health.textContent = player.health;

		return this;

	}

	/**
	* Opens the debug interface.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	openDebugUI() {

		this.datGui.open();

		return this;

	}

	/**
	* Closes the debug interface.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	closeDebugUI() {

		this.datGui.close();

		return this;

	}

	/**
	* Creates the UI-elements for the FPS view.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	_buildFPSInterface() {

		// crosshairs

		const crosshairsTexture = this.world.assetManager.textures.get( 'crosshairs' );
		const crosshairsMaterial = new SpriteMaterial( { map: crosshairsTexture, opacity: CONFIG.UI.CROSSHAIRS.OPACITY } );

		const crosshairs = new Sprite( crosshairsMaterial );
		crosshairs.matrixAutoUpdate = false;
		crosshairs.visible = false;
		crosshairs.position.set( 0, 0, 1 );
		crosshairs.scale.set( CONFIG.UI.CROSSHAIRS.SCALE, CONFIG.UI.CROSSHAIRS.SCALE, 1 );
		crosshairs.updateMatrix();
		this.scene.add( crosshairs );

		this.sprites.crosshairs = crosshairs;

		// damage indication

		// front

		const frontIndicatorTexture = this.world.assetManager.textures.get( 'damageIndicatorFront' );
		const frontIndicatorMaterial = new SpriteMaterial( { map: frontIndicatorTexture, opacity: CONFIG.UI.DAMAGE_INDICATOR.OPACITY } );

		const frontIndicator = new Sprite( frontIndicatorMaterial );
		frontIndicator.matrixAutoUpdate = false;
		frontIndicator.visible = false;
		frontIndicator.position.set( 0, 0, 1 );
		frontIndicator.scale.set( CONFIG.UI.DAMAGE_INDICATOR.SCALE, CONFIG.UI.DAMAGE_INDICATOR.SCALE, 1 );
		frontIndicator.updateMatrix();
		this.scene.add( frontIndicator );

		this.sprites.frontIndicator = frontIndicator;

		// right

		const rigthIndicatorTexture = this.world.assetManager.textures.get( 'damageIndicatorRight' );
		const rightIndicatorMaterial = new SpriteMaterial( { map: rigthIndicatorTexture, opacity: CONFIG.UI.DAMAGE_INDICATOR.OPACITY } );

		const rightIndicator = new Sprite( rightIndicatorMaterial );
		rightIndicator.matrixAutoUpdate = false;
		rightIndicator.visible = false;
		rightIndicator.position.set( 0, 0, 1 );
		rightIndicator.scale.set( CONFIG.UI.DAMAGE_INDICATOR.SCALE, CONFIG.UI.DAMAGE_INDICATOR.SCALE, 1 );
		rightIndicator.updateMatrix();
		this.scene.add( rightIndicator );

		this.sprites.rightIndicator = rightIndicator;

		// left

		const leftIndicatorTexture = this.world.assetManager.textures.get( 'damageIndicatorLeft' );
		const leftIndicatorMaterial = new SpriteMaterial( { map: leftIndicatorTexture, opacity: CONFIG.UI.DAMAGE_INDICATOR.OPACITY } );

		const leftIndicator = new Sprite( leftIndicatorMaterial );
		leftIndicator.matrixAutoUpdate = false;
		leftIndicator.visible = false;
		leftIndicator.position.set( 0, 0, 1 );
		leftIndicator.scale.set( CONFIG.UI.DAMAGE_INDICATOR.SCALE, CONFIG.UI.DAMAGE_INDICATOR.SCALE, 1 );
		leftIndicator.updateMatrix();
		this.scene.add( leftIndicator );

		this.sprites.leftIndicator = leftIndicator;

		// right

		const backIndicatorTexture = this.world.assetManager.textures.get( 'damageIndicatorBack' );
		const backIndicatorMaterial = new SpriteMaterial( { map: backIndicatorTexture, opacity: CONFIG.UI.DAMAGE_INDICATOR.OPACITY } );

		const backIndicator = new Sprite( backIndicatorMaterial );
		backIndicator.matrixAutoUpdate = false;
		backIndicator.visible = false;
		backIndicator.position.set( 0, 0, 1 );
		backIndicator.scale.set( CONFIG.UI.DAMAGE_INDICATOR.SCALE, CONFIG.UI.DAMAGE_INDICATOR.SCALE, 1 );
		backIndicator.updateMatrix();
		this.scene.add( backIndicator );

		this.sprites.backIndicator = backIndicator;

		return this;

	}

	/**
	* Renders the HUD sprites. This is done after rendering the actual 3D scene.
	*
	* @return {UIManager} A reference to this UI manager.
	*/
	_render() {

		this.world.renderer.clearDepth();

		this.world.renderer.render( this.scene, this.camera );

		return this;

	}

}

export { UIManager };
