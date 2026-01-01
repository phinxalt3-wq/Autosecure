const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const checkToken = require("../../../mainbot/utils/checkToken");
const autosecure = require("../../autosecure");

// Restart multiple bots and return a message for each
async function restartbots(userid, array) {
  let results = [];

  for (const botnumber of array) {
    let result = await restartbot(userid, botnumber);
    results.push(`${botnumber}: ${result}`);
  }

  return results.join("\n");
}

// Get token from database
async function gettoken(userid, botnumber) {
  let settings = await queryParams(
    `SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`,
    [userid, botnumber]
  );
  if (!settings || settings.length === 0) return null;
  return settings[0].token;
}

// Fully start bot (destroy old instance if exists, then start new)
async function fullstartbot(userid, botnumber, token) {
  try {
    let key = `${userid}|${botnumber}`;
    let existing = autosecureMap.get(key);

    if (existing) {
      autosecureMap.delete(key);
      existing.destroy();
    }

    let started = await autosecure(token, userid, botnumber);
    autosecureMap.set(key, started);

    return true;
  } catch (err) {
    console.error(`Failed to start bot ${botnumber}:`, err);
    return false;
  }
}

// Restart a single bot and return a status message
async function restartbot(userid, botnumber) {
  let bottoken = await gettoken(userid, botnumber);

  if (!bottoken) {
    return "Failed: No token found";
  }

  let isValid = await checkToken(bottoken);
  if (!isValid) {
    return "Failed: Invalid token";
  }

  let started = await fullstartbot(userid, botnumber, bottoken);
  if (started) {
    return "Restarted successfully";
  } else {
    return "Failed to restart";
  }
}

module.exports = {
  restartbots,
  restartbot
};
