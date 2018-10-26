/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { GameEntity, EntityManager, Time } from '../lib/yuka.module.js';
import { WebGLRenderer, Scene, PerspectiveCamera, GridHelper } from '../lib/three.module.js';

class World {

	constructor() {

		this.entityManager = null;
		this.time = null;

		//

		this.renderer = null;
		this.camera = null;
		this.scene = null;

		//

		this.animate = animate.bind( this );
		this.onWindowResize = onWindowResize.bind( this );

	}

	init() {

		// game setup

		this.entityManager = new EntityManager();
		this.time = new Time();

		const entity = new GameEntity();
		this.entityManager.add( entity );

		// 3D

		this.scene = new Scene();

		this.camera = new PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
		this.camera.position.set( 0, 10, 15 );
		this.camera.lookAt( this.scene.position );

		const grid = new GridHelper( 10, 25 );
		this.scene.add( grid );

		this.renderer = new WebGLRenderer( { antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( this.renderer.domElement );

		window.addEventListener( 'resize', this.onWindowResize, false );

		this.animate();

	}

}

//

function onWindowResize() {

	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( this.animate );

	this.time.update();

	const delta = this.time.getDelta();

	this.entityManager.update( delta );

	this.renderer.render( this.scene, this.camera );

}

export default World;
