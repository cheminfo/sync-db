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
        this._deleted = 0;
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
        this.emit('info', result.body);
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
        for (let i = 0; i < result.length; i++) {
            const res = result[i];
            if (res.action === 'update') {
                await this._insert(res);
                this._inserted++;
            } else if (res.action === 'delete') {
                await this._delete(res);
                this._deleted++;
            } else {
                throw new Error('unexpected action: ' + res.action);
            }
            this._seqid = res.seqid;
            this.emit('progress', res);
        }
        return await this._fetch();
    }

    async _insert(data) {
        debug('_insert');
        if (!data.seqid) {
            // data must have a seqid
            throw new Error('got data without seqid: ' + JSON.stringify(data));
        }
        const doc = await this._driver.get(data.id);
        const toInsert = {
            id: data.id,
            seqid: data.seqid,
            revid: 0,
            date: data.date,
            value: data.value
        };
        if (doc) {
            // doc exists locally
            if (doc.seqid === data.seqid) {
                // same seqid. we already got this value. nothing to do
                return;
            } else if (doc.seqid > data.seqid) {
                // seqid is maintained by the server and can only become bigger
                throw new Error(`got data with unexpected seqid ${data.seqid} lower than current ${doc.seqid}`);
            } else {
                // seqid is bigger than local. update needed
                if (doc.revid > 0) {
                    // conflict: data changed both locally and on the server
                    const id = await nextIDForConflict(doc.id, this._driver, 0);
                    const docBackup = {
                        id,
                        seqid: -1,
                        revid: 0,
                        date: doc.date,
                        value: doc.value
                    };
                    await this._driver.insert(docBackup);
                }
                return await this._driver.insert(toInsert);
            }
        } else {
            // doc does not exist locally. just insert
            return await this._driver.insert(toInsert);
        }
    }

    async _delete(data) {
        await this._driver.remove(data.id);
    }

    async _push() {
        debug('_push');
        const data = await this._driver.getRevData();
        const url = `${this._url}/update`;
        for (let i = 0; i < data.length; i++) {
            const obj = data[i];
            const toPush = {
                id: obj.id,
                seqid: obj.seqid,
                date: obj.date,
                state: 'update',
                value: obj.value
            };
            let response;
            try {
                response = await agent.post(url).send(toPush).withCredentials().end();
            } catch (e) {
                if (e.status === 409) {
                    await this._fetch();
                } else {
                    throw e;
                }
            }
            if (response.body.seqid) {
                toPush.seqid = response.body.seqid;
                await this._driver.insert(toPush);
                this._pushed++;
            } else {
                throw new Error('no seqid in response from server: ' + JSON.stringify(response.body));
            }
        }
        return this._end();
    }

    _end() {
        debug('end sync');
        var resInfo = {
            inserted: this._inserted,
            deleted: this._deleted,
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
