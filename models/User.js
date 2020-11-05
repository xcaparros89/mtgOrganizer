const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {type: String, require: true},
    email: {type: String, require: true},
    password: {type: String, require: true},
    decksId: { type: [String]},
    userCards: [{_id: {type:Schema.Types.ObjectId, ref:'Card'}, count: Number}],
    imgPath: {type: String, default: 'img/defaultAvatarBlack.png'},
    imgName: {type:String, default:'default'}
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema)

module.exports = User;