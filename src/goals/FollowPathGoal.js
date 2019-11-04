import { Goal } from 'yuka';
import { BufferGeometry } from 'three';

/**
* Sub-goal for seeking the defined destination point.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class FollowPathGoal extends Goal {

	constructor( owner ) {

		super( owner );

		this.to = null;

	}

	activate() {

		const owner = this.owner;
		const path = owner.path;

		//

		if ( path !== null ) {

			if ( owner.world.debug ) {

				// update path helper

				const pathHelper = owner.pathHelper;

				pathHelper.geometry.dispose();
				pathHelper.geometry = new BufferGeometry().setFromPoints( path );
				pathHelper.visible = owner.world.uiManager.debugParameter.showPaths;

			}

			// update path and steering

			const followPathBehavior = owner.steering.behaviors[ 0 ];
			followPathBehavior.active = true;
			followPathBehavior.path.clear();

			const onPathBehavior = owner.steering.behaviors[ 1 ];
			onPathBehavior.active = true;

			for ( let i = 0, l = path.length; i < l; i ++ ) {

				const waypoint = path[ i ];

				followPathBehavior.path.add( waypoint );

			}

			//

			this.to = path[ path.length - 1 ];


		} else {

			this.status = Goal.STATUS.FAILED;

		}

	}

	execute() {

		if ( this.active() ) {

			const owner = this.owner;

			if ( owner.atPosition( this.to ) ) {

				this.status = Goal.STATUS.COMPLETED;

			}

		}

	}

	terminate() {

		const owner = this.owner;

		const followPathBehavior = owner.steering.behaviors[ 0 ];
		followPathBehavior.active = false;

		const onPathBehavior = owner.steering.behaviors[ 1 ];
		onPathBehavior.active = false;

	}

}

export { FollowPathGoal };
