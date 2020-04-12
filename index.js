const express = require('express');
const MongoClient = require('mongodb').MongoClient;
require('dotenv/config');
const fs = require('fs');
const app = express();

//OAuth2
const snoowrap = require('snoowrap')
const r = new snoowrap({
    
  });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const insertInterval = setInterval(insertData, 10000);
const emptyDBInterval = setInterval(emptyDB, 60000)

//Middleware

/*
  This function gets latest 25 comments from a subreddit. After it serperates the string
  by spaces and removes any special characters it then iterates through every word and counts the 
  frequency. Results are stored in a dictionary where the key is the word and the value is the 
  words frequency. Then the result is stored in a database/updated existing documents. 
*/
function insertData(){
    let words = new Array();
    let commentlist = r.getSubreddit('wallstreetbets').getNewComments();
    let cleanData = async () => {
        let result = await (commentlist);
        return result;
    };
    
    cleanData().then(function(result) {
        let stopwords = ["still","We","You","going","like","I'm",'would','it','get','Im','dont','The','I','i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now'];
        for(i=0;i<=result.length-1;i++){
            let currentData = JSON.stringify(result[i].body).split(' ');
            
            for(j=0;j<=currentData.length;j++){
                if (currentData[j]!=undefined && !stopwords.includes(currentData[j])){
                    currentData[j].toLowerCase();
                    currentData[j] = currentData[j].replace(/[?.,"'\/#!$%\^&\*;:{}=\-_`~()]/g,"", '');
                    currentData[j] = currentData[j].replace(/\s{2,}/g,"");
                    currentData[j] = currentData[j].replace(/[0-9]/g,"");
                    if(currentData[j]!="" && currentData[j] != "I"){
                        words.push(currentData[j]);
                    }
                }
            }
        }
        for(i=0;i<=words.length-1;i++){
            words[i] = words[i].replace(/[?.,"'\/#!$%\^&\*;:{}=\-_`~()]/g,"", '');
            words[i] = words[i].replace(/\s{2,}/g,"");
            words[i] = words[i].replace(/[0-9]/g,"");
        }
        
    }).then(()=>{
        var wordsMap = {};
        words.forEach(function (key) {
            if (wordsMap.hasOwnProperty(key)) {
                wordsMap[key]++;
            } else {
                wordsMap[key] = 1;
             }
        });

        words = wordsMap;
        MongoClient.connect(process.env.MONGODB_URI || process.env.DB_CONNECTION, { useUnifiedTopology: true, useNewUrlParser: true }, function (err, db) {
            if (err) throw err;
            const dbo = db.db("heroku_4s2n14p0");
            const messageTable = dbo.collection("comments");
            let closeDBpromises = [];
            for(var key in words){
                let promise = messageTable.findOneAndUpdate({ "_id" : key },{$set: { "_id" : key}, $inc : { "frequency" : words[key] }},{upsert: true}).then(() => words[Object.keys(words)[Object.keys(words).length - 1]] == key)
                closeDBpromises.push(promise);
            }
            Promise.all(closeDBpromises).then(()=>{
                db.close();
                console.log("entry finished");
            });
        })
    })
    
}
function emptyDB(){
    MongoClient.connect(process.env.MONGODB_URI || process.env.DB_CONNECTION, { useUnifiedTopology: true, useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        const dbo = db.db("heroku_4s2n14p0");
        const messageTable = dbo.collection("comments");
        const mins = new Date().getMinutes();
        if (mins == "00") {
            messageTable.deleteMany({}, function(err, obj) {
                if (err) throw err;
                console.log(obj.result.n + " document(s) deleted");
                db.close();
              });  
        }
        else{
            db.close();
        }
        console.log('Tick ' + mins);
        
    })
}


//ROUTES
app.get('/', (req, res) => {
    //Access Token = 20545328-m7sd4o4wYPGbJ_gHzwzTzAetl0s
    fs.readFile('./views/index.html', function (err, data) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(data);
        res.end();
        }); 
  });
app.get('/cloud', (req, res) => {
    MongoClient.connect(process.env.MONGODB_URI || process.env.DB_CONNECTION, { useUnifiedTopology: true, useNewUrlParser: true }, function (err, db) {
        if (err) throw err;
        const dbo = db.db("heroku_4s2n14p0");
        const messageTable = dbo.collection("comments");
        const sort = {frequency: -1};
        messageTable.find().sort(sort).toArray(function(err, result) {
            if (err) throw err;
            res.json(result);
            db.close();
          });
    })
});



