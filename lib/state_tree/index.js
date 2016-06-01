'use strict';

const GameState = require('./game_state');


/**
 * Manages a hierarchy of game states that form the running application.
 *
 * The tree graph has each node represent a state within the session, where one
 * node is considered the active game state. The active node must be a leaf
 * node within the graph.
 * 
 * When a node is active, the parent nodes within its hierarchy are also considered
 * active.
 * 
 * Each game state may contain a list of system objects, these are created using
 * a factory (from npm module @nfactorial/factory_node). This factory must be
 * supplied to the state tree during construction. System objects should extend
 * the 'GameSystem' object provided within this package.
 *
 * When the per-frame update is being processing the onUpdate method should be invoked,
 * this method requires an UpdateArgs parameter to be supplied. This object is passed
 * to all active systems during the frame. The actual format of this object is left
 * entirely up-to the owning application to define.
 */
class StateTree {
    constructor(systemFactory) {
        if (!systemFactory) {
            throw new Error('StateTree - A valid system factory must be supplied during construction.');
        }

        this.name = null;
        this.stateMap = new Map();
        this.systemMap = new Map();
        this.activeState = null;
        this.defaultState = null;
        this.pendingState = null;
        this.systemFactory = systemFactory;
    }

    /**
     * Prepares the state tree for use by the application using the supplied description.
     * @param desc {object} Description of the state tree layout.
     */
    onInitialize(desc) {
        if (!desc) {
            throw new Error('StateTree.initialize - No description was provided.');
        }

        this.name = desc.name;

        if (desc.states) {
            for (const stateDescription of desc.states) {
                const state = new GameState(stateDescription);

                this.stateMap.set(stateDescription.name, state);
            }

            // Resolve all children in the hierarchy
            for (const state of this.stateMap.values()) {
                state.resolveChildren(this);
            }

            // Determine which state is considered the defaul state in the tree
            let mainState = desc.main || desc.states[0].name;

            this.defaultState = this.stateMap.get(mainState);

            if (!this.defaultState) {
                throw new Error('StateTree.Initialize - Could not find main state \'' + mainState + '\' for processing.');
            }

            this.pendingState = this.defaultState;
        }
    }

    /**
     * Called each frame when it is time to do our processing.
     * @param updateArgs {UpdateArgs} Object supplied to all active systems containing per-frame information.
     */
    onUpdate(updateArgs) {
        StateTree.commitStateChange(this);

        if (this.activeState) {
            this.activeState.onUpdate(updateArgs);
        }

        StateTree.commitStateChange(this);
    }

    /**
     * Retrieves a GameState object associated with the specified name.
     * @param name {String} Name of the game state to be retrieved.
     * @returns {GameState} The game state associated with the the specified name otherwise undefined.
     */
    getState(name) {
        return this.stateMap.get(name);
    }
}

/**
 * Given two independent states, this method determines where in the hierarchy the two states
 * join at the same parent.
 *
 * The supplied states must be leaf nodes within the hierarchy.
 *
 * @param stateA {GameState}
 * @param stateB {GameState}
 * @returns {GameState} The game state in the hierarchy where the two states join.
 */
StateTree.findCommonAncestor = function(stateA, stateB) {
    if (!stateA) {
        throw new Error('findCommonAncestor - stateA was invalid.');
    }

    if (!stateB) {
        throw new Error('findCommonAncestor - stateB was invalid.');
    }

    // If they are the same state, we don't need to do anything further
    if (stateA === stateB) {
        return stateA;
    }

    // Determine common ancestor
    let scanA = stateA.parent;
    let scanB = stateB.parent;
    while (scanA && scanB ) {
        if ( stateB.checkParentHierarchy(scanA) ) {
            return scanA;
        }

        if ( stateA.checkParentHierarchy(scanB) ) {
            return scanB;
        }

        scanA = scanA.parent;
        scanB = scanB.parent;
    }

    return null;
};

/**
 * *NOTE* This is not a member variable as it is not a part of the StateTree API, however we want to
 * make it available for unit testing otherwise it would be a module local function.
 *
 * @param stateTree {StateTree} The StateTree object whose state change is to be applied.
 */
StateTree.commitStateChange = function(stateTree) {
    if (stateTree.pendingState) {
        let rootState = StateTree.findCommonAncestor(stateTree.activeState, stateTree.pendingState);

        // Invoke 'onDestroy' for all systems in the branch that is being terminated
        stateTree.activeState.onDestroy(rootState);

        stateTree.activeState = stateTree.pendingState;
        stateTree.pendingState = null;

        // Invoke 'onInitialize' for all systems in the branch that has become active
        stateTree.activeState.onInitialize(rootState, initArgs);
    }
};

module.exports = StateTree;
