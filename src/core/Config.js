/**
 * @author Mugen87 / https://github.com/Mugen87
 */

const CONFIG = {
	BOT: {
		MOVEMENT: {
			MAXSPEED: 3
		},
		HEAD: {
			HEIGHT: 1.8
		},
		GOAL: {
			UPDATE_FREQUENCY: 5
		},
		MEMORY: {
			SPAN: 3
		},
		NAVIGATION: {
			NEXT_WAYPOINT_DISTANCE: 2,
			ARRIVE_DECELERATION: 2,
			ARRIVE_TOLERANCE: 2
		},
		VISION: {
			UPDATE_FREQUENCY: 5
		},
		WEAPON: {
			UPDATE_FREQUENCY: 4,
			REACTION_TIME: 0.2,
			AIM_ACCURACY: 0.1,
			AIM_PERSISTANCE: 2
		}
	}
};

export { CONFIG };
