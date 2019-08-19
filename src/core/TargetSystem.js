const visibleRecords = new Array();
const invisibleRecords = new Array();

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

		// reset

		this._currentRecord = null;

		visibleRecords.length = 0;
		invisibleRecords.length = 0;

		// sort records according to their visibility

		for ( let i = 0, l = records.length; i < l; i ++ ) {

			const record = records[ i ];

			if ( record.visible ) {

				visibleRecords.push( record );

			} else {

				invisibleRecords.push( record );

			}

		}

		// record selection

		if ( visibleRecords.length > 0 ) {

			// if there are visible records, select the closest one

			let minDistance = Infinity;

			for ( let i = 0, l = visibleRecords.length; i < l; i ++ ) {

				const record = visibleRecords[ i ];

				const distance = this.owner.position.squaredDistanceTo( record.lastSensedPosition );

				if ( distance < minDistance ) {

					minDistance = distance;
					this._currentRecord = record;

				}

			}

		} else if ( invisibleRecords.length > 0 ) {

			// if there are invisible records, select the one that was last sensed

			let maxTimeLastSensed = - Infinity;

			for ( let i = 0, l = invisibleRecords.length; i < l; i ++ ) {

				const record = invisibleRecords[ i ];

				if ( record.timeLastSensed > maxTimeLastSensed ) {

					maxTimeLastSensed = record.timeLastSensed;
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

		return ( this._currentRecord !== null ) ? this._currentRecord.timeBecameVisible : - 1;

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
