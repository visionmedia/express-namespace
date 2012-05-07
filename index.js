/*!
 * Express - Contrib - namespace
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express')
  , join = require('path').join
  , app = express.application
    ? express.application
    : express.HTTPServer.prototype;

/**
 * Namespace using the given `path`, providing a callback `fn()`,
 * which will be invoked immediately, resetting the namespace to the previous.
 *
 * @param {String} path
 * @param {Function} fn
 * @return {Server} for chaining
 * @api public
 */

exports.namespace = function(){
  var args = Array.apply(null, arguments)
    , path = args.shift()
    , fn = args.pop()
    , self = this;

  if (args.length) self.all(path + '*', args);
  (this._ns = this._ns || []).push(path);
  fn.call(this);
  this._ns.pop();
  return this;
};

/**
 * Return the current namespace.
 *
 * @return {String}
 * @api public
 */

exports.__defineGetter__('currentNamespace', function(){
  return join.apply(this, this._ns).replace(/\\/g, '/').replace(/\/$/, '') || '/';
});

/**
 * Proxy HTTP methods to provide namespacing support.
 */

(express.router || express.Router).methods.concat('del').forEach(function(method){
  var orig = app[method];
  exports[method] = function(){
    var args = Array.prototype.slice.call(arguments)
      , len  = args.length
      , path = args.shift()
      , fn = args.pop()
      , self = this;

    // Prevent namepacing getter on application
    if(method === 'get' && len === 1) {
      return orig.apply(this,Array.prototype.slice.call(arguments));
    }


    this.namespace(path, function(){
      // currentNamespace property getter return an invalid path (a '.') ? - So I don't use it
      var curr = join.apply(this, this._ns).replace(/\\/g, '/').replace(/\/$/, '') || '/';

      args.forEach(function(fn){
        fn.namespace = curr;
        orig.call(self, curr, fn);
      });

      fn.namespace = curr;
      orig.call(self, curr, fn);
    });

    return this;
  };
});

// merge

for (var key in exports) {
  var desc = Object.getOwnPropertyDescriptor(exports, key);
  Object.defineProperty(app, key, desc);
  Object.defineProperty(app, key, desc);
}
