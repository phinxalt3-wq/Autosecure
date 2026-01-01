

/**
 * 
 * @param {HttpClient} axios 
 */
module.exports = async (axios) => {
  try {
    const uatRequest = await axios.get("https://account.live.com/consent/Manage?guat=1");

    const clientIdRegex = /data-clientid="([^"]+)"/gi;
    const clientIds = [];
    let match;
    while ((match = clientIdRegex.exec(uatRequest.data))) {
      clientIds.push(match[1]);
    }

    const appNameRegex = /<div class="consentManageAppName">([^<]+)<\/div>/gi;
    const oauths = [];
    while ((match = appNameRegex.exec(uatRequest.data))) {
      oauths.push(match[1]);
    }

    if (clientIds.length === 0 || oauths.length === 0) {
      console.log("No OAuths found.");
      return {
        oauthquantity: 0,
        oauths: []
      };
    }

    const oauthData = clientIds.map((id, index) => ({
      clientId: id,
      appName: oauths[index] || "Unknown"
    }));

    console.log("OAuths fetched:", clientIds.length);

    return {
      oauthquantity: oauthData.length,
      oauths: oauthData
    };
  } catch (error) {
    console.error("Error fetching or parsing data:", error.message);
    return {
      oauthquantity: 0,
      oauths: []
    };
  }
}
