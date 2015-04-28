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
    this._promise = driver.init().then(function () {
        return self._start();
    });
    this._promise.catch(function (e) {
        self.emit('error', e);
    });
    this.then = this._promise.then.bind(this._promise);
}

Util.inherits(Sync, EventEmitter);

Sync.prototype._start = function () {
    var self = this;
    return this._driver.getLastSeq().then(function (id) {
        return new Promise(function (resolve, reject) {
            self._seqid = id;
            var infoUrl = self._url + '/info?since=' + id;
            agent.get(infoUrl).end(function (err, result) {
                if (err) return reject(err);
                self.emit('progress', {
                    type: 'info',
                    value: result.body
                });
                self._fetch(resolve, reject);
            });
        });
    });
};

Sync.prototype._fetch = function (resolve, reject) {
    var self = this;
    var url = this._url + '?since=' + this._seqid + '&limit=' + this._limit;
    agent.get(url).end(function (err, response) {
        if (err) return reject(err);
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
                }, reject);
            } else if (result.length === 0) {
                var resInfo = {
                    inserted: self._inserted
                };
                self.emit('end', resInfo);
                resolve(resInfo);
            } else {
                self._fetch();
            }
        }
    })
};

module.exports = Sync;
