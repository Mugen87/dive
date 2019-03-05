import { AABB, Vector3 } from '../lib/yuka.module.js';
import { SceneUtils } from '../etc/SceneUtils.js';

/**
* Class for representing the bounds of an enemy. Its primary purpose is to avoid
* expensive operations on the actual geometry of an enemy. Hence, intersection test
* are perfomed with a simple hierarchy of AABBs.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class CharacterBounds {

	/**
	* Constructs a new level entity with the given values.
	*
	* @param {Enemy} owner - The owner of this instance.
	*/
	constructor( owner ) {

		this.owner = owner;

		// the outer and topmost bounding volume. used in the first
		// phase of an intersection test

		this._outerHitbox = new AABB();
		this._outerHitboxDefinition = new AABB();

		// TODO: Implement skeleton based AABBs

	}

	/**
	* Inits the bounding volumes of this instance.
	*
	* @return {CharacterBounds} A reference to this instance.
	*/
	init() {

		this._outerHitboxDefinition.set( new Vector3( - 0.5, 0, - 0.5 ), new Vector3( 0.5, 1.8, 0.5 ) );

		const owner = this.owner;
		const world = owner.world;

		if ( world.debug ) {

			// TODO: Replace this with the skeleton based AABBs
			// Right now, the visualized AABB of the outer hitbox is wrong since the
			// respective lines can be rotate. This is not possible with an AABB.

			const hitboxHelper = SceneUtils.createHitboxHelper( this._outerHitboxDefinition );
			hitboxHelper.visible = false;

			owner._renderComponent.add( hitboxHelper );
			world.helpers.hitboxHelpers.push( hitboxHelper );

		}

		return this;

	}

	/**
    * Updates the outer bounding volume of this instance. Deeper bounding volumes
    * are only update if necessary.
	*
	* @return {CharacterBounds} A reference to this instance.
	*/
	update() {

		this._outerHitbox.copy( this._outerHitboxDefinition ).applyMatrix4( this.owner.worldMatrix );

		return this;

	}

	/**
	* Computes the center point of this instance and stores it into the given vector.
	*
	* @param {Vector3} result - The result vector.
	* @return {Vector3} The result vector.
	*/
	getCenter( center ) {

		return this._outerHitbox.getCenter( center );

	}

	/**
    * Returns the intesection point if the given ray hits one of the bounding volumes.
    * If no intersection is detected, null is returned.
	*
	* @param {Ray} ray - The ray.
	* @param {Vector3} intersectionPoint - The intersection point.
	* @return {Vector3} The intersection point.
	*/
	intersectRay( ray, intersectionPoint ) {

		return ray.intersectAABB( this._outerHitbox, intersectionPoint );

	}

}

export { CharacterBounds };
