'use strict';

var url = require('url');

module.exports = {
    pattern: '/api/collection[^/].*',
    fixtures: function () {
        return require('./collection.json');
    },
    callback: function (match, data) {
        var uri = url.parse(match[0], true);
        var since = 0;
        if (uri.query.since) {
            since = parseInt(uri.query.since);
        }
        var found = false;
        for (var i = 0; i < data.length; i++) {
            if (data[i].seqid > since) {
                data = data.slice(i);
                found = true;
                break;
            }
        }
        if (since && !found) {
            data = [];
        }
        if (uri.query.limit) {
            var limit = parseInt(uri.query.limit);
            if (data.length > limit) {
                data = data.slice(0, limit)
            }
        }
        var body = {
            data: data
        };
        if (data.length) {
            body.lastSeqId = data[data.length - 1].seqid;
        }

        return {
            body: body
        };
    }
};
