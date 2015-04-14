'use strict';

function FakeDriver() {
    this._lastSeq = 0;
}

FakeDriver.prototype.init = function () {
    return Promise.resolve();
};

FakeDriver.prototype.getLastSeq = function () {
    return Promise.resolve(this._lastSeq);
};

module.exports = FakeDriver;
