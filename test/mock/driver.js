'use strict';

function FakeDriver() {
    this._lastSeq = 0;
    this._data = [];
}

FakeDriver.prototype.getLastSeq = function () {
    return Promise.resolve(this._lastSeq);
};

FakeDriver.prototype.getData = function () {
    return Promise.resolve(this._data.slice());
};

FakeDriver.prototype.insert = function (obj) {
    for (var i = 0; i < this._data.length; i++) {
        if (this._data[i].id === obj.id) {
            this._data[i] = obj.data;
            this._lastSeq = obj.seqid;
            return Promise.resolve();
        }
    }
    this._data.push(obj.value);
    this._lastSeq = obj.seqid;
    return Promise.resolve();
};

module.exports = FakeDriver;
