'use strict';

const bodyParser = require('express');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {blog} = require('./models');

const app = express();
app.use(bodyParser.json());


// GET all
app.get('/posts', function(req, res) {
	blog
	.find()
	.then(posts => {
		res.json({
			posts: posts.map(
				(post) => post.serialize())
		});
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});


// GET id
app.get('/posts/:id', function(req, res) {
	blog
	.findById(req.params.id)
	.then(blog => res.json(blog.serialize()))
	.catch(err => {
		console.log(err);
		res.status(500).json({message: 'Internal server error'});
	});
});



app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});

// closeServer needs access to a server object, but that only
// gets created when `runServer` runs, so we declare `server` here
// and then assign a value to it in run
let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
