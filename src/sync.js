'use strict';

var Util = require('util');
var EventEmitter = require('events').EventEmitter;

var agent = require('superagent');

function Sync(driver, url) {
    EventEmitter.call(this);
    this._driver = driver;
    this._url = url;
    this._seqid = 0;
    this._inserted = 0;
    this._limit = 5;
    var self = this;
    driver.init().then(function () {
        self._start();
    }, function (e) {
        self.emit('error', e);
    });
}

Util.inherits(Sync, EventEmitter);

Sync.prototype._start = function () {
    var self = this;
    this._driver.getLastSeq().then(function (id) {
        self._seqid = id;
        var infoUrl = self._url + '/info?since=' + id;
        agent.get(infoUrl).end(function (err, result) {
            if (err) return self.emit('error', err);
            self.emit('progress', {
                type: 'info',
                value: result.body
            });
            self._fetch();
        });
    }).catch(function (err) {
        self.emit('error', err);
    });
};

Sync.prototype._fetch = function () {
    var self = this;
    var url = this._url + '?since=' + this._seqid + '&limit=' + this._limit;
    agent.get(url).end(function (err, response) {
        if (err) return self.emit('error', err);
        var result = response.body.data;
        var i = 0;
        insert();

        function insert() {
            if (result.length > i) {
                var res = result[i++];
                self._driver.insert(res).then(function () {
                    self._seqid = res.seqid;
                    self._inserted++;
                    self.emit('progress', {
                        type: 'insert',
                        value: res.value
                    });
                    insert();
                }, function (err) {
                    self.emit('error', err);
                });
            } else if (result.length === 0) {
                self.emit('end', {
                    inserted: self._inserted
                });
            } else {
                self._fetch();
            }
        }
    })
};

module.exports = Sync;
