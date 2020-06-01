var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");

router.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  }

  req.db
    .from("users")
    .select("email")
    .where({ email: req.body.email })
    .then((users) => {
      if (users.length !== 0) {
        return res
          .status(404)
          .json({ error: true, message: "User already exists!" });
      }
      const saltRounds = 10;
      const password = bcrypt.hashSync(req.body.password, saltRounds);

      req.db
        .from("users")
        .insert({ email: req.body.email, password: password })
        .then((_) =>
          res
            .status(201)
            .json({ error: false, message: "Add user successful!" })
        )
        .catch((err) => {
          res.json({ error: true, message: "Fail to connect with database" });
        });
    })
    .catch((err) => {
      res.json({ error: true, message: "Fail to connect with database" });
    });
});

router.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  }

  req.db
    .from("users")
    .select("email", "password")
    .where({ email: req.body.email })
    .then(async (users) => {
      if (users[0] === undefined) {
        return res
          .status(401)
          .json({ error: true, message: "Incorrect email or password" });
      }

      const email = users[0].email;
      const hash = users[0].password;

      console.log(email);

      const result = await bcrypt.compare(req.body.password, hash);
      if (!result) {
        return res
          .status(401)
          .json({ error: true, message: "Incorrect email or password" });
      }

      const secret = process.env.SECRET_KEY;
      const expires_in = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expires_in;
      const token = jwt.sign({ email, exp }, secret);
      res.status(200).json({ token_type: "Bearer", token, expires_in });
    });
});

module.exports = router;
