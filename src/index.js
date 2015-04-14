'use strict';

var url = require('url');

var Sync = require('./sync');

var driverS = Symbol('syncdb-driver');
var prefixS = Symbol('syncdb-prefix');
var initS = Symbol('syncdb-init');
var execS = Symbol('syncdb-exec');

function SyncDB(options) {
    if (!(this instanceof SyncDB))
        return new SyncDB(options);

    if (typeof options !== 'object' || options === null)
        throw new TypeError('options argument must be an object');
    if (typeof options.driver !== 'object')
        throw new TypeError('driver option must be an object');

    this[driverS] = options.driver;
    this[prefixS] = options.prefix ? options.prefix : '';

    this[execS] = new Map();
    this[initS] = options.driver.init();
}

SyncDB.prototype.sync = function (url) {
    var self = this;
    this[initS].then(function () {
        url = url.resolve(self[prefixS], url);
        if (self[execS].has(url))
            return self[execS].get(url);
        var exec = new Sync(self[driverS], url);
        self[execS].set(url, exec);

        var removed = false;
        function remove() {
            if (!removed) {
                self[execS].delete(url);
                removed = true;
            }
        }

        exec.on('error', remove);
        exec.on('end', remove);
    }, function (e) {
        throw e;
    });
};

module.exports = SyncDB;
