var express = require("express");
const Filter = require('bad-words');
const Card = require("../models/Card");
const User = require("../models/User");
const Deck = require("../models/Deck");        
const colors = require('colors');
var router = express.Router();
var filter = new Filter();
let resultSearch = '';

//search cards
router.get("/search/card", function (req, res, next) {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  res.render("search/card");
});

router.post("/search/card", async (req, res, next) => {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
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
      console.log('paramsObj', paramsObj)
      resultSearch = await Card.find(paramsObj);
      if(req.session.currentUser) {
        res.locals.isLogged = true;
      }

      resultSearch.forEach(card => {
        card.logged = res.locals.isLogged;
      });

      res.render("search/card", { resultSearch });
    } catch (err) {
      console.log(err);
    }
});

router.post("/search/card/:id", async (req, res, next) => {
  console.log(req.params.id)
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
      res.render("search/card", { resultSearch });
    } catch (err) {
      console.log(err);
    }
  });

// explore decks
router.get('/search/deck', async (req, res, next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let decks = await Deck.find();
  decks.forEach(deck=>deck.colors = deck.colors.filter(color=>color === 'G' || color === 'B' || color === 'W' || color === 'U' || color === 'R').join(''));
  res.render('search/deck', {decks});
});

router.post('/search/deck', async (req, res, next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  console.log(req.body)
  let colors = req.body['colors[]'];
  let params = [];
  if(req.body.title) params.push({title: new RegExp(`(.*${req.body.title}).*`,'gi')});
  if(req.body.legalities && req.body.legalities!='Legality') params.push({legalities:{$in: [req.body.legalities]}});
  if(colors)typeof colors === 'object'? colors.forEach(col=>params.push({colors: {$in: [col]}})) : params.push({colors: {$in: [colors]}});
  console.log(params)
   let decks =  params.length? await Deck.find({$and: [...params]}) : await Deck.find();
   console.log(decks)
   decks.forEach(deck=>deck.colors = deck.colors.filter(color=>color === 'G' || color === 'B' || color === 'W' || color === 'U' || color === 'R').join(''));
   console.log(decks)
  res.render('search/deck', {decks});
});

let deck;
router.get('/search/deck/:id', async (req, res, next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  deck = await Deck.findById(req.params.id).populate('mainCards.creatures.card').populate('mainCards.lands.card').populate('mainCards.planeswalkers.card').populate('mainCards.instants.card').populate('mainCards.enchantments.card').populate('mainCards.sorceries.card').populate('mainCards.artifacts.card').populate('mainCards.others.card').populate('sideboard.card');
  author = await User.findById(deck.authorId);
  deck.authorName = author.username;
  if( req.session.currentUser){
    let missingCards =[];
    res.locals.isLogged = true;
  res.locals.isUserAuthor = deck.authorId === req.session.currentUser._id? true : false;
    deck.mainCards.creatures.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.instants.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.sorceries.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.enchantments.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.artifacts.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.planeswalkers.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.lands.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });
    deck.mainCards.others.forEach(cardObj=>{
      let userCard = req.session.currentUser.userCards.filter((userCardObj)=> userCardObj._id == cardObj.card._id)[0];
      if(userCard){
        if(userCard.count - cardObj.count < 0){
          missingCards.push({string: `${cardObj.count - userCard.count} ${cardObj.card.name}`, name: cardObj.card.name})
        }
      } else{
        missingCards.push({string: `${cardObj.count} ${cardObj.card.name}`, name: cardObj.card.name})
      }
    });  
  deck.missingCards = missingCards.length === 0 ? [{string:'You own all the cards of this deck'}] : missingCards;
  }
  console.log(deck.missingCards)
  res.locals.likes = deck.likes.length;
  res.locals.dislikes = deck.dislikes.length;
  res.render('search/deckInfo', {deck});
});

router.post('/deckInfo/reply', async (req,res,next)=>{
  let filterReply = filter.clean(req.body.reply)
  let newReplies = [...deck.replies, {message: filterReply, author:req.session.currentUser.username}];
  console.log(newReplies);
  await Deck.findByIdAndUpdate({_id:deck._id},{replies:newReplies});
  res.redirect(`/search/deck/${deck._id}`);
});

router.get('/deckInfo/like', async (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let newLike = false;
  deck.likes.forEach(like=>{if(like == req.session.currentUser._id) newLike = true;});
  if(!newLike){
    let newLikes = [...deck.likes, req.session.currentUser._id];
    await Deck.findByIdAndUpdate({_id:deck._id},{likes:newLikes});
  }
  res.redirect(`/search/deck/${deck._id}`);
})

router.get('/deckInfo/dislike', async (req,res,next)=>{
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  let newDislike = false;
  deck.dislikes.forEach(dislike=>{if(dislike == req.session.currentUser._id) newDislike = true;});
  if(!newDislike){
    let newDislikes = [...deck.dislikes, req.session.currentUser._id];
    await Deck.findByIdAndUpdate({_id:deck._id},{dislikes:newDislikes});
  }
  res.redirect(`/search/deck/${deck._id}`);
})

module.exports = router;