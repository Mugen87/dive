/**
* This file holds configurable parameters of the game.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/

const CONFIG = {
	AUDIO: {
		VOLUME_IMPACT: 0.2 // volume
	},
	PLAYER: {
		BOUNDING_RADIUS: 0.5, // meter
		DYING_TIME: 3, // seconds
		HEAD_HEIGHT: 1.7, // meter
		MAX_HEALTH: 100, // health points
		MAX_SPEED: 4 // meter/seconds
	},
	CONTROLS: {
		LOOKING_SPEED: 2, // unitless
		BRAKING_POWER: 10, // unitless
		HEAD_MOVEMENT: 1.4, // unitless
		WEAPON_MOVEMENT: 1.4, // unitless
		ACCELERATION: 0.7 // unitless
	},
	BOT: {
		MOVEMENT: {
			MAX_SPEED: 3, // meter/seconds
			DODGE_SIZE: 4 // meter
		},
		GOAL: {
			UPDATE_FREQUENCY: 5 // number per seconds
		},
		MEMORY: {
			SPAN: 20 // seconds
		},
		NAVIGATION: {
			NEXT_WAYPOINT_DISTANCE: 0.5, // meter
			ARRIVE_DECELERATION: 2, // unitless
			ARRIVE_TOLERANCE: 1, // meter
			PATH_RADIUS: 0.1, // meter
			ONPATH_WEIGHT: 1 // unitless
		},
		TARGET_SYSTEM: {
			UPDATE_FREQUENCY: 5 // number per seconds
		},
		VISION: {
			UPDATE_FREQUENCY: 5 // number per seconds
		},
		WEAPON: {
			UPDATE_FREQUENCY: 4, // number per seconds
			REACTION_TIME: 0.2, // seconds
			AIM_ACCURACY: 2.5, // world units
			CHANGE_COST: 0.5 // desirability
		},
		BOUNDING_RADIUS: 0.5, // meter
		COUNT: 2, // number
		HEAD_HEIGHT: 1.5, // meter
		MAX_HEALTH: 100, // health points
		DYING_TIME: 3, // seconds
		SEARCH_FOR_ATTACKER_TIME: 3 // seconds
	},
	BLASTER: {
		ROUNDS_LEFT: 12, // number
		ROUNDS_PER_CLIP: 12, // number
		AMMO: 48, // number
		MAX_AMMO: 48, // number
		SHOT_TIME: 0.4, // seconds
		RELOAD_TIME: 1.6, // seconds
		MUZZLE_TIME: 0.04, // seconds
		EQUIP_TIME: 0.5, // seconds
		HIDE_TIME: 0.5, // seconds
		SPREAD: 0.01, // unitless

	},
	SHOTGUN: {
		ROUNDS_LEFT: 6, // number
		ROUNDS_PER_CLIP: 6, // number
		AMMO: 24, // number
		MAX_AMMO: 24, // number
		SHOT_TIME: 1.2, // seconds
		RELOAD_TIME: 1.6, // seconds
		SHOT_RELOAD_TIME: 0.5, // seconds
		MUZZLE_TIME: 0.04, // seconds
		EQUIP_TIME: 1, // seconds
		HIDE_TIME: 1, // seconds
		SPREAD: 0.08, // unitless
		BULLETS_PER_SHOT: 6 // number
	},
	ASSAULT_RIFLE: {
		ROUNDS_LEFT: 30, // number
		ROUNDS_PER_CLIP: 30, // number
		AMMO: 90, // number
		MAX_AMMO: 90, // number
		SHOT_TIME: 0.2, // seconds
		RELOAD_TIME: 1.6, // seconds
		MUZZLE_TIME: 0.04, // seconds
		EQUIP_TIME: 1, // seconds
		HIDE_TIME: 1, // seconds
		SPREAD: 0.01, // unitless

	},
	BULLET: {
		MAX_SPEED: 400, // meter/seconds
		LIFETIME: 1, // seconds
		DAMAGE: 20 // health points
	},
	UI: {
		HIT_INDICATION_TIME: 0.3 //seconds
	}
};

export { CONFIG };
