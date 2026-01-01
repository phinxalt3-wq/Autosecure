const HttpClient = require('../process/HttpClient')

module.exports = async (xbl, d = false) => {
    try {
        let axios = new HttpClient()
        
        let extractSSID;
        try {
            extractSSID = await axios.post(
                "https://api.minecraftservices.com/authentication/login_with_xbox", 
                {
                    identityToken: xbl,
                    ensureLegacyEnabled: true,
                    platform: "WEB"
                },
                {}, // axiosConfig
                3   // 3 retries for SSID generation (critical for ownership check)
            );
        } catch (err) {
            console.error(`[ssid.js] Failed to get SSID after retries:`, err.message);
            return null;
        }

        if (!extractSSID?.data) {
            console.error(`[ssid.js] SSID API returned no data`);
            return null;
        }

        if (extractSSID?.status >= 400) {
            console.error(`[ssid.js] SSID API returned status ${extractSSID.status}:`, extractSSID.data);
            return null;
        }

        if (extractSSID?.data?.access_token) {
            console.log(`[ssid.js] Successfully obtained SSID access token`);
            return extractSSID.data.access_token;
        }

        if (d && JSON.stringify(extractSSID.data).includes("/authentication/login_with_xbox")) {
            console.warn(`[ssid.js] Rate limit detected on login_with_xbox endpoint`);
            return "u should probably chill with the spam";
        }

        console.warn(`[ssid.js] Unexpected response structure from SSID endpoint:`, extractSSID.data);
        return null;

    } catch (e) {
        console.error(`[ssid.js] Unexpected error getting SSID:`, e.message);
        return null;
    }
}
