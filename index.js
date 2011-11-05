
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
  , HTTPServer = express.HTTPServer
  , HTTPSServer = express.HTTPSServer;

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
  var args = Array.prototype.slice.apply(arguments)
    , path = args.shift()
    , fn = args.pop()

  if(args.length == 1 && Array.isArray(args[0])){
    args = args[0];
  }
  (this._ns = this._ns || []).push(path);
  this._chains = (this._chains = this._chains || []).concat(args);
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
  return join.apply(this, this._ns).replace(/\/$/, '') || '/';
});

exports.__defineGetter__('chains', function(){
  return this._chains;
});
/**
 * Proxy HTTP methods to provide namespacing support.
 */

express.router.methods.concat(['del']).forEach(function(method){
  var orig = HTTPServer.prototype[method];
  exports[method] = function(){
    var args = Array.prototype.slice.call(arguments)
      , path = args.shift()
      , fn = args.pop()
      , self = this;

    this.namespace(path, function(){
      var curr = this.currentNamespace;
      self.chains.concat(args).forEach(function(fn){
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
  Object.defineProperty(HTTPServer.prototype, key, desc);
  Object.defineProperty(HTTPSServer.prototype, key, desc);
}
