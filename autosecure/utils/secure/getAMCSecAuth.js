const axios = require('axios');

async function getAMCSecAuth(t) {
  if (!t) {
    throw new Error("Missing 't' parameter.");
  }

  try {
    const url = "https://account.microsoft.com/auth/complete-silent-signin?ru=https://account.microsoft.com/?lang=nl-NL&refd=account.live.com&refp=landing&mkt=NL-NL&wa=wsignin1.0";

    const data = `t=${encodeURIComponent(t)}`;

    const headers = {
        "Cache-Control": "max-age=0",
        "Sec-Ch-Ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
        "Origin": "https://login.live.com",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Referer": "https://login.live.com/",
    };

    const response = await axios.post(url, data, {
      headers,
      maxRedirects: 0, 
      validateStatus: (status) => status === 302 || status === 200 
    });

    const setCookieHeader = response.headers["set-cookie"];


    if (!setCookieHeader) {
      console.log('No cookies in AMC')
      return null
    }

    
    const amcSecAuthCookie = setCookieHeader.find(cookie => cookie.startsWith("AMCSecAuth="));

    if (!amcSecAuthCookie) {
      console.log('Microsoft removed amc fr?')
      return null
    }

    const amcSecAuthValue = amcSecAuthCookie.split(";")[0].split("=")[1];

    return amcSecAuthValue;
  } catch (error) {
    console.log(`Couldn't get value!`)
    return null;
  }
}

module.exports = getAMCSecAuth;
