'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const data = [
    {seqid: 1, id: "1", value: {field1: "value1"}},
    {seqid: 2, id: "2", value: {field1: "value2"}},
    {seqid: 3, id: "3", value: {field1: "value3"}},
    {seqid: 6, id: "4", value: {field1: "value4"}}
];
let lastSeqId = 6;

const app = new Koa();
const router = new Router({prefix: '/api/collection'});

router.get('/info', function *() {
    var since = optionalNumber(this.query.since, 0);
    var remaining = 0;
    var total =  data.length;
    for (var obj of data) {
        if (obj.seqid >= since) {
            continue;
        }
        remaining++;
    }
    this.body = {total, remaining};
});

router.get('/', function *() {
    var since = optionalNumber(this.query.since, 0);
    var limit = optionalNumber(this.query.limit, 0);

    var result = [];
    var seqId;

    for (var obj of data) {
        if (obj.seqid >= since) {
            continue;
        }
        result.push(obj);
        seqId = obj.seqid;
        if (limit > 0 && limit === result.length) {
            break;
        }
    }

    this.body = {data: result, lastSeqId: seqId};
});

app.use(bodyParser());
app.use(router.routes());

app.use(function *() {
    console.log('missing route:', this.path);
});

app.listen(6543);

function optionalNumber(value, def) {
    if (value) return parseInt(value);
    return def;
}
