import { Task } from '../lib/yuka.module.js';

/**
* TODO
*
* @author {@link https://github.com/robp94|robp94}
*/
class PathPlannerTask extends Task {

	/**
	* TODO
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
	* TODO
	*/
	execute() {

		const path = this.planner.navMesh.findPath( this.from, this.to );

		this.callback( this.vehicle, path );

	}

}

export { PathPlannerTask };
