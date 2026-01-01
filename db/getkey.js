const { queryParams } = require("./db"); 


async function haslifetimekey() {
  try {
    const lifetime = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);

   // console.log(`Lifetime: ${JSON.stringify(lifetime)}`)

    if (Array.isArray(lifetime) && lifetime.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking lifetime API key:", error);
    return false; 
  }
}


async function getHypixelApiKey() {
    let key, timefromdbRaw;
    const hasLifetime = await haslifetimekey();
 
    if (hasLifetime) {
      const results2 = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);
      if (results2.length > 0) {
        key = results2[0].apikey;
        timefromdbRaw = results2[0].time;
      }
    }
 
    if (!key) {
      const results = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [1]);
      if (results.length > 0) {
        key = results[0].apikey;
        timefromdbRaw = results[0].time;
      }
    }
    if (!key) {
        return null;
    }
    return key;
}

module.exports = {
  getHypixelApiKey,
  haslifetimekey
};