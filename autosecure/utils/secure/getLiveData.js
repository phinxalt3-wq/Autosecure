const axios = require("axios")
module.exports = async () => {
  try {
    let cookies = []
    const data = await axios({
      method: "GET",
      url: "https://login.live.com",
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    let c = data.headers["set-cookie"];
    if (c) {
      for (let co of c) {
        cookies += co.split(";")[0] + "; "
      }
    }
    
    const linkRegex = /https:\/\/login.live.com\/ppsecure\/post.srf\?contextid=[0-9a-zA-Z]{1,100}&opid=[0-9a-zA-Z]{1,100}&bk=[a-zA-Z0-9]{1,100}&uaid=[0-9a-zA-Z]{1,100}\&pid=0/g;
    let ppft = null;
    let loginLink = null;
    
    try {
      const serverDataMatch = data.data.match(/var ServerData = ({.*?});/s);
      if (serverDataMatch) {
        const serverData = JSON.parse(serverDataMatch[1]);
        if (serverData.sFTTag) {
          const ppftMatch = serverData.sFTTag.match(/value="([^"]*)"/);
          if (ppftMatch) {
            ppft = ppftMatch[1];
          }
        }
      }
      if (!ppft) {
        const ppftRegex = /name="PPFT"[^>]*value="([^"]*)"/;
        const ppftMatch = data.data.match(ppftRegex);
        if (ppftMatch) {
          ppft = ppftMatch[1];
        }
      }
      if (!ppft) {
        const ppftRegex2 = /value="([^"]*)"[^>]*name="PPFT"/;
        const ppftMatch2 = data.data.match(ppftRegex2);
        if (ppftMatch2) {
          ppft = ppftMatch2[1];
        }
      }
      const linkMatch = data.data.match(linkRegex);
      if (linkMatch) {
        loginLink = linkMatch[0];
      }
      
    } catch (error) {
      console.error('Error parsing Microsoft login data:', error.message);
      const ppftRegex = /value="([^"]*)"/
      const ppftMatch = data.data.match(ppftRegex);
      if (ppftMatch) {
        ppft = ppftMatch[1];
      }
      
      const linkMatch = data.data.match(linkRegex);
      if (linkMatch) {
        loginLink = linkMatch[0];
      }
    }

    if (!ppft) {
      console.error('Failed to extract PPFT from Microsoft login page');
      return null;
    }

    return {
      loginLink: loginLink,
      ppft: ppft,
      cookies: cookies
    }
  } catch (error) {
    console.error('Failed to get live data:', error.message);
    return null;
  }
}