/**
 * @author robp94 / https://github.com/robp94
 */
class TargetSystem {

	constructor( owner ) {

		this.owner = owner;//enemy

		this._currentRecord = null;

	}

	/**
	 * Updates the target system internal state.
	 */
	update() {

		const records = this.owner.memoryRecords;
		let closestDistance = Infinity;
		this._currentRecord = null;

		for ( let i = 0, l = records.length; i < l; i ++ ) {

			const record = records[ i ];
			const distance = this.owner.position.distanceToSquared( record.lastSensedPosition );

			if ( distance < closestDistance ) {

				closestDistance = distance;
				this._currentRecord = record;

			}

		}

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
	 * Returns the last recorded position of the target, or null if there is no target.
	 *
	 * @return {Vector3} The last sensed position of the target.
	 */
	getLastRecordedPosition() {

		return ( this._currentRecord !== null ) ? this._currentRecord.lastSensedPosition : null;

	}

	/**
	 * Returns the time when the target was last sensed or -1 if there is none,
	 *
	 * @return {Number} The time when the target was last sensed.
	 *
	 */
	getTimeLastSensed() {

		return ( this._currentRecord !== null ) ? this._currentRecord.timeLastSensed : - 1;

	}

	/** Returns the current target if there is one.
	 *
	 * @returns {Enemy} Returns the current target if there is one, else null.
	 */
	getCurrentTarget() {

		return ( this._currentRecord !== null ) ? this._currentRecord.entity : null;

	}

}
export { TargetSystem };
