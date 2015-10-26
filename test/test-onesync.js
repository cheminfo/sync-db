'use strict';

var request = require('superagent');
var config = require('./mock/superagent');
require('superagent-mock')(request, config);

var SyncDB = require('..');
var FakeDriver = require('./mock/driver');

describe('One sync', function () {

    it('should sync', function (done) {
        var mySync = new SyncDB({
            driver: new FakeDriver(),
            url: '/api/collection'
        });

        var inserted = 0;
        var info = false;

        var dataSync = mySync.sync();

        dataSync.on('end', function (result) {
            result.inserted.should.equal(inserted);
            info.should.be.true();
            done();
        });
        dataSync.on('info', function () {
            info = true;
        });
        dataSync.on('progress', function () {
            inserted++;
        });
        dataSync.on('error', function (e) {
            done(e);
        });
        /*dataSync.on('conflict', function (localDoc, remoteDoc, resolve) {

        });*/

    });

});
