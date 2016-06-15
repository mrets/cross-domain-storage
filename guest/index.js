
var crel = require('crel');
var prefix = 'sessionAccessId-';
var getId = require('../getId');

module.exports = function storageGuest(source, parent) {
    parent = parent || document.body;

    var iframe;
    var contentWindow;
    var callbacks = {};
    var sessionRequests = [];
    var connected = false;
    var closed = true;
    var connectedTimeout;

    iframe = crel('iframe', {
        src: source,
        width: 0,
        height: 0,
        style: 'display: none;',
    });

    function openStorage() {
        parent.appendChild(iframe);
        contentWindow = iframe.contentWindow;
        closed = false;

        window.addEventListener('message', handleMessage);

        checkConnected();
    }
    openStorage();

    function createId() {
        return prefix + Date.now();
    }

    function handleMessage(event) {
        var response = event.data;
        var sessionAccessId = getId(response);

        if (sessionAccessId === 'sessionAccessId-connected') {
            connected = true;
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
        iframe.remove();
        connected = false;
        closed = true;
    }

    function message(method, key, value, callback) {
        if (closed) {
            openStorage();
        }

        if (!connected && method !== 'connect') {
            sessionRequests.push(Array.prototype.slice.call(arguments));
        }

        var id = createId();

        callbacks[id] = callback;

        contentWindow.postMessage({
            method: method,
            key: key,
            value: value,
            id: id,
        }, source);
    }

    function get(key, callback) {
        if (!callback) {
            throw (new Error('callback required for get'));
        }

        message('get', key, null, callback);
    }

    function set(key, value, callback) {
        message('set', key, value, null, callback);
    }

    function remove(key, callback) {
        message('remove', key, null, callback);
    }

    function checkConnected() {
        if (connected) {
            clearTimeout(connectedTimeout);
            while (sessionRequests.length) {
                message.apply(null, sessionRequests.pop());
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
