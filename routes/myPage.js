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
let types = ['creatures', 'lands', 'enchantments', 'sorceries', 'planeswalkers', 'instants', 'artifacts']
let typesReg = [/Creature/, /Land/, /Enchantment/, /Sorcery/, /Planeswalker/, /Instant/, /Artifact/]
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
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  const { name, set_name, rarity, legalities, type, subtype} = req.body;
  console.log(req.body, 'req.body')
  let colors=req.body['colors[]'];
  let paramsObj = [];
  if (name) paramsObj.push({name: new RegExp(name.trim(), "i")})
  if (set_name) paramsObj.push({set_name : new RegExp(set_name.trim(), "i")});
  if (rarity) paramsObj.push({set_name : new RegExp(rarity.trim(), "i")});
  if (legalities != 'Legality') paramsObj.push({[`legalities.${legalities}`] : "legal"});
  if(colors)typeof colors === 'object'? colors.forEach(col=>paramsObj.push({colors: {$in: [col]}})) : paramsObj.push({colors: {$in: [colors]}});
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
    paramsObj.push({type_line: regex2});
  }
    try {
      console.log(paramsObj, 'paramsObj')
      newDeck.results = await Card.find({$and: [...paramsObj]});
      console.log(newDeck.results, 'newDEck.results')
      res.render("myPage/makeDeck", { newDeck });
    } catch (err) {
      console.log(err);
    }
});

//SEARCH CARD
router.post("/search/cardForDeck/:id", (req, res, next) => {
  if(!newDeck.cards)newDeck.cards={ main:{lands:[], artifacts:[], enchantments:[], instants:[], sorceries:[], planeswalkers:[],creatures:[], others:[]}, side:[], undecided:[]}
  let newCard = newDeck.results.find(card=> card._id == req.params.id)
  if(req.body.place === 'main'){
    typesReg.forEach((typeReg, index)=>{if(typeReg.test(newCard.type_line))newDeck.cards.main[types[index]].push({card:newCard, count:req.body.count});})
  } else {
    newDeck.cards[req.body.place].push({card:newCard, count: req.body.count});
  }
  res.render("myPage/makeDeck", { newDeck });
});

//CHANGE TEXT
router.post('/makeDeck/text', uploadCloud.single("photo"), (req,res,next)=>{
  newDeck.title = filter.clean(req.body.title); 
  newDeck.description = filter.clean(req.body.description);
  if(req.file){
    newDeck.imgPath = req.file.url.split('/upload/').join('/upload/w_1000,h_900,c_crop/')//aqui has de fer split('upload').join('upload/elscanvisquesiguiquevulguis a la imatge'npm)
  }
  res.render("myPage/makeDeck", { newDeck });
});

//CHANGE NUMBER OF CARDS
router.post('/makeDeck/number/place/:place/type/:type/id/:id', (req,res,next)=>{
  if(req.params.place === 'main'){
      newDeck.cards.main[req.params.type] = newDeck.cards.main[req.params.type].map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  } else{
    newDeck.cards[req.params.place]= newDeck.cards[req.params.place].map(cardObj=> cardObj.card._id == req.params.id? {...cardObj, count:req.body.count} : cardObj);
  }
  res.render("myPage/makeDeck", { newDeck });
});

//MOVE CARD
router.post('/makeDeck/move/place/:place/type/:type/id/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let movedCard
  if(req.params.place === 'main'){
    movedCard = newDeck.cards[req.params.place][req.params.type].find(cardObj=> cardObj.card._id == req.params.id);
    newDeck.cards[req.params.place][req.params.type] = newDeck.cards[req.params.place][req.params.type].filter(cardObj=> cardObj.card._id != req.params.id);
  } else{
    movedCard = newDeck.cards[req.params.place].find(cardObj=> cardObj.card._id == req.params.id);
    newDeck.cards[req.params.place] = newDeck.cards[req.params.place].filter(cardObj=> cardObj.card._id != req.params.id);
  }
  if(req.body.place === 'main'){
    typesReg.forEach((typeReg, index)=>{
      if(typeReg.test(movedCard.card.type_line)){newDeck.cards.main[types[index]].push(movedCard);}
    })
  }else{  
    newDeck.cards[req.body.place] = [...newDeck.cards[req.body.place], movedCard];
  }
  res.render("myPage/makeDeck", { newDeck });
});

//MOVE DELETE
router.get('/makeDeck/delete/place/:place/type/:type/id/:id', (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  if(req.params.place === 'main'){
    newDeck.cards[req.params.place][req.params.type] = newDeck.cards[req.params.place][req.params.type].filter(cardObj=> cardObj.card._id != req.params.id);
  } else{
    newDeck.cards[req.params.place] = newDeck.cards[req.params.place].filter(cardObj=> cardObj.card._id != req.params.id);
  }
  res.render("myPage/makeDeck", { newDeck });
});

//SAVE DECK
router.get('/makeDeck/save',async (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let mistakes = '';
  let colors = [];
  let legalities = ['standard', 'future', 'historic', 'pioneer', 'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander', 'brawl', 'duel', 'oldschool'];
  if(newDeck.cards.main.length <60) mistakes += 'The deck must have a minimum of 60 cards.';
  if(newDeck.cards.side.length >15) mistakes += 'The side deck must have a maximum of 15 cards.'; 
    types.forEach(type=>{
      newDeck.cards.main[type] = newDeck.cards.main[type].map(cardObj=>{
        if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    })
  })
    newDeck.cards.side = newDeck.cards.side.map(cardObj=>{
      if(cardObj.count>4 && !/Basic Land/.test(cardObj.card.type_line)){mistakes += `You cannot have more than 4 ${cardObj.card.name}.`}
      colors = [...colors, ...cardObj.card.colors];
      let newLegalities = [...legalities];
      legalities.forEach(legality=>{if(cardObj.card.legalities[legality]==='not_legal')newLegalities.splice(newLegalities.indexOf(legality), 1);});
      legalities = [...newLegalities];
      return {card: cardObj.card._id, count: cardObj.count};
    });
    colors = new Set(colors);
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

//SHOW MY DECKS
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

//MODIFY MY DECK
router.post('/myDecks/modify/:id', async function (req,res,next){
  currentDeck = req.params.id;
  let myDeck = await Deck.findById(req.params.id).populate('mainCards.creatures.card').populate('mainCards.lands.card').populate('mainCards.planeswalkers.card').populate('mainCards.instants.card').populate('mainCards.enchantments.card').populate('mainCards.sorceries.card').populate('mainCards.artifacts.card').populate('mainCards.others.card').populate('sideboard.card');
  let mainCards = {creatures:[],instants:[],sorceries:[],enchantments:[],lands:[],planeswalkers:[],artifacts:[],others:[]}; 
  let sideboard = [];
  types.forEach(type=>{
    myDeck.mainCards[type].forEach(cardObj=>{mainCards[type].push({card:cardObj.card, count:cardObj.count})});
  })
  myDeck.sideboard.forEach(cardObj=>{sideboard.push({card:cardObj.card, count:cardObj.count})});
  newDeck = {title:myDeck.title, description:myDeck.description, imgPath:myDeck.imgPath, cards: {main:mainCards, side:sideboard, undecided:[]}, author:req.session.currentUser.username};
  res.render('myPage/makeDeck', {newDeck});
});

//COPY A DECK
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