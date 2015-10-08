'use strict';

const EventEmitter = require('events');
const agent = require('superagent');

class Sync extends EventEmitter {
    constructor(driver, url, limit) {
        super();
        this._driver = driver;
        this._url = url;
        this._seqid = 0;
        this._inserted = 0;
        this._limit = limit;

        this._promise = this._start();
        this._promise.catch(e => {
            if (EventEmitter.listenerCount('error') > 0) {
                this.emit('error', e);
            }
        });
        this.then = this._promise.then.bind(this._promise);
    }

    _start() {
        return this._driver.getLastSeq().then(id => {
            return new Promise((resolve, reject) => {
                this._seqid = id;
                const infoUrl = this._url + '/info?since=' + id;
                agent.get(infoUrl).end((err, result) => {
                    if (err) return reject(err);
                    this.emit('info', result.body);
                    this._fetch(resolve, reject);
                });
            });
        });
    }

    _fetch(resolve, reject) {
        const url = `${this._url}?since=${this._seqid}&limit=${this._limit}`;
        agent.get(url).end((err, response) => {
            if (err) return reject(err);
            const result = response.body.data;
            let i = 0;
            const insert = () => {
                if (result.length > i) {
                    var res = result[i++];
                    this._driver.insert(res).then(() => {
                        this._seqid = res.seqid;
                        this._inserted++;
                        this.emit('progress', res);
                        insert();
                    }, reject);
                } else if (result.length === 0) {
                    var resInfo = {
                        inserted: this._inserted
                    };
                    this.emit('end', resInfo);
                    resolve(resInfo);
                } else {
                    this._fetch(resolve, reject);
                }
            };
            insert();
        });
    }
}

module.exports = Sync;
