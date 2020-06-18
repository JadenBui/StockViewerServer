require("dotenv").config();
var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", (req, res) => {
  const requestedEmail = req.body.email;
  const requestedPassword = req.body.password;

  if (!requestedEmail || !requestedPassword) {
    return res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  } else {
    if (!requestedEmail.includes("@")) {
      return res.status(400).json({
        error: true,
        message: "Invalid email format, please add '@'",
      });
    }
  }

  req.db
    .from("users")
    .select("email")
    .where({ email: requestedEmail })
    .then((users) => {
      if (users.length !== 0) {
        return res
          .status(404)
          .json({ error: true, message: "User already exists!" });
      }
      const saltRounds = 10;
      const hashPassword = bcrypt.hashSync(requestedPassword, saltRounds);

      return req.db
        .from("users")
        .insert({ email: requestedEmail, password: hashPassword });
    })
    .then((_) =>
      res.status(201).json({ error: false, message: "Add user successful!" })
    )
    .catch((_) => {
      res
        .status(503)
        .json({ error: true, message: "Fail to connect with database" });
    });
});

router.post("/login", (req, res) => {
  const requestedEmail = req.body.email;
  const requestedPassword = req.body.password;
  if (!requestedEmail || !requestedPassword) {
    return res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  }

  req.db
    .from("users")
    .select("email", "password")
    .where({ email: requestedEmail })
    .then(async (users) => {
      if (users[0] === undefined) {
        return res
          .status(401)
          .json({ error: true, message: "Incorrect email or password" });
      }

      const hash = users[0].password;

      const correctCredential = await bcrypt.compare(requestedPassword, hash);
      if (!correctCredential) {
        return res
          .status(401)
          .json({ error: true, message: "Incorrect email or password" });
      }

      const secret = process.env.SECRET_KEY;
      const expires_in = 60 * 60 * 24;
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ requestedEmail, exp }, secret);
      res.status(200).json({ token_type: "Bearer", token, expires_in });
    });
});

module.exports = router;
