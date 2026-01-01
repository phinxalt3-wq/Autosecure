async function newxbl(axios) {
  let sft = await getsftloop(axios);
  if (!sft) {
    console.log(`Failed to get PPFT`);
    return null;
  }


  console.log(`SFT: ${sft}`)

  const response = await axios.post(
    'https://login.live.com/ppsecure/post.srf',
    `PPFT=${sft}&canary=&LoginOptions=1&type=28&hpgrequestid=&ctx=`,
    {
      params: {
        'nopa': '2',
        'client_id': '000000004420578E',
        'cobrandid': '8058f65d-ce06-4c30-9559-473c9275a65d',
        'uaid': '32597a17fca24badb5b689369f8952f6',
        'pid': '15216',
        'opid': '60419988A95CC55E',
        'route': 'C510_BAY'
      },
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://login.live.com',
        'Referer': 'https://login.live.com/ppsecure/post.srf?nopa=2&client_id=000000004420578E&cobrandid=8058f65d-ce06-4c30-9559-473c9275a65d&contextid=774A24D4AD0EAC58&opid=60419988A95CC55E&bk=1751462746&uaid=32597a17fca24badb5b689369f8952f6&pid=15216',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Sec-GPC': '1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Brave";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"19.0.0"',
      }
    }
  );

  let xboxcodelink = null;
  if (response?.headers?.location) {
    xboxcodelink = response.headers.location;
  } else {
    console.log(`No xboxcodelink!`);
    return null;
  }

  let tokenresponse = await axios.get(xboxcodelink);
  let location = null;
  if (tokenresponse?.headers?.location) {
    location = tokenresponse.headers.location;
  } else {
    console.log(`No accesstoken (no mc)`);
    return null;
  }

  const accessToken = location.match(/accessToken=([^&]*)/)?.[1];
  if (!accessToken) {
    console.log(`Didn't get accesstoken!`);
    console.log(`Link: ${location}`);
    return null;
  }

  const json = JSON.parse(Buffer.from(accessToken, "base64").toString("utf-8"));
  const uhs = json[0]?.Item2?.DisplayClaims?.xui[0]?.uhs;

  let xsts = "";
  let playfabxbl = null;
  let gtg = null;
  let xuid = null;
  let purchasetoken = null;

  for (const item of Object.values(json)) {
    if (item?.Item1 === "rp://api.minecraftservices.com/") {
      xsts = item?.Item2?.Token;
    }
    if (item?.Item1 === "http://xboxlive.com" && item?.Item2?.DisplayClaims?.xui?.length > 0) {
      gtg = item.Item2.DisplayClaims.xui[0]?.gtg;
      xuid = item.Item2.DisplayClaims.xui[0]?.xid;
    }
    if (item?.Item1 === "http://playfab.xboxlive.com/") {
      const secondtoken = item?.Item2?.Token;
      playfabxbl = `XBL3.0 x=${uhs};${secondtoken}`;
    }
    if (item?.Item1 === "http://mp.microsoft.com/") {
      const thirdtoken = item?.Item2?.Token;
      purchasetoken = `XBL3.0 x=${uhs};${thirdtoken}`;
    }
  }

  if (!xsts) {
    console.log(`XSTS token missing`);
    return false;
  }

  console.log(`XBL: XBL3.0 x=${uhs};${xsts}`);

  return {
    XBL: `XBL3.0 x=${uhs};${xsts}`,
    gtg: gtg,
    xuid: xuid,
    playxbl: playfabxbl,
    purchasingtoken: purchasetoken
  };
}

async function getsftloop(axios, retry = 0) {
  if (retry > 2) {
    return null;
  }

  try {
    const defaultRes = await axios.get("https://login.live.com/login.srf");
    const ppftRegex1 = /PPFT.*?value="(.*?)"/;
    let match = defaultRes.data.match(ppftRegex1);

    if (match && match[1]) {
      return match[1];
    }

    const ppftRegex2 = /value="([^"]*)"/;
    match = defaultRes.data.match(ppftRegex2);

    if (match && match[1]) {
      return match[1];
    }

    return getsftloop(axios, retry + 1);
  } catch {
    return getsftloop(axios, retry + 1);
  }
}

module.exports = {
  newxbl
};
