/**
 * Object used for managing a collection of events and their associated listeners.
 */
class EventProvider {
    constructor() {
        this._eventMap = new Map();
    }

    /**
     * Registers a new listener for a specified event.
     * @param {String} eventName - The name of the event the listener wishes to be notified of.
     * @param {Function} cb - The callback to be invoked when the specified event is raised.
     * @param {Object|null} o - The object the supplied callback belongs to.
     */
    on(eventName, cb, o) {
        if (!eventName) {
            throw new Error('EventProvider.on - No event name was specified.');
        }

        if (!cb) {
            throw new Error('EventProvider.on - No callback was specified.');
        }

        let event = this._eventMap.get(eventName);
        if (!event) {
            event = {
                listeners: []
            };

            this._eventMap.set(eventName, event);
        }

        event.listeners.push({
            cb: cb,
            o: o
        });
    }

    /**
     * Unregisters a previously registered listener from the event provider.
     * @param {String} eventName - The name of the event the listener was subscribed to.
     * @param {Function} cb - The callback that was registered.
     * @param {Object|null} o - The object the supplied callback belongs to.
     */
    off(eventName, cb, o) {
        const event = this._eventMap.get(eventName);
        if (event) {
            for (let loop = 0; loop < event.listeners.length; ++loop) {
                if (event.listeners[loop].cb === cb && event.listeners[loop].o === o) {
                    event.listeners.splice(loop, 1);
                    return;
                }
            }
        }
    }

    /**
     * Raises the specified event and notifies all listeners.
     * @param {String} eventName - The name of the event to be raised.
     * @param {Object} e - Argument that will be passed onto all listeners attached to the event.
     */
    fire(eventName, e) {
        const event = this._eventMap.get(eventName);
        if (event) {
            for (const listener of event.listeners) {
                listener.cb.call(listener.o, e);
            }
        }
    }
}

module.exports = EventProvider;
