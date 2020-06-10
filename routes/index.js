const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");

const checkValidRoute = (req, res, next) => {
  if (Object.keys(req.query).length !== 0) {
    if (req.query["industry"]) {
      return res.status(400).json({
        error: true,
        message: "Industry query only available on route /stocks/symbols",
      });
    } else if (req.query["from"] || req.query["to"]) {
      return res.status(400).json({
        error: true,
        message:
          "Date parameters only available on authenticated route /stocks/authed",
      });
    } else {
      return res.status(400).json({
        error: true,
        message: `Query is not exist on this route ${req.originalUrl}`,
      });
    }
  }
  next();
};

const authenticateToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(403)
      .json({ error: true, message: "Authorization header is missing!" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    res.status(400).json({ error: true, message: "Unauthorized user" });
  }

  try {
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    if (decode.exp < Date.now()) {
      res.status(400).json({ error: true, message: "The token has expired!" });
      return;
    }
    next();
  } catch (e) {
    res.status(400).json({ error: true, message: "The token is invalid!" });
  }
};

router.get("/stocks/symbols", (req, res) => {
  if (Object.keys(req.query).length !== 0) {
    if (req.query["industry"]) {
      const industry = req.query["industry"];
      if (/^\d+$/.test(industry)) {
        return res.status(400).json({
          error: true,
          message: "Industry parameter can only contain letters",
        });
      }
      req.db
        .from("stocks")
        .select("name", "symbol", "industry")
        .where("industry", "like", `%${industry}%`)
        .distinct("symbol")
        .then((stocks) => {
          if (stocks.length === 0) {
            return res
              .status(404)
              .json({ error: true, message: "Industry sector not found" });
          }
          res.status(200).json(stocks);
        })
        .catch((_) => {
          res.json({ error: true, message: "Fail to connect with database" });
        });
    } else {
      return res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry' is permitted",
      });
    }
  } else {
    req.db
      .from("stocks")
      .select("name", "symbol", "industry")
      .distinct("symbol")
      .then((stocks) => {
        res.status(200).json(stocks);
      })
      .catch((_) => {
        res.json({ error: true, message: "Fail to connect with database" });
      });
  }
});

router.get("/stocks/:symbols",checkValidRoute, (req, res) => {
  if (
    !/[A-Z]+/.test(req.params.symbols) ||
    req.params.symbols !== req.params.symbols.toUpperCase() ||
    req.params.symbols.length > 5
  ) {
    return res.status(400).json({
      error: true,
      message: "Stock symbol incorrect format - must be 1-5 capital letters",
    });
  } else if (Object.keys(req.query).length !== 0) {
    if (req.query["from"] && req.query["to"]) {
      return res.status(400).json({
        error: true,
        message:
          "Date parameters only available on authenticated route /stocks/authed",
      });
    }
    return res.status(400).json({
      error: true,
      message: `Query is not supported in route /stocks/${req.params.symbols}`,
    });
  } else {
    req.db
      .from("stocks")
      .select("*")
      .where({ symbol: req.params.symbols })
      .distinct("symbol")
      .then((stocks) => {
        if (stocks.length === 0) {
          return res.status(404).json({
            error: true,
            message: "No entry for symbol in stocks database",
          });
        }
        res.status(200).json(stocks[0]);
      })
      .catch((_) => {
        res
          .status(404)
          .json({ error: true, message: "Fail to connect with database" });
      });
  }
});

router.get("/stocks/authed/:symbols",checkValidRoute, authenticateToken, (req, res) => {
  if (Object.keys(req.query).length === 0) {
    return res.status(404).json({
      error: true,
      message: "Not found",
    });
  }

  if (!req.query["from"] && !req.query["to"]) {
    return res.status(400).json({
      error: true,
      message:
        "Parameters allowed are from and to, example: /stocks/authed/AAL?from=2020-03-15",
    });
  }
  const from = req.query["from"];
  const to = req.query["to"];
  if (Date.parse(from) === NaN || Date.parse(to) === NaN) {
    return res.status(400).json({
      error: true,
      message: "From date cannot be parsed by Date.parse()",
    });
  }
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
    .whereBetween("timestamp", [from, to])
    .then((stocks) => {
      if (stocks.length === 0) {
        return res.status(404).json({
          error: true,
          message:
            "No entries available for query symbol for supplied date range",
        });
      }
      res.json(stocks);
    })
    .catch((err) => {
      res.json({ error: true, message: "Fail to connect with database" });
    });
});

module.exports = router;
