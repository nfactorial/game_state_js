'use strict';

var chai = require('chai');
var expect = chai.expect;
var GameState = require('../../../lib/state_tree/game_state');

/**
 * Verify the GameState class behaves as expected.
 */
describe('game_state', function() {
    it('Should be empty when constructed.', function() {
        const state = new GameState();

        expect(state.parent).to.be.null;
        expect(state.childNames.length).to.equal(0);
        expect(state.systemNames.length).to.equal(0);
        expect(state.children.size).to.equal(0);
        expect(state.gameSystems.size).to.equal(0);
    });
});
