const path = require("path");
const { MESSAGES } = require("../util/messages");

const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database(
  path.resolve(__dirname, "../data.db"),
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(MESSAGES.DB_CONNECT);
  }
);
module.exports = { db };
