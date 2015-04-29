'use strict';

var Sync = require('./sync');

function SyncDB(options) {
    if (!(this instanceof SyncDB)) {
        return new SyncDB(options);
    }

    if (typeof options !== 'object' || options === null) {
        throw new TypeError('options argument must be an object');
    }
    if (typeof options.driver !== 'object') {
        throw new TypeError('driver option must be an object');
    }

    this._driver = options.driver;
    this._url = options.url ? options.url : '';

    this._exec = null;
}

SyncDB.prototype.sync = function (options) {
    if (this._exec) {
        return this._exec;
    }
    options = options || {};
    var exec = new Sync(this._driver, this._url, options.limit);
    this._exec = exec;

    var self = this;

    function remove() {
        self._exec = null;
    }

    exec.then(remove);
    return exec;
};

module.exports = SyncDB;
