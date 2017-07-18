'use strict';

/**
 * This object is supplied to game systems when they are first initialized.
 * It provides access to other parts of the framework that a game system may
 * wish to access.
 */
class InitArgs {
    constructor() {
        this.stateTree = null;
        this.state = null;
    }

    /**
     * Retrieves the system object associated with the specified name.
     * System objects will only be found if they exist within the callers state hierarchy.
     * 
     * @param name {String} Name associated with the system object to be retrieved.
     * @returns {GameSystem} The game system associated with the specified name or null if one could not be found.
     */
    getSystem(name) {
        if (this.state) {
            return this.state.findSystem(name);
        }

        return null;
    }
}

module.exports = InitArgs;
