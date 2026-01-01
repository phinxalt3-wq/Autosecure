const axios = require('axios');
const { URLSearchParams } = require('url');

async function getMSAToken(hostCookie) {
    try {
        const headers = {
            "Host": "login.live.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "close",
            "Referer": "https://account.microsoft.com/",
            "Cookie": `__Host-MSAAUTH=${hostCookie};`
        };

        const url = 'https://login.live.com/oauth20_authorize.srf?client_id=000000000004773A&response_type=token&scope=PIFD.Read+PIFD.Create+PIFD.Update+PIFD.Delete&redirect_uri=https%3A%2F%2Faccount.microsoft.com%2Fauth%2Fcomplete-silent-delegate-auth&state=%7B%22userId%22%3A%22bf3383c9b44aa8c9%22%2C%22scopeSet%22%3A%22pidl%22%7D&prompt=none';
        
        const response = await axios.get(url, {
            headers,
            maxRedirects: 0,
            validateStatus: (status) => status === 302 || (status >= 400 && status < 600)
        });

        if (response.status >= 400) {
            return null;
        }

        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
            console.log('No redirect URL found at msatoken!');
            return null;
        }

        const params = new URLSearchParams(redirectUrl.split('#')[1]);
        const Token = params.get('access_token');
        const MSAToken = `MSADELEGATE1.0=${Token}`;
        return MSAToken || null;
    } catch (error) {
        return null;
    }
}

module.exports = getMSAToken;
