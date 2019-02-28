import { ENEMY_STATUS_ALIVE } from '../core/Constants.js';

/**
* Class to select a target from the opponents currently in a bot's perceptive memory.
*
* @author {@link https://github.com/robp94|robp94}
*/
class TargetSystem {

	/**
	* Constructs a new target system with the given values.
	*
	* @param {GameEntity} owner - The owner of this weapon system.
	*/
	constructor( owner ) {

		this.owner = owner; // enemy

		this._currentRecord = null; // represents the memory record of the current target

	}

	/**
	* Updates the target system internal state.
	*
	* @return {TargetSystem} A reference to this target system.
	*/
	update() {

		const records = this.owner.memoryRecords;
		let closestDistance = Infinity;

		this._currentRecord = null; // reset

		for ( let i = 0, l = records.length; i < l; i ++ ) {

			const record = records[ i ];

			if ( record.entity.status === ENEMY_STATUS_ALIVE ) {

				const distance = this.owner.position.squaredDistanceTo( record.lastSensedPosition );

				if ( distance < closestDistance ) {

					closestDistance = distance;
					this._currentRecord = record;

				}

			}

		}

		return this;

	}


	/**
	* Resets the internal data structures.
	*
	* @return {TargetSystem} A reference to this target system.
	*/
	reset() {

		this._currentRecord = null;

		return this;

	}

	/**
	* Checks if the target is shootable/visible or not
	*
	* @return {Boolean} Whether the target is shootable/visible or not.
	*/
	isTargetShootable() {

		return ( this._currentRecord !== null ) ? this._currentRecord.visible : false;

	}

	/**
	* Returns the last sensed position of the target, or null if there is no target.
	*
	* @return {Vector3} The last sensed position of the target.
	*/
	getLastSensedPosition() {

		return ( this._currentRecord !== null ) ? this._currentRecord.lastSensedPosition : null;

	}

	/**
	* Returns the time when the target was last sensed or -1 if there is none.
	*
	* @return {Number} The time when the target was last sensed.
	*/
	getTimeLastSensed() {

		return ( this._currentRecord !== null ) ? this._currentRecord.timeLastSensed : - 1;

	}

	/**
	* Returns the time when the target became visible or -1 if there is none.
	*
	* @return {Number} The time when the target became visible.
	*/
	getTimeBecameVisible() {

		const time = this.owner.world.time;
		const elapsedTime = time.getElapsed();

		return ( this._currentRecord !== null ) ? ( elapsedTime - this._currentRecord.timeBecameVisible ) : - 1;

	}

	/** Returns the current target if there is one.
	*
	* @returns {Enemy} Returns the current target if there is one, else null.
	*/
	getTarget() {

		return ( this._currentRecord !== null ) ? this._currentRecord.entity : null;

	}

	/** Returns true if the enemy has an active target.
	*
	* @returns {Boolean} Whether the enemy has an active target or not.
	*/
	hasTarget() {

		return this._currentRecord !== null;

	}

}
export { TargetSystem };
