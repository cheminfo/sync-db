'use strict';

const EventEmitter = require('events');
const agent = require('./superagent');
const debug = require('debug')('syncdb:sync');

class Sync extends EventEmitter {
    constructor(driver, url, limit) {
        debug('new sync');
        super();
        this._driver = driver;
        this._url = url;
        this._seqid = 0;
        this._inserted = 0;
        this._pushed = 0;
        this._limit = limit;

        this._promise = this._start();
        this._promise.catch(e => {
            // This check is needed, otherwise it will throw an exception if
            // there is no error listener
            if (this.listenerCount('error') > 0) {
                this.emit('error', e);
            }
        });
        this.then = this._promise.then.bind(this._promise);
    }

    async _start() {
        debug('start sync');
        // Get last local seqid
        const id = await this._driver.getLastSeqid();
        this._seqid = id;
        const infoUrl = `${this._url}/info?since=${id}`;
        // Get remaining sync steps from server
        const result = await agent.get(infoUrl).withCredentials().end();
        this.emit('info', result.body.data);
        return await this._fetch();
    }

    async _fetch() {
        debug('_fetch');
        const url = `${this._url}?since=${this._seqid}&limit=${this._limit}`;
        const response = await agent.get(url).withCredentials().end();
        const result = response.body.data;
        if (result.length === 0) {
            return await this._push();
        }
        let i = 0;
        const insertNext = () => {
            if (result.length > i) {
                const res = result[i++];
                return this._insert(res).then(() => {
                    this._seqid = res.seqid;
                    this._inserted++;
                    this.emit('progress', res);
                    return insertNext();
                });
            } else {
                return this._fetch();
            }
        };
        return await insertNext();
    }

    async _insert(data) {
        debug('_insert');
        const doc = await this._driver.get(data.id);
        const toInsert = {
            id: data.id,
            seqid: data.seqid,
            revid: 0,
            date: data.date,
            value: data.value
        };
        if (doc && doc.seqid !== data.seqid) {
            const id = await nextIDForConflict(doc.id, this._driver, 0);
            const docBackup = {
                id,
                seqid: -1,
                revid: 0,
                date: doc.date,
                value: doc.value
            };
            await this._driver.insert(docBackup);
            return await this._driver.insert(toInsert);
        } else {
            return await this._driver.insert(toInsert);
        }
    }

    _push() {
        debug('_push');
        return this._driver.getRevData().then((data) => {
            const url = `${this._url}/update`;
            let i = 0;
            const pushNext = () => {
                if (data.length > i) {
                    const obj = data[i++];
                    const toPush = {
                        id: obj.id,
                        seqid: obj.seqid,
                        date: obj.date,
                        state: 'update',
                        value: obj.value
                    };
                    return agent.post(url).send(toPush).withCredentials().end().then(response => {
                        toPush.seqid = response.body.data.seqid;
                        return this._driver.insert(toPush).then(() => {
                            this._pushed++;
                            return pushNext();
                        });
                    }, e => {
                        if (e.status === 409) {
                            return this._fetch();
                        }
                        return Promise.reject(e);
                    });
                } else {
                    return this._end();
                }
            };
            return pushNext();
        });
    }

    _end() {
        debug('end sync');
        var resInfo = {
            inserted: this._inserted,
            pushed: this._pushed
        };
        this.emit('end', resInfo);
        return resInfo;
    }
}

module.exports = Sync;

async function nextIDForConflict(currentID, driver, it) {
    if (it === undefined) it = 0;
    const id = currentID + '_' + it;
    const data = await driver.get(id);
    if (!data) return id;
    else return await nextIDForConflict(currentID, driver, ++it);
}
