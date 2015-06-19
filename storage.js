/*
  ============================================================================================
  storage.js
  AMD module for managing IndexedDB (with Promises), localStorage, sessionStorage, and cookies
  ============================================================================================
  @license Open source under MIT
  Copyright 2015 Robert Higgins All rights reserved
  ============================================================================================
  global Promise
  ============================================================================================
*/

define(typeof Promise === 'undefined' ? [
  './npo.js', // polyfill promise
] : [], function () {

  var hasLocalStorage = (function() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  })();

  var hasSessionStorage = (function() {
    try {
      return 'localStorage' in window && window['sessionStorage'] !== null;
    } catch (e) {
      return false;
    }
  })();

  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
  var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

  var DB = function(db){

    var self = this;

    this.closed = false;

    this.add = function(table, records, addcallback) {
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
            if(typeof callback === "function"){
              addcallback(e, record);
            }
          };
        });
        transaction.oncomplete = function(){ resolve(records, self); };
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.delete = function(table, keys, deletecallback) {
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
            if(typeof callback === "function"){
              deletecallback(e, key);
            }
          };
        });
        transaction.oncomplete = function() { resolve(keys); };
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.clear = function (table){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        store.clear();
        transaction.oncomplete = function(){ resolve(true); };
        transaction.onerror = function(){ reject(false) };
        transaction.onabort = function(){ reject(false) };
      });
    };

    this.count = function (table){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readonly" );
        var store = transaction.objectStore(table);
        var request = store.count();
        transaction.oncomplete = function(){ resolve(request.result); };
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.get = function (table, key, getCallback){
      if(self.closed) throw new Error('Database has been closed');
      return new Promise(function(resolve, reject){
        var transaction = db.transaction(table, "readwrite" );
        var store = transaction.objectStore(table);
        var request = store.get(key);
        request.onsuccess = function(e){
          if(typeof getCallback === "function"){
            getCallback(e, request.result);
          }
        };
        transaction.oncomplete = function(){ resolve(request.result); };
        transaction.onerror = reject;
        transaction.onabort = reject;
      });
    };

    this.update = function(table, records, updatecallback){
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
               if(typeof updatecallback === "function"){
                 updatecallback(e, result, record);
               }
            };
            requestUpdate.onerror = reject;
            requestUpdate.onabort = reject;
          };
        });
        transaction.oncomplete = function() { resolve(records); };
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
        transaction.oncomplete = function() { resolve(list); };
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

  return {
    cookie: {
      clear: function(){
        var cookies = document.cookie.split('; ');
        cookies.forEach(function(key){
          document.cookie = key.split("=")[0] + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        });
      },
      getItem: function(key, defaultValue){
        var cookies = document.cookie.split('; ');
        var value;
        cookies.forEach(function(item){
          if(item.split("=")[0] === key){
            value = item.split("=")[1];
            return false;
          }
        });
        return value === null? defaultValue === undefined? null : defaultValue : value;
      },
      key: function(index){
        var cookies = document.cookie.split('; ');
        return cookies[index].split("=")[0];
      },
      keys: function(){
        var keys = [];
        var cookies = document.cookie.split('; ');
        cookies.forEach(function(key){
          keys.push(key.split("=")[0]);
        });
        return keys;
      },
      setItem: function(key, value, expires){
        if(!expires) expires = Date.now();
        document.cookie = key + "=" + value + "; expires=" + expires;
      },
      removeItem: function(key){
        document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
      }
    },
    local: {
      clear: function(){
        if(hasLocalStorage){
          localStorage.clear();
        }
      },
      getItem: function(key, defaultValue){
        if(hasLocalStorage){
          var value = localStorage.getItem(key);
          return value === null? defaultValue === undefined? null : defaultValue : value;
        } else {
          return defaultValue === undefined? null : defaultValue;
        }
      },
      key: function(index){
        if(hasLocalStorage){
          return localStorage.key(index);
        }
      },
      keys: function(){
        if(hasLocalStorage){
          var keys = [];
          var count = 0;
          var name;
          while(name = localStorage.key(count)){
            keys.push(name);
            count++;
          }
          return keys;
        }
      },
      setItem: function(key, value){
        if(hasSessionStorage){
          localStorage.setItem(key, value);
        }
      },
      removeItem: function(key){
        if(hasSessionStorage){
          localStorage.removeItem(key);
        }
      }
    },
    session: {
      clear: function(){
        if(hasSessionStorage){
          sessionStorage.clear();
        }
      },
      getItem: function(key, defaultValue){
        if(hasSessionStorage){
          var value = sessionStorage.getItem(key);
          return value === null? defaultValue === undefined? null : defaultValue : value;
        } else {
          return defaultValue === undefined? null : defaultValue;
        }
      },
      key: function(index){
        if(hasSessionStorage){
          return sessionStorage.key(index);
        }
      },
      keys: function(){
        if(hasSessionStorage){
          var keys = [];
          var count = 0;
          var name;
          while(name = sessionStorage.key(count)){
            keys.push(name);
            count++;
          }
          return keys;
        }
      },
      setItem: function(key, value){
        if(hasSessionStorage){
          sessionStorage.setItem(key, value);
        }
      },
      removeItem: function(key){
        if(hasSessionStorage){
          sessionStorage.removeItem(key);
        }
      }
    },
    db: function (options) {
      if(!indexedDB) throw new Error('IndexedDB required');
      return new Promise(function(resolve, reject){
        var request = indexedDB.open(options.name, options.version);
        request.onsuccess = function(e){
          resolve(new DB(e.target.result));
        };
        request.onupgradeneeded = function(e){
          var db = e.target.result;
          Object.keys(options.schema).forEach(function(tableName){
            var table = options.schema[tableName];
            var store = db.createObjectStore(tableName, table.key);
            if(Object.prototype.toString.call(table.indexes) === "[object Object]"){
              Object.keys(table.indexes).forEach(function(indexKey){
                try { store.index(indexKey); }
                catch(e) {
                  store.createIndex(
                    indexKey,
                    table.indexes[indexKey].key || indexKey,
                    Object.keys(table.indexes[indexKey]).length ? table.indexes[indexKey] : { unique: false }
                  );
                }
              });
            }
          });
        };
        request.onerror = reject;
      });
    }
  };
});