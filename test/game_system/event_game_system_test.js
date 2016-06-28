'use strict';

var chai = require('chai');
var expect = chai.expect;
var EventGameSystem = require('../../lib/game_system/event_game_system.js');

/**
 * Verify the EventGameSystem class behaves as expected.
 */
describe('event_game_system', () => {
    const TEST_EVENT = 'TestEvent';
    const UNUSED_EVENT = 'UnusedEvent';

    it('Should be empty when constructed', () => {
        const system = new EventGameSystem();

        expect(system.eventListeners.size).to.equal(0);
    });

    it('Should allow listeners to be added and removed', () => {
        const system = new EventGameSystem();
        const testCallback = function () {};

        system.addListener(TEST_EVENT, testCallback);

        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(1);

        system.removeListener(TEST_EVENT, testCallback);
        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(0);

        system.addListener(TEST_EVENT, testCallback);
        system.addListener(TEST_EVENT, testCallback);
        system.addListener(TEST_EVENT, testCallback);

        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(3);

        system.removeListener(TEST_EVENT, testCallback);
        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(2);

        system.removeListener(TEST_EVENT, testCallback);
        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(1);

        system.removeListener(TEST_EVENT, testCallback);
        expect(system.eventListeners.size).to.equal(1);
        expect(system.eventListeners.get(TEST_EVENT).length).to.equal(0);
    });

    it('Should invoke the appropriate function callback when fired', () => {
        const system = new EventGameSystem();
        let counter = 0;

        const testCallback = function () { counter ++; };

        system.addListener(TEST_EVENT, testCallback);

        expect(counter).to.equal(0);
        system.fire(UNUSED_EVENT);
        expect(counter).to.equal(0);
        system.fire(TEST_EVENT);
        expect(counter).to.equal(1);
    });

    it('Should invoke the appropriate object callback when fired', () => {
        const system = new EventGameSystem();

        const testObject = {
            counter: 0,
            testCallback: function () {
                this.counter++;
            }
        };

        system.addListener(TEST_EVENT, testObject.testCallback, testObject);

        expect(testObject.counter).to.equal(0);
        system.fire(UNUSED_EVENT);
        expect(testObject.counter).to.equal(0);
        system.fire(TEST_EVENT);
        expect(testObject.counter).to.equal(1);
    });

    it('Should invoke multiple callback when fired', () => {
        const system = new EventGameSystem();

        let counter = 0;

        const funcCallback = function () { counter ++; };
        const testObject = {
            counter: 0,
            objCallback: function () {
                this.counter++;
            }
        };

        system.addListener(TEST_EVENT, funcCallback);
        system.addListener(TEST_EVENT, testObject.objCallback, testObject);

        expect(counter).to.equal(0);
        expect(testObject.counter).to.equal(0);
        system.fire(UNUSED_EVENT);
        expect(counter).to.equal(0);
        expect(testObject.counter).to.equal(0);
        system.fire(TEST_EVENT);
        expect(counter).to.equal(1);
        expect(testObject.counter).to.equal(1);
    });
});
