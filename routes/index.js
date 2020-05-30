const express = require("express");
const router = express.Router();

router.get("/stocks/symbols", (req, res) => {
  if(req.query['industry']){
    req.db
    .from("stocks")
    .select("name", "symbol", "industry")
    .where("industry", "like", `%${req.query["industry"]}%`)
    .where("timestamp", "=", "2020/03/24")
    .then((stocks) => {
      res.status(200).json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "The stock symbol is invalid" });
      console.log(err);
    });
  }else{
    req.db
    .from("stocks")
    .select("name", "symbol", "industry")
    .where("timestamp", "=", "2020/03/24")
    .then((stocks) => {
      res.status(200).json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "Fail to connect with database" });
    });
  }
});

router.get("/stocks/:symbols", (req, res) => {
  req.db
    .from("stocks")
    .select("name", "symbol", "industry")
    .where("symbol", "=", req.params.symbols)
    .limit(1)
    .then((stocks) => {
      res.json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "The stock symbol is invalid" });
      console.log(err);
    });
});

router.get("/stocks/auth/:symbols?from=:from&to=:to", (req, res) => {
  req.db
    .from("stocks")
    .select("name", "symbol", "industry")
    .where("symbols", "=", req.params.symbols)
    .whereBetween("timestamp", [req.params.from, req.params.to])
    .then((stocks) => {
      res.json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "The stock symbol is invalid" });
      console.log(err);
    });
});

router.post("/api/update", (req, res) => {
  if (!req.body.City || !req.body.CountryCode || !req.body.Pop) {
    res.status(400).json({ message: "Error updating population" });
    console.log("Error on request body:", JSON.stringify(req.body));
  }
  const filter = {
    Name: req.body.City,
    CountryCode: req.body.CountryCode,
  };

  const pop = {
    Population: req.body.Pop,
  };

  req
    .db("city")
    .where(filter)
    .update(pop)
    .then((_) => {
      res.status(201).json({ message: `Successful update ${req.body.City}` });
      console.log("Successful update population:", JSON.stringify(filter));
    })
    .catch((e) =>
      res.status(500).json({ message: "Database error - not updated" })
    );
});

module.exports = router;
