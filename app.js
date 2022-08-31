// Jshint esversion:6

require('dotenv').config()
const express = require("express");
const https = require("https");
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs'); //let us use the ejs module in order to make templates in our project


app.use(express.urlencoded({extended: true}));//must be written in order to use the data that was sent in the post request.
app.use(express.static("public")); // used to specify a folder as the one that contains all the local files that are used in my html (styles.css / images ETC) this folder is considered as the root folder for these files. 

// MongoDB setup

mongoose.connect('mongodb+srv://' + process.env.DB_USER_NAME+ ":" + process.env.DB_PASSWORD + '@cluster0.tzn3xae.mongodb.net/seriesDB');
const seasonSchema = new mongoose.Schema({ 
    number:{
        type: Number,
        required: true
    },
    episodes:{
        type: Number,
        required: true
    }
});
let Season = mongoose.model('season', seasonSchema);

const seriesSchema = new mongoose.Schema({ //creating a new schema that defines how the documents should be written
    name: {
        type:String,
        required:true
    },
    seasons: [seasonSchema]
});
let Series = mongoose.model('series', seriesSchema);

// main application setup

let allSeries = [];

app.get("/", function(req, res){
    Series.find({}, function(err, foundItems){
        allSeries = foundItems;
        res.render('list', {allSeries:allSeries});
    })
});

app.post("/", function(req, res){
    if (req.body.button === "home"){
        res.redirect("/");
    }else{
        res.render("add",{});
    }
});

app.post("/newSeries", function(req,res){
    console.log(req.body);
    let name = req.body.name;
    Series.findOne({name:name}, async function(err, found){
        console.log(found);
        let seasonNum = found.seasons.length+1;
        if(err){
            res.send(err);
        } else if(found !== null){
            console.log("Series already exists");
            res.render("season", {seriesName:name, seasonNum:seasonNum});
        }else{
            let newSeries = new Series({name:name,seasons:[]});
            await newSeries.save();
            res.render("Season",{seriesName:name});
        }
    })

});

let number;
app.post("/newSeason", function(req,res){
    let name = req.body.name;
    number = req.body.number;
    let episodes = req.body.episodes;
    let isExist = false;
    let index;
    let newSeason = new Season({number:number,episodes:episodes});
    Series.findOne({name:name}, async function(err, foundSeries){
        console.log(foundSeries.seasons.length);
        for(let i=0; i<foundSeries.seasons.length; i++){
            console.log(foundSeries.seasons[i].number);
            if(foundSeries.seasons[i].number == number){
                isExist = true;
                index = i;
            }
        }
        if(isExist===true){
            console.log("The season exists - updating..");
            foundSeries.seasons[index] = newSeason;
            await foundSeries.save();
            console.log("Season updated");
            res.render("Season",{seriesName:name});
        }else{
            foundSeries.seasons.push(newSeason);
            await foundSeries.save();
            res.render("Season",{seriesName:name});
        }
    });
});

app.post("/random", function(req,res){
    let index = req.body.button;
    Series.find({}, function(err, foundSeries){
        let seasonLen = foundSeries[index].seasons.length;
        let chosenSeason = Math.floor(Math.random()*(seasonLen));
        let episodeLen = foundSeries[index].seasons[chosenSeason].episodes;
        let chosenepisode = Math.floor(Math.random()*(episodeLen))+1;
        chosenSeason++;
        res.json("Your next episode is - Season " + chosenSeason + ", episode " + chosenepisode +"!");
    });  
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});