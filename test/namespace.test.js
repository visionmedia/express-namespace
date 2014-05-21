
/**
 * Module dependencies.
 */

var express = require('express')
  , assert = require('assert')
  , request = require('supertest')
  , namespace = require('..')
  , pending = require('./support/pending');

describe('app.namespace(path, fn)', function(){
  it('should not prefix root-level paths', function(done){
    var app = express();
    done = pending(2, done);

    app.get('/one', function(req, res){
      res.send('GET one');
    });

    app.get('/some/two', function(req, res){
      res.send('GET two');
    });

    request(app)
    .get('/one')
    .expect('GET one', done);

    request(app)
    .get('/some/two')
    .expect('GET two', done);
  })

  it('should prefix within .namespace()', function(done){
    var app = express();
    done = pending(6, done);

    app.get('/one', function(req, res){
      res.send('GET one');
    });

    app.namespace('/foo', function(){
      app.get('/', function(req, res){
        res.send('foo');
      });

      app.namespace('/baz', function(){
        app.get('/', function(req, res){
          res.send('GET baz');
        });

        app.delete('/all', function(req, res){
          res.send('DELETE all baz');
        });
      })

      app.get('/bar', function(req, res){
        res.send('bar');
      });
    })

    app.get('/some/two', function(req, res){
      res.send('GET two');
    });

    request(app)
    .get('/foo/baz')
    .expect('GET baz', done);

    request(app)
    .del('/foo/baz/all')
    .expect('DELETE all baz', done);

    request(app)
    .get('/one')
    .expect('GET one', done);

    request(app)
    .get('/some/two')
    .expect('GET two', done);

    request(app)
    .get('/foo')
    .expect('foo', done);

    request(app)
    .get('/foo/bar')
    .expect('bar', done);
  })

  it('should support middleware', function(done){
    var app = express();

    function load(req, res, next) {
      req.forum = { id: req.params.id };
      next();
    }

    app.namespace('/forum/:id', load, function(){
      app.get('/', function(req, res){
        res.send('' + req.forum.id);
      });
    });

    request(app)
    .get('/forum/23')
    .expect('23', done);
  })

  it('should support VERB methods as express', function(){
    var app = express();

    app.namespace('/method', function(){
      app.all('/', function(){ });
    });
    for(var method in app.routes) {
      assert.equal(app.routes[method][0].path, '/method', 'not support method ' + method);
    }
  })


  it('should not die with regexes, but they ignore namespacing', function(done){
    var app = express();
    done = pending(3, done);

    app.get(/test\d\d\d/, function(req, res) {
      res.send("GET test");
    });

    app.namespace('/forum/:id', function(){

      app.get('/', function(req, res){
        res.send('' + req.params.id);
      });

      app.get(/^\/((?!login$|account\/login$|logout$)(.*))/, function(req, res) {
        res.send("crazy reg");
      });

    });

    request(app)
      .get('/forum/23')
      .expect('23', done);

    request(app)
      .get('/test123')
      .expect('GET test', done);

    request(app)
      .get('/account/123')
      .expect('crazy reg', done);
  })

  describe('routes with regexp', function(){

    it('should allow regexp routes', function(done){
      var app = express();
      done = pending(2, done);

      app.namespace('/forum/:id', function(){
        app.get('/((view)?)', function(req, res){
          res.send('' + req.params.id);
        });
      });

      request(app)
        .get('/forum/23/')
        .expect('23', done);

      request(app)
        .get('/forum/23/view')
        .expect('23', done);
      
    })

    it('should allow for complex regexp in routes', function(done){
      var app = express();

      done = pending(2, done);

      app.namespace('/blog/:id', function(){
        app.get('/((:page)?)', function(req, res){
          if (req.params.page){
            return res.send('' + req.params.page);
          }
          res.send('' + req.params.id);
        })
      });

      request(app)
        .get('/blog/23/')
        .expect('23', done);

      request(app)
        .get('/blog/23/12')
        .expect('12', done);

    });
  })

})
