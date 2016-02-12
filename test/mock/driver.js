'use strict';

const debug = require('debug')('syncdb:driver');

function FakeDriver(data) {
    if (data) {
        debug('new driver with data');
        this._data = data;
        this._lastSeq = data[data.length - 1].seqid;
    } else {
        debug('new driver without data');
        this._data = [];
        this._lastSeq = 0;
    }
}

FakeDriver.prototype.getLastSeqid = function () {
    debug(`getLastSeqid: ${this._lastSeq}`);
    return Promise.resolve(this._lastSeq);
};

FakeDriver.prototype.get = function (id) {
    var found = this._data.find(function (el) {
        return el.id === id;
    });
    debug(`get: id=${id} (${found ? '' : 'not '}found)`);
    return Promise.resolve(found);
};

FakeDriver.prototype.getData = function () {
    debug(`getData (${this._data.length} objects)`);
    return Promise.resolve(this._data);
};

FakeDriver.prototype.insert = function (obj) {
    for (var i = 0; i < this._data.length; i++) {
        if (this._data[i].id === obj.id) {
            this._data[i] = obj;
            this._lastSeq = obj.seqid;
            debug(`insert: updated ${obj.id}`);
            return Promise.resolve();
        }
    }
    this._data.push(obj);
    if (obj.seqid !== -1) this._lastSeq = obj.seqid;
    debug(`insert: added ${obj.id}`);
    return Promise.resolve();
};

FakeDriver.prototype.remove = function (id) {
    for (var i = 0; i < this._data.length; i++) {
        if (this._data[i].id === id) {
            this._data.splice(i, 1);
            return true;
        }
    }
    return false;
};

FakeDriver.prototype.getRevData = function () {
    var revdata = [];
    for (var obj of this._data) {
        if (obj.revid > 0) {
            revdata.push(obj);
        }
    }
    debug(`getRevData: (${revdata.length} objects)`);
    return Promise.resolve(revdata);
};

module.exports = FakeDriver;
