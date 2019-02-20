/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, Color, VertexColors, LineBasicMaterial, Group, IcosahedronBufferGeometry } from '../lib/three.module.js';
import { LineSegments, Line, Mesh } from '../lib/three.module.js';

class NavMeshUtils {

	static createConvexRegionHelper( navMesh ) {

		const regions = navMesh.regions;

		const geometry = new BufferGeometry();
		const material = new MeshBasicMaterial( { vertexColors: VertexColors, depthWrite: false, polygonOffset: true, polygonOffsetFactor: - 4 } );

		const mesh = new Mesh( geometry, material );
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

	static createPathHelper( ) {

		const pathHelper = new Line( new BufferGeometry(), new LineBasicMaterial( { color: 0xff0000 } ) );
		pathHelper.renderOrder = 2;
		pathHelper.visible = false;
		return pathHelper;

	}

	static createGraphHelper( graph, nodeSize = 1, nodeColor = 0x4e84c4, edgeColor = 0xffffff ) {

		const group = new Group();
		group.renderOrder = 3;

		// nodes

		const nodeMaterial = new MeshBasicMaterial( { color: nodeColor } );
		const nodeGeometry = new IcosahedronBufferGeometry( nodeSize, 2 );

		const nodes = [];

		graph.getNodes( nodes );

		for ( let node of nodes ) {

			const nodeMesh = new Mesh( nodeGeometry, nodeMaterial );
			nodeMesh.renderOrder = 3;
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
		lines.renderOrder = 3;
		lines.matrixAutoUpdate = false;

		group.add( lines );

		return group;

	}

}


export { NavMeshUtils };
