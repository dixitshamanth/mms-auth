
// app.post("/login", function (req, res) {

//   const user = new User({
//     username: req.body.username,
//     password: req.body.password
//   });

//   console.log(user);

//   req.login(user, function (err) {

//     console.log("inside login")
//     if (err) {
//       console.log(err)
//       res.redirect("/login")
//     } else {
//       passport.authenticate("local")(req, res, function () {
//         console.log("inside authenticate")
//         if (req.user.sabhe_id) {
//           res.redirect("/profile")
//         }
//         else {
//           res.redirect("/intermediate")
//         }
//       });
//     }
//   }
//   )
// }
// );


// app.get("/submit", function (req, res) {
//   if (req.isAuthenticated()) {
//     res.render("submit");
//   } else {
//     res.redirect("/login");
//   }
// });

// app.post("/submit", function (req, res) {
//   const submittedSecret = req.body.secret;

//   //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
//   // console.log(req.user.id);

//   User.findById(req.user.id, function (err, foundUser) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUser) {
//         foundUser.secret = submittedSecret;
//         foundUser.save(function () {
//           res.redirect("/secrets");
//         });
//       }
//     }
//   });
// });

// app.get("/secrets", function (req, res) {
//   User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUsers) {
//         res.render("secrets", { usersWithSecrets: foundUsers });
//       }
//     }
//   });
// });