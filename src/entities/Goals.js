/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Goal, CompositeGoal, Vector3 } from '../lib/yuka.module.js';
import { NavMeshUtils } from '../etc/NavMeshUtils.js';



const SEEK = 'SEEK';


const WALK = 'WALK';
const IDLE = 'IDLE';


const from = new Vector3();
const to = new Vector3();
let path = null;

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

		this.animationId = null;


	}

	activate() {

		const owner = this.owner;

		// select closest collectible

		const navMesh = this.owner.navMesh;

		from.copy( owner.position );
		to.copy( owner.navMesh.getRandomRegion().centroid );

		path = navMesh.findPath( from, to );

	}

	execute() {

		const owner = this.owner;

		//???
		this.status = Goal.STATUS.COMPLETED;

	}

	terminate() {

		const owner = this.owner;


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

		if ( path !== null ) {

			// update path helper

			const index = owner.index;
			NavMeshUtils.updatePathHelper( path, index );

			// update path and steering

			const followPathBehavior = owner.steering.behaviors[ 0 ];
			followPathBehavior.active = true;
			followPathBehavior.path.clear();

			for ( const point of path ) {

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

		// adjust animation speed based on the actual velocity of the girl


	}

	terminate() {


		const owner = this.owner;

		const followPathBehavior = owner.steering.behaviors[ 0 ];
		followPathBehavior.active = false;
		this.owner.velocity.set( 0, 0, 0 );

		//



	}

}

//

class CompleteGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;


	}

	execute() {

		const owner = this.owner;
		this.status = Goal.STATUS.COMPLETED;

	}

	terminate() {

		const owner = this.owner;



	}

}

export {
	ExploreGoal
};
