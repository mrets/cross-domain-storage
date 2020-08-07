'use strict';

function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
        }
        return arr2;
    } else {
        return Array.from(arr);
    }
}

var getId = require('../getId');

var prefix = 'sessionAccessId-';

function createId() {
    return prefix + Date.now();
}

module.exports = function storageGuest(source, parent) {
    parent = parent || document.body;

    var contentWindow = void 0;
    var callbacks = {};
    var sessionRequests = [];
    var connected = false;
    var closed = true;
    var connectedTimeout = void 0;
    var isLoaded = false;

    var iframe = document.createElement('iframe');
    iframe.src = source;
    iframe.width = 0;
    iframe.height = 0;
    iframe.style.display = 'none;';
    iframe.onload = function () {
        isLoaded = true;
    };

    function openStorage() {
        parent.appendChild(iframe);
        contentWindow = iframe.contentWindow;
        closed = false;

        window.addEventListener('message', handleMessage);

        checkConnected();
    }

    openStorage();

    function handleMessage(event) {
        var response = event.data;
        var sessionAccessId = getId(response);

        if (sessionAccessId === 'sessionAccessId-connected') {
            connected = true;
            return;
        }

        if (response.connectError) {
            Object.keys(callbacks).forEach(function (key) {
                return callbacks[key](response.error);
            });
            callbacks = {};
            return;
        }

        var callback = callbacks[sessionAccessId];

        if (sessionAccessId && callback) {
            callback(response.error, response.data);
        }
    }

    function close() {
        clearTimeout(connectedTimeout);
        window.removeEventListener('message', handleMessage);
        iframe.parentNode.removeChild(iframe);
        connected = false;
        closed = true;
    }

    function message(method, key, value, callback) {
        if (closed) {
            openStorage();
        }

        if (!connected && method !== 'connect') {
            sessionRequests.push([method, key, value, callback]);
        }

        var id = createId();

        if (callbacks && typeof callback === 'function') {
            callbacks[id] = callback;
        }

        if (isLoaded) {
            contentWindow.postMessage(
                {
                    method: method,
                    key: key,
                    value: value,
                    id: id,
                },
                source,
            );
        }
    }

    function get(key, callback) {
        if (!callback) {
            throw new Error('callback required for get');
        }

        message('get', key, null, callback);
    }

    function set(key, value, callback) {
        message('set', key, value, callback);
    }

    function remove(key, callback) {
        message('remove', key, null, callback);
    }

    function checkConnected() {
        if (connected) {
            clearTimeout(connectedTimeout);
            while (sessionRequests.length) {
                message.apply(undefined, _toConsumableArray(sessionRequests.pop()));
            }

            return;
        }

        message('connect');

        connectedTimeout = setTimeout(checkConnected, 125);
    }

    return {
        get: get,
        set: set,
        remove: remove,
        close: close,
    };
};
