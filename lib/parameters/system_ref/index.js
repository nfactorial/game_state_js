const NodeParam = require('@nfactorial/node_param');

const TYPE_NAME = 'ref:system';
const EXPORT_NAME = 'SystemRef';

/**
 * Describes a parameter that may be used to reference a game system instance within the state tree.
 */
class SystemRefParameter extends NodeParam.ParameterBase {
    constructor(name) {
        super(TYPE_NAME, name, null);
    }

    extractValue(desc, initArgs) {
        if (typeof desc !== 'string') {
            throw new Error('StateRef.extractValue - Declaration was not of string type.');
        }

        const systemObject = initArgs.getSystem(desc);
        if (!systemObject) {
            throw new Error('SystemRef.extractValue - Referenced system object \'' + desc + '\' could not be found.');
        }

        return systemObject;
    }
}

module.exports = {
    EXPORT: EXPORT_NAME,
    TYPE_NAME: TYPE_NAME,
    ctor: SystemRefParameter
};
