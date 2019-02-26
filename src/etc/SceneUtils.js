/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { LineSegments, Sprite, SpriteMaterial, LineBasicMaterial, CanvasTexture, BufferGeometry, Float32BufferAttribute } from '../lib/three.module.js';

class SceneUtils {

	static cloneWithSkinning( source ) {

		// see https://github.com/mrdoob/three.js/pull/14494

		const cloneLookup = new Map();

		const clone = source.clone();

		parallelTraverse( source, clone, ( sourceNode, clonedNode ) => {

			cloneLookup.set( sourceNode, clonedNode );

		} );

		source.traverse( function ( sourceMesh ) {

			if ( ! sourceMesh.isSkinnedMesh ) return;

			const sourceBones = sourceMesh.skeleton.bones;
			const clonedMesh = cloneLookup.get( sourceMesh );

			clonedMesh.skeleton = sourceMesh.skeleton.clone();

			clonedMesh.skeleton.bones = sourceBones.map( ( sourceBone ) => {

				if ( ! cloneLookup.has( sourceBone ) ) {

					throw new Error( 'SceneUtils: Required bones are not descendants of the given object.' );

				}

				return cloneLookup.get( sourceBone );

			} );

			clonedMesh.bind( clonedMesh.skeleton, sourceMesh.bindMatrix );

		} );

		return clone;

	}

	static createUUIDLabel( uuid ) {

		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );

		canvas.width = 512;
		canvas.height = 64;

		context.fillStyle = '#ee0808';
		context.fillRect( 0, 0, canvas.width, canvas.height );

		context.fillStyle = '#ffffff';
		context.font = '24px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText( uuid, canvas.width / 2, canvas.height / 2 );

		const texture = new CanvasTexture( canvas );
		const material = new SpriteMaterial( { map: texture } );

		const sprite = new Sprite( material );

		sprite.scale.set( 4, 0.5, 1 );

		return sprite;

	}

	static printMemoryRecords( enemies ) {

		for ( const enemy of enemies ) {

			console.log( 'Current memory records for enemy with ID: %s', enemy.uuid );
			console.table( enemy.memoryRecords );

		}

	}

	static createHitboxHelper( hitbox ) {

		var indices = [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ];
		var positions = [ 1, 1, 1, - 1, 1, 1, - 1, - 1, 1, 1, - 1, 1, 1, 1, - 1, - 1, 1, - 1, - 1, - 1, - 1, 1, - 1, - 1 ];

		var geometry = new BufferGeometry();

		geometry.setIndex( indices );
		geometry.addAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );

		const lines = new LineSegments( geometry, new LineBasicMaterial( { color: 0xffffff } ) );
		lines.matrixAutoUpdate = false;

		hitbox.getCenter( lines.position );
		hitbox.getSize( lines.scale );
		lines.scale.multiplyScalar( 0.5 );
		lines.updateMatrix();

		return lines;

	}

}

function parallelTraverse( a, b, callback ) {

	callback( a, b );

	for ( let i = 0; i < a.children.length; i ++ ) {

		parallelTraverse( a.children[ i ], b.children[ i ], callback );

	}

}

export { SceneUtils };
