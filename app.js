//jshint esvers/jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
// var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const members_for_db = require("./member_database");

require("dotenv").config()

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json())
app.use(session({
  secret: "Some secret string",
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(process.env.MONGO_URI.toString(), { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) {
    console.error(err.message)
  } else {
    console.log("Connected to Mongo")
  }
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  secret: String,
  sabhe_id: String,
  isAdmin: Boolean
});

const memberSchema = new mongoose.Schema({
  sl_no: Number,
  sabhe_id: String,
  title: String,
  fullname: String,
  address: String,
  city: String,
  pincode: String,
  landline: String,
  mobile: String,
  email_id: String,
  gothra: String,
  date_of_birth: String,
  month_of_birth: String,
  year_of_birth: Number,
  introduction: String,
  if_deceased: String,
  date_deceased: String,
  img:
  {
    data: Buffer,
    contentType: String
  }
})

var dates = [];
for (i = 1; i <= 31; i++) {
  dates.push(i.toString());
}
var years = [];
for (i = 1930; i <= 2020; i++) {
  years.push(i.toString())
}
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Member = new mongoose.model("Member", memberSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//   clientID: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: "http://localhost:3000/auth/google/secrets",
//   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
// },

//   function (accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

app.get("/", function (req, res) {
  res.render("home", { iflogin: false, forgot: false, passwordmessage: "" });
  console.log("Home page")
});

// app.get("/auth/google",
//   passport.authenticate('google', { scope: ["profile"] })
// );

// app.get("/auth/google/secrets",
//   passport.authenticate('google', { failureRedirect: "/" }),
//   function (req, res) {
//     res.redirect("/googlelogin");
//     console.log("Google login")
//   });

app.get("/login", function (req, res) {
  console.log("Login page")
  res.render("home", { iflogin: true, forgot: false, passwordmessage: "" });

});


app.get("/profile", function (req, res) {

  if (req.isAuthenticated()) {
    User.findById({ _id: req.user._id }, function (err, foundUser) {
      if (err) {
        res.send(err);
        console.log(err.message);
      }
      else {
        console.log(foundUser.sabhe_id);
        Member.findOne({ sabhe_id: foundUser.sabhe_id }, function (err, foundMember) {
          if (err) {
            res.send("SOME ERROR OCCURED, PLEASE RETRY");
            console.log(err.message);
          }
          else {
            console.log("Profile page accessed by " + foundMember.fullname);
            res.render("profile", { member_details: foundMember, ifUpdate: false });
          }
        })
      }
    })
  }
  else {
    res.redirect("/")
  }
})

app.get("/forgot", function (req, res) {
  console.log("Forgot password accessed")
  res.render("home", { iflogin: false, forgot: true, passwordmessage: "" })
})

// app.get("/googlelogin", function (req, res) {
//   if (req.isAuthenticated()) {
//     if (req.user.sabhe_id) {
//       res.redirect("/profile");
//     }
//     else {
//       res.redirect("/intermediate")
//     }
//   }
//   else {
//     res.redirect("/")
//   }
// })

app.get("/intermediate", function (req, res) {
  if (req.isAuthenticated()) {
    console.log("Other details verification page accessed by " + req.user.username)
    res.render("intermediate", { resultName: "" });
  }
  else {
    res.redirect("/login")
  }
})

app.get("/logout", function (req, res) {
  console.log(req.user.username + " Logging out")
  req.logout();
  res.redirect("/login")
})

app.get("/updateprofile", function (req, res) {
  if (req.isAuthenticated()) {
    User.findById({ _id: req.user._id }, function (err, foundUser) {
      if (err) {
        res.send(err);
        console.log(err.message);
      }
      else {
        Member.findOne({ sabhe_id: foundUser.sabhe_id }, function (err, foundMember) {
          if (err) {
            res.send("SOME ERROR OCCURED, PLEASE RETRY")
            console.log(err.message);
          }
          else {
            console.log("Update profile section accessed by " + foundMember.fullname);
            res.render("profile", { member_details: foundMember, dates: dates, years: years, months: months, ifUpdate: true });
          }
        })
      }
    })
  }
  else {
    res.redirect("/")
  }
})

app.get("/admin", function (req, res) {

  Member.find({}, null, { sort: { sabhe_id: 'ascending' } }, function (err, allUsersList) {
    if (err) {
      res.send(err);
      console.log(err.message);
    } else {

      if (req.isAuthenticated() && req.user.isAdmin === true) {
        console.log("Admin page accessed")
        res.render("admin", { wholeList: allUsersList })
      }
      else {
        res.redirect("/");
      }

    }
  })

});


app.post("/confirm", function (req, res) {
  var sabhe_id = req.body.sabhe_id;

  Member.findOne({ sabhe_id: sabhe_id }, function (err, user) {
    if (err) {
      console.log(err);
      console.log(err.message);
      res.redirect("/")
    } else {
      console.log("Confirm page accessed by " + req.user.username);
      res.render("confirm", { user: user })
    }
  })
});

app.post("/updateprofile", function (req, res) {

  var fullname = req.body.fullname
  var address = req.body.address
  var city = req.body.city
  var pincode = req.body.pincode
  var landline = req.body.landline
  var mobile = req.body.mobile
  var email_id = req.body.email_id
  var gothra = req.body.gothra
  var date_of_birth = req.body.date_of_birth
  var month_of_birth = req.body.month_of_birth
  var year_of_birth = req.body.year_of_birth
  var introduction = req.body.introduction
  var sabhe_id = req.body.sabhe_id;

  Member.findOneAndUpdate({ sabhe_id: sabhe_id },
    {
      fullname: fullname,
      address: address,
      city: city,
      pincode: pincode,
      landline: landline,
      mobile: mobile,
      email_id: email_id,
      gothra: gothra,
      date_of_birth: date_of_birth,
      month_of_birth: month_of_birth,
      year_of_birth: year_of_birth,
      introduction: introduction
    }
    , function (err) {
      if (err) {
        console.log(err);
        console.log(err.message);
      }
      if (req.user.isAdmin) {
        res.redirect("/admin")
      }
      else {
        console.log("Profile updated by " + req.user.username);
        res.redirect("/profile")
      }
    })
});

app.post("/adminupdate", function (req, res) {
  var sabhe_id = req.body.sabhe_id;

  Member.findOne({ sabhe_id: sabhe_id }, function (err, foundMember) {
    if (err) {
      res.send("SOME ERROR OCCURED, PLEASE RETRY");
      console.log(err.message);
    }
    else {
      console.log("Admin update for " + foundMember.fullname);
      res.render("profile", { member_details: foundMember, dates: dates, years: years, months: months, ifUpdate: true });
    }
  })
})

app.post("/adminsearch", function (req, res) {

  var sabhe_id = req.body.sabhe_id;
  var fullname = req.body.fullname;
  var address = req.body.address;
  var searchKey = {}

  if (fullname) {
    searchKey = { fullname: new RegExp(fullname, 'i') }
  }
  else if (address) {
    searchKey = { address: new RegExp(address, 'i') }
  }
  else {
    searchKey = { sabhe_id: new RegExp(sabhe_id, 'i') }
  }

  Member.find(searchKey, function (err, foundMembers) {
    if (err) {
      res.redirect("/admin");
      console.log(err.message)
    }
    else {
      console.log("Admin searched");
      res.render("admin", { wholeList: foundMembers });
    }
  })

})

var fs = require('fs');
var path = require('path');
const sharp = require('sharp');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
var upload = multer({ storage: storage });

app.post('/imageupload', upload.single('image'), async (req, res, next) => {
  console.log("Image post request by " + req.user.username);

  await sharp(__dirname + '/public/uploads/' + req.file.filename).resize(150, 150)
    .png({ quality: 100 }).toFile(__dirname
      + '/public/uploads/' + req.file.filename + '-thumb');

  Member.findOneAndUpdate({ sabhe_id: req.body.sabhe_id },
    {
      img: {
        data: fs.readFileSync(path.join(__dirname + '/public/uploads/' + req.file.filename + '-thumb')),
        contentType: 'image/png'
      }
    }
    , function (err) {
      if (err) {
        console.log(err.message);
      }
      else {
        console.log("Image saved to database " + req.user.username);
        fs.unlink(__dirname + '/public/uploads/' + req.file.filename, (err) => {
          if (err) {
            console.error(err.message);
            return
          }
        });
        fs.unlink(__dirname + '/public/uploads/' + req.file.filename + '-thumb', (err) => {
          if (err) {
            console.error(err.message)
            return
          }
        });

        res.redirect("/profile")
      }
    }
  )
});

app.post("/register", function (req, res) {
  console.log("New user register request +" + req.body.username)

  var password1 = req.body.password;
  var password2 = req.body.password2;
  var username = req.body.username;

  var namekey = req.body.firstname;

  // If password not entered
  if (password1 == '') {
    res.render("home", { iflogin: false, passwordmessage: "Please choose a password" });
  }
  // If confirm password not entered
  else if (password1 == '') {
    res.render("home", { iflogin: false, passwordmessage: "Please re-type your password" });
  }
  // If Not same return False.
  else if (password2 != password1) {
    res.render("home", { iflogin: false, passwordmessage: "Passwords don't match" });

  }

  else if (username == '') {
    res.render("home", { iflogin: false, passwordmessage: "Please enter a username (email-id)" });
  }

  else {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
      if (err) {
        console.log(err.message)
        res.render("home", { iflogin: false, passwordmessage: err.message });
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log("New user registered " + req.user.username);
          Member.find({ fullname: new RegExp(namekey, 'i') }, function (err, searchedUsers) {
            if (searchedUsers.length !== 0) {
              console.log("Intermediate name list page accessed by " + req.user.username);
              res.render("intermediate", { resultName: searchedUsers });
            }
            else {
              res.redirect("/intermediate");
            }
          })


        })
      }
    })
  }

});

