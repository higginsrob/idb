/*
  ====================================================
  idb.js
  AMD module for using IndexedDB with Promises
  ====================================================
  @license Open source under MIT
  Copyright 2015 Robert Higgins All rights reserved
  ====================================================
  global Promise
  ====================================================
*/

define(function(){

  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
  var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

  var DB = function(db){

    var self = this;

    this.closed = false;

    this.connection = db;

    this.add = function(table, records, eachCallback) {
      if(self.closed) throw 'Database has been closed';
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        if(Object.prototype.toString.call(records) === "[object Object]"){
          records = [records];
        }
        records.forEach(function(record){
          var request = store.add(record);
          request.onsuccess = function(e){
            if(typeof eachCallback === "function"){
              eachCallback(e, record);
            }
          };
        });
        transaction.oncomplete = resolve.bind(self, records);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.delete = function(table, keys, eachCallback) {
      if(self.closed) throw 'Database has been closed';
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        if(Object.prototype.toString.call(keys) === "[object String]"){
          keys = [keys];
        }
        keys.forEach(function(key){
          var request = store.delete(key);
          request.onsuccess = function(e){
            if(typeof eachCallback === "function"){
              eachCallback(e, key);
            }
          };
        });
        transaction.oncomplete = resolve.bind(self,keys);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.clear = function(table){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        store.clear();
        transaction.oncomplete = resolve.bind(self, true);
        transaction.onerror = function(){ reject(false) };
        transaction.onabort = function(){ reject(false) };
      });
    };

    this.count = function(table){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readonly" );
        var store = transaction.objectStore(table);
        var request = store.count();
        transaction.oncomplete = resolve.bind(self, request.result);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.get = function(table, key, eachCallback){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        var request = store.get(key);
        request.onsuccess = function(e){
          if(typeof eachCallback === "function"){
            eachCallback(e, request.result);
          }
        };
        transaction.oncomplete = resolve.bind(self, request.result);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.getObjectStoreNames = function(){
      return Array.prototype.slice.call(db.objectStoreNames);
    };

    this.update = function(table, records, eachCallback){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        if(Object.prototype.toString.call(records) === "[object Object]"){
          records = [records];
        }
        records.forEach(function(record){
          if(Object.prototype.toString.call(record) !== "[object Object]") throw new Error('you must use an object to modify changes');
          if(!record[store.keyPath]) throw new Error('you must specify the index key in your modify object');
          var request = store.get(record[store.keyPath]);
          request.onsuccess = function(e){
            var result = request.result;
            Object.keys(record).forEach(function(key){
              result[key] = record[key];
            });
            var requestUpdate = store.put(result);
            requestUpdate.onsuccess = function(e) {
               if(typeof eachCallback === "function"){
                 eachCallback(e, result, record);
               }
            };
            requestUpdate.onerror = reject;
            requestUpdate.onabort = reject;
          };
        });
        transaction.oncomplete = resolve.bind(self, records);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.upsert = function(table, records, eachCallback){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        if(Object.prototype.toString.call(records) === "[object Object]"){
          records = [records];
        }
        records.forEach(function(record){
          if(Object.prototype.toString.call(record) !== "[object Object]") throw new Error('you must use an object to modify changes');
          if(!record[store.keyPath]) throw new Error('you must specify the index key in your modify object');
          var request = store.get(record[store.keyPath]);
          request.onsuccess = function(e){
            if(!request || !request.result){ // add
              var transaction = db.transaction(table, "readwrite" );
              var store = transaction.objectStore(table);
              if(Object.prototype.toString.call(records) === "[object Object]"){
                records = [records];
              }
              records.forEach(function(record){
                var request = store.add(record);
                request.onsuccess = function(e){
                  if(typeof eachCallback === "function"){
                    eachCallback(e, record);
                  }
                };
              });
              transaction.oncomplete = resolve.bind(self, records);
              transaction.onerror = reject;
              transaction.onabort = reject;
            } else { // update
              transaction = db.transaction(table, "readwrite" );
              store = transaction.objectStore(table);
              var request = store.get(record[store.keyPath]);
              request.onsuccess = function(e){
                var result = request.result;
                Object.keys(record).forEach(function(key){
                  result[key] = record[key];
                });
                var requestUpdate = store.put(result);
                requestUpdate.onsuccess = function(e) {
                   if(typeof eachCallback === "function"){
                     eachCallback(e, result, record);
                   }
                };
                requestUpdate.onerror = reject;
                requestUpdate.onabort = reject;
              };
            }
          };
        });
        transaction.oncomplete = resolve.bind(self, records);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.query = function(table, key, listCallback){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readonly" );
        var store = transaction.objectStore(table);
        var list = [];
        if(Object.prototype.toString.call(key) === "[object Object]"){
          if(key.lower && key.upper){
            key = IDBKeyRange.bound(key.lower, key.upper);
          } else if(key.only){
            key = IDBKeyRange.only(key.only);
          } else if(key.lower){
            key = IDBKeyRange.lowerBound(key.lower);
          } else if(key.upper){
            key = IDBKeyRange.upperBound(key.upper);
          }
        }
        store.openCursor(key).onsuccess = function(e){
          var cursor = e.target.result;
          if(cursor){
            list.push(cursor.value);
            if(typeof listCallback === "function"){
              listCallback(e, cursor.value);
            }
            cursor.continue();
          }
        };
        transaction.oncomplete = resolve.bind(self, list);
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.close = function() {
      if(this.closed) throw new Error('Database is already closed');
      db.close();
      this.closed = true;
    };

  };

  return function (options) {
    return new Promise(function(resolve, reject){
      if(!indexedDB) throw new Error('IndexedDB not supported in this browser');
      if(Object.prototype.toString.call(options.tables) !== "[object Array]") throw new Error('You must specify at least one table');
      var request = indexedDB.open(options.name, options.version);
      request.onsuccess = function(e){
        resolve(new DB(e.target.result));
      };
      request.onupgradeneeded = function(e){
        var db = e.target.result;
        options.tables.forEach(function(table){
          if(!table.name || !table.keyPath) throw new Error("a table must have a name and a keyPath");
          var store = db.createObjectStore(table.name, { keyPath: table.keyPath });
          if(Object.prototype.toString.call(table.indexes) === "[object Object]"){
            Object.keys(table.indexes).forEach(function(indexKey){
              try {
                store.index(indexKey);
              } catch(e) {
                store.createIndex(
                  indexKey,
                  table.indexes[indexKey].key || indexKey,
                  Object.keys(table.indexes[indexKey]).length? table.indexes[indexKey] : { unique: false }
                );
              }
            });
          }
        });
      };
      request.onerror = reject;
    });
  };
});