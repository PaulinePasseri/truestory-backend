const mongoose = require("mongoose");

const usersSchema = mongoose.Schema({
  email: String,
  token: String,
  password: String,
  username: String,
  nickname: String,
  avatar: String,
});

const Users = mongoose.model("users", usersSchema);

module.exports = Users;
