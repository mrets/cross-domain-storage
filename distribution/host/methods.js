'use strict';

var connectId = 'sessionAccessId-connected';

module.exports = {
    get: function get(event, data) {
        event.source.postMessage(
            {
                id: data.id,
                data: window.localStorage.getItem(data.key),
            },
            event.origin,
        );
    },
    set: function set(event, data) {
        window.localStorage.setItem(data.key, data.value);

        event.source.postMessage(
            {
                id: data.id,
            },
            event.origin,
        );
    },
    remove: function remove(event, data) {
        window.localStorage.removeItem(data.key);

        event.source.postMessage(
            {
                id: data.id,
            },
            event.origin,
        );
    },
    connect: function connect(event) {
        event.source.postMessage(
            {
                id: connectId,
            },
            event.origin,
        );
    },
};