const sqlite = require("sqlite3").verbose();
const { join } = require("path");
const path = join(__dirname, "database.db");

const db = new sqlite.Database(path, (err) => {
  if (err) throw err;
});


// Solves circular depencendies

const queryParams = (command, params = [], method = "all") => {
  return new Promise((resolve, reject) => {
    db[method](command, params, (error, result) => {
      error ? reject(error) : resolve(result);
    });
  });
};

module.exports = { db, queryParams };
