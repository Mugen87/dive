/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { MemoryRecord } from '../lib/yuka.module.js';

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

	static printMemoryRecords( enemies ) {

		for ( const enemy of enemies ) {

			const records = [];

			// TODO: gathering memory records for an entity and produce an output at the console

			records.push( new MemoryRecord() );
			records.push( new MemoryRecord() );
			records.push( new MemoryRecord() );

			console.log( 'Memory records for enemy with ID: %s', enemy.uuid );
			console.table( records );

		}

	}

}

function parallelTraverse( a, b, callback ) {

	callback( a, b );

	for ( let i = 0; i < a.children.length; i ++ ) {

		parallelTraverse( a.children[ i ], b.children[ i ], callback );

	}

}

export { SceneUtils };
