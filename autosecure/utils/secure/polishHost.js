const axios = require("axios");
module.exports = async (host, amsc) => {
    try {
        let data = await axios({
            method: "GET",
            url: "https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=21&ct=1708978285&rver=7.5.2156.0&wp=SA_20MIN&wreply=https://account.live.com/proofs/Add?apt=2&uaid=0637740e739c48f6bf118445d579a786&lc=1033&id=38936&mkt=en-US&uaid=0637740e739c48f6bf118445d579a786",
            headers: {
                cookie: `__Host-MSAAUTH=${host}; amsc=${amsc}`,
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 500,
            timeout: 15000 // 15 second timeout
        })


    if (data.data.includes("Abuse")) {
        return `locked`
    } else if (data.data.includes("working to restore all services")) {
        return `down`
    }
    let polishedHost = null
    data.headers["set-cookie"].map((cookie) => {
        const [name, ...values] = cookie.split("=");
        if (name == "__Host-MSAAUTH") {
            polishedHost = values.join("=").split(";").shift()
        }
    });
        if (polishedHost) {
            return polishedHost
        } else {
            return host
        }
    } catch (error) {
        console.log(`[POLISHHOST] Error occurred:`, error.message);
        
        if (error.response) {
            console.log(`[POLISHHOST] Response status:`, error.response.status);
            if (error.response.status === 400) {
                console.log(`[POLISHHOST] HTTP 400 - Invalid host or session expired`);
                throw new Error('Invalid host or session expired');
            }
            if (error.response.status >= 500) {
                console.log(`[POLISHHOST] Server error - Microsoft services may be down`);
                return 'down';
            }
        }
        
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.log(`[POLISHHOST] Network timeout or connection reset`);
            throw new Error('Network timeout during authentication');
        }
        
        // For other errors, return the original host
        console.log(`[POLISHHOST] Returning original host due to error`);
        return host;
    }
}