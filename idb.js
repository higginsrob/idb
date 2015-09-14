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
    this.closed = false;
    this.connection = db;
  };

  DB.prototype.add = function(table, records, eachCallback) {
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
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

  DB.prototype.delete = function(table, keys, eachCallback) {
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
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

  DB.prototype.clear = function(table){
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
      var store = transaction.objectStore(table);
      store.clear();
      transaction.oncomplete = resolve.bind(self, true);
      transaction.onerror = function(){ reject(false) };
      transaction.onabort = function(){ reject(false) };
    });
  };

  DB.prototype.count = function(table){
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readonly" );
      var store = transaction.objectStore(table);
      var request = store.count();
      transaction.oncomplete = resolve.bind(self, request.result);
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  DB.prototype.get = function(table, key, eachCallback){
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
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

  DB.prototype.getObjectStoreNames = function(){
    return Array.prototype.slice.call(this.connection.objectStoreNames);
  };

  DB.prototype.update = function(table, records, eachCallback){
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
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

  DB.prototype.upsert = function(table, records, eachCallback) {
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readwrite" );
      var store = transaction.objectStore(table);
      if(Object.prototype.toString.call(records) === "[object Object]"){
        records = [records];
      }
      records.forEach(function(record){
        var request = store.put(record);
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

  DB.prototype.set = function(table, records, eachCallback){
    if(this.closed) throw new Error('Database has been closed');
    if(Object.prototype.toString.call(records) !== "[object Array]") throw new Error('records argument must be an array');
    if(!records.length) throw new Error('you must specify at least one record');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readonly" );
      var store = transaction.objectStore(table);
      var keyPath = store.keyPath;
      self.query(table).then(function(result){
        var remove = [];
        result.forEach(function(item){
          if(typeof records[item[keyPath]] === "undefined"){
            remove.push(item[keyPath]);
          }
        });
        var upsert = function(){
          self.upsert(table, records).then(resolve.bind(self, records)).catch(reject);
        };
        if(remove.length){
          self.delete(table, remove).then(upsert).catch(reject);
        } else {
          upsert();
        }
      }).catch(reject);
    });
  };

  DB.prototype.query = function(table, key, listCallback){
    if(this.closed) throw new Error('Database has been closed');
    var self = this;
    return new Promise(function(resolve, reject){
      var transaction = self.connection.transaction(table, "readonly" );
      var store = transaction.objectStore(table);
      var keyPath = store.keyPath;
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

  DB.prototype.close = function() {
    if(this.closed) throw new Error('Database is already closed');
    this.connection.close();
    this.closed = true;
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