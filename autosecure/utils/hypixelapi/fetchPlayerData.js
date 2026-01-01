const axios = require('axios');
const https = require('https');

async function fetchPlayerData(username) {
  const url = `https://nadeshiko.io/player/${username}/network`;

  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html",
    "Cache-Control": "no-cache"
  };

  try {
    const response = await axios.get(url, {
      headers,
      timeout: 3000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    if (response.status === 200) {
      const html = response.data;

      const match = html.match(/playerData = JSON\.parse\(decodeURIComponent\("(.*?)"\)\)/);

      if (match) {
        const playerDataEncoded = match[1];
        const playerDataString = decodeURIComponent(playerDataEncoded);
        const playerData = JSON.parse(playerDataString);

        console.log(`✅ Player data for ${username} fetched successfully.`);
        return playerData;
      } else {
        console.log("❌ Player data not found in the response");
        return null;
      }
    } else {
      console.log(`❌ Failed to fetch data. HTTP Status Code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function hypixelprofile2(username) {
  try {
    const json = await fetchPlayerData(username);
    // console.log(json)
    // console.log(json?.profile);
    if (json?.profile) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

module.exports = {
  fetchPlayerData,
  hypixelprofile2
};
