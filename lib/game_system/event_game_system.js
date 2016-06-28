const GameSystem = require('./index.js');

/**
 * Extended base class for game systems, this class provides support for a game system to supply events
 * to external objects. A game system may broadcast an event to interested listeners by calling the
 * 'fire' method.
 */
class EventGameSystem extends GameSystem {
    constructor() {
        super();

        this.eventListeners = new Map();
    }

    /**
     * Registers a callback to be invoked when a particular event is raised.
     * @param {String} name - Name of the event the callback wishes to listen for.
     * @param {Function} handler - The callback function to be invoked when the specified event is raised.
     * @param {Object=} obj - The object instance the method belongs to.
     */
    addListener(name, handler, obj) {
        if (!this.eventListeners.has(name)) {
            this.eventListeners.set( name, [] );
        }

        this.eventListeners.get(name).push({
            f: handler,
            o: obj
        });
    }

    /**
     * Removes a listener from a specified event.
     * @param {String} name - Name of the event the listener wishes to be removed from.
     * @param {Function} handler - The callback function to be removed from the event.
     * @param {Object=} obj - The object instance the method belongs to.
     */
    removeListener(name, handler, obj) {
        const listeners = this.eventListeners.get(name);
        if (listeners) {
            const l = listeners.length;

            for (let loop = 0; loop < l; ++loop ) {
                if (listeners[loop].f === handler && listeners[loop].o === obj) {
                    listeners.splice(loop, 1);
                    return;
                }
            }
        }
    }

    /**
     * Raises an event within the game server, any listeners for this event will be notified.
     * @param {String} name - Name of the event to be fired.
     * @param {Object=} data = Data associated with the raised event.
     */
    fire(name, data) {
        const listeners = this.eventListeners.get(name);
        if (listeners) {
            for (const handler of listeners) {
                if (handler.o) {
                    handler.f.call(handler.o, data);
                } else {
                    handler.f(data);
                }
            }
        }
    }
}

module.exports = EventGameSystem;
