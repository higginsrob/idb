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

  var IDBManager = function(db){
    this.closed = false;
    this.connection = db;
  };

  IDBManager.prototype.add = function(records, eachCallback) {
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.selectedObjectStore) throw new Error('Object store not selected');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readwrite" );
      var store = transaction.objectStore(self.selectedObjectStore);
      if(Object.prototype.toString.call(records) === "[object Object]"){
        records = [records];
      }
      records.forEach(function(record){
        var request = store.add(record);
        if(typeof eachCallback === "function"){
          request.onsuccess = function(e){
            eachCallback(e, record);
          };
        }
      });
      transaction.oncomplete = resolve.bind(self, records);
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.clear = function(){
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.connection) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readwrite" );
      var store = transaction.objectStore(self.selectedObjectStore);
      store.clear();
      transaction.oncomplete = resolve.bind(self, true);
      transaction.onerror = function(){ reject(false); };
      transaction.onabort = function(){ reject(false); };
    });
  };

  IDBManager.prototype.count = function(){
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.selectedObjectStore) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readonly" );
      var store = transaction.objectStore(self.selectedObjectStore);
      var request = store.count();
      transaction.oncomplete = function(e){
        resolve(request.result);
      };
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.close = function(){
    if(this.closed) throw new Error('Database is already closed');
    this.connection.close();
    this.closed = true;
  };

  IDBManager.prototype.delete = function(keys, eachCallback) {
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readwrite" );
      var store = transaction.objectStore(self.selectedObjectStore);
      if(Object.prototype.toString.call(keys) === "[object String]"){
        keys = [keys];
      }
      keys.forEach(function(key){
        var request = store.delete(key);
        if(typeof eachCallback === "function"){
          request.onsuccess = function(e){
            eachCallback(e, key);
          };
        }
      });
      transaction.oncomplete = resolve.bind(self,keys);
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.get = function(key){
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.connection || !self.selectedObjectStore) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readonly" );
      var store = transaction.objectStore(self.selectedObjectStore);
      var request = store.get(key);
      transaction.oncomplete = function(){
        resolve(request.result);
      };
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.getObjectStoreNames = function(){
    return Array.prototype.slice.call(this.connection.objectStoreNames);
  };

  // IDBManager.prototype.getDatabaseNames = function(){
  //   return new Promise(function(resolve, reject){
  //     var transaction = indexedDB.webkitGetDatabaseNames();
  //     transaction.onsuccess = function(e){
  //       resolve(Array.prototype.slice.call(e.target.result));
  //     };
  //     transaction.onerror = reject;
  //   });
  // };

  IDBManager.prototype.update = function(records, eachCallback){
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.connection || !self.selectedObjectStore) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readwrite" );
      var store = transaction.objectStore(self.selectedObjectStore);
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
         if(typeof eachCallback === "function"){
            requestUpdate.onsuccess = function(e) {
               eachCallback(e, result, record);
             };
          }
          requestUpdate.onerror = reject;
          requestUpdate.onabort = reject;
        };
      });
      transaction.oncomplete = resolve.bind(self, records);
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.upsert = function(records, eachCallback) {
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.connection || !self.selectedObjectStore) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readwrite" );
      var store = transaction.objectStore(self.selectedObjectStore);
      if(Object.prototype.toString.call(records) === "[object Object]"){
        records = [records];
      }
      records.forEach(function(record){
        var request = store.put(record);
        if(typeof eachCallback === "function"){
          request.onsuccess = function(e){
            eachCallback(e, record);
          };
        }
      });
      transaction.oncomplete = resolve.bind(self, records);
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.set = function(records, eachCallback){ //  broken
    var self = this;
    return new Promise(function(resolve, reject){
      if(self.closed) throw new Error('Database has been closed');
      if(!self.connection) throw new Error('database not found');
      if(Object.prototype.toString.call(records) !== "[object Array]") throw new Error('records argument must be an array');
      if(!records.length) throw new Error('you must specify at least one record');

      self.clear().then(function(){
        // self.add
      });

      var transaction = self.connection.transaction(self.selectedObjectStore, "readonly" );
      var store = transaction.objectStore(self.selectedObjectStore);
      var keyPath = store.keyPath;
      self.query().then(function(result){
        var remove = [];
        result.forEach(function(item){
          if(typeof records[item[keyPath]] === "undefined"){
            remove.push(item[keyPath]);
          }
        });
        var upsert = function(){
          self.upsert(records).then(resolve.bind(self, records)).catch(reject);
        };
        if(remove.length){
          self.delete(remove).then(upsert).catch(reject);
        } else {
          upsert();
        }
      }).catch(reject);
    });
  };

  IDBManager.prototype.query = function(index, config, eachCallback){
    var self = this;
    return new Promise(function(resolve, reject){
      if(this.closed) throw new Error('Database has been closed');
      if(!self.connection || !self.selectedObjectStore) throw new Error('database not found');
      var transaction = self.connection.transaction(self.selectedObjectStore, "readonly" );
      var store = transaction.objectStore(self.selectedObjectStore);
      var list = [];
      if(Object.prototype.toString.call(config) === "[object Object]"){
        if(config.lower && config.upper){
          config = IDBKeyRange.bound(config.lower, config.upper);
        } else if(config.only){
          config = IDBKeyRange.only(config.only);
        } else if(config.lower){
          config = IDBKeyRange.lowerBound(config.lower);
        } else if(config.upper){
          config = IDBKeyRange.upperBound(config.upper);
        }
      }
      var onsuccess = function(e){
        var cursor = e.target.result;
        if(cursor){
          list.push(cursor.value);
          if(typeof eachCallback === "function"){
            eachCallback(e, cursor.value);
          }
          cursor.continue();
        }
      };
      if(typeof index === "string"){
        store.index(index).openCursor(config).onsuccess = onsuccess;
      } else {
        store.openCursor(config).onsuccess = onsuccess;
      }
      transaction.oncomplete = function(){
        resolve(list);
      };
      transaction.onerror = reject;
      transaction.onabort = reject;
    });
  };

  IDBManager.prototype.use = function(selected_objectStore_name){
    if(typeof selected_objectStore_name === "string"){
      this.selectedObjectStore = selected_objectStore_name;
    }
    return this;
  };

  return function(options) {
    return new Promise(function(resolve, reject){
      if(!indexedDB) throw new Error('IndexedDB not supported in this browser');
      if(Object.prototype.toString.call(options.tables) !== "[object Array]") throw new Error('You must specify at least one table');
      var request = indexedDB.open(options.name, options.version);
      request.onsuccess = function(e){
        resolve(new IDBManager(e.target.result));
      };
      request.onerror = reject;
      request.onupgradeneeded = function(e){
        var db = e.target.result;
        options.tables.forEach(function(table){
          if(!table.name) throw new Error("a table must have a name");
          if(!table.key) table.key = { autoIncrement: true };
          if(typeof table.key === "string"){
            table.key = { keyPath: table.key };
          }
          var store = db.createObjectStore(table.name, table.key);
          if(typeof table.indexes === "string" || Object.prototype.toString.call(table.indexes) === "[object Object]"){
            table.indexes = [table.indexes];
          }
          if(Object.prototype.toString.call(table.indexes) === "[object Array]"){
            table.indexes.forEach(function(index){
              if(typeof index === "string"){
                store.createIndex(index, index, { unique: false, multientry: false });
              } else if(Object.prototype.toString.call(index) === "[object Object]"){
                Object.keys(index).forEach(function(key){
                  if(typeof index[key] === "string" || Object.prototype.toString.call(index[key]) === "[object Array]"){
                    store.createIndex(key, index[key], { unique: false, multientry: false });
                  } else if(Object.prototype.toString.call(index[key]) === "[object Object]"){
                    var path = index[key].path || key;
                    delete index[key].path;
                    store.createIndex(key, path, index[key]);
                  }
                  return false;
                });
              }
            });
          }
        });
      };
    });
  };
});
