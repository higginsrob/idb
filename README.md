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
    schema: {
      "the_table_name": {
        key: {
          keyPath: 'theKeyPath' // example: 'name', 'id', 'uid'
        },
        // define optional index schema
        indexes: {
          name: {},
          email: { unique: true }
          foo: {},
          bar: {}
        }
      }
    }
  }).then(function(db){

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