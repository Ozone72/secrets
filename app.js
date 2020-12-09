//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const app = express();

// * MIDDLEWARE *
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Setup passport and session
app.use(passport.initialize());
app.use(passport.session());

// * CONNECTION *
const uri = process.env.MONGO_URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .catch((err) => console.log(err.reason));

// * SCHEMA & MODEL
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  password: String,
  provider: String,
});

// configure passport-local-mongoose
userSchema.plugin(passportLocalMongoose, { usernameField: "username" });
// configure mongoose-findorcreate
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// set up passport local
passport.use(User.createStrategy());

// passport universale serialization
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// * OATH2 SETUP
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OATH2_CLIENTID,
      clientSecret: process.env.OATH2_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate(
        { username: profile.id },
        {
          provider: "google",
          email: profile._json.email,
        },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APPID,
      clientSecret: process.env.FACEBOOK_APPSECRET,
      callbackURL: "http://localhost:3000/auth/facebook/secrets",
      profileFields: ["id", "email"],
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate(
        { username: profile.id },
        {
          provider: "facebook",
          email: profile._json.email,
        },
        function (err, user) {
          return cb(err, user);
        }
      );
    }
  )
);

// * ROUTES *
// Root
app.get("/", (req, res) => {
  res.render("home");
});

// Google OAUTH2
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

// Facebook OAUTH2
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

// Facebook will redirect the user to this URL after approval.
app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

// Login
app
  .route("/login")
  .get(function (req, res) {
    res.render("login");
  })
  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    });
  });

// Registration
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.register(
      { username: username, email: username, provider: "local" },
      password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

// Secrets
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// * SERVER *
const port = 3000;
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Server started on port: " + port);
  }
});
