import { TaskQueue } from '../lib/yuka.module.js';
import { PathPlannerTask } from './PathPlannerTask.js';

/**
* Class for asynchronous path finding. Therefore a task queue is used.
*
* @author {@link https://github.com/robp94|robp94}
*/
class PathPlanner {

	/**
	* Construct a new PathPlanner with the given arguments.
	* @param {NavMesh} navMesh - The navmesh used for path finding.
	*/
	constructor( navMesh ) {

		this.navMesh = navMesh;

		this.taskQueue = new TaskQueue();

	}

	/**
	* Creates a new Task for to find a path and adds the task to the queue.
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
	* Update Method which calls the update method of the task queue.
	*/
	update() {

		this.taskQueue.update();

	}

}

export { PathPlanner };
