const NodeParam = require('@nfactorial/node_param');

const TYPE_NAME = 'ref:state';
const EXPORT_NAME = 'StateRef';

class StateRef {
    constructor(stateTree, stateName) {
        this.stateTree = stateTree;
        this.stateName = stateName;
    }

    apply() {
        this.stateTree.changeState(this.stateName);
    }
}

/**
 * Describes a parameter that may be used to reference states within the currently active state tree.
 */
class StateRefParameter extends NodeParam.ParameterBase {
    constructor(name) {
        super(TYPE_NAME, name, null);
    }

    extractValue(desc, initArgs) {
        if (typeof desc !== 'string') {
            throw new Error('StateRef.extractValue - Declaration was not of string type.');
        }

        return new StateRef(initArgs.stateTree, desc);
    }
}

module.exports = {
    EXPORT: EXPORT_NAME,
    TYPE_NAME: TYPE_NAME,
    ctor: StateRefParameter
};
