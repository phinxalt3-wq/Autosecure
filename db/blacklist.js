const { queryParams } = require("./db");

async function isblacklisted(user_id) {
  try {
    const blacklist = await queryParams("SELECT * FROM autosecureblacklist WHERE user_id = ?", [user_id]);
   // console.log(blacklist)
    if (blacklist.length > 0) {
      return { blacklisted: true, reason: blacklist[0].reason };
    } else {
      return { blacklisted: false };
    }
  } catch (error) {
    console.error("Error checking blacklist status:", error);
    return { blacklisted: false };
  }
}

module.exports = isblacklisted;
