import { MovingEntity, Ray, Vector3 } from 'yuka';
import { MESSAGE_HIT } from '../core/Constants.js';

const intersectionPoint = new Vector3();
const ray = new Ray();

/**
* Base class for representing a projectile.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Projectile extends MovingEntity {

	/**
	* Constructs a new projectile with the given values.
	*
	* @param {GameEntity} owner - The owner of this projectile.
	* @param {Ray} ray - The ray that defines the trajectory of this projectile.
	*/
	constructor( owner = null, ray = new Ray() ) {

		super();

		this.canActivateTrigger = false;

		this.owner = owner;
		this.ray = ray;

		this.lifetime = 0;
		this.currentTime = 0;

		this.damage = 0;

	}

	/**
	* Executed when this game entity is updated for the first time by its entity manager.
	*
	* @return {Projectile} A reference to this game entity.
	*/
	start() {

		// make the render component visible when the projectile was updated
		// by the entity manager at least once

		this._renderComponent.visible = true;

		return this;

	}

	/**
	* Update method of this projectile.
	*
	* @param {Number} delta - The time delta value;
	* @return {Projectile} A reference to this projectile.
	*/
	update( delta ) {

		const world = this.owner.world;

		this.currentTime += delta;

		if ( this.currentTime > this.lifetime ) {

			world.remove( this );

		} else {

			ray.copy( this.ray );
			ray.origin.copy( this.position );

			super.update( delta );

			const entity = world.checkProjectileIntersection( this, intersectionPoint );

			if ( entity !== null ) {

				// calculate distance from origin to intersection point

				const distanceToIntersection = ray.origin.squaredDistanceTo( intersectionPoint );
				const validDistance = ray.origin.squaredDistanceTo( this.position );

				if ( distanceToIntersection <= validDistance ) {

					// inform game entity about hit

					this.owner.sendMessage( entity, MESSAGE_HIT, 0, { damage: this.damage, direction: this.ray.direction } );

					// remove projectile from world

					world.remove( this );

				}

			}

		}

	}

}

export { Projectile };
