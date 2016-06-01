'use strict';

/**
 * A game system is an object that performs processing within a running title.
 * Game systems are assigned to a game state and are updated when that game
 * state is considered active within the running session.
 *
 * The framework will notify the game system when it becomes active or inactive
 * via the onActivate and onDeactivate methods.
 *
 * The onInitialize method is invoked when the title is about to begin processing,
 * the game system should prepare itself for use in this method. References to
 * other systems may be obtained during at this point, however game systems
 * cannot reference other systems that are not within its hierarchy.
 *
 * The onDestroy method is invoked during system shutdown, the game system should
 * release any external references at this point.
 */
class GameSystem {
    constructor() {
        //
    }

    /**
     * Called by the framework when it is ready for the game system to prepare for
     * processing.
     *
     * @param initArgs {InitArgs}
     */
    onInitialize(initArgs) {
        //
    }

    /**
     * Called by the framework when the game is being destroyed.
     */
    onDestroy() {
        //
    }

    /**
     * Called by the framework when the game system is becoming active within the
     * running title.
     */
    onActivate() {
        //
    }

    /**
     * Called by the framework when the game system is no longer in the active
     * game state hierarchy.
     */
    onDeactivate() {
        //
    }
}

module.exports = GameSystem;
