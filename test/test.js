'use strict';

var request = require('superagent');
var config = require('./mock/superagent');
require('superagent-mock')(request, config);

var SyncDB = require('..');
var FakeDriver = require('./mock/driver');

describe('SyncDB', function () {

    it('blabla', function () {
        var mySync = new SyncDB({
            driver: new FakeDriver(),
            prefix: 'http://localhost:1234/v1.2.0/prod/'
        });

        var data1Sync = mySync.sync('data1');

        data1Sync.on('end', function (result) {

        });
        data1Sync.on('progress', function () {

        });
        data1Sync.on('error', function () {

        });
        data1Sync.on('conflict', function (localDoc, remoteDoc, resolve) {

        });

        var data2Sync = mySync.sync('data2');
    });

});
