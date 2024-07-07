const { rateLimit } = require("express-rate-limit");
const express = require("express");
const { default: axios } = require("axios");
const cache = require("memory-cache");
const app = express();
const cors = require("cors");
const { default: Groq } = require("groq-sdk");
require("dotenv").config();

app.use(require("sanitize").middleware);
app.use(express.json());
app.use(
  cors({
    origin: "*",
    allowedHeaders: "*",
    preflightContinue: true,
  })
);

app.set("trust proxy", 1);

app.all("/", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.post("/api/completion", async (req, res) => {
  const groq = new Groq({ apiKey: process.env.APIKEY });

  groq.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content: req.body.sysprompt,
        },
        {
          role: "user",
          content: req.body.prompt,
        },
      ],
      model: "llama3-8b-8192",
    })
    .then((response) => {
      res.send(response.choices[0].message.content);
    });
});

app.listen(process.env.PORT || 3000);

module.exports = app;
