var express = require("express");
const Filter = require('bad-words');
const Card = require("../models/Card");
const User = require("../models/User");
const Deck = require("../models/Deck");
const bcrypt = require("bcryptjs");
const uploadCloud = require("../config/cloudinary");
const colors = require('colors');

var router = express.Router();
var filter = new Filter();

router.use((req, res, next) => { // Todo lo que esta dentro del Array es protected.
    // if hay un usuario en sesión (si está logged in)
    if (req.session.currentUser) {
      res.locals.isLogged = true;
      next();
    } else {
      res.redirect("/login");
    }
  });
  
  // VIEW PROFILE
  router.get("/profile", function (req, res, next) {
    if(req.session.currentUser) {
      res.locals.isLogged = true;
    }
    res.render("myPage/profile", {user:req.session.currentUser});
  })

  router.get("/modifyProfile", function (req, res, next) {
    if(req.session.currentUser) {
      res.locals.isLogged = true;
    }
    res.render("myPage/modifyProfile", {user:req.session.currentUser});
  })

  //MODIFY PROFILE
  router.post("/modifyProfile", uploadCloud.single("photo"), async function (req, res, next) {
    let imgPath = req.session.currentUser.imgPath;
    let imgName = req.session.currentUser.imgName;
    if(req.file){
      imgPath = req.file.url;
      imgName = req.file.originalname;
    }
    const userEmail = await User.findOne({ email: req.body.email });
    if (userEmail !== null && userEmail._id != req.session.currentUser._id) {
      res.locals.error = 'The email already exists!'
      res.render("myPage/modifyProfile", {user:req.session.currentUser});
      return;
    }
    const repeatedUser = await User.findOne({ username: req.body.username });
    if (repeatedUser !== null && repeatedUser._id != req.session.currentUser._id) {
      res.locals.error = 'The username already exists!'
      res.render("myPage/modifyProfile", {user:req.session.currentUser});
      return;
    }

    if(req.body.password != req.body.password2){
      res.locals.error = 'The passwords do not match!'
      res.render("myPage/modifyProfile", {user:req.session.currentUser});
    }
    const salt = bcrypt.genSaltSync(10);
    let newUsername = req.body.username;
    let newEmail = req.body.email;
    let newUser;
    if(req.body.password){
      const hashPass = bcrypt.hashSync(req.body.password, salt);
      newUser = await User.findByIdAndUpdate(req.session.currentUser._id, {username: newUsername, email:newEmail , password:hashPass, imgPath, imgName}, {new: true})
    }else{ 
      newUser = await User.findByIdAndUpdate(req.session.currentUser._id, {username: newUsername, email:newEmail, imgPath, imgName}, {new: true});
   }
    req.session.currentUser = newUser;
    res.render("myPage/profile", {user:req.session.currentUser});
  })

 
  //MY CARDS
  router.get("/myCollection", async function (req, res, next) {
    if(req.session.currentUser) res.locals.isLogged = true;
    try {
      req.session.currentUser = await User.findById(req.session.currentUser._id);
      let userPopulated = await User.findById(req.session.currentUser._id).populate('userCards._id');
      let userCards = userPopulated.userCards;
      res.render("myPage/myCollection", {userCards});
    } catch (error) {console.log(error);}
  });

  router.post('/myCollection/modify/:id', async function(req, res, next){
    if(req.session.currentUser)res.locals.isLogged = true;
    try{
    let userCards = req.session.currentUser.userCards;
    let newUserCards;
    let owned = Number(req.body.owned);
    newUserCards = owned == 0? userCards.filter(card=> card._id != req.params.id) : userCards.map(card=>card._id == req.params.id? {_id:req.params.id, count:owned} : card);
    await User.findByIdAndUpdate(req.session.currentUser._id, {userCards: newUserCards});
    res.redirect('/myCollection');
    } catch(error){console.log(error);}
  });

  router.post("/myCollection/search", async (req, res, next) => {
    if(req.session.currentUser) {
      res.locals.isLogged = true;
    }
    let userPopulated = await User.findById(req.session.currentUser._id).populate('userCards._id');
    let userCards = userPopulated.userCards;
    const { name, legality} = req.body;
    let colors=req.body['colors[]'] 
      try {
        if(name){
          let paramsName = new RegExp(name.trim(), "i");
          userCards = userCards.filter(card=>{
            return paramsName.test(card._id.name)
          })
        }
        if(legality != 'Legality'){
          userCards = userCards.filter(card=>{
            return card._id.legalities[legality] === 'legal'
          })
        }

        if(colors){
          const paramsColors = [];
          typeof colors === 'object'? colors.forEach(col=>paramsColors.push(col)) : paramsColors.push(colors);
          userCards = userCards.filter(card=>{
            let includes = true;
            paramsColors.forEach(col=>{if(!card._id.colors.includes(col)) includes = false;});
            return includes;
        })
      }
      
        if(req.session.currentUser) {
          res.locals.isLogged = true;
        }
        userCards.forEach(card => {
          card.logged = res.locals.isLogged;
        });
     
        res.render("myPage/myCollection", { userCards });
      } catch (err) {
        console.log(err);
      }
  });
  
  router.post("/myCollection/search/:id", async (req, res, next) => {
    if(req.session.currentUser) {
      res.locals.isLogged = true;
    }
      try {
        req.session.currentUser = await User.findById(req.session.currentUser._id);
        collection = [...req.session.currentUser.userCards.filter(card=>card._id != req.params.id), {_id:req.params.id, count: req.body.owned}];
        await User.findByIdAndUpdate(req.session.currentUser._id, {userCards: collection});
        const card = await Card.findOne({_id: req.params.id})
        res.locals.addedMessage = req.body.owned + " " + card.name + " has been added to your collection."
        res.locals.cardAdded = true;
        res.render("myPage/myCollection", { resultSearch });
      } catch (err) {
        console.log(err);
      }
    });

