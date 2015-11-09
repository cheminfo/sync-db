0.2.0 / 2015-11-09
==================

* all responses from the server must have a "data" property

0.1.8 / 2015-11-05
==================

* fix handling of conflict response from server

0.1.7 / 2015-10-26
==================

* add onGet callback
* fix pull to not create a conflict all the time

0.1.6 / 2015-10-23
==================

* fix infinite loop in nextIDForConflict

0.1.5 / 2015-10-23
==================

* create new id in case of conflict

0.1.4 / 2015-10-23
==================

* correctly set seqid after push

0.1.3 / 2015-10-23
==================

* implement conflict handling

0.1.2 / 2015-10-09
==================

* fix error emission in Sync

0.1.1 / 2015-10-09
==================

* fix insert

0.1.0 / 2015-10-08
==================

* move limit to global options
* support push (if no conflict)
* add insert and clearDatabase

0.0.5 / 2015-05-29
==================

* removed `init` requirement from the driver API.

0.0.4 / 2015-04-29
==================

* driver.init should be a Promise instead of a function returning one.
* added limit option for sync (default: 5)
* separate progress and info events

0.0.3 / 2015-04-28
==================

* Fix promise resolving

0.0.2 / 2015-04-28
==================

* A new SyncDB instance must be created for each collection

0.0.1 / 2015-04-27
==================

* first experimental version
