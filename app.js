const Parser = require('rss-parser');
const Twitter = require('twitter');
const fs = require('fs');
request = require('request');

let parser = new Parser();

const dotenv = require('dotenv').config();

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

setInterval(refreshRSS, 10000);
//refreshRSS();

async function refreshRSS () {
    //parsen des feeds
    let feed = await parser.parseURL('https://www.reddit.com/r/ich_iel.rss');

    //anti-announcement-check
    if (!feed.items[0].title.startsWith('ich')) {
        feed.items.splice(0,1);
    }
    fs.readFile('feedLog.txt', (err, data) => {
        if(err) throw err;
        if (!feed.items[0].link == data.toString()) {
            //download des bildes nur, wenn noch nicht vorhanden

            var newestImageURL = feed.items[0].content.split('<span><a href="')[1].split('"')[0];
            download(newestImageURL, 'newest.jpg', () => {
                fs.writeFile("feedLog.txt", feed.items[0].link, (err) => {
                    if (err) throw err;
                    console.log('Downloaded and saved to log!')
                })
            });

            //tweeten
            fs.readFile('newest.jpg', (err, data) => {
            client.post('media/upload', {media: data}, function(error, media, response) {

            if (!error) {
                console.log(media);
  
                var status = {
                    status: `${feed.items[0].title}\nPfostiert von ${feed.items[0].author}`,
                    media_ids: media.media_id_string
                }
                
                client.post('statuses/update', status, function(error, tweet, response) {
                    if (!error) {
                        console.log(tweet);
                    }
                });
            } else {
                console.error(error);
            }
        })
    });
        } else {
            console.log('Nothing new');
        }
    })
};
  

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
  
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

