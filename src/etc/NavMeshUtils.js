import { LineSegments, Line, Mesh, Group } from '../lib/three.module.js';
import { MeshBasicMaterial, LineBasicMaterial } from '../lib/three.module.js';
import { BufferGeometry, Float32BufferAttribute, IcosahedronBufferGeometry } from '../lib/three.module.js';
import { Color, VertexColors } from '../lib/three.module.js';

/**
* Class with various helpers in context of navigation meshes.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class NavMeshUtils {

	/**
	* Creates a helper that visualizes the convex regions of
	* a navigation mesh.
	*
	* @param {NavMesh} navMesh - The nav mesh.
	* @return {Mesh} The helper.
	*/
	static createConvexRegionHelper( navMesh ) {

		const regions = navMesh.regions;

		const geometry = new BufferGeometry();
		const material = new MeshBasicMaterial( { vertexColors: VertexColors, depthWrite: false, polygonOffset: true, polygonOffsetFactor: - 4 } );

		const mesh = new Mesh( geometry, material );
		mesh.matrixAutoUpdate = false;
		mesh.renderOrder = 1;

		const positions = [];
		const colors = [];

		const color = new Color();

		for ( let region of regions ) {

			// one color for each convex region

			color.setHex( Math.random() * 0xffffff );

			// count edges

			let edge = region.edge;
			const edges = [];

			do {

				edges.push( edge );

				edge = edge.next;

			} while ( edge !== region.edge );

			// triangulate

			const triangleCount = ( edges.length - 2 );

			for ( let i = 1, l = triangleCount; i <= l; i ++ ) {

				const v1 = edges[ 0 ].from();
				const v2 = edges[ i + 0 ].from();
				const v3 = edges[ i + 1 ].from();

				positions.push( v1.x, v1.y, v1.z );
				positions.push( v2.x, v2.y, v2.z );
				positions.push( v3.x, v3.y, v3.z );

				colors.push( color.r, color.g, color.b );
				colors.push( color.r, color.g, color.b );
				colors.push( color.r, color.g, color.b );

			}

		}

		geometry.addAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		return mesh;

	}

	/**
	* Creates a helper that visualizes the navigation path of a game entity.
	* Note that the actual geometry is created at a later point since this
	* helper is reused for all paths of a game entity.
	*
	* @return {Line} The helper.
	*/
	static createPathHelper() {

		const pathHelper = new Line( new BufferGeometry(), new LineBasicMaterial( { color: 0xff0000 } ) );
		pathHelper.matrixAutoUpdate = false;
		pathHelper.renderOrder = 3;
		pathHelper.visible = false;
		return pathHelper;

	}

	/**
	* Creates a helper that visualizes the navigation graph of a navigation mesh.
	*
	* @param {Graph} graph - The navigation graph.
	* @param {Number} nodeSize - The size of the visualized nodes.
	* @param {Number} nodeColor - The color of the visualized nodes.
	* @param {Number} edgeColor - The color of the visualized edges.
	* @return {Group} The helper.
	*/
	static createGraphHelper( graph, nodeSize = 1, nodeColor = 0x4e84c4, edgeColor = 0xffffff ) {

		const group = new Group();
		group.renderOrder = 2;

		// nodes

		const nodeMaterial = new MeshBasicMaterial( { color: nodeColor } );
		const nodeGeometry = new IcosahedronBufferGeometry( nodeSize, 2 );

		const nodes = [];

		graph.getNodes( nodes );

		for ( let node of nodes ) {

			const nodeMesh = new Mesh( nodeGeometry, nodeMaterial );
			nodeMesh.renderOrder = 2;
			nodeMesh.position.copy( node.position );
			nodeMesh.userData.nodeIndex = node.index;

			nodeMesh.matrixAutoUpdate = false;
			nodeMesh.updateMatrix();

			group.add( nodeMesh );

		}

		// edges

		const edgesGeometry = new BufferGeometry();
		const position = [];

		const edgesMaterial = new LineBasicMaterial( { color: edgeColor } );

		const edges = [];

		for ( let node of nodes ) {

			graph.getEdgesOfNode( node.index, edges );

			for ( let edge of edges ) {

				const fromNode = graph.getNode( edge.from );
				const toNode = graph.getNode( edge.to );

				position.push( fromNode.position.x, fromNode.position.y, fromNode.position.z );
				position.push( toNode.position.x, toNode.position.y, toNode.position.z );

			}

		}

		edgesGeometry.addAttribute( 'position', new Float32BufferAttribute( position, 3 ) );

		const lines = new LineSegments( edgesGeometry, edgesMaterial );
		lines.renderOrder = 2;
		lines.matrixAutoUpdate = false;

		group.add( lines );

		return group;

	}

}


export { NavMeshUtils };
