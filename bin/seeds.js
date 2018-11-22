const mongoose = require("mongoose");
const History = require('../models/history-model.js');


const trackData = [
  {
    userId: "5bf6ad5723de9ee947091994",
    spotify: [{
      name: "Ritual" ,
      artist: "Wrabel" ,
    }]
    },
    // {
    //   userId: "5bf6740e00c503d2b756ff3e",
    //   spotify: [{
    //     name: "What She Wants",
    //     artist: "A R I Z O N A",
    //   }]
    //   },
    //   {
    //     userId: "5bf6740e00c503d2b756ff3e",
    //     spotify: [{
    //       name: "Bloodstain",
    //       artist: "Wrabel",
    //     }]
    //     }
      ]
  

  mongoose
  .connect('mongodb://localhost/flowse', {useNewUrlParser: true})
  .then(x => {
    console.log('Connected to Mongo')
  })
  .catch(err => {
    console.error('Error connection', err)
  })

 History.create(trackData)
 .then(result => {
   console.log("Success")
 })
 .catch(err => {
   console.log("Error creating the base", err);
 });