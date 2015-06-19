## storage - AMD module for managing IndexedDB (with Promises), localStorage, sessionStorage, and cookies

storage.js is an AMD module (requireJS) that helps manage browser side storage.  It wraps asyncronous IndexedDB methods into Promises, and simplifies db creation/updating.  It also allows you to use the same api to manage localStorage, sessionStorage, and cookies, making your code interchangable between all three.

Included in this repo is Kyle Simpson "npo.js" polyfill (https://github.com/getify/native-promise-only), and is only loaded if there is no global Promise method.

## IndexedDB
```javascript
Storage.db({
  name: 'the_db_name',
  version: 1,
  schema: {
    "the_table_name": {
      key: {
        keyPath: 'theKeyPath'
      },
      // optional indexes
      indexes: {
        name: {},
        email: { unique: true }
      }
    }
  }
}).then(function (db) {

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
```

## LocalStorage
```javascript
Storage.local.clear();                    // clear localStorage
Storage.local.getItem(key);               // get item in storage
Storage.local.key(index)                  // get key at index
Storage.local.keys()                      // array of all keys in storage
Storage.local.setItem(key, value)         // set item in storage
Storage.local.removeItem(key)             // remove item from storage
```

## SessionStorage
```javascript
Storage.session.clear();                  // clear localStorage
Storage.session.getItem(key);             // get item in storage
Storage.session.key(index)                // get key at index
Storage.session.keys()                    // array of all keys in storage
Storage.session.setItem(key, value)       // set item in storage
Storage.session.removeItem(key)           // remove item from storage
```

## Cookies
```javascript
Storage.cookie.clear();                   // clear local items in cookie
Storage.cookie.getItem(key);              // get item in cookie
Storage.cookie.key(index)                 // get key at index
Storage.cookie.keys()                     // array of all keys in cookie
Storage.cookie.setItem(key, value)        // set cookie
Storage.cookie.removeItem(key)            // remove item from cookie
```