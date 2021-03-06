'use strict';

const chai = require('chai');
const expect = chai.expect;
const StateTree = require('../../lib/state_tree');
const InitArgs = require('../../lib/init_args');


/**
 * Verify the StateTree class behaves as expected.
 */
describe('state_tree', () => {
    it('Should throw an exception if no system factory is provided', () => {
        expect(function() {
            new StateTree(null, null);
        }).to.throw('StateTree.constructor - A valid system factory must be supplied during construction.');
    });

    it('Should throw an exception if no description is provided', () => {
        const mockFactory = {};

        expect(() => {
            new StateTree(mockFactory, null);
        }).to.throw('StateTree.constructor - No description was provided.');
    });

    it('Should be empty when constructed', () => {
        const name = 'CtorTest';
        const mockFactory = {};
        const Description = { name: name };

        const stateTree = new StateTree(mockFactory, Description);

        expect(stateTree.name).to.equal(name);
        expect(stateTree.activeState).to.be.null;
        expect(stateTree.defaultState).to.be.null;
        expect(stateTree.pendingState).to.be.null;
        expect(stateTree.systemFactory).to.equal(mockFactory);
        expect(stateTree.stateMap.size).to.equal(0);
        expect(stateTree.systemMap.size).to.equal(0);
    });

    it('Should throw an exception if no InitArgs is supplied to the onInitialize method.', () => {
        const name = 'CtorTest';
        const mockFactory = {};
        const Description = { name: name };

        const stateTree = new StateTree(mockFactory, Description);

        expect(function() {
            stateTree.onInitialize();
        }).to.throw('StateTree.onInitialize - No InitArgs object was provided.');
    });

    it('Should correctly identify common ancestors within the hierarchy', () => {
        const mockFactory = {};
        const initArgs = new InitArgs();

        const TestData = require('./ancestor_test.json');
        const stateTree = new StateTree(mockFactory, TestData);

        stateTree.onInitialize(initArgs);

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
