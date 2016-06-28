'use strict';

var chai = require('chai');
var expect = chai.expect;
var GameState = require('../../../lib/state_tree/game_state');

class MockGameState {
    constructor() {
        this.exitCount = 0;
        this.enterCount = 0;
        this.updateCount = 0;
        this.destroyCount = 0;
        this.initializeCount = 0;
    }

    onInitialize(initArgs) {
        this.initializeCount++;
    }

    onDestroy() {
        this.destroyCount++;
    }

    onEnter(branchRoot) {
        this.enterCount++;
    }

    onExit(branchRoot) {
        this.exitCount++;
    }

    onUpdate(updateArgs) {
        this.updateCount++;
    }
}


/**
 * Verify the GameState class behaves as expected.
 */
describe('game_state', () => {
    it('Should be empty when constructed', () => {
        const state = new GameState();

        expect(state.parent).to.be.null;
        expect(state.childNames.length).to.equal(0);
        expect(state.children.size).to.equal(0);
        expect(state.gameSystems.size).to.equal(0);
    });

    it('Should correctly pass onExit up the chain', () => {
        const state = new GameState();
        const mockParent = new MockGameState();

        state.parent = mockParent;

        state.onExit(null);
        state.onExit(mockParent);

        expect(mockParent.exitCount).to.equal(1);
        expect(mockParent.enterCount).to.equal(0);
        expect(mockParent.updateCount).to.equal(0);
        expect(mockParent.destroyCount).to.equal(0);
        expect(mockParent.initializeCount).to.equal(0);
    });

    it('Should correctly pass onEnter up the chain', () => {
        const state = new GameState();
        const mockParent = new MockGameState();

        state.parent = mockParent;

        state.onEnter(null);
        state.onEnter(mockParent);

        expect(mockParent.exitCount).to.equal(0);
        expect(mockParent.enterCount).to.equal(1);
        expect(mockParent.updateCount).to.equal(0);
        expect(mockParent.destroyCount).to.equal(0);
        expect(mockParent.initializeCount).to.equal(0);
    });

    it('Should correctly pass onUpdate up the chain', () => {
        const state = new GameState();
        const mockParent = new MockGameState();
        const updateArgs = {};

        state.parent = mockParent;

        state.onUpdate(updateArgs);

        expect(mockParent.exitCount).to.equal(0);
        expect(mockParent.enterCount).to.equal(0);
        expect(mockParent.updateCount).to.equal(1);
        expect(mockParent.destroyCount).to.equal(0);
        expect(mockParent.initializeCount).to.equal(0);
    });
});
