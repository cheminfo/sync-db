'use strict';

var Url = require('url');

var Sync = require('./sync');

function SyncDB(options) {
    if (!(this instanceof SyncDB))
        return new SyncDB(options);

    if (typeof options !== 'object' || options === null)
        throw new TypeError('options argument must be an object');
    if (typeof options.driver !== 'object')
        throw new TypeError('driver option must be an object');

    this._driver = options.driver;
    this._prefix = options.prefix ? options.prefix : '';

    this._exec = new Map();
}

SyncDB.prototype.sync = function (url) {
    url = Url.resolve(this._prefix, url);
    if (this._exec.has(url))
        return this._exec.get(url);
    var exec = new Sync(this._driver, url);
    this._exec.set(url, exec);

    var self = this;
    var removed = false;
    function remove() {
        if (!removed) {
            self._exec.delete(url);
            removed = true;
        }
    }
    exec.on('error', remove);
    exec.on('end', remove);

    return exec;
};

module.exports = SyncDB;
