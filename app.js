//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const saltRounds = 10;

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// * CONNECTION *
const uri = process.env.MONGO_URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((err) => console.log(err.reason));

// * SCHEMA & MODEL
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// * ROUTES *
// Root
app.get("/", (req, res) => {
  res.render("home");
});

// Login
app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function (err, validUser) {
      if (err) {
        console.log(err);
      } else {
        if (validUser) {
          bcrypt.compare(password, validUser.password, function (err, result) {
            if (result === true) {
              res.render("secrets");
            } else {
              console.log(err);
            }
          });
        }
      }
    });
  });

// Registration
app
  .route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });
      newUser.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          res.render("secrets");
        }
      });
    });
  });

// Logout
app.get("/logout", (req, res) => {
  res.redirect("/");
});

// * SERVER *
const port = 3000;
app.listen(port, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Server started on " + port);
  }
});
