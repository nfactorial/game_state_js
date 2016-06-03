'use strict';

/**
 * Base class for parameters used each frame update by the application.
 * Titles should extend this class with their own customizations and supply
 * their title specific UpdateArgs object to the state tree during update.
 *
 * Before supplying an UpdateArgs object to the game, the title should fill
 * the following member variables.
 *
 * UpdateArgs.deltaTime
 * Should contain the time (in seconds) since the last update.
 *
 * UpdateArgs.stateTree
 * Should contain a reference to the titles state tree, this cannot be null.
 */
class UpdateArgs {
    constructor() {
        this.deltaTime = 0;
        this.stateTree = null;
    }

    /**
     * Requests a change in the titles active game state. State changes are applied
     * at the end of the current frames processing.
     *
     * @param name {String} Name of the state to be switched to, this state must be a leaf node in the hierarchy.
     */
    requestState(name) {
        if (!this.stateTree) {
            throw new Error('UpdateArgs.requestState - Cannot request state, stateTree is invalid.');
        }

        this.stateTree.requestState(name);
    }
}

module.exports = UpdateArgs;
