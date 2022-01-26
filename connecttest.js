//Parser
const Parser = require('rss-parser');

let parser = new Parser();

//Image processing

const https = require("https");
const fs = require("fs");

//Mongo
const { MongoClient } = require('mongodb');
const dotenv = require("dotenv").config();

const uri = `mongodb+srv://admin:${process.env.PASSWD}@maincluster.kjjvk.mongodb.net/zwitscher-data?retryWrites=true&w=majority`;
MongoClient.connect(uri, function(err, db) {
    if (err) throw err;

    var dbo = db.db("zwitscher-data");
    //readRSS();
    checkAge();

    async function readRSS() {
        let feed = await parser.parseURL('https://www.reddit.com/r/ich_iel/top.rss');
        const imageURL = "https://i.redd.it/" + feed.items[0].content.split("https://i.redd.it/")[1].split('"')[0];
        console.log(imageURL);

        const post = { link: imageURL, unixTime: Date.now() }; //in ms

        download(imageURL, "downloadpic.jpg");
        dbo.collection("links").insertOne(post, (err, res) => {
            if (err) throw err;
            console.log(`${res} was inserted.`);
            db.close(); //REMOVE
        });

    }

    function checkAge() {
        dbo.collection("links").find({}).toArray((err, result) => {
            if (err) throw err;
            for (let i = 0; i < result.length; i++) {
                const postObj = result[i];
                console.log((Date.now() - postObj.unixTime) > 604800000)
                db.close(); //REMOVE
            }
        });
    }
    
    
    
});

function download(url, filename) { //downloads the file at the given url
    const file = fs.createWriteStream(filename);
    const request = https.get(url, (res) => {
        res.pipe(file);
        
    })
}