//MY DECKS
let newDeck = {};
let currentDeck; //used when modifiying decks
router.post('/makeDeck', function (req,res,next){
  newDeck={title: filter.clean(req.body.title), description: filter.clean(req.body.description), author: req.session.currentUser.username};
  res.render('myPage/makeDeck', {newDeck});
});

router.post('/makeDeck/search', async (req,res,next)=>{
  const { name, set_name, rarity, legality, type, subtype, colors } = req.body;
  const paramsObj = {};
  if (name) paramsObj.name = new RegExp(name.trim(), "i");
  if (set_name) paramsObj.set_name = new RegExp(set_name.trim(), "i");
  if (rarity) paramsObj.set_name = new RegExp(rarity.trim(), "i");
  if (legality) paramsObj[`legalities.${legality}`] = "legal";
  if (colors) {
    let colorsArr = colors
      .trim()
      .split(",")
      .join("")
      .split(" ")
      .map((color) => {
        if (color === "red" || color === "Red" || color === "RED") return "R";
        if (color === "blue" || color === "Blue" || color === "BLUE")
          return "U";
        if (color === "white" || color === "White" || color === "WHITE")
          return "W";
        if (color === "green" || color === "Green" || color === "GREEN")
          return "G";
        if (color === "black" || color === "Black" || color === "BLACK")
          return "B";
      })
      .sort();
    paramsObj.colors = colorsArr;
  }
  if (type || subtype) {
    let regex = "";
    let totalTypeArr = [];
    if (type) totalTypeArr = [...type.trim().split(",").join("").split(" ")];
    if (subtype)
      totalTypeArr = [
        ...totalTypeArr,
        ...subtype.trim().split(",").join("").split(" "),
      ];
    totalTypeArr.forEach((el) => (regex += `(?=.*\\b${el}\\b)`));
    let regex2 = new RegExp(regex + ".*", "gi");
    paramsObj.type_line = regex2;
  }
    try {
      newDeck.results = await Card.find(paramsObj);
      res.render("myPage/makeDeck", { newDeck });
    } catch (err) {
      console.log(err);
    }
});

