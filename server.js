var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var port = process.env.port || 3000;

var databaseUrl = "news";
var collections = ["stories"];
var db = require("./models")

app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/news", {
  useMongoClient: true
});

// Routes

app.get("/", function(req, res){
  res.render("index");
})

// A GET route for scraping the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("https://www.nytimes.com/section/world?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=World&WT.nav=page", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    $("div.story-meta").each(function(i, element) {
      // Save an empty result object
      var result = {};
      // Add the text and href of every link, and save them as properties of the result object
      result.link = $(this)
        .parent("a")
        .attr("href");
        console.log("link " + result.link);
      result.title = $(this)
        .children("h2.headline")
        .text();
        console.log("Title " + result.title)
        result.summary = $(this)
        .children("p.summary")
        .text();
        console.log("Summary " + result.summary);
      // Create a new Article using the `result` object built from scraping
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
    // $("div.story-meta").each(function(i, element) {
    //   // Save an empty result object
    //   var result = {};
    //   // Add the text and href of every link, and save them as properties of the result object
    //   // result.link = $(this)
    //   //   .children("a")
    //   //   .attr("href");
    //   //   console.log("link " + result.link);
    //   result.title = $(this)
    //     .children("h2.headline")
    //     .text();
    //     console.log("Title " + result.title)
    //     result.summary = $(this)
    //     .children("p.summary")
    //     .text();
    //     console.log("Summary " + result.summary);
    //   // Create a new Article using the `result` object built from scraping
    //   db.Headlines
    //     .create(result)
    //     .then(function(dbHeadlines) {
    //       // If we were able to successfully scrape and save an Article, send a message to the client
    //       res.send("Scrape Complete");
    //     })
    //     .catch(function(err) {
    //       // If an error occurred, send it to the client
    //       res.json(err);
    //     });
    // });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Headlines
    .find({})
    .then(function(dbHeadlines) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

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

// var db = mongojs(databaseUrl, collections);
// db.on("error", function(error) {
//   console.log("Database Error:", error);
// });

// Main route (simple Hello World Message)
// app.get("/", function(req, res) {
//   res.send("Hello world");
// });

// Retrieve data from the db
// app.get("/all", function(req, res) {
//   // Find all results from the scrapedData collection in the db
//   db.scrapedData.find({}, function(error, found) {
//     // Throw any errors to the console
//     if (error) {
//       console.log(error);
//     }
//     // If there are no errors, send the data to the browser as json
//     else {
//       res.json(found);
//     }
//   });
// });

// // Scrape data from one site and place it into the mongodb db
// // app.get("/scrape", function(req, res) {
//   // Make a request for the news section of ycombinator
//   request("https://www.nytimes.com/section/world?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=World&WT.nav=page", function(error, response, html) {
//     // Load the html body from request into cheerio
//     var $ = cheerio.load(html);
//     // For each element with a "title" class
//     var urls = [];
//     var headlines = [];
//     var summary = [];
  
//     // Select each element in the HTML body from which you want information.
//     // NOTE: Cheerio selectors function similarly to jQuery's selectors,
//     // but be sure to visit the package's npm page to see how it works
//     $("div.story-body").each(function(i, element) {
  
//       //var link = $(element).children().attr("href");
//       var link = $(element).children().attr("href");
//       //console.log(link);
//       //  var title = $(element).children().text();
//       // var title = $(element).children().attr(".headline");
//        //console.log(title);
  
//       // Save these results in an object that we'll push into the results array we defined earlier
//       urls.push({
//         link: link,
//         // title: title
//       });
//     });
  
//     $("div.story-meta").each(function(i, element){
//       var title = $(element).children("h2").text();
//       //console.log(title);
  
//       headlines.push({
//         title: title
//       });
//     });
  
//     $("div.story-meta").each(function(i, element){
//       var writeUp = $(element).children("p").text();
//       //console.log(title);
  
//       summary.push({
//         writeUp: writeUp
//       })
//     })
  
//     // Log the results once you've looped through each of the elements found with cheerio
//     // console.log(urls);
//     // console.log(headlines);
//     // console.log(summary);
//   });

//   // Send a "Scrape Complete" message to the browser
//   //res.send("Scrape Complete");
// // });


//Listen on port 3000
app.listen(port, function() {
  console.log("http://localhost:" + port);
});