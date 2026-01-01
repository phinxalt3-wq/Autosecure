const axios = require('axios');
const { fetchPlayerData } = require('./fetchPlayerData');

module.exports = async (username) => {
  const retryPromise = async (fn, maxRetries = 3, delayMs = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  };

  try {
    let uuid;

    // Try Mojang API first (most reliable)
    try {
      const res1 = await retryPromise(async () => {
        return axios({
          url: `https://api.mojang.com/users/profiles/minecraft/${username}`,
          method: "get",
          maxRedirects: 0,
          timeout: 8000,
          validateStatus: status => status >= 200 && status < 510,
        });
      }, 3, 500);
      
      uuid = res1?.data?.id || null;
      if (uuid) {
        console.log(`[getUUID] UUID from Mojang API for ${username}: ${uuid}`);
        return uuid;
      }
    } catch (err) {
      console.warn(`[getUUID] Mojang API failed for ${username}:`, err.message);
    }

    // Try PlayerDB as fallback
    if (!uuid) {
      try {
        const res2 = await retryPromise(async () => {
          return axios.get(`https://playerdb.co/api/player/minecraft/${username}`, {
            timeout: 8000
          });
        }, 2, 500);
        
        if (res2?.data?.code === "player.found" && res2.data?.data?.player?.raw_id) {
          uuid = res2.data.data.player.raw_id;
          console.log(`[getUUID] UUID from playerdb.co for ${username}: ${uuid}`);
          return uuid;
        }
      } catch (err) {
        console.warn(`[getUUID] PlayerDB API failed for ${username}:`, err.message);
      }
    }

    // Try nadeshiko as last resort
    if (!uuid) {
      try {
        const playerData = await fetchPlayerData(username);
        if (playerData?.uuid) {
          uuid = playerData.uuid;
          console.log(`[getUUID] UUID from fetchPlayerData for ${username}: ${uuid}`);
          return uuid;
        }
      } catch (err) {
        console.warn(`[getUUID] fetchPlayerData failed for ${username}:`, err.message);
      }
    }

    if (!uuid) {
      console.error(`[getUUID] Could not find UUID for ${username} from any source`);
    }

    return uuid || null;
  } catch (error) {
    console.error(`[getUUID] Unexpected error looking up ${username}:`, error.message);
    return null;
  }
};