app.post("/intermediate", function (req, res, next) {
  // var nameKey = req.body.fullname;
  // var addressKey = req.body.address;
  var x = "emptykey"
  var door = req.body.door === "" ? x : req.body.door;
  var sabhe_id = req.body.sabhe_id === "" ? x : req.body.sabhe_id;
  var mobile = req.body.mobile === "" ? x : req.body.mobile;


  Member.find({ mobile: new RegExp(mobile, 'i') }, function (err, searchedUsers) {
    if (searchedUsers.length !== 0) {

      console.log("Intermediate name list page accessed by " + req.user.username + " with mobile key");
      res.render("intermediate", { resultName: searchedUsers });
    }
    else {
      Member.find({ sabhe_id: new RegExp(sabhe_id, 'i') }, function (err, searchedUsers1) {
        if (searchedUsers1.length !== 0) {
          console.log("Intermediate name list page accessed by " + req.user.username + " with sabhe id key");
          res.render("intermediate", { resultName: searchedUsers1 });
        }
        else {
          Member.find({ address: new RegExp(door, 'i') }, function (err, searchedUsers2) {
            if (searchedUsers2.length !== 0) {
              console.log("Intermediate name list page accessed by " + req.user.username + " with doornumber key");
              res.render("intermediate", { resultName: searchedUsers2 });
              next();
            }
            else {
              res.redirect("/intermediate")
            }
          })
        }
      })
    }
  })

})

app.post("/profile", function (req, res) {
  const sabhe_id = req.body.sabhe_id;

  User.findByIdAndUpdate(req.user._id, { sabhe_id: sabhe_id }, function (err) {
    if (err) {
      console.log(err.message);
      res.send("error occured, check console");
    }
    else {
      console.log("User linked to database " + req.user.username)
      res.redirect("/profile");
    }
  })
})

app.post('/login', function (req, res, next) {
  console.log("Login request " + req.body.username);
  passport.authenticate('local', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render("home", { iflogin: true, passwordmessage: "Problem with username/password" }); }
    req.logIn(user, function (err) {

      if (err) { return next(err); }
      if (req.user.sabhe_id) {
        return res.redirect("/profile")
      }
      else {
        if (req.user.isAdmin === true) {
          return res.redirect("/admin")
        } else {
          return res.redirect("/intermediate")
        }

      }
    });
  })(req, res, next);
}, function (err) {
  if (err) console.log(err.message);
  console.log("PLEASE RETURN TO HOMEPAGE")
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function () {
  console.log("Server started successfully");
});
