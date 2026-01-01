const { getHypixelApiKey } = require("../../../db/getkey");
const checkhypixelkey = require('./checkhypixelkey');
const axios = require('axios');
const { hypixelprofile2 } = require("../hypixelapi/fetchPlayerData");
const getUUID = require("../hypixelapi/getUUID");

async function validateusername(ign, value) {
  let setting = null;

  if (value === 0 || value === "0") {
    setting = "none";
  } else if (value === 1 || value === "1") {
    setting = "uuid";
  } else if (value === 2 || value === "2" || value === "hypixel") {
    setting = "hypixel";
  } else{
  }

  let msg = {
    success: false,
    reason: "Unknown"
  }



  switch (setting) {
    case "none":
        msg.success = true
        msg.reason = "Validation is set to none!"
      return msg;

    case "uuid": {
      const uuid = await getUUID(ign);
    //  console.log(`${uuid}`)
      if (!uuid){
        msg.success = false
        msg.reason = "No Minecraft Profile."
      } else{
        msg.success = true
        msg.reason = "Has Minecraft Profile"
      }
      return msg
    }

    case "hypixel": {
      const uuid = await getUUID(ign);

      if (!uuid) {
        msg.success = false
        msg.reason = "No Minecraft Profile."
        return msg
      } 

      const hypixelApiKey = await getHypixelApiKey();

      if (checkhypixelkey(hypixelApiKey)) {
        const hypixelCheck = await hypixelprofile(uuid, hypixelApiKey);

        if (hypixelCheck === "retry") {
          const fallbackResult = await hypixelprofile2(ign);
        msg.success = fallbackResult 
        msg.reason = fallbackResult ? "Has MC & HYP Profile!" : "Has Minecraft but no Hypixel Profile."
          return msg
        } else {
        msg.success = hypixelCheck 
        msg.reason = hypixelCheck ? "Has MC & HYP Profile!" : "Has Minecraft but no Hypixel Profile."
          return msg
        }
      } else {
        console.log(`Invalid key!`)
        const fallbackResult = await hypixelprofile2(ign);
        msg.success = fallbackResult 
        msg.reason = fallbackResult ? "Has MC & HYP Profile!" : "Has Minecraft but no Hypixel Profile."
          return msg
      }
    }

    default:
      return false;
  }
}





async function hypixelprofile(uuid, key) {
  const url = `https://api.hypixel.net/v2/player?key=${key}&uuid=${uuid}`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data?.player) {
      return true;
    }
    return false;
  } catch (error) {
    return "retry";
  }
}

module.exports = {
  validateusername
};