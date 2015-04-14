'use strict';

var SyncDB = require('..');
var SyncIDB = require('sync-db-indexeddb');

describe('SyncDB', function () {

    it('blabla', function () {
        var mySync = new SyncDB({
            driver: SyncIDB({name: 'mydb'}),
            prefix: 'http://localhost/api'
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
