## IDB.js - AMD module for managing IndexedDB with Promises.

idb.js is an [AMD module](http://requirejs.org/) that helps manage browser side storage.  It wraps asyncronous IndexedDB methods into Promises, simplifying db creation, updating, and error catching.

This module depends on a Global Promise that older browsers might not support, you may want to include a pollyfill like [npo.js](https://github.com/getify/native-promise-only).


## Example of use:
```javascript

require([ 'idb' ], function(IDB){

  // create or connect to database, returns a promise
  IDB({
    name: 'the_db_name',
    version: 1,
    tables: [
      {
        name: "the_table_name", // example: 'user_list', 'datasource', 'state'
        keyPath: 'theKeyPath', // example: 'id', 'uid', 'name', 'email'
        indexes: { // optional - define additional indexs
          name: {},
          email: { unique: true },
          foo: {},
          bar: {}
        }
      }
    ]
  }).then(function(db){

    // the returned "db" object wraps promise prototype methods around the IDBDatabase
    // you can manually access the result of window.indexedDB.open(name, version) with db.connection
    console.log(db.connection);

    // add records to the table
    db.add('the_table_name', [
      { theKeyPath: "first", value: "A" },
      { theKeyPath: "second", value: "B" },
      { theKeyPath: "third", value: "C" }
    ]).then(function(){
      // created three records
    });

     // delete records from the table
    db.delete('the_table_name', [ "first", "second", "third"]).then(function(){
      // deleted three records (by keyPath)
    });

    // get a record
    db.get('the_table_name', "second").then(function(response){
      console.log(response);
    });

    // update records in the table (by keyPath)
    db.update('the_table_name',{ theKeyPath: "first", value: "Apple" }).then({
      // updated one record
    });

    // add records to the table if they do not already exist
    // update records in the table if they already exist
    db.upsert('the_table_name', [
      { theKeyPath: "first", value: "A" },
      { theKeyPath: "second", value: "B" },
      { theKeyPath: "third", value: "C" }
    ]).then(function(){
      // created or updated three records
    });

    // set all of the tables records in one command
    // any record not specified will be deleted
    db.set('the_table_name', [
      { theKeyPath: "second", value: "B" },
      { theKeyPath: "third", value: "C" }
    ]).then(function(){
      // delete all records exept where keyPath === "second" or "third"
      // upsert (create or update) record "second" and "third"
      // similar to calling clear then add, but will only delete records
      // that are not specified
    });

    // list all items in the table
    db.query('the_table_name').then(function(list) {
      console.log(list); // array
    });

    // count
    db.count('the_table_name').then(function(count){
      console.log(count); // number of records in the table
    });

    // clear table
    db.clear('the_table_name').then(function(){
      // deleted all records in the table
    });

    // close db connection
    db.close();

  }).catch(function (err) {
    console.error(err);
  });

});
```