import { Goal } from '../lib/yuka.module.js';
import { BufferGeometry } from '../lib/three.module.js';
import { CONFIG } from '../core/Config.js';

/**
* Sub-goal for seeking the defined destination point.
*
* @author {@link https://github.com/Mugen87|Mugen87}
* @author {@link https://github.com/robp94|robp94}
*/
class FollowPathGoal extends Goal {

	constructor( owner ) {

		super( owner );

	}

	activate() {

		const owner = this.owner;

		//

		if ( owner.path !== null ) {

			if ( owner.world.debug ) {

				// update path helper

				const pathHelper = owner.pathHelper;

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

		if ( this.active() ) {

			const owner = this.owner;

			const squaredDistance = owner.position.squaredDistanceTo( owner.to );

			const tolerance = CONFIG.BOT.NAVIGATION.ARRIVE_TOLERANCE * CONFIG.BOT.NAVIGATION.ARRIVE_TOLERANCE;

			if ( squaredDistance <= tolerance ) {

				this.status = Goal.STATUS.COMPLETED;

			}

		}

	}

	terminate() {

		const owner = this.owner;

		const followPathBehavior = owner.steering.behaviors[ 0 ];
		followPathBehavior.active = false;
		this.owner.velocity.set( 0, 0, 0 );

	}

}

export { FollowPathGoal };
