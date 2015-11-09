'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const debug = require('debug')('syncdb:server');

exports.url = 'http://localhost:6543/api/collection';

let data;
let lastSeqId;

exports.init = function () {
    debug('init');
    data = [
        {seqid: 1, id: '1', value: {field1: 'value1'}},
        {seqid: 2, id: '2', value: {field1: 'value2'}},
        {seqid: 3, id: '3', value: {field1: 'value3'}},
        {seqid: 6, id: '4', value: {field1: 'value4'}}
    ];
    exports.data = JSON.parse(JSON.stringify(data));

    lastSeqId = 6;
};

const app = new Koa();
const router = new Router({prefix: '/api/collection'});

router.get('/info', function *() {
    var since = optionalNumber(this.query.since, 0);
    var has = 0;
    var total =  data.length;
    for (var obj of data) {
        if (obj.seqid > since) {
            continue;
        }
        has++;
    }
    debug(`info (since ${since}): total=${total} remaining=${total - has}`);
    this.body = {data: {total, remaining: total - has}};
});

router.get('/', function *() {
    var since = optionalNumber(this.query.since, 0);
    var limit = optionalNumber(this.query.limit, 0);

    var result = [];
    var seqId;

    for (var obj of data) {
        if (obj.seqid <= since) {
            continue;
        }
        result.push(obj);
        seqId = obj.seqid;
        if (limit > 0 && limit === result.length) {
            break;
        }
    }

    if (seqId === undefined) seqId = data[data.length - 1].seqid;

    debug(`get (since ${since}, limit ${limit}): ${result.length} results (lastSeqId: ${seqId})`);
    this.body = {data: result};
});

router.post('/update', function *() {
    var body = this.request.body;
    var doc = data.find(obj => obj.id === body.id);
    if (!doc) {
        data.push(body);
        body.seqid = ++lastSeqId;
        debug(`insert new doc (id=${body.id}, seqid=${lastSeqId})`);
        this.body = {data: {seqid: lastSeqId}};
    } else {
        if (doc.seqid === body.seqid) {
            doc.seqid = ++lastSeqId;
            debug(`update doc (id=${body.id}, seqid=${lastSeqId})`);
            this.body = {data: {seqid: lastSeqId}};
        } else {
            this.status = 409;
            this.body = 'conflict';
        }
    }
});

app.use(bodyParser());
app.use(router.routes());

app.use(function *() {
    debug('missing route: ' + this.path);
});

app.listen(6543);

function optionalNumber(value, def) {
    if (value) return parseInt(value);
    return def;
}

function sortData() {
    data.sort(function (a, b) {
        return a.seqid - b.seqid;
    });
}
