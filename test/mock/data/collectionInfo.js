'use strict';

var url = require('url');

module.exports = {
    pattern: '/api/collection/info.*',
    fixtures: function () {
        return require('./collection.json');
    },
    callback: function (match, data) {
        var uri = url.parse(match[0], true);
        var since = 0;
        if (uri.query.since) {
            since = parseInt(uri.query.since);
        }

        var remaining = 0;
        for (var i = 0; i < data.length; i++) {
            if (data[i].seqid > since) {
                remaining = data.length - i;
                break;
            }
        }

        return {
            body: {
                total: data.length,
                remaining: remaining
            }
        };
    }
};
