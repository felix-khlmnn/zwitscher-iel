//Parser
const Parser = require('rss-parser');

let parser = new Parser();

//Image processing

const https = require("https");
const fs = require("fs");

//Mongo
const { MongoClient } = require('mongodb');
const dotenv = require("dotenv").config();

//Twitter
const Twitter = require("twitter");

var twitterClient = new Twitter({ //creating the Twitter client
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const uri = `mongodb+srv://admin:${process.env.PASSWD}@maincluster.kjjvk.mongodb.net/zwitscher-data?retryWrites=true&w=majority`;
MongoClient.connect(uri, function(err, db) { //everything inside of here to create a hanging app
    if (err) throw err;

    var dbo = db.db("zwitscher-data");
    readRSS();                      //init of readRSS
    checkAge();                     //init of checkAge
    setInterval(readRSS, 180000);   //Every three hours
    setInterval(checkAge, 1440000)


    async function readRSS() {
        let feed = await parser.parseURL('https://www.reddit.com/r/ich_iel/top.rss');
        const imageURL = "https://i.redd.it/" + feed.items[0].content.split("https://i.redd.it/")[1].split('"')[0];
        console.log(imageURL);

        const post = { link: imageURL, unixTime: Date.now() }; //in ms


        dbo.collection("links").findOne({link: imageURL}, (err, result) => {
            if (result == null) {
                const file = fs.createWriteStream('downloadpic.jpg');
                const request = https.get(imageURL, (res) => {
                res.pipe(file);
                dbo.collection("links").insertOne(post, (err, res) => {
                    if (err) throw err;
                    console.log(`${post.link} was inserted.`);
                    

                    fs.readFile('./downloadpic.jpg', (err, data) => {
                        if (err) throw err;
                        twitterClient.post('media/upload', {media: data}, (err, media, res) => {
                            //console.log(res);
                            if (!err) {
                                console.log(media);
    
                                var status = {
                                    status: `${feed.items[0].title}\nvon ${feed.items[0].author}`,
                                    media_ids: media.media_id_string
                                }
                                console.log(status.status + "\n" + status.media_ids)
    
                                twitterClient.post('statuses/update', status, (err, tweet, res) => {
                                    if (err) throw err;
                                    console.log(tweet);
                                })
                            } else throw err;
                        })
                    });
                })
                    
                });
            } else {
                console.log("Document already exists");
            }
        })
        
        
    }

    function checkAge() {
        dbo.collection("links").find({}).toArray((err, result) => {
            if (err) throw err;
            for (let i = 0; i < result.length; i++) {
                const postObj = result[i];
                console.log(Date.now() - postObj.unixTime + "\n" + postObj.link) // 604800000 =One week in milliseconds
                if ((Date.now() - postObj.unixTime > 604800000)) {
                    dbo.collection("links").deleteOne({ link: postObj.link }, (err, obj) => {
                        if (err) throw err;
                        console.log("1 Document deleted for being too old.");
                    })
                }
            }
        });
    }

    async function tweet(rssEntry) {
        
    }
    
    
    
});

function download(url, filename) { //downloads the file at the given url
    
}