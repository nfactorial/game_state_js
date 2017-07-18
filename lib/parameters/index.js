const NodeParam = require('@nfactorial/node_param');

/**
 * List of flies containing the default parameters to be registered.
 * @type {[String]} Paths to each default parameter implementation that should be registered.
 */
const PARAMETER_TYPE_LIST = [
    './state_ref',
    './system_ref'
];

module.exports = {
    registerParams: function() {
        for (const item of PARAMETER_TYPE_LIST) {
            const param = require(item);

            NodeParam.register(param.EXPORT, param.TYPE_NAME, param.ctor);
        }
    }
};