router.post("/search/cardForDeck/:id", (req, res, next) => {
  if(!newDeck.cards)newDeck.cards={ main:{lands:[], artifacts:[], enchantments:[], instants:[], sorceries:[], planeswalkers:[],creatures:[], others:[]}, side:[], undecided:[]}
  let newCard = newDeck.results.find(card=> card._id == req.params.id)
   if(req.body.place === 'main'){
  if (/Land/.test(newCard.type_line)){newDeck.cards.main.lands.push({card:newCard, count:req.body.count});}
  else if (/Instant/.test(newCard.type_line)){newDeck.cards.main.instants.push({card:newCard, count:req.body.count});}
  else if (/Enchantment/.test(newCard.type_line)){newDeck.cards.main.enchantments.push({card:newCard, count:req.body.count});}
  else if (/Sorcery/.test(newCard.type_line)){newDeck.cards.main.sorceries.push({card:newCard, count:req.body.count});}
  else if (/Planeswalker/.test(newCard.type_line)){newDeck.cards.main.planeswalkers.push({card:newCard, count:req.body.count});}
  else if (/Creature/.test(newCard.type_line)){newDeck.cards.main.creatures.push({card:newCard, count:req.body.count});}
  else if (/Artifact/.test(newCard.type_line)){newDeck.cards.main.artifacts.push({card:newCard, count:req.body.count});}
  else {newDeck.cards.main.others.push({card:newCard, count:req.body.count});}
   } else if(req.body.place === 'side'){
      newDeck.cards.side.push({card:newCard, count: req.body.count});
    } else {
       newDeck.cards.undecided.push({card:newCard, count: req.body.count});
      }
  console.log(newDeck.cards);
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/text', uploadCloud.single("photo"), (req,res,next)=>{
  newDeck.title = filter.clean(req.body.title); 
  newDeck.description = filter.clean(req.body.description);
  console.log(req.file);
  if(req.file){
    newDeck.imgPath = req.file.url.split('/upload/').join('/upload/w_1000,h_900,c_crop/')//aqui has de fer split('upload').join('upload/elscanvisquesiguiquevulguis a la imatge'npm)
  }
  console.log(newDeck.imgPath)
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/main/:id', (req,res,next)=>{
  newDeck.cards.main.creatures = newDeck.cards.main.creatures.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.lands = newDeck.cards.main.lands.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.enchantments = newDeck.cards.main.enchantments.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.sorceries = newDeck.cards.main.sorceries.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.planeswalkers = newDeck.cards.main.planeswalkers.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.instants = newDeck.cards.main.instants.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.artifacts = newDeck.cards.main.artifacts.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  newDeck.cards.main.others = newDeck.cards.main.others.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/side/:id', (req,res,next)=>{
  newDeck.cards.side= newDeck.cards.side.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/undecided/:id', (req,res,next)=>{
  newDeck.cards.undecided = newDeck.cards.undecided.map(cardObj=>cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/move/main/:id', (req,res,next)=>{
  let movedCardCreature = newDeck.cards.main.creatures.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardLand = newDeck.cards.main.lands.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardEnchantment = newDeck.cards.main.enchantments.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardSorcery = newDeck.cards.main.sorceries.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardPlaneswalkers = newDeck.cards.main.planeswalkers.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardInstants = newDeck.cards.main.instants.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardArtifacts = newDeck.cards.main.artifacts.find(cardObj=> cardObj.card._id == req.params.id);
  let movedCardOthers = newDeck.cards.main.others.find(cardObj=> cardObj.card._id == req.params.id);
  if(movedCardCreature){
    newDeck.cards.main.creatures = newDeck.cards.main.creatures.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardCreature];
  } else if(movedCardLand){
    newDeck.cards.main.lands = newDeck.cards.main.lands.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardLand];
  } else  if(movedCardEnchantment){
    newDeck.cards.main.enchantments = newDeck.cards.main.enchantments.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardEnchantment];
  } else  if(movedCardSorcery){
    newDeck.cards.main.sorceries = newDeck.cards.main.sorceries.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardSorcery];
  } else  if(movedCardPlaneswalkers){
    newDeck.cards.main.planeswalkers = newDeck.cards.main.planeswalkers.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardPlaneswalkers];
  } else  if(movedCardInstants){
    newDeck.cards.main.instants = newDeck.cards.main.instants.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardInstants];
  } else  if(movedCardArtifacts){
    newDeck.cards.main.artifacts = newDeck.cards.main.artifacts.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardArtifacts];
  } else if(movedCardOthers){
    newDeck.cards.main.others = newDeck.cards.main.others.filter(cardObj=> cardObj.card._id != req.params.id);
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCardOthers];
  }
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/move/side/:id', (req,res,next)=>{
  let movedCard = newDeck.cards.side.find(cardObj=> cardObj.card._id == req.params.id);
  newDeck.cards.side = newDeck.cards.side.filter(cardObj=> cardObj.card._id != req.params.id);
  if(req.body.place === 'undecided'){
    newDeck.cards.undecided = [...newDeck.cards.undecided, movedCard];
  } else{
    if (/Land/.test(movedCard.card.type_line)){newDeck.cards.main.lands.push(movedCard);}
  else if (/Instant/.test(movedCard.card.type_line)){newDeck.cards.main.instants.push(movedCard);}
  else if (/Enchantment/.test(movedCard.card.type_line)){newDeck.cards.main.enchantments.push(movedCard);}
  else if (/Sorcery/.test(movedCard.card.type_line)){newDeck.cards.main.sorceries.push(movedCard);}
  else if (/Planeswalker/.test(movedCard.card.type_line)){newDeck.cards.main.planeswalkers.push(movedCard);}
  else if (/Creature/.test(movedCard.card.type_line)){newDeck.cards.main.creatures.push(movedCard);}
  else if (/Artifact/.test(movedCard.card.type_line)){newDeck.cards.main.artifacts.push(movedCard);}
  else {newDeck.cards.main.others.push(movedCard);}
  }
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/move/undecided/:id', (req,res,next)=>{
  let movedCard = newDeck.cards.undecided.find(cardObj=> cardObj.card._id == req.params.id);
  newDeck.cards.undecided = newDeck.cards.undecided.filter(cardObj=> cardObj.card._id != req.params.id);
  if(req.body.place === 'side'){
    newDeck.cards.side = [...newDeck.cards.side, movedCard];
  } else{
    if (/Land/.test(movedCard.card.type_line)){newDeck.cards.main.lands.push(movedCard);}
  else if (/Instant/.test(movedCard.card.type_line)){newDeck.cards.main.instants.push(movedCard);}
  else if (/Enchantment/.test(movedCard.card.type_line)){newDeck.cards.main.enchantments.push(movedCard);}
  else if (/Sorcery/.test(movedCard.card.type_line)){newDeck.cards.main.sorceries.push(movedCard);}
  else if (/Planeswalker/.test(movedCard.card.type_line)){newDeck.cards.main.planeswalkers.push(movedCard);}
  else if (/Creature/.test(movedCard.card.type_line)){newDeck.cards.main.creatures.push(movedCard);}
  else if (/Artifact/.test(movedCard.card.type_line)){newDeck.cards.main.artifacts.push(movedCard);}
  else {newDeck.cards.main.others.push(movedCard);}
  }
  res.render("myPage/makeDeck", { newDeck });
});

