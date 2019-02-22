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
	}
};

export { CONFIG };
