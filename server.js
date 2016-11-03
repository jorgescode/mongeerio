// node dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

//using logger, defining body parser url encoding and defining static folder
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));

//defining database uri to connect to
var databaseUri = 'mongodb://heroku_968mv4bv:4dj5cteh2ll6v1oabegqh0h18@ds025762.mlab.com:25762/heroku_968mv4bv';
//var databaseUri = 'mongodb://localhost/mongeerio';

//creating connection to specific database uri
mongoose.connect(databaseUri);

//used to define what to log out on error and successful connection
var db = mongoose.connection;
db.on('error', function(err)
{
    console.log('Mongoose Error: ', err);
});
db.once('open', function()
{
    console.log('Mongoose Connection Successful.');
});

//obtaining mongoose schemas
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

// default root route
app.get('/', function(req, res)
{
    res.send(index.html);
});

// scraper route that calls cheerio to scrape data and pass it to Mongoose to create new Articles
app.get('/scrape', function(req, res)
{
    //using request library to get html of time.com newfeed
    request('http://time.com/newsfeed/', function(error, response, html)
    {
        //using cheerio to load html from request to $ variable
        var $ = cheerio.load(html);
        //using regular jquery syntax to select elements we want to scrap data from
        $('.wrapper.clearfix>div:nth-of-type(3) article:not([class*=\'bottom\']) section').each(function(i, element)
        {
            var result = {};

            //result.imgSrc = $(element).children('figure img').attr('src');
            result.title = $(element).find('h2 a').text();
            result.link = $(element).find('h2 a').attr('href');
            console.log(result);

            // creating new article with the result object
            var entry = new Article(result);

            // prevents duplicates from being added by checking for the number of documents that have the same
            // article title
            Article.count({ title: result.title }, function (err, count)
            {
                if(err)
                    console.log(err);
                else if(count > 0)
                    console.log('DUPLICATE DETECTED! There are %d of title: ' + result.title, count);
                else
                {
                    // saving article into database
                    entry.save(function(err2, doc)
                    {
                        if (err2)
                            console.log(err2);
                        else
                            console.log(doc);
                    });
                }
            });
        });
    });
    // gives a link to go back once scrapping is finished
    res.send("<a href='/'>Scrape Complete</a>");
});

// get route for articles that retrieves articles from mongodb
app.get('/articles', function(req, res)
{
    //using mongoose find to get all articles and return it to the response in json format
    Article.find({}, function(err, doc)
    {
        if (err)
            console.log(err);
        else
            res.json(doc);
    });
});

// route with particular id that returns all its notes using Mongoose populate function
app.get('/articles/:id', function(req, res)
{
    Article
    .findOne({'_id': req.params.id})
    .populate('note')
    .exec(function(err, doc)
    {
        if(err)
            console.log(err);
        else
            res.json(doc);
    });
});

// post to article to add a new note to it
app.post('/articles/:id', function(req, res)
{
    // creating a new Note from request body
    var newNote = new Note(req.body);

    // saving note to mongodb
    newNote.save(function(err, doc)
    {
        if(err)
            console.log(err);
        else
        {
            // adding note to article by using the article id selected and updating its note with the id of the note created in doc
            Article
            .findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
            .exec(function(err, doc)
            {
                if (err)
                    console.log(err);
                else
                    res.send(doc);
            });
        }
    });
});

var PORT = process.env.PORT || 3000;

app.listen(PORT, function()
{
    console.log('App running on port 3000!');
});