'use strict';

var chai = require('chai');
var expect = chai.expect;
var StateTree = require('../../lib/state_tree');
var GameState = require('../../lib/state_tree/game_state')

/**
 * Verify the StateTree class behaves as expected.
 */
describe('state_tree', function() {
    it('Should throw an exception if no system factory is provided', function() {
        expect(function() {
            new StateTree(null);
        }).to.throw('StateTree - A valid system factory must be supplied during construction.');
    });

    it('Should be empty when constructed', function() {
        const mockFactory = {};

        const stateTree = new StateTree(mockFactory);

        expect(stateTree.name).to.be.null;
        expect(stateTree.activeState).to.be.null;
        expect(stateTree.defaultState).to.be.null;
        expect(stateTree.pendingState).to.be.null;
        expect(stateTree.systemFactory).to.equal(mockFactory);
        expect(stateTree.stateMap.size).to.equal(0);
        expect(stateTree.systemMap.size).to.equal(0);
    });

    it('Should correctly identify common ancestors within the hierarchy', function() {
        const mockFactory = {};

        const TestData = require('./ancestor_test.json');
        const stateTree = new StateTree(mockFactory);

        stateTree.onInitialize(TestData);

        const root1 = stateTree.getState('root1');
        const root2 = stateTree.getState('root2');
        const root3 = stateTree.getState('root3');

        expect(root1).not.to.be.null;
        expect(root2).not.to.be.null;
        expect(root3).not.to.be.null;

        const root1_child1 = stateTree.getState('root1_child1');
        const root2_child1 = stateTree.getState('root2_child1');
        const root2_child1_child1 = stateTree.getState('root2_child1_child1');
        const root2_child1_child2 = stateTree.getState('root2_child1_child2');
        const root2_child1_child2_child1 = stateTree.getState('root2_child1_child2_child1');
        const root3_child1 = stateTree.getState('root3_child1');
        const root3_child2 = stateTree.getState('root3_child2');

        expect(root1_child1).not.to.be.null;
        expect(root2_child1_child1).not.to.be.null;
        expect(root2_child1_child2).not.to.be.null;
        expect(root2_child1_child2_child1).not.to.be.null;
        expect(root3_child1).not.to.be.null;
        expect(root3_child2).not.to.be.null;

        // An exception should be thrown if we don't supply two states
        expect(function() {
            StateTree.findCommonAncestor(null, null);
        }).to.throw('findCommonAncestor - stateA was invalid.');

        expect(function() {
            StateTree.findCommonAncestor(null, root1_child1);
        }).to.throw('findCommonAncestor - stateA was invalid.');

        expect(function() {
            StateTree.findCommonAncestor(root1_child1, null);
        }).to.throw('findCommonAncestor - stateB was invalid.');

        // If the same state is passed as both parameters, we should receive it back
        expect(StateTree.findCommonAncestor(root1_child1, root1_child1)).to.equal(root1_child1);

        // Verify ancestors are evaluated correctly
        expect(StateTree.findCommonAncestor(root1_child1, root2_child1_child1)).to.be.null;
        expect(StateTree.findCommonAncestor(root2_child1_child1, root2_child1_child2)).to.equal(root2_child1);
        expect(StateTree.findCommonAncestor(root2_child1_child2_child1, root2_child1_child1)).to.equal(root2_child1);
        //expect(StateTree.findCommonAncestor(root1_child, stateTree.getState('')).name).to.equal('');
        //expect(StateTree.findCommonAncestor(root1_child, stateTree.getState('')).name).to.equal('');
    });
});
