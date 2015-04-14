'use strict';

var Util = require('util');
var EventEmitter = require('events').EventEmitter;

var agent = require('superagent');

var driverS = Symbol('sync-driver');
var urlS = Symbol('sync-url');
var startS = Symbol('sync-start');

function Sync(driver, url) {
    EventEmitter.call(this);
    this[driverS] = driver;
    this[urlS] = url;
    this[startS]();
}

Util.inherits(Sync, EventEmitter);

Sync.prototype[startS] = function () {
    var self = this;
    this[driverS].getLastSeq().then(function (id) {
        // request number of documents, then start fetching
    });
};
