var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var port = process.env.PORT || 3000;
var uri = 'mongodb://ciarra:mpw4hiaa@ds129315.mlab.com:29315/heroku_t5c18vsh';

var databaseUrl = "news";
var collections = ["stories"];
var db = require("./models")
// var headlines = require("./models/headlines.js");
// var notes = require("./models/notes.js");

app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(uri);

if (process.env.MONGODB_URI){
  mongoose.connect(process.env.MONGODB_URI)
}else{
  mongoose.connect("mongodb://localhost/news", {
      useMongoClient: true
  })
}

// var db = mongoose.connection;

// Routes

app.get("/", function(req, res){
  res.render("index");
})

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/section/world?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=World&WT.nav=page", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    $("div.story-meta").each(function(i, element) {
      // Save an empty result object
      var result = {};
      result.link = $(this).parent("a").attr("href");
        console.log("link " + result.link);
      result.title = $(this).children("h2.headline").text();
        console.log("Title " + result.title)
      result.summary = $(this).children("p.summary").text();
        console.log("Summary " + result.summary);
    //   // Create a new Article using the `result` object built from scraping
      db.Headlines
        .create(result)
        .then(function(dbHeadlines) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Complete");
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Headlines
    .find({}).then(function(dbHeadlines) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
app.get("/save", function(req, res){
    res.render("saved");
})

app.post("/save", function(req, res) {
  //this references the Articles schema
    var newResults = {};
  
    newResults.link = req.body.link;
    newResults.summary = req.body.summary;
    newResults.title = req.body.title;

      db.Headlines.create(newResults).then(function(dbArticle) {
      res.redirect("/scrape");

      console.log("YES", newResults);
    })
    .catch(function(err) {
    res.json(err);
  })
  })

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Headlines
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbHeadlines) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Headlines.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbHeadlines) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


//Listen on port 3000
app.listen(port, function() {
  console.log("http://localhost:" + port);
});