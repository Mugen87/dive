import { TaskQueue } from 'yuka';
import { PathPlannerTask } from './PathPlannerTask.js';

/**
* Class for asynchronous path finding using Yuka's task features.
*
* @author {@link https://github.com/robp94|robp94}
*/
class PathPlanner {

	/**
	* Construct a new PathPlanner with the given arguments.
	*
	* @param {NavMesh} navMesh - The navmesh used for path finding.
	*/
	constructor( navMesh ) {

		this.navMesh = navMesh;

		this.taskQueue = new TaskQueue();

	}

	/**
	* Creates a new task for pathfinding and adds the task to the queue.
	*
	* @param {Vehicle} vehicle - The vehicle for which the path is to be found.
	* @param {Vector3} from - The start point of the path.
	* @param {Vector3} to - The target point of the path.
	* @param {Function} callback - The callback which is called after the task is finished.
	*/
	findPath( vehicle, from, to, callback ) {

		const task = new PathPlannerTask( this, vehicle, from, to, callback );

		this.taskQueue.enqueue( task );

	}

	/**
	* Update method of the path planenr.
	*/
	update() {

		this.taskQueue.update();

	}

}

export { PathPlanner };
