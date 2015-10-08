# JavaScript API

## new SyncDB(options)

__options__

* driver: instance of a driver that handles local data storage. Drivers must implement the [Driver API](./Driver.md).
* url: URL of the server-side API
* limit: maximum number of entries to fetch per request (default: 5)

## SyncDB#sync()

Start a new synchronization with the server. If one is already in progress, returns it.

## SyncDB#insert(docID, document)

Create a new document or update it if a document with the same ID already exists.

## SyncDB#remove(docID)

Remove a document.

## SyncDB#get(docID)

Get a document by ID.

## SyncDB#getData()

Get an array with all documents.
