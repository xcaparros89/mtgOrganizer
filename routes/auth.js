var express = require("express");
var router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

//SIGNUP
router.get("/signup", function (req, res, next) {
  res.render("auth/signup");
});

router.post("/signup", async (req, res, next) => {
  if (req.body.username === "" || req.body.email === "" || req.body.password === "") {
    res.render("auth/signup", {
      errorMessage: "Indicate a username, email and a password to sign up",
    });
    return;
  }

  const { username, email, password, password2 } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashPass = bcrypt.hashSync(password, salt);

  try {
    const user = await User.findOne({ email: email });
    if (user !== null) {
      res.render("auth/signup", {
        errorMessage: "The email already exists!",
      });
      return;
    }

    const repeatedUser = await User.findOne({ username: username });
    if (repeatedUser !== null) {
      res.render("auth/signup", {
        errorMessage: "The username already exists!",
      });
      return;
    }

    if(password != password2){
      res.render("auth/signup", {
        errorMessage: "The passwords do not match!",
      });
      return;
    }

    let newUser = await User.create({
      username,
      email,
      password: hashPass,
      imgPath: `img/defaultAvatar${req.body.favoriteColor}.png`
    });
    req.session.currentUser = newUser;
    res.redirect("/myCollection");
  } catch (error) {
    next(error);
  }
});

//LOGIN
router.get("/login", (req, res, next) => {
  if(req.session.currentUser) {
    res.locals.isLogged = true;
  }
  res.render("auth/login");
});

router.post("/login", async (req, res, next) => {
  if (req.body.username === "" || req.body.password === "") {
    res.render("auth/login", {
      errorMessage: "Indicate a username and a password to login",
    });
    return;
  }

  const { username, password } = req.body;

  try {
    console.log('username', username)
    const user = await User.findOne({ $or: [{username:username }, {email:username}]});
    if (!user) {
      res.render("auth/login", {
        errorMessage: "The username doesn't exist",
      });
      return;
    }

    if (bcrypt.compareSync(password, user.password)) {
      req.session.currentUser = user;
      console.log(user)
      res.redirect("/myCollection");
    } else {
      res.render("auth/login", {
        errorMessage: "Incorrect password",
      });
    }
  } catch (error) {}
});

//LOGOUT
router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect('/')
  })
})

module.exports = router;
