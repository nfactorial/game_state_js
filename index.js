const NodeParam = require('@nfactorial/node_param');
const parameters = require('./lib/parameters');

parameters.registerParams();

module.exports = {
    Parameters: NodeParam,
    GameSystem: require('./lib/game_system'),
    EventGameSystem: require('./lib/game_system/event_game_system.js'),
    StateTree: require('./lib/state_tree'),
    InitArgs: require('./lib/init_args'),
    UpdateArgs: require('./lib/update_args')
};
