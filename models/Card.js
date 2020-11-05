const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardSchema = new Schema(
    {name: {type: String, require: true},
    image_uris: {png: String},
    mana_cost: {type: String},
    cmc: {type: Number},
    type_line: {type:String},
    oracle_text: {type: String},
    power: {type: String},
    toughness: {type: String},
    colors: {type: [String]},
    keywords: {type: [String]},
    legalities: {
        standard: String,
        future: String,
        historic: String,
        pioneer: String,
        modern: String,
        legacy: String,
        pauper: String,
        vintage: String,
        penny: String,
        commander: String,
        brawl: String,
        duel: String,
        oldschool: String
    },
    set: {type: String},
    set_name: {type: String},
    set_type: {type: String},
    set_uri: {type: String},
    rarity: {type: String}
    }
);

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;