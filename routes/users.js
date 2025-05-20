var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const uniqid = require("uniqid");

router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({
    $or: [{ email: req.body.email }],
  }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        avatar: null,
        nickname: null,
        email: req.body.email,
        password: hash,
        token: uid2(32),
      });

      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      res.json({ result: false, error: "Username or email already exists" });
    }
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});
router.put("/profile", (req, res) => {
  if (
    !checkBody(req.body, ["token", "nickname"]) ||
    !req.files ||
    !req.files.photoFromFront
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: req.body.token }).then((user) => {
    if (!user) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    const photoPath = `./tmp/${uniqid()}.jpg`;
    req.files.photoFromFront.mv(photoPath, (err) => {
      if (err) {
        res.json({ result: false, error: "File upload failed" });
        return;
      }

      cloudinary.uploader.upload(photoPath, (error, resultCloudinary) => {
        fs.unlinkSync(photoPath); 

        if (error) {
          res.json({ result: false, error: "Cloudinary upload failed" });
          return;
        }

        user.nickname = req.body.nickname;
        user.avatar = resultCloudinary.secure_url;
        user.save().then(() => {
          res.json({ result: true, url: resultCloudinary.secure_url });
        });
      });
    });
  });
});

router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (user) {
      console.log(user);
      res.json({ result: true, user });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

module.exports = router;
