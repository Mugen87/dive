/**
 * @author Mugen87 / https://github.com/Mugen87
 */

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

}

function parallelTraverse( a, b, callback ) {

	callback( a, b );

	for ( let i = 0; i < a.children.length; i ++ ) {

		parallelTraverse( a.children[ i ], b.children[ i ], callback );

	}

}

export { SceneUtils };