router.get('/makeDeck/delete/main/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  newDeck.cards.main.lands = newDeck.cards.main.lands.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.instants = newDeck.cards.main.instants.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.enchantments = newDeck.cards.main.enchantments.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.sorceries = newDeck.cards.main.sorceries.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.planeswalkers = newDeck.cards.main.planeswalkers.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.creatures = newDeck.cards.main.creatures.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.artifacts = newDeck.cards.main.artifacts.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards.main.others = newDeck.cards.main.others.filter(cardObj=> cardObj.card._id != req.params.id);
  res.render("myPage/makeDeck", { newDeck });
});

router.get('/makeDeck/delete/side/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  newDeck.cards.side = newDeck.cards.side.filter(cardObj=> cardObj.card._id != req.params.id);
  res.render("myPage/makeDeck", { newDeck });
});

router.get('/makeDeck/delete/undecided/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  newDeck.cards.undecided = newDeck.cards.undecided.filter(cardObj=> cardObj.card._id != req.params.id);
  res.render("myPage/makeDeck", { newDeck });
});

router.get('/makeDeck/save',async (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let mistakes = '';
  let colors = [];
  let legalities = ['standard', 'future', 'historic', 'pioneer', 'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander', 'brawl', 'duel', 'oldschool'];
  if(newDeck.cards.main.length <60) mistakes += 'The deck must have a minimum of 60 cards.';
  if(newDeck.cards.side.length >15) mistakes += 'The side deck must have a maximum of 15 cards.'; 
    newDeck.cards.main.creatures = newDeck.cards.main.creatures.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.sorceries = newDeck.cards.main.sorceries.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.instants = newDeck.cards.main.instants.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.enchantments = newDeck.cards.main.enchantments.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.planeswalkers = newDeck.cards.main.planeswalkers.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.artifacts = newDeck.cards.main.artifacts.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.lands = newDeck.cards.main.lands.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.main.others = newDeck.cards.main.others.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    newDeck.cards.side = newDeck.cards.side.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    colors = new Set(colors);
    console.log('legalities', legalities); console.log('mistakes', mistakes); console.log('colors',[...colors]);
    mistakes = ''; // uncomment this line is to have the validation for number of cards in deck, 4 of a kind...
    if(!mistakes){
    if(currentDeck){
      await Deck.findByIdAndUpdate({_id: currentDeck}, {mainCards: newDeck.cards.main, sideboard: newDeck.cards.side, imgPath: newDeck.imgPath, legalities:legalities, colors:[...colors], title:newDeck.title, description: newDeck.description});
      let id = currentDeck;
      currentDeck='';
      newDeck = ''; 
      res.redirect(`/search/deck/${id}`);
    }else{
      console.log(newDeck);
      let newImgPath = newDeck.imgPath? newDeck.imgPath : 'https://res.cloudinary.com/dysghv9yf/image/upload/v1604610846/magic/green-blue-deck.jpg';
      await Deck.create({ 
          title: newDeck.title,
          description: newDeck.description,
          authorId: req.session.currentUser._id,
          mainCards: newDeck.cards.main,
          sideboard: newDeck.cards.side,
          legalities: legalities,
          colors: [...colors],
          likes: [],
          dislikes:[],
          replies: [],
          imgPath: newImgPath
        });
        newDeck = '';
        res.redirect('/myDecks');
    }

  }else {
    newDeck.mistakes = mistakes;
    res.render("myPage/makeDeck", { newDeck });
  }
})

