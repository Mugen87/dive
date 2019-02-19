/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial, Color, Mesh, VertexColors, Line, LineBasicMaterial } from '../lib/three.module.js';
const pathMaterial = new LineBasicMaterial( { color: 0xff0000 } );

class NavMeshUtils {

	static createConvexRegionHelper( navMesh ) {

		const regions = navMesh.regions;

		const geometry = new BufferGeometry();
		const material = new MeshBasicMaterial( { vertexColors: VertexColors, depthWrite: false, polygonOffset: true, polygonOffsetFactor: - 4 } );

		const mesh = new Mesh( geometry, material );

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

	static createPathHelper( visible ) {

		const pathHelper = new Line( new BufferGeometry(), pathMaterial );
		pathHelper.visible = visible;
		return pathHelper;

	}

	static updatePathHelper( path, index ) {

		const pathHelper = NavMeshUtils.pathHelpers[ index ];

		pathHelper.geometry.dispose();
		pathHelper.geometry = new BufferGeometry().setFromPoints( path );

	}

}


export { NavMeshUtils };
