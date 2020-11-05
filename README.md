# Project2

# Description
This page is used to manage your magic decks and find new decks and cards

# MVP
Home page, 
Decks search page,
Cards search page,
Personal page,
Deck info page,
Card info page,
Call to Magic's API for the cards info
User and Deck Model
CRUD + authentication and authorization
Resposive page

# Backlog
Cards market,
Events (tournaments...),
Basic version of the game

# Wireframes
<img src='project2/public/images/wireframe.png'>
https://wireframepro.mockflow.com/view/Ma9f049c5e2ef4f1452e77725e0e4fb091602166447826

# APIs
https://api.magicthegathering.io

# Structure
\
project2/\
&nbsp;&nbsp;&nbsp;&nbsp;|── bin\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── seeds.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── www\
&nbsp;&nbsp;&nbsp;&nbsp;|── models\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── Card.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── Deck.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── User.js\
&nbsp;&nbsp;&nbsp;&nbsp;|── public\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── images\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── favicon.ico\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── wireframe.png\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── stylesheets\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── style.css\
&nbsp;&nbsp;&nbsp;&nbsp;|── routes\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── auth.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── deck.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── index.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── search.js\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── user.js\
&nbsp;&nbsp;&nbsp;&nbsp;|── views\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── auth\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── login.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── signup.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── search\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── card.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── deck.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── cardInfo.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── deckInfo.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── error.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── index.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;|── layout.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;└── profile.hbs\
&nbsp;&nbsp;&nbsp;&nbsp;|── .gitignore\
&nbsp;&nbsp;&nbsp;&nbsp;|── app.js\
&nbsp;&nbsp;&nbsp;&nbsp;|── package-lock.json\
&nbsp;&nbsp;&nbsp;&nbsp;|── package.json\
README.md
\
# Routes

MethodRouteDescriptionRequest - BodyGET/Main page route. Renders home index view.GET/loginRenders login form view.POST/loginSends Login form data to the server.{ username, password }GET/signupRenders signup form view.POST/signupSends SignUp info to the server and creates user in the DB.{ name, email, password }GET/randomRenders to the random card pageGET/userPriv route. Renders user view and list projects and cardsGET/project/create/Priv route. Renders create projects form.POST/project/create/:_idPriv route. Sends new projects info to server, updates DB.{ projectname, description}GET/project/edit/Priv route. Renders edit projects form.PUT/project/edit/:_idPriv route. Sends edit projects info to server, updates DB.{ projectname, description }POST/card/create/Priv route. Sends new cards info to server, updates DB.{ description }GET/card/create/Priv route. Renders create cards form.DELETE/projectsPriv route. Deletes user project from DB.DELETE/cardsPriv route. Deletes user card from DB.GET/logoutPriv route. Destroy current session. Renders home index view.

# Models
User model\
&nbsp;&nbsp;&nbsp;&nbsp;{\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;username: {type: String, require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;email: {type: String, require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;password: {type: String, require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;decksId: { type: [String]},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;userCards: {type: [{cardId: String, count: Number}]},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;profileImg: {type: String, default: 'images/defaultAvatar.png'}\
&nbsp;&nbsp;&nbsp;&nbsp;}\
\
Deck model\
&nbsp;&nbsp;&nbsp;&nbsp;{\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;name: {type: String, require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;authorId: {type: String, require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;mainCards: {type: [{cardId: String, count: Number}], require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sideboard: {type: [{cardId: String, count: Number}], require: true},\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;likes: {type: [String]}\
&nbsp;&nbsp;&nbsp;&nbsp;}\


# Links
GitHub
https://github.com/xcaparros89/Project2

Heroku
...

Trello
https://trello.com/invite/b/QA7dhTFu/48c335959060ca3fd50a64b7a025937d/m2-proyecto
