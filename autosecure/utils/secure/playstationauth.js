const axios = require('axios');

async function getmctoken(playxbl) {
 // console.log("[getmctoken] Starting session with playxbl:", playxbl);

  const response = await axios.post(
    'https://authorization.franchise.minecraft-services.net/api/v1.0/session/start',
    {
      device: {
        playFabTitleId: '1DF18',
        applicationType: 'MinecraftPE',
        gameVersion: '1.19.2',
        id: 'fffdd560-46d4-485e-ac2f-e43eb7d4a025',
        memory: '1024',
        platform: 'Windows10',
        storePlatform: 'uwp.store',
        type: 'Windows10',
        treatmentOverrides: []
      },
      user: {
        tokenType: 'Xbox',
        token: playxbl
      }
    },
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
        'Accept': '*/*',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://www.minecraft.net/',
        'Authorization': 'Bearer',
        'Content-Type': 'application/json',
        'x-xbl-contract-version': '2',
        'Origin': 'https://www.minecraft.net',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Priority': 'u=4',
        'TE': 'trailers'
      }
    }
  );

  const authorizationheader = response?.data?.result?.authorizationHeader || null;

 // console.log("[getmctoken] Got authorization header:", authorizationheader);

  if (!authorizationheader) {
    console.warn("[getmctoken] WARNING: No authorization header found in response");
  }

  return authorizationheader;
}

async function playstationauth(playxbl, mpurchase) {
 // console.log("[playstationauth] Running with playxbl:", playxbl, "and mpurchase:", mpurchase);

  const authorization = await getmctoken(playxbl);

  if (!authorization) {
    console.error("[playstationauth] ERROR: No authorization token, aborting");
    return { minecoin: 0, playstation: 0 };
  }

  const response = await axios.post(
    'https://entitlements.mktpl.minecraft-services.net/api/v1.0/currencies/virtual/refresh',
    {},
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
        'Accept': '*/*',
        'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://www.minecraft.net/',
        'content-type': 'application/json',
        'authorization': authorization,
        'microsoftPurchasingToken': mpurchase,
        'Origin': 'https://www.minecraft.net',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Priority': 'u=4',
        'TE': 'trailers'
      }
    }
  );

 // console.log(`Response data: ${JSON.stringify(response.data)}`)

  const balances = response?.data?.result?.virtualCurrency?.virtualCurrencyBalances || [];

//  console.log("[playstationauth] Raw balances:", balances);

  const balancesMap = Object.fromEntries(
    balances.map(b => [b.type, b.amount])
  );

  const minecoin = balancesMap.Minecoin || 0;
  const playstationToken = balancesMap.PlayStationToken || 0;

 // console.log("[playstationauth] Minecoin:", minecoin, "| PlayStationToken:", playstationToken);

  return {
    minecoin: minecoin,
    playstation: playstationToken
  };
}

module.exports = {
  playstationauth
};
