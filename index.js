const NodeParam = require('@nfactorial/node_param');
const parameters = require('./lib/parameters');

parameters.registerParams();

module.exports = {
    EventGameSystem: require('./lib/game_system/event_game_system.js'),
    EventProvider: require('./lib/event_provider'),
    UpdateArgs: require('./lib/update_args'),
    GameSystem: require('./lib/game_system'),
    StateTree: require('./lib/state_tree'),
    InitArgs: require('./lib/init_args'),
    Parameters: NodeParam
};
