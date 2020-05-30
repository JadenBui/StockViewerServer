const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');


router.get("/:params", (req, res) => {
  res.json({ error: true, message: "Not Found" });
});

router.get("/stocks/symbols", (req, res) => {
  const industry = req.query["industry"];
  if (industry) {
    if (/^\d+$/.test(industry)) {
      res.status(404).json({
        error: true,
        message: "Industry parameter can only contain letters",
      });
    }
    req.db
      .from("stocks")
      .select("name", "symbol", "industry")
      .where("industry", "like", `%${req.query["industry"]}%`)
      .where({ timestamp: "2020-03-24" })
      .then((stocks) => {
        if (stocks.length === 0) {
          res
            .status(404)
            .json({ error: true, message: "Industry section not found!" });
        }
        res.status(200).json(stocks);
      })
      .catch((err) => {
        res.json({ error: true, message: "Fail to connect with database" });
      });
  } else {
    req.db
      .from("stocks")
      .select("name", "symbol", "industry")
      .where({ timestamp: "2020-03-24" })
      .then((stocks) => {
        res.status(200).json(stocks);
      })
      .catch((err) => {
        res.json({ error: true, message: "Fail to connect with database" });
      });
  }
});

router.get("/stocks/:symbols", (req, res) => {
  if (req.params.symbols !== req.params.symbols.toUpperCase()) {
    res.json({
      error: true,
      message: "Stock symbol incorrect format - must be 1-5 capital letters",
    });
  }
  req.db
    .from("stocks")
    .select("name", "symbol", "industry")
    .where({ symbol: req.params.symbols })
    .limit(1)
    .then((stocks) => {
      if (stocks.length === 0) {
        res.json({ error: true, message: "Stock symbol not found!" });
      }
      res.json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "Fail to connect with database" });
    });
});

router.get("/stocks/authed/:symbols", (req, res) => {
  req.db
    .from("stocks")
    .select(
      "timestamp",
      "name",
      "symbol",
      "industry",
      "open",
      "high",
      "low",
      "close",
      "volumes"
    )
    .where("symbol", "=", req.params.symbols)
    .whereBetween("timestamp", [req.query["from"], req.query["to"]])
    .then((stocks) => {
      if (stocks.length === 0) {
        res.json({ error: true, message: "Date range is not available!" });
      }
      res.json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "Fail to connect with database" });
    });
});

router.post("/user/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  }

  req.db
    .from("users")
    .select("email")
    .where({ email: req.body.email })
    .then((users) => {
      if (users[0]) {
        res
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

router.post('/user/login',(req,res)=>{
  if(!req.body.email || !req.body.password){
    res
      .status(400)
      .json({ message: "Request body incomplete - email and password needed" });
  }
  
  req.db
    .from("users")
    .select("email","password")
    .where({ email: req.body.email })
    .then((users) => {
      if (users[0]) {
        res
          .status(404)
          .json({ error: true, message: "Email not found!" });
      }
      
      const user = users[0];

      if(!bcrypt.compare(password,user.password)){
        res
          .status(404)
          .json({ error: true, message: "Password is incorrect!" });
      }

      const secret = process.env.SECRET_KEY;
      const expires = 60 * 60 * 24;
      const exp = Math.floor(Date.now() / 1000) + expires;
      const token = jwt.sign({email,exp},secret)
      res
          .status(200)
          .json({ token_type: "Bearer", token, expires });
    })
})

module.exports = router;
