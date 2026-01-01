const axios = require('axios');

module.exports = async function getdatazyger() {
    try {
        const response = await axios.post("https://login.live.com");

        const setCookieHeader = response.headers['set-cookie'] || [];

        const cookies = setCookieHeader.join('; ');
        const ppftRegex = /value="([^"]*)"/;
        const ppft = response.data.match(ppftRegex)[0].replace("value=", "").replaceAll("\"", "");
        

        const extractedCookies = {
            MSPOK: (cookies.match(/MSPOK=([^;]+)/) || [])[1],
            MSPRequ: (cookies.match(/MSPRequ=([^;]+)/) || [])[1],
            OParams: (cookies.match(/OParams=([^;]+)/) || [])[1],
            uaid: (cookies.match(/uaid=([^;]+)/) || [])[1],
            ppft: ppft
        };

        console.log(extractedCookies);







        return extractedCookies;
    } catch (error) {
        console.error("Error making the request or extracting cookies:", error);
        return null;
    }
}


