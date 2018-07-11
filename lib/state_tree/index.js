'use strict';

const GameState = require('./game_state');

const MAXIMUM_STATE_CHANGES = 10;

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
 *
 * For debug purposes, you may set the debug property of the state tree. When set to true, the state tree
 * will log all state changes as they occur.
 */
class StateTree {

    /**
     * Creates and initializes a new StateTree object for use by the application.
     * @param systemFactory {Factory} The factory object to be used when creating game system objects.
     * @param desc {Object} Description of the state tree to be constructed.
     */
    constructor(systemFactory, desc) {
        if (!systemFactory) {
            throw new Error('StateTree.constructor - A valid system factory must be supplied during construction.');
        }

        if (!desc) {
            throw new Error('StateTree.constructor - No description was provided.');
        }

        this.name = desc.name;
        this.stateMap = new Map();
        this.systemMap = new Map();
        this.activeState = null;
        this.defaultState = null;
        this.pendingState = null;
        this.systemFactory = systemFactory;
        this.debug = false;

        this._tickRequested = false;
        this._onApplyTick = this._onApplyTick.bind(this);

        if (desc.states) {
            for (const stateDescription of desc.states) {
                const state = new GameState(this, stateDescription);

                this.stateMap.set(stateDescription.name, state);
            }

            // Determine which state is considered the defaul state in the tree
            let mainState = desc.main || desc.states[0].name;

            this.defaultState = this.stateMap.get(mainState);

            if (!this.defaultState) {
                throw new Error('StateTree.constructor - Could not find main state \'' + mainState + '\' for processing.');
            }
        }
    }

    /**
     * Prepares the state tree for use by the application using the supplied description.
     * @param initArgs {InitArgs} The InitArgs object to be supplied to each game state.
     */
    onInitialize(initArgs) {
        if (!initArgs) {
            throw new Error('StateTree.onInitialize - No InitArgs object was provided.');
        }

        initArgs.stateTree = this;

        // Resolve all children in the hierarchy
        for (const state of this.stateMap.values()) {
            state.resolveChildren(this);
        }

        this.pendingState = this.defaultState;

        for (const state of this.stateMap.values()) {
            // We only initialize states at the root of the tree, the states themselves
            // will ensure their children are initialized also.
            if (!state.parent) {
                state.onInitialize(initArgs);
            }
        }

        StateTree.commitStateChange(this);
    }

    /**
     * Called by the framework when the game represented by this state tree is being destroyed.
     */
    onDestroy() {
        if (this.activeState) {
            this.activeState.onExit(null);

            // TODO: Invoke 'onDestroy' for all system objects

            this.activeState = null;

            for (const state of this.stateMap.values()) {
                // Only invoke onDestroy for root states, they will ensure the call
                // is forwarded correctly to their children.
                if (!state.parent) {
                    state.onDestroy();
                }
            }
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
            this.activeState.onPostUpdate(updateArgs);
        }

        StateTree.commitStateChange(this);
    }

    /**
     * Requests that the state tree alter the flow of execution to another branch.
     * @param {String} stateName - The name of the game state execution flow should switch to.
     */
    changeState(stateName) {
        if (!stateName) {
            throw new Error('StateTree.changeState - No state was specified for transfer.');
        }

        const state = this.stateMap.get(stateName);
        if (!state) {
            throw new Error('StateTree.changeState - Requested state \'' + stateName + '\' could not be found.');
        }

        if (state.children.size) {
            throw new Error('StateTree.changeState - Requested state \'' + stateName + '\' was not a leaf node.');
        }

        this.pendingState = state;

        // If we haven't already requested the _onApplyTick method to be invoked when ready, request it now.
        // This allows state changes to occur even when the application is not calling our onUpdate method.
        if (!this._tickRequested) {
            process.nextTick(this._onApplyTick);
            this._tickRequested = true;
        }
    }

    /**
     * Creates a new system object and associates it with a specified name.
     * If not type is specified, this method assumes the supplied name also matches the type name.
     * @param name {String} Name to be associated with the created system object.
     * @param type {String=} The name of the object type to be created.
     * @returns {GameSystem} The created instance of the game system.
     */
    createSystem(name, type) {
        if (this.systemMap.get(name)) {
            throw new Error('StateTree.createSystem - System object \'' + name + '\' already exists!');
        }

        // If type was not specified, then assume the name also matches the type.
        const typeName = type || name;

        const system = this.systemFactory.create(typeName);
        if (!system) {
            throw new Error('StateTree.createSystem - Could not find system object type \'' + typeName + '\'.');
        }

        this.systemMap.set(name, system);

        return system;
    }

    /**
     * Retrieves a GameState object associated with the specified name.
     * @param name {String} Name of the game state to be retrieved.
     * @returns {GameState} The game state associated with the the specified name otherwise undefined.
     */
    getState(name) {
        return this.stateMap.get(name);
    }

    /**
     * Calledback invoked when a game state change has been requested.
     * @private
     */
    _onApplyTick() {
        if (this.pendingState) {
            StateTree.commitStateChange(this);
        }

        // We must do this last, to prevent multiple change requests from causing multiple nextTick() invocations.
        // commitStateChange only returns when all changes have been applied, or the application encountered too many
        // state changes. So we conclude using nextTick() any more, is always a bad idea.
        this._tickRequested = false;
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
StateTree.findCommonAncestor = function (stateA, stateB) {
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
    while (scanA && scanB) {
        if (stateB.checkParentHierarchy(scanA)) {
            return scanA;
        }

        if (stateA.checkParentHierarchy(scanB)) {
            return scanB;
        }

        scanA = scanA.parent;
        scanB = scanB.parent;
    }

    return null;
};

/**
 * *NOTE* This is not a member function as it is not a part of the StateTree API, however we want to
 * make it available for unit testing otherwise it would be a module local function.
 *
 * @param stateTree {StateTree} The StateTree object whose state change is to be applied.
 */
StateTree.commitStateChange = function (stateTree) {
    let counter = 0;

    while (stateTree.pendingState) {
        if (++counter > MAXIMUM_STATE_CHANGES) {
            throw new Error('StateTree.commitStateChange - Too many state changes occurred in the frame.');
        }

        const pendingState = stateTree.pendingState;

        stateTree.pendingState = null;

        if (pendingState !== stateTree.activeState) {
            let rootState = null;
            if (stateTree.activeState) {
                rootState = StateTree.findCommonAncestor(stateTree.activeState, pendingState);

                // Invoke 'onDestroy' for all systems in the branch that is being terminated
                stateTree.activeState.onExit(rootState);
            }

            if (stateTree.debug) {
                const activeName = stateTree.activeState ? stateTree.activeState.name : '(none)';
                const pendingName = pendingState ? pendingState.name : '(none)';

                console.log('StateTree - Leaving state \'' + activeName + '\', entering state \'' + pendingName + '\'.');
            }

            // Invoke 'onInitialize' for all systems in the branch that has become active
            stateTree.activeState = pendingState;
            pendingState.onEnter(rootState);
            pendingState.onPostEnter(rootState);
        }
    }
};


module.exports = StateTree;
