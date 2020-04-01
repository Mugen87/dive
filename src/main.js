/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import world from './core/World.js';

const startButton = document.getElementById( 'start' );
startButton.addEventListener( 'click', () => {

	const startScreen = document.getElementById( 'startScreen' );
	startScreen.remove();

	world.init();

} );
