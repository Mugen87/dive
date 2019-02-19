/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Goal, CompositeGoal, Vector3 } from '../lib/yuka.module.js';
import { BufferGeometry } from '../lib/three.module.js';

const from = new Vector3();
const to = new Vector3();


class ExploreGoal extends CompositeGoal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;

		this.addSubgoal( new FindNextDestinationGoal( owner ) );
		this.addSubgoal( new SeekToDestinationGoal( owner ) );
		this.addSubgoal( new CompleteGoal( owner ) );

	}

	execute() {

		this.activateIfInactive();

		this.status = this.executeSubgoals();

	}

}

//

class FindNextDestinationGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;

		// select closest collectible

		const navMesh = this.owner.navMesh;

		from.copy( owner.position );
		to.copy( owner.navMesh.getRandomRegion().centroid );

		owner.path = navMesh.findPath( from, to );

	}

	execute() {

		//???
		this.status = Goal.STATUS.COMPLETED;

	}

}

//

class SeekToDestinationGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	activate() {




		const owner = this.owner;

		//

		if ( owner.path !== null ) {

			// update path helper
			if ( owner.world.debug ) {

				const index = owner.index;
				const pathHelper = owner.world.helpers.pathHelpers[ index ];

				pathHelper.geometry.dispose();
				pathHelper.geometry = new BufferGeometry().setFromPoints( owner.path );
				pathHelper.visible = owner.world.uiParameter.showPaths;

			}


			// update path and steering

			const followPathBehavior = owner.steering.behaviors[ 0 ];
			followPathBehavior.active = true;
			followPathBehavior.path.clear();

			for ( const point of owner.path ) {

				followPathBehavior.path.add( point );

			}

		} else {

			this.status = Goal.STATUS.FAILED;

		}

	}

	execute() {

		const owner = this.owner;

		const squaredDistance = owner.position.squaredDistanceTo( to );

		if ( squaredDistance < 0.25 ) {

			this.status = Goal.STATUS.COMPLETED;

		}

	}

	terminate() {

		const owner = this.owner;

		const followPathBehavior = owner.steering.behaviors[ 0 ];
		followPathBehavior.active = false;
		this.owner.velocity.set( 0, 0, 0 );

	}

}

//

class CompleteGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	execute() {

		this.status = Goal.STATUS.COMPLETED;

	}

}

export { ExploreGoal };