//My decks
router.get("/myDecks", async function (req, res, next) {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
    try {
        let myDecks = await Deck.find({authorId:req.session.currentUser._id});
        myDecks.forEach(deck=>deck.colors = deck.colors.filter(color=>color === 'G' || color === 'B' || color === 'W' || color === 'U' || color === 'R').join(''));
      res.render("myPage/myDecks", {myDecks});
    } catch (error) {console.log(error);}
  });

router.post('/myDecks/modify/:id', async function (req,res,next){
  currentDeck = req.params.id;
  let myDeck = await Deck.findById(req.params.id).populate('mainCards.creatures.card').populate('mainCards.lands.card').populate('mainCards.planeswalkers.card').populate('mainCards.instants.card').populate('mainCards.enchantments.card').populate('mainCards.sorceries.card').populate('mainCards.artifacts.card').populate('mainCards.others.card').populate('sideboard.card');
  let mainCards = {creatures:[],instants:[],sorceries:[],enchantments:[],lands:[],planeswalkers:[],artifacts:[],others:[]}; 
  let sideboard = [];
  myDeck.mainCards.creatures.forEach(cardObj=>{mainCards.creatures.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.instants.forEach(cardObj=>{mainCards.instants.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.sorceries.forEach(cardObj=>{mainCards.sorceries.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.enchantments.forEach(cardObj=>{mainCards.enchantments.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.lands.forEach(cardObj=>{mainCards.lands.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.planeswalkers.forEach(cardObj=>{mainCards.planeswalkers.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.artifacts.forEach(cardObj=>{mainCards.artifacts.push({card:cardObj.card, count:cardObj.count})});
  myDeck.mainCards.others.forEach(cardObj=>{mainCards.others.push({card:cardObj.card, count:cardObj.count})});
  myDeck.sideboard.forEach(cardObj=>{sideboard.push({card:cardObj.card, count:cardObj.count})});
  newDeck = {title:myDeck.title, description:myDeck.description, imgPath:myDeck.imgPath, cards: {main:mainCards, side:sideboard, undecided:[]}, author:req.session.currentUser.username};
  res.render('myPage/makeDeck', {newDeck});
});

router.get("/myDecks/copy/:id", async function (req, res, next) {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let copiedDeck = await Deck.findById(req.params.id);
  copiedDeck = JSON.stringify(copiedDeck);
  let newDeck = JSON.parse(copiedDeck);
  let newSideboard = newDeck.sideboard.map(cardObj=>{return {card: cardObj.card, count: cardObj.count};});
  await Deck.create({
    title: 'COPY OF: ' + newDeck.title,
    description: newDeck.description,
    authorId: req.session.currentUser._id,
    mainCards: newDeck.mainCards,
    sideboard: newSideboard,
    legalities: newDeck.legalities,
    colors: newDeck.colors,
    likes: [],
    dislikes:[],
    replies: []
  });
  res.redirect('/myDecks');
})

router.post('/myDecks/delete/:id', async function (req,res,next){
await Deck.findOneAndRemove({_id:req.params.id});
res.redirect('/myDecks');
});

module.exports = router;