/*
*
* Simple blogging app
* By: Hani Yahya
*
*/

const express = require('express'),
bodyParser = require('body-parser'),
nunjucks = require('nunjucks'),
MongoClient = require('mongodb').MongoClient,
ObjectId = require('mongodb').ObjectID,
assert = require('assert')

// Set up express
app = express()
app.set('view engine', 'html')
app.set('views', __dirname + '/views')
app.use('/static', express.static(__dirname + '/static'))
app.use(bodyParser.urlencoded({ extended: true }))

const env = nunjucks.configure('views', {
  autoescape: true,
  express: app
});

const database = 'mongodb://localhost:27017/nodejsblog'

MongoClient.connect(database, (err, db) => {

  assert.equal(null, err)
  console.log(`Connected to the database: ${database}`);

  let router = express.Router()

  router.get('/', (req, res) => {
    res.render('home', {
      page_title: "Simple blogging app",
    });
  }) // get '/'

  // insering a new post
  router.post('/new_post', (req, res) => {

    let insertPost = (doc, db, callback) => {
      db.collection('posts').insertOne(doc, (err, result) => {
        assert.equal(err, null)
        callback(result.ops[0]._id)
      })
    }

    let post = {
      title: req.body.post_title,
      body: req.body.post_body,
      date: new Date()
    }

    insertPost(post, db, (post_id) => {
      console.log("Post inserted successfully")
      console.log(post)

      res.redirect('/post/' + post_id)
    })

  }) // post '/new_post'

  // displaying a post by its _id
  router.get('/post/:post_id', (req, res) => {
    let post_id = req.params.post_id

    if (post_id == null) {
      res.status(404).send("Post not found.")
      return
    }

    let findPost = (pid, db, callback) => {
      db.collection('posts').find({ _id: new ObjectId(pid) }).toArray((err, result) => {
        assert.equal(err, null)
        callback(result)
      })
    }

    findPost(post_id, db, (post) => {
      let doc = {
        page_title: "Simple blogging app",
        post_id: post[0]._id,
        post_title: post[0].title,
        post_body: post[0].body,
        post_date: post[0].date
      }
      res.render('post', doc)
    })

  }) // get '/post/:post_id'


  // displaying a post by its _id
  router.get('/delete/:post_id', (req, res) => {
    let post_id = req.params.post_id

    if (post_id == null) {
      res.status(404).send('Post not found.')
      return
    }

    db.collection('posts').deleteOne({ _id: new ObjectId(post_id) }, function(err, obj) {
      if (err) throw err
      console.log(`Post ${post_id} was deleted`)
      res.redirect('/posts/')
    });

  }) // delete '/post/:post_id'


  // editing a post by its _id
  router.get('/edit/:post_id', (req, res) => {
    let post_id = req.params.post_id

    if (post_id == null) {
      res.status(404).send('Post not found.')
      return
    }

    let findPost = (pid, db, callback) => {
      db.collection('posts').find({ _id: new ObjectId(pid) }).toArray((err, result) => {
        assert.equal(err, null)
        callback(result)
      })
    }

    findPost(post_id, db, (post) => {
      let doc = {
        post_id: post[0]._id,
        post_title: post[0].title,
        post_body: post[0].body,
      }
      res.render('edit_post', doc)
    })

  }) // get '/edit/:post_id'


  // update a post
  router.post('/update_post/:post_id', (req, res) => {
    let post_id = req.params.post_id

    if (post_id == null) {
      res.status(404).send('Post not found.')
      return
    }

    let updated = {
      title: req.body.post_title,
      body: req.body.post_body,
      date: new Date()
    }

    let updatePost = (pid, edited, db, callback) => {
      db.collection('posts').updateOne({ _id: new ObjectId(pid) }, edited, (err, res) => {
        if (err) throw err;
        callback()
      })
    }

    updatePost(post_id, updated, db, () => {
      console.log(`Post ${post_id} updated`);
      res.redirect('/post/' + post_id)
    })

  }) // post '/update_post'


  // displaying all posts
  router.get('/posts', (req, res) => {
    db.collection('posts').find().toArray().then((posts) => {
      console.log("Listing all Posts..")
      console.log(posts)

      res.render('posts', {
        posts,
        page_title: "Simple blogging app"
      })

    }, (err) => {
      console.log("Unable to fetch /posts", err)
    })

  }) // get '/posts'

  // Use the router routes in our application
  app.use('/', router)

  // Start server listening
  let server = app.listen(3000, () => {
    let port = server.address().port
    console.log(`App is listening on port ${port}`)
  })

}) // MongoClient.connect
