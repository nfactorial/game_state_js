'use strict';

/**
 * Represents a leaf in the state tree for a running title, when a game state is active
 * all parent states within the hierarchy are also considered active.
 *
 * Game states do not include processing themselves, frame processing is provided by
 * implementing GameSystem objects and assigning them to a game state. An active
 * game state will forward updates to its assigned system objects.
 */
class GameState {

    /**
     * Initializes the game state for use by the running application.
     * @param {StateTree} stateTree - The state tree to which we belong.
     * @param {Object} desc - Description of the state to be initialized.
     */
    constructor(stateTree, desc) {
        this.parent = null;
        this.childNames = [];

        this.children = new Map();
        this.gameSystems = new Map();

        if (desc) {
            if (desc.children) {
                for (const name of desc.children) {
                    this.childNames.push(name);
                }
            }

            if (desc.systems) {
                for (const name of desc.systems) {
                    if (typeof name === 'string') {
                        this.gameSystems.set(name, stateTree.createSystem(name));
                    } else {
                        this.gameSystems.set(name, stateTree.createSystem(name.name, name.type));
                    }
                }
            }
        }
    }

    /**
     *
     * @param {StateTree} stateTree -
     */
    resolveChildren(stateTree) {
        for (const name of this.childNames) {
            const child = stateTree.getState(name);
            if (!child) {
                throw new Error('Unable to resolve hierarchy, state \'' + name + '\' could not be found.');
            }

            if (child.parent) {
                throw new Error('GameState was referenced by multiple parents (\'' + name + '\').');
            }

            this.children.set(name, child);

            child.parent = this;
        }
    }

    /**
     * Prepares the state tree for use by the application using the supplied description.
     * @param {Object} initArgs -
     */
    onInitialize(initArgs) {
        initArgs.state = this;

        for (const system of this.gameSystems.values()) {
            system.onInitialize(initArgs);
        }

        // Forward initialization onto each child
        for (const child of this.children.values()) {
            child.onInitialize(initArgs);
        }
    }

    /**
     * Called by the framework when the entire state tree is being destroyed.
     */
    onDestroy() {
        const childValues = this.children.values();
        for (let loop = childValues.length - 1; loop >= 0; loop--) {
            childValues[loop].onDestroy();
        }

        const systemValues = this.gameSystems.values();
        for (let loop = systemValues.length - 1; loop >= 0; loop--) {
            systemValues[loop].onDestroy();
        }
    }

    /**
     * Called by the framework when this game state is becoming active within the running session.
     * @param {GameState} branchRoot - The branch point iin the state tree where the switch occurred.
     */
    onEnter(branchRoot) {
        if (this.parent !== branchRoot) {
            this.parent.onEnter(branchRoot);
        }

        for (const system of this.gameSystems.values()) {
            system.onActivate();
        }
    }

    /**
     * Called by the framework when control is leaving the branch where this game state exists.
     * @param {GameState} branchRoot - The branch point in the state tree where the switch occurred.
     */
    onExit(branchRoot) {
        // System objects are exited in reverse order
        const systemValues = this.gameSystems.values();
        for (let index = systemValues.length - 1; index >= 0; index--) {
            systemValues[index].onDeactivate();
        }

        if (this.parent !== branchRoot) {
            this.parent.onExit(branchRoot);
        }
    }

    /**
     * Called each frame allowing game systems to perform any necessary processing.
     * @param {UpdateArgs} updateArgs - Description of the state tree layout.
     */
    onUpdate(updateArgs) {
        if (this.parent) {
            this.parent.onUpdate(updateArgs);
        }

        for (const system of this.gameSystems.values()) {
            if (system.onUpdate) {
                system.onUpdate(updateArgs);
            }
        }
    }

    /**
     * Retrieves the game system associated with the specified name.
     * @param {String} name - The name associated with the system to be retrieved.
     * @returns {GameSystem} The game system within the hierarchy associated with the specified name or null.
     */
    findSystem(name) {
        const system = this.gameSystems.get(name);
        if (system) {
            return system;
        }

        if (this.parent) {
            return this.parent.findSystem(name);
        }

        return null;
    }

    /**
     * Determines whether or not a specified state is within the parent hierarchy of this node.
     * @param {GameState} state - The game state to be checked.
     * @returns {boolean} True if the specified state exists within the parent hierarchy otherwise false.
     */
    checkParentHierarchy(state) {
        if (this === state) {
            return true;
        }

        if (this.parent) {
            return this.parent.checkParentHierarchy(state);
        }

        return false;
    }
}

module.exports = GameState;
