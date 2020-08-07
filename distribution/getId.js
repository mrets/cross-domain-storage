'use strict';

var prefix = 'sessionAccessId-';

function getId(data) {
    var id = void 0;

    if (data && data.id && ~data.id.indexOf(prefix)) {
        id = data.id;
    }

    return id;
}

module.exports = getId;