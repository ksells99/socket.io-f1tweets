const http = require("http");
const path = require("path");
const express = require("express");
const socketIo = require("socket.io");
const needle = require("needle");
const config = require("dotenv").config();
const TOKEN = process.env.TWITTER_BEARER_TOKEN;
const PORT = process.env.PORT || 3000;

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

// Define URLs and stream rules
const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id";

const rules = [{ value: "f1" }];

// STREAM RULE FUNCTIONS

// Get stream rules
async function getRules() {
  // Use needle to send GET request to twitter rulesURL - pass in token
  const response = await needle("get", rulesURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  // Return response
  return response.body;
}

// Set stream rules
async function setRules() {
  // Get array of rules specified in array above
  const data = {
    add: rules,
  };

  // Use needle to send POST request to twitter rulesURL - pass rules and token
  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
}

// Delete stream rules - pass in current rules
async function deleteRules(rules) {
  // Make sure rules passed in is an array - return null if not
  if (!Array.isArray(rules.data)) {
    return null;
  }

  // Map through array and return IDs - this gives IDs of rules to delete
  const ids = rules.data.map((rule) => rule.id);

  // Pass in IDs to delete object
  const data = {
    delete: {
      ids: ids,
    },
  };

  // Use needle to send POST request (even though deleting) to twitter rulesURL - pass rules to delete, and token
  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  return response.body;
}

// GET TWEET STREAM

function streamTweets() {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  stream.on("data", (data) => {
    try {
      // Data returned is a buffer so need to parse to JSON
      const json = JSON.parse(data);
      console.log(json);

      // Leave error catch empty to keep connection open
    } catch (error) {}
  });
}

io.on("connection", () => {
  console.log("Client connected...");
});

// // Runs immediately after server started
// (async () => {
//   let currentRules;

//   try {
//     // Get all existing rules
//     currentRules = await getRules();

//     // Delete all existing rules
//     await deleteRules(currentRules);

//     // Set new rules based on array above
//     await setRules();

//     //
//   } catch (error) {
//     console.error(error);
//     process.exit(1);
//   }

//   streamTweets();
// })();

// Tell server to listen to port specified earlier
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
