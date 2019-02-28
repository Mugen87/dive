import { Task } from '../lib/yuka.module.js';

/**
* Class to represent an actual PathPlannerTask.
* It runs the actual path finding.
*
* @author {@link https://github.com/robp94|robp94}
*/
class PathPlannerTask extends Task {

	/**
	* Construct a new PathPlannerTask with the given arguments.
	* @param {PathPlanner} planner - The path planner which created this task.
	* @param {Vehicle} vehicle - The vehicle for which the path is to be found.
	* @param {Vector3} from - The start point of the path.
	* @param {Vector3} to - The target point of the path.
	* @param {Function} callback - The callback which is called after the task is finished.
	*/
	constructor( planner, vehicle, from, to, callback ) {

		super();

		this.callback = callback;
		this.planner = planner;
		this.vehicle = vehicle;
		this.from = from;
		this.to = to;

	}

	/**
	* This function runs the path finding and afterwards the callback function.
	*/
	execute() {

		const path = this.planner.navMesh.findPath( this.from, this.to );

		this.callback( this.vehicle, path );

	}

}

export { PathPlannerTask };
