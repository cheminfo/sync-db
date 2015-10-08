'use strict';

function FakeDriver() {
    this._lastSeq = 0;
    this._data = [];
}

FakeDriver.prototype.getLastSeqid = function () {
    return Promise.resolve(this._lastSeq);
};

FakeDriver.prototype.get = function (id) {
    return Promise.resolve(this._data.find(function (el) {
        return el.id === id;
    }));
};

FakeDriver.prototype.getData = function () {
    return Promise.resolve(this._data.map(function (el) {
        return el.value;
    }));
};

FakeDriver.prototype.insert = function (obj) {
    for (var i = 0; i < this._data.length; i++) {
        if (this._data[i].id === obj.id) {
            this._data[i] = obj.value;
            this._lastSeq = obj.seqid;
            return Promise.resolve();
        }
    }
    this._data.push(obj.value);
    this._lastSeq = obj.seqid;
    return Promise.resolve();
};

FakeDriver.prototype.getRevData = function () {
    return Promise.resolve([]);
};

module.exports = FakeDriver;
