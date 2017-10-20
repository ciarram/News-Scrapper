var express = require('express');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var port = process.env.port || 3000;

var databaseUrl = "news";
var collections = ["stories"];

var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

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

// Scrape data from one site and place it into the mongodb db
// app.get("/scrape", function(req, res) {
  // Make a request for the news section of ycombinator
  request("https://www.nytimes.com/section/world?action=click&pgtype=Homepage&region=TopBar&module=HPMiniNav&contentCollection=World&WT.nav=page", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    var urls = [];
    var headlines = [];
    var summary = [];
  
    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("div.story-body").each(function(i, element) {
  
      //var link = $(element).children().attr("href");
      var link = $(element).children().attr("href");
      //console.log(link);
      //  var title = $(element).children().text();
      // var title = $(element).children().attr(".headline");
       //console.log(title);
  
      // Save these results in an object that we'll push into the results array we defined earlier
      urls.push({
        link: link,
        // title: title
      });
    });
  
    $("div.story-meta").each(function(i, element){
      var title = $(element).children("h2").text();
      //console.log(title);
  
      headlines.push({
        title: title
      });
    });
  
    $("div.story-meta").each(function(i, element){
      var writeUp = $(element).children("p").text();
      //console.log(title);
  
      summary.push({
        writeUp: writeUp
      })
    })
  
    // Log the results once you've looped through each of the elements found with cheerio
    // console.log(urls);
    // console.log(headlines);
    // console.log(summary);
  });

  // Send a "Scrape Complete" message to the browser
  //res.send("Scrape Complete");
// });


//Listen on port 3000
app.listen(port, function() {
  console.log("http://localhost:" + port);
});