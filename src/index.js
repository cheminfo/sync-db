'use strict';

const Sync = require('./sync');

class SyncDB {
    constructor(options) {
        if (typeof options !== 'object' || options === null) {
            throw new TypeError('options argument must be an object');
        }
        if (typeof options.driver !== 'object') {
            throw new TypeError('driver option must be an object');
        }

        this._driver = options.driver;
        this._url = options.url ? options.url : '';
        this._limit = options.limit || 5;

        this._exec = null;
    }

    sync() {
        if (this._exec) {
            return this._exec;
        }
        const exec = new Sync(this._driver, this._url, this._limit);
        this._exec = exec;

        exec.then(() => {this._exec = null;});
        return exec;
    }

    insert(docID, document) {
        return this._driver.get(docID).then(doc => {
            if (!doc) {
                doc = {
                    id: docID,
                    seqid: -1
                };
            }
            doc.revid = (doc.revid || 0) + 1;
            doc.date = Date.now();
            doc.value = document;
            return this._driver.insert(doc);
        });
    }

    remove(docID) {
        throw new Error('remove is unimplemented');
        //return this._driver.remove(docID);
    }

    get(docID) {
        return this._driver.get(docID).then(doc => doc.value);
    }

    getData() {
        return this._driver.getData().then(docs => docs.map(doc => doc.value));
    }

    clearDatabase() {
        return this._driver.clearDatabase();
    }
}

module.exports = SyncDB;
