var express = require('express');
var router = express.Router();
const User = require("../models/User");
const Card = require('../models/Card');

/* GET home page. */
router.get('/', async function(req, res, next) {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  console.log(res.locals.isLogged);
  res.render('index', { title: 'MTG Organize & Build' });
});


module.exports = router;
