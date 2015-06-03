# Sync API Specifications

## Server

### Push data from client

For collections that need two-way synchronisation.
The server is always the master and it decides if the data being sent is valid or not for insertion. The decision is based on the `seqid` of the document.

#### POST /collection

```yaml
{
  id: 1234,
  seqid: 4,
  date: 1433318689266,
  state: "update",
  value: {...}
}
```

#### Handle POST request

1. Let *body* be the result of parsing the request data as a JSON.
2. If parsing fails, return failure.
3. If *body* is not an object, return failure.
4. If *body* does not contain `id`, `date` and `value` fields, return failure.
5. Let *doc* be the result of searching a local document with *id*.
6. If *doc* is null, run these substeps:
 1. Let *doc* be a new document using `id`, `date` and `value` fields from *body*.
 2. Assign a new `seqid` to *doc* and save it.
 3. Return *doc.seqid*.
7. If *doc.seqid* is equal to *body.seqid*, run these substeps:
 1. Replace the `value` and `date` fields of *doc* with the ones from *body*.
 2. Assign a new `seqid` to *doc* and save it.
 3. Return *doc.seqid*.
8. If *doc.seqid* is different from *body.seqid*, return failure.
