const axios = require("axios");
const fetchProfileStats = require("./fetchProfileStats")


/// Unneeded, use getStats.

module.exports = async function fetchStatsSkyblock(uuid, key) {
  try {
    const { data } = await axios.get(`https://api.hypixel.net/player?key=${key}&uuid=${uuid}`);

    if (!data || Object.keys(data).length === 0) {
      console.log('Hypixel down');
      return null;
    }

    let profiles = data?.player?.stats?.SkyBlock?.profiles
    let keys = Object.keys(profiles)
    
    let firstProfileKey = keys[0]
    let currentprofileid = profiles[firstProfileKey].profile_id
    let currentprofilename = profiles[firstProfileKey].cute_name
    
    let otherprofiles = keys.slice(1).map(key => {
        let profile = profiles[key]
        return `${profile.profile_id},${profile.cute_name}`
    }).join('|')


    




    

    return null;
  } catch (error) {
    console.error(`Error fetching SkyBlock stats for ${uuid}:`, error.message);
    return null;
  }
};