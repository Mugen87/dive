import { TaskQueue } from '../lib/yuka.module.js';
import { PathPlannerTask } from './PathPlannerTask.js';

/**
* TODO
*
* @author {@link https://github.com/robp94|robp94}
*/
class PathPlanner {

	/**
	* TODO
	*/
	constructor( navMesh ) {

		this.navMesh = navMesh;

		this.taskQueue = new TaskQueue();

	}

	/**
	* TODO
	*/
	findPath( vehicle, from, to, callback ) {

		const task = new PathPlannerTask( this, vehicle, from, to, callback );

		this.taskQueue.enqueue( task );

	}

	/**
	* TODO
	*/
	update() {

		this.taskQueue.update();

	}

}

export { PathPlanner };
