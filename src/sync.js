'use strict';

const EventEmitter = require('events');
const agent = require('./superagent');

class Sync extends EventEmitter {
    constructor(driver, url, limit) {
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
            if (EventEmitter.listenerCount('error') > 0) {
                this.emit('error', e);
            }
        });
        this.then = this._promise.then.bind(this._promise);
    }

    _start() {
        // Get last local seqid
        return this._driver.getLastSeqid().then(id => {
            this._seqid = id;
            const infoUrl = `${this._url}/info?since=${id}`;
            // Get remaining sync steps from server
            return agent.get(infoUrl).end().then(result => {
                this.emit('info', result.body);
                return this._fetch();
            });
        });
    }

    _fetch() {
        const url = `${this._url}?since=${this._seqid}&limit=${this._limit}`;
        return agent.get(url).end().then(response => {
            const result = response.body.data;
            if (result.length === 0) {
                return this._push();
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
            return insertNext();
        });
    }

    _insert(data) {
        return this._driver.get(data.id).then(doc => {
            if (doc && doc.seqid !== data.seqid) {
                // todo resolve conflict
                console.error(doc, data);
                throw new Error('Conflict on fetch!!!');
            }
            const toInsert = {
                id: data.id,
                seqid: data.seqid,
                revid: 0,
                date: data.date,
                value: data.value
            };
            return this._driver.insert(toInsert);
        });
    }

    _push() {
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
                    return agent.post(url).send(toPush).end().then(response => {
                        if (response.status !== 200) {
                            // todo resolve conflict
                            console.error(data, response);
                            throw new Error('Conflict on push!!!')
                        }
                        toPush.seqid = response.seqid;
                        return this._insert(toPush).then(() => {
                            this._pushed++;
                            return pushNext();
                        });
                    });
                } else {
                    return this._end();
                }
            };
            return pushNext();
        });
    }

    _end() {
        var resInfo = {
            inserted: this._inserted,
            pushed: this._pushed
        };
        this.emit('end', resInfo);
        return resInfo;
    }
}

module.exports = Sync;
