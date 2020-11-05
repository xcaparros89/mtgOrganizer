

//const Card = require("../models/Card");

async function addToCollection(el){
    let id = el.id.split('_')[1];
    let numOwned = document.getElementById('num_'+id).value
    //console.log(await Card.find(id))
    console.log(numOwned)
  }