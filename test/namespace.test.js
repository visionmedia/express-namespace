/**
 * Module dependencies.
 */

var express   = require('express')
  , namespace = require('../')
  , assert    = require('assert')
  , should    = require('should')
  , request   = require('./support/http');



describe('app.namespace(str, fn)', function(){

  var app = express()
    , id;

  app.get('/one', function(req, res){
    res.send('GET one');
  });

  it('app should be equal after namespace call', function() {
    app.namespace('/user', function(){}).should.equal(app);
  });


  it('should add namespace', function() {
    app.namespace('/user', function(){
      app.all('/:id', function(req, res, next){
        id = req.params.id;
        next();
      });

      app.get('/:id', function(req, res){
        res.send('GET user ' + id);
      });
      
      app.del('/:id', function(req, res){
        res.send('DELETE user ' + id);
      });
    });
    
    app.get('/two', function(req, res){
      res.send('GET two');
    });
  });


  it('should get() namespaced route', function(done) {
    request(app)
      .get('/user/12')
      .end(function(res) {
        res.body.should.equal('GET user 12');
        done();
      });
  });

  it('should delete() namespaced route', function(done) {
    request(app)
      .delete('/user/12')
      .end(function(res) {
        res.body.should.equal('DELETE user 12');
        done();
      });
  });


  it('should get() a route defined before namespaced routes', function(done) {
    request(app)
      .get('/one')
      .end(function(res) {
        res.body.should.equal('GET one');
        done();
      });
  });

  it('should get() a route defined after namespaced routes', function(done) {
    request(app)
      .get('/two')
      .end(function(res) {
        res.body.should.equal('GET two');
        done();
      });
  });

});




describe('app.namespace(str, fn) nesting', function(){
  var pending = 6
    , calls = 0
    , app = express();
  
  function finished() {
    --pending || function(){
      assert.equal(2, calls);
    }();
  }

  function middleware(req, res, next) {
    ++calls;
    next();
  }

  app.get('/one', function(req, res){
    res.send('GET one');
  });

  app.namespace('/forum/:id', function(){
    app.get('/', function(req, res){
      res.send('GET forum ' + req.params.id);
    });
    
    app.get('/edit', function(req, res){
      res.send('GET forum ' + req.params.id + ' edit page');
    });

    app.namespace('/thread', function(){
      app.get('/:tid', middleware, middleware, function(req, res){
        res.send('GET forum ' + req.params.id + ' thread ' + req.params.tid);
      });
    });

    app.del('/', function(req, res){
      res.send('DELETE forum ' + req.params.id);
    });
  });
  
  app.get('/two', function(req, res){
    res.send('GET two');
  });


  it('should get() /forum/1', function(done) {
    request(app)
      .get('/forum/1')
      .end(function(res) {
        res.body.should.equal('GET forum 1');
        finished();
        done();
      });
  });

  it('should get() /forum/1/edit', function(done) {
    request(app)
      .get('/forum/1/edit')
      .end(function(res) {
        res.body.should.equal('GET forum 1 edit page');
        finished();
        done();
      });
  });

  it('should get() /forum/1/thread/50', function(done) {
    request(app)
      .get('/forum/1/thread/50')
      .end(function(res) {
        res.body.should.equal('GET forum 1 thread 50');
        finished();
        done();
      });
  });

  it('should delete() /forum/2', function(done) {
    request(app)
      .delete('/forum/2')
      .end(function(res) {
        res.body.should.equal('DELETE forum 2');
        finished();
        done();
      });
  });


  it('should get() a route defined before namespaced routes', function(done) {
    request(app)
      .get('/one')
      .end(function(res) {
        res.body.should.equal('GET one');
        finished();
        done();
      });
  });

  it('should get() a route defined after namespaced routes', function(done) {
    request(app)
      .get('/two')
      .end(function(res) {
        res.body.should.equal('GET two');
        finished();
        done();
      });
  });

});




describe('fn.route', function(){
  var app = express();

  app.namespace('/user/:id', function(){
    app.get('/', function handler(req, res){
      assert.equal('/user/:id', handler.namespace);
      res.send(200);
    });
  });

  it('should get() /user/12', function(done) {
    request(app)
      .get('/user/12')
      .end(function(res) {
        res.body.should.equal('OK');
        done();
      });
  });

});

describe('app.namespace(str, middleware, fn)', function(){
  var app = express(),
      calledA = 0,
      calledB = 0;
  
  function middlewareA(req,res,next){
    calledA++;
    next();
  }

  function middlewareB(req,res,next){
    calledB++;
    next();
  }

  app.namespace('/user/:id', middlewareA, function(){
    app.get('/', function(req,res){
      res.send('got Home');
    });

    app.get('/other', function(req,res){
      res.send('got Other');
    });

    app.namespace('/nest', middlewareB, function(req,res){
      app.get('/', function(req,res){
        res.send('got Nest');
      });
    });
  });

  var pending = 3;
  function finished() {
    --pending || function(){
      assert.equal(3, calledA);
      assert.equal(1, calledB);
    }();
  }


  it('should get() /user/12', function(done) {
    request(app)
      .get('/user/12')
      .end(function(res) {
        res.body.should.equal('got Home');
        finished();
        done();
      });
  });

  it('should get() /user/12/other', function(done) {
    request(app)
      .get('/user/12/other')
      .end(function(res) {
        res.body.should.equal('got Other');
        finished();
        done();
      });
  });

  it('should get() /user/12/nest', function(done) {
    request(app)
      .get('/user/12/nest')
      .end(function(res) {
        res.body.should.equal('got Nest');
        finished();
        done();
      });
  });

});

