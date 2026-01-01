const axios = require('axios');


/*
Get reservationID (xuid)
*/

async function getXUID(xblTokengtg) {
  const headers = {
    Authorization: xblTokengtg,
    'x-xbl-contract-version': '2',
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  };

  try {
    const res = await axios.get(
      'https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag',
      { headers }
    );

    return res.data.profileUsers?.[0]?.id || null;
  } catch (err) {
    console.error('[!] Failed to get XUID:', err.response?.data || err.message);
    return null;
  }
}



/*
Get XBL (xbox)
*/


async function getxblx(userToken) {
    console.log('getXBL3 called with userToken:', userToken);
    const url = 'https://xsts.auth.xboxlive.com/xsts/authorize';
    const payload = {
        Properties: {"SandboxId":"RETAIL","UserTokens":[userToken]},
        RelyingParty: 'http://xboxlive.com',
        TokenType: 'JWT'
    };
    const headers = {
        'content-type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://www.xbox.com/',
        'ms-cv': 'bxWMikoSL3fMSlsu9CMmfq.14',
        'x-xbl-contract-version': '1',
        'Origin': 'https://www.xbox.com',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Priority': 'u=4',
        'TE': 'trailers'
    };
 //   console.log('getXBL3 request payload:', JSON.stringify(payload, null, 2));
  //  console.log('getXBL3 request headers:', JSON.stringify(headers, null, 2));
    try {
        const response = await axios.post(url, payload, { headers });
     //   console.log('getXBL3 response status:', response.status);
    //    console.log('getXBL3 response data:', JSON.stringify(response.data, null, 2));
        const token = response.data.Token;
        const uhs = response.data.DisplayClaims.xui[0].uhs;
        const xbl3 = `XBL3.0 x=${uhs};${token}`;
    //    console.log('getXBL3 extracted token:', token);
     //   console.log('getXBL3 extracted uhs:', uhs);
     //   console.log('getXBL3 final xbl3 string:', xbl3);
        return xbl3;
    } catch (error) {
        if (error.response) {
            console.error('getXBL3 error response status:', error.response.status);
            console.error('getXBL3 error response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('getXBL3 error:', error.message);
        }
        return null;
    }
}

/*
Change XBOX Gamertag (2)
*/



async function changeGamertag(userToken, newGamertag) {
 // console.log(`Changing XBOX Gamertag: ${userToken}, newgtg: ${newGamertag}`)
  const xblTokengtg = await getxblx(userToken);
  if (!xblTokengtg) {
    console.log(`Couldn't get XBOX XBL.`);
    return { success: false, reason: 'Failed to get token (2A)' };
  }
 // console.log(`Got XBOX XBL token (start: ${xblTokengtg.substring(0, 50)})`);

  const xuid = await getXUID(xblTokengtg);
  if (!xuid) {
    console.log(`Couldn't get XUID!`);
    return { success: false, reason: 'Failed to get token (2B)' };
  }

 // console.log(`Got XBL and XUID: ${xuid}. Proceeding to reserve gamertag.`);

  const reserveHeaders = {
    Authorization: xblTokengtg,
    'x-xbl-contract-version': '2',
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0',
    Referer: 'https://www.xbox.com/',
    'Accept-Language': 'en-US'
  };

  const reservePayload = {
    reservationId: xuid,
    modernGamertag: newGamertag,
    targetGamertagFields: 'modernGamertag'
  };

  try {
    const reserveRes = await axios.post(
      'https://gamertag.xboxlive.com/gamertags/reserve',
      reservePayload,
      { headers: reserveHeaders }
    );

    console.log(`[+] Gamertag reserved successfully: ${reserveRes.data.uniqueModernGamertag}`);
  } catch (err) {
    console.error('[!] Gamertag reserve failed:', err.response?.data || err.message);
    return { success: false, reason: `Failed to reserve ${newGamertag}` };
  }

  const confirmHeaders = {
    Authorization: xblTokengtg,
    'x-xbl-contract-version': '6',
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0',
    Referer: 'https://www.xbox.com/',
    'Accept-Language': 'en-US'
  };

  const confirmPayload = {
    gamertag: {
      gamertag: newGamertag,
      gamertagSuffix: '',
      classicGamertag: newGamertag
    },
    reservationId: Number(xuid),
    preview: false,
    useLegacyEntitlement: false
  };

try {
  const confirmRes = await axios.post(
    'https://accounts.xboxlive.com/users/current/profile/gamertag',
    confirmPayload,
    { headers: confirmHeaders }
  );

  if (confirmRes.data?.hasFree === false) {
    console.log('[!] Microsoft requires payment to change this Gamertag.');
    return { success: false, reason: `Microsoft requires payment to change to ${newGamertag}.` };
  }

  console.log(`[+] Gamertag changed successfully to: ${newGamertag}`);
  return { success: true, reason: `Changed to: ${newGamertag}` };
} catch (err) {
  const errorData = err.response?.data;

  if (errorData?.code === 5025) {
    console.log('[!] Microsoft requires payment to change this Gamertag.');
    return { success: false, reason: `Microsoft requires payment to change to ${newGamertag}.` };
  }

  console.error('[!] Gamertag change failed:', errorData || err.message);
  return { success: false, reason: `Failed to change to ${newGamertag}. (unknown)` };
}
}


module.exports = { changeGamertag }