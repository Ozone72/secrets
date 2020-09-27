//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

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
    // TODO
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username, password: password }, function (
      err,
      validUser
    ) {
      if (err) {
        console.log(err);
      } else {
        if (validUser) {
          if (validUser.password === password) {
            res.render("secrets");
          }
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
    const newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    newUser.save(function (err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });

// Logout
app.get("/logout", (req, res) => {
  res.redirect("/");
});

// * SERVER *
const port = 3000;
app.listen(port, function () {
  console.log("Server started on " + port);
});
