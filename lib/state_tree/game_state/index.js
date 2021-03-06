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

        this.childList = [];
        this.systemList = [];

        if (desc) {
            this.name = desc.name;

            if (desc.children) {
                for (const name of desc.children) {
                    this.childNames.push(name);
                }
            }

            if (desc.systems) {
                for (const systemDesc of desc.systems) {
                    this._createSystem(stateTree, systemDesc);
                }
            }
        }
    }

    /**
     * Obtains a direct reference to each child state object we contain.
     * @param {StateTree} stateTree - The state tree we belong to.
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

            this.childList.push(child);
            this.children.set(name, child);

            child.parent = this;
        }
    }

    /**
     * Prepares the state tree for use by the application using the supplied description.
     * @param {InitArgs} initArgs -
     */
    onInitialize(initArgs) {
        initArgs.state = this;

        for (const system of this.gameSystems.values()) {
            if (system.type.Parameters) {
                this._applyParameters(initArgs, system.type.Parameters, system.params, system.o);
            }

            system.o.onInitialize(initArgs);
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
        const childCount = this.childList.length;
        for (let loop = childCount - 1; loop >= 0; loop--) {
            this.childList[loop].onDestroy();
        }

        const systemCount = this.systemList.length;
        for (let loop = systemCount - 1; loop >= 0; loop--) {
            this.systemList[loop].onDestroy();
        }
    }

    /**
     * Called by the framework when this game state is becoming active within the running session.
     * @param {GameState} branchRoot - The branch point iin the state tree where the switch occurred.
     */
    onEnter(branchRoot) {
        if (this.parent && this.parent !== branchRoot) {
            this.parent.onEnter(branchRoot);
        }

        for (const system of this.systemList) {
            system.onActivate();
        }
    }

    /**
     * Called by the framework when control is leaving the branch where this game state exists.
     * @param {GameState} branchRoot - The branch point in the state tree where the switch occurred.
     */
    onExit(branchRoot) {
        // System objects are exited in reverse order
        const systemCount = this.systemList.length;
        for (let index = systemCount - 1; index >= 0; index--) {
            this.systemList[index].onDeactivate();
        }

        if (this.parent && this.parent !== branchRoot) {
            this.parent.onExit(branchRoot);
        }
    }

    /**
     * Called by the framework once all systems have had their onActivate method call invoked. Allows for some systems
     * to wait before attempting to interact with another system.
     * @param {GameState} branchRoot - The branch point in the state tree where the switch occurred.
     */
    onPostEnter(branchRoot) {
        if (this.parent && this.parent !== branchRoot) {
            this.parent.onPostEnter(branchRoot);
        }

        for (const system of this.systemList) {
            system.onPostActivate();
        }
    }

    /**
     * Called each frame allowing game systems to perform any necessary processing.
     * @param {UpdateArgs} updateArgs - Parameters describing the current frame being processed.
     */
    onUpdate(updateArgs) {
        if (this.parent) {
            this.parent.onUpdate(updateArgs);
        }

        for (const system of this.systemList) {
            if (system.onUpdate) {
                system.onUpdate(updateArgs);
            }
        }
    }

    /**
     * Called each frame once the initial onUpdate phase has completed, allowing systems to perform additional processing
     * after the main update phase.
     * @param {UpdateArgs} updateArgs - Parameters describing the current frame being processed.
     */
    onPostUpdate(updateArgs) {
        if (this.parent) {
            this.parent.onPostUpdate(updateArgs);
        }

        for (const system of this.systemList) {
            if (system.onPostUpdate) {
                system.onPostUpdate(updateArgs);
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
            return system.o;
        }

        return this.parent ? this.parent.findSystem(name) : null;
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

        return this.parent ? this.parent.checkParentHierarchy(state) : false;
    }

    /**
     * Creates a new instance of a system object within the current game state.
     * @param {StateTree} stateTree - The state tree we belong to.
     * @param {Object} desc - Description of the system object to be created.
     * @private
     */
    _createSystem(stateTree, desc) {
        let systemType = null;
        let systemName = null;
        let systemParams = null;
        let systemOptions = null;

        if (typeof desc === 'string') {
            systemName = desc;
            systemType = desc;
        } else {
            systemName = desc.name;
            systemType = desc.type || systemName;

            // We don't want to copy the value 'undefined'
            if (desc.params) {
                systemParams = desc.params;
            }

            if (desc.options) {
                systemOptions = desc.options;
            }
        }

        const systemObject = stateTree.createSystem(systemName, systemType);

        this.systemList.push(systemObject);
        this.gameSystems.set(systemName, {
            o: systemObject,
            typeName: systemType,
            options: systemOptions,
            type: stateTree.systemFactory.map.get(systemType),
            params: systemParams
        });
    }

    /**
     * Extracts the parameter values for the specified game system instance.
     * @param {InitArgs} initArgs
     * @param paramDecl
     * @param configParams
     * @param {GameSystem} obj - Instance of the game system whose parameters are to be extracted.
     * @private
     */
    _applyParameters(initArgs, paramDecl, configParams, obj) {
        for (const param of paramDecl) {
            const paramName = param.name;

            if (configParams && configParams[paramName]) {
                obj[paramName] = param.extractValue(configParams[paramName], initArgs);
            } else {
                obj[paramName] = param.getDefaultValue();
            }
        }
    }
}

module.exports = GameState;
