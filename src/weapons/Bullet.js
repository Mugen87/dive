import { Ray } from 'yuka';
import { CONFIG } from '../core/Config.js';
import { Projectile } from './Projectile.js';

/**
* Class for representing a bullet.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Bullet extends Projectile {

	/**
	* Constructs a new bullet with the given values.
	*
	* @param {GameEntity} owner - The owner of this bullet.
	* @param {Ray} ray - The ray that defines the trajectory of this bullet.
	*/
	constructor( owner = null, ray = new Ray() ) {

		super( owner, ray );

		this.maxSpeed = CONFIG.BULLET.MAX_SPEED;

		this.position.copy( ray.origin );
		this.velocity.copy( ray.direction ).multiplyScalar( this.maxSpeed );

		const s = 1 + ( Math.random() * 1.5 ); // scale the shot line a bit

		this.scale.set( s, s, s );

		this.lifetime = CONFIG.BULLET.LIFETIME;

		this.damage = CONFIG.BULLET.DAMAGE;

	}

}

export { Bullet };
