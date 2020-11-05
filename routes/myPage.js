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
  
  //Profile
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

  router.post("/modifyProfile", uploadCloud.single("photo"), async function (req, res, next) {
    const imgPath = req.file.url;
    const imgName = req.file.originalname;
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
      newUser = await User.findByIdAndUpdate(req.session.currentUser._id, {username: newUsername, email:newEmail , password:hashPass}, {new: true})
    }else{ 
      newUser = await User.findByIdAndUpdate(req.session.currentUser._id, {username: newUsername, email:newEmail}, {new: true});
   }
    req.session.currentUser = newUser;
    res.render("myPage/profile", {user:req.session.currentUser});
  })


  //My cards
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
  //router.post('/myCollection/modify/:id', async function(req, res, next){
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

//Make deck
let newDeck = {};
let currentDeck; //used when modifiying decks
router.post('/makeDeck', function (req,res,next){
  newDeck={title: filter.clean(req.body.title), description: filter.clean(req.body.description)}
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
  if(!newDeck.cards)newDeck.cards={main:[], side:[], undecided:[]};
  let newCard = newDeck.results.find(card=> card._id == req.params.id)
  console.log(req.params.id)
  console.log(newDeck.cards);
  newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], {card:newCard, count:req.body.count}];
    res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/text', (req,res,next)=>{
  newDeck.title = filter.clean(req.body.title); 
  newDeck.description = filter.clean(req.body.description);
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/modify/main/:id', (req,res,next)=>{
  newDeck.cards.main = newDeck.cards.main.map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
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
  let movedCard = newDeck.cards.main.find(cardObj=> cardObj.card._id == req.params.id);
  newDeck.cards.main = newDeck.cards.main.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCard];
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/move/side/:id', (req,res,next)=>{
  let movedCard = newDeck.cards.side.find(cardObj=> cardObj.card._id == req.params.id);
  newDeck.cards.side = newDeck.cards.side.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCard];
  res.render("myPage/makeDeck", { newDeck });
});

router.post('/makeDeck/move/undecided/:id', (req,res,next)=>{
  let movedCard = newDeck.cards.undecided.find(cardObj=> cardObj.card._id == req.params.id);
  newDeck.cards.undecided = newDeck.cards.undecided.filter(cardObj=> cardObj.card._id != req.params.id);
  newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCard];
  res.render("myPage/makeDeck", { newDeck });
});

router.get('/makeDeck/delete/main/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  newDeck.cards.main = newDeck.cards.main.filter(cardObj=> cardObj.card._id != req.params.id);
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
    newDeck.cards.main = newDeck.cards.main.map(cardObj=>{
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
      await Deck.findByIdAndUpdate({_id: currentDeck}, {mainCards: newDeck.cards.main, sideboard: newDeck.cards.side, legalities:legalities, colors:[...colors], title:newDeck.title, description: newDeck.description});
    }else{
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
          replies: []
        });
    }
    let id = currentDeck;
    currentDeck='';
    newDeck = ''; 
    res.redirect(`/search/deck/${id}`);
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
  let myDeck = await Deck.findById(req.params.id).populate('mainCards.card').populate('sideboard.card');
  let mainCards = []; 
  let sideboard = [];
  myDeck.mainCards.forEach(cardObj=>{mainCards.push({card:cardObj.card, count:cardObj.count})});
  myDeck.sideboard.forEach(cardObj=>{sideboard.push({card:cardObj.card, count:cardObj.count})});
  let newTitle = myDeck.title.split(' ').join('&nbsp');
  let newDescription = myDeck.description.split(' ').join('&nbsp');
  newDeck = {title:myDeck.title, description:description, cards: {main:mainCards, side:sideboard, undecided:[]}};
  console.log(newDeck.cards.main)
  res.render('myPage/makeDeck', {newDeck});
});

router.get("/myDecks/copy/:id", async function (req, res, next) {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let copiedDeck = await Deck.findById(req.params.id);
  copiedDeck = JSON.stringify(copiedDeck);
  let newDeck = JSON.parse(copiedDeck);
  newMainCards = newDeck.mainCards.map(cardObj=>{return {card: cardObj.card, count: cardObj.count};});
  newSideboard = newDeck.sideboard.map(cardObj=>{return {card: cardObj.card, count: cardObj.count};});
  console.log('here', newMainCards, newSideboard);
  await Deck.create({
    title: 'COPY OF: ' + newDeck.title,
    description: newDeck.description,
    authorId: req.session.currentUser._id,
    mainCards: newMainCards,
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