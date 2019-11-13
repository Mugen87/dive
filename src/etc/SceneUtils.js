import { LineSegments, Sprite, SpriteMaterial, LineBasicMaterial, CanvasTexture, BufferGeometry, Float32BufferAttribute } from 'three';
import { Mesh, Group, MeshBasicMaterial, CylinderBufferGeometry, SphereBufferGeometry } from 'three';

/**
* Class with various helper methods.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class SceneUtils {

	/**
	* Clones a skinned mesh. This method is necessary since three.js
	* does not yet support cloning of skinned meshes in the core.
	*
	* @param {SkinnedMesh} source - The skinned mesh to clone.
	* @return {SkinnedMesh} The cloned skinned mesh.
	*/
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

	/**
	* Creates a label that visualizes the UUID of a game entity.
	*
	* @param {String} uuid - The UUID to visualize.
	* @return {Sprite} The label.
	*/
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

	/**
	* Creates a helper that visualizes the hitbox of an enemy.
	*
	* @param {AABB} hitbox - The hitbox to visualize.
	* @return {LineSegments} The helper.
	*/
	static createHitboxHelper( hitbox ) {

		var indices = [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ];
		var positions = [ 1, 1, 1, - 1, 1, 1, - 1, - 1, 1, 1, - 1, 1, 1, 1, - 1, - 1, 1, - 1, - 1, - 1, - 1, 1, - 1, - 1 ];

		var geometry = new BufferGeometry();

		geometry.setIndex( indices );
		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );

		const lines = new LineSegments( geometry, new LineBasicMaterial( { color: 0xffffff } ) );
		lines.matrixAutoUpdate = false;

		hitbox.getCenter( lines.position );
		hitbox.getSize( lines.scale );
		lines.scale.multiplyScalar( 0.5 );
		lines.updateMatrix();

		return lines;

	}

	/**
	 * Creates helper points to visualize the spawning points of the game.
	 *
	 * @param {Array} spawnPoints - An array of spawn points to visualize.
	 * @return {Group} The helper.
	 */
	static createSpawnPointHelper( spawnPoints ) {

		const group = new Group();
		group.matrixAutoUpdate = false;

		const nodeColor = 0xff0000;
		const nodeMaterial = new MeshBasicMaterial( { color: nodeColor } );
		const nodeGeometry = new CylinderBufferGeometry( 0.2, 0.2, 0.5 );
		nodeGeometry.translate( 0, 0.25, 0 );

		for ( let i = 0, l = spawnPoints.length; i < l; i ++ ) {

			const nodeMesh = new Mesh( nodeGeometry, nodeMaterial );
			nodeMesh.position.copy( spawnPoints[ i ].position );

			nodeMesh.matrixAutoUpdate = false;
			nodeMesh.updateMatrix();

			group.add( nodeMesh );

		}

		group.visible = false;

		return group;

	}

	/**
	 * Creates a trigger helper in order to visualize the position and
	 * trigger region.
	 *
	 * @param {Trigger} trigger - The trigger.
	 * @return {Group} The helper.
	 */
	static createTriggerHelper( trigger ) {

		// assuming trigger.region is of type SphericalTriggerRegion

		const triggerGeometry = new SphereBufferGeometry( trigger.region.radius, 16, 16 );
		const triggerMaterial = new MeshBasicMaterial( { color: 0x6083c2, wireframe: true } );

		const triggerMesh = new Mesh( triggerGeometry, triggerMaterial );
		triggerMesh.matrixAutoUpdate = false;
		triggerMesh.visible = false;

		return triggerMesh;

	}

}

//

function parallelTraverse( a, b, callback ) {

	callback( a, b );

	for ( let i = 0; i < a.children.length; i ++ ) {

		parallelTraverse( a.children[ i ], b.children[ i ], callback );

	}

}

export { SceneUtils };
