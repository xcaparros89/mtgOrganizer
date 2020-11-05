const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deckSchema = new Schema(
  {
    title: {type: String, require: true},
    description: {type: String, require: true},
    authorId: {type: String, require: true},
    mainCards: [{card: {type:Schema.Types.ObjectId, ref:'Card'}, count: Number}], // Min 60 No more than 4 of each excepting basic lands
    sideboard: [{card: {type:Schema.Types.ObjectId, ref:'Card'}, count: Number}],// Max 15
    legalities: {type: [String]},
    colors:{type: [String], require: true},
    likes: {type: [String], require: true},
    dislikes: {type: [String]},
    replies: {type: [{message:String, author:String}]}
  },
  {
    timestamps: true,
  }
);

const Deck = mongoose.model('Deck', deckSchema);

module.exports = Deck;