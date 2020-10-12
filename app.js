//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(session({
  secret: 'oodie poodie puddin pie',
  resave: false,
  saveUninitialized: false
}));

// Setup passport and session
app.use(passport.initialize());
app.use(passport.session());


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

// configure passport-local-mongoose
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// * ROUTES *
// Root
app.get("/", (req, res) => {
  res.render("home");
});

// Login
app.get('/login', (req, res) => {
  res.render("login");
});

// Registration
app.get('/register', (req, res) => {
  res.render('register');
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
