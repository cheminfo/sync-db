'use strict';

var server = require('./mock/server');

var SyncDB = require('..');
var FakeDriver = require('./mock/driver');

describe('One sync with insert', function () {

    it('should insert new data', function () {
        var driver = new FakeDriver(server.data);
        var mySync = new SyncDB({
            driver,
            url: server.url
        });

        return Promise.all([
            mySync.insert('5', {field1: 'value5'}),
            mySync.insert('6', {field1: 'value6'})
        ]).then(function () {
            return driver.get('6').then(function (data) {
                data.id.should.equal('6');
                data.seqid.should.equal(-1);
                data.revid.should.equal(1);
                data.value.field1.should.equal('value6');
                return mySync.sync().then(function () {
                    return driver.get('6').then(function (data) {
                        data.seqid.should.equal(8);
                    });
                });
            });
        });
    });
});
