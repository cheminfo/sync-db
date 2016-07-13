'use strict';

var server = require('./mock/server');

var SyncDB = require('..');
var FakeDriver = require('./mock/driver');

describe('One sync', function () {
    it('should sync from scratch', function (done) {
        var mySync = new SyncDB({
            driver: new FakeDriver(),
            url: server.url
        });

        var inserted = 0;
        var info = false;

        var dataSync = mySync.sync();

        dataSync.on('end', function (result) {
            result.inserted.should.equal(inserted);
            info.total.should.equal(4);
            info.remaining.should.equal(4);
            done();
        });
        dataSync.on('info', function (_info) {
            info = _info;
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

    it('should sync remaining values', function (done) {
        var mySync = new SyncDB({
            driver: new FakeDriver(server.data.slice(0, 2)),
            url: server.url
        });

        var inserted = 0;
        var info = false;

        var dataSync = mySync.sync();

        dataSync.on('end', function (result) {
            result.inserted.should.equal(inserted);
            info.total.should.equal(4);
            info.remaining.should.equal(2);
            done();
        });
        dataSync.on('info', function (_info) {
            info = _info;
        });
        dataSync.on('progress', function () {
            inserted++;
        });
        dataSync.on('error', function (e) {
            done(e);
        });
    });

    it('should sync updated values', function (done) {
        var mySync = new SyncDB({
            driver: new FakeDriver([
                {
                    seqid: 3,
                    id: '3',
                    action: 'update',
                    value: {field1: 'oldvalue3'}
                },
                {
                    seqid: 6,
                    id: '4',
                    action: 'update',
                    value: {field1: 'oldvalue4'}
                },
                {
                    seqid: 7,
                    id: '1',
                    action: 'update',
                    value: {field1: 'value1'}
                },
                {
                    seqid: 9,
                    id: '2',
                    action: 'update',
                    value: {field1: 'value2'}
                }
            ]),
            url: server.url
        });

        var inserted = 0;
        var info = false;

        var dataSync = mySync.sync();

        dataSync.on('end', function (result) {
            result.inserted.should.equal(2);
            info.total.should.equal(4);
            info.remaining.should.equal(2);
            mySync._driver.getData().then(function (data) {
                data.length.should.equal(4);
                done();
            }).catch(done);
        });
        dataSync.on('info', function (_info) {
            info = _info;
        });
        dataSync.on('progress', function () {
            inserted++;
        });
        dataSync.on('error', function (e) {
            done(e);
        });
    });
});
