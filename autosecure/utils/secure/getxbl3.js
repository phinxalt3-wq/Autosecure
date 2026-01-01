const axios = require('axios');
const qs = require('querystring');

async function getOAuthCode(hostCookie) {
    try {
        const response = await axios.get('https://login.live.com/oauth20_authorize.srf', {
            params: {
                client_id: '1f907974-e22b-4810-a9de-d9647380c97e',
                scope: 'openid profile offline_access',
                redirect_uri: 'https://www.xbox.com/auth/msa/blank.html',
                response_type: 'code',
                state: JSON.stringify({
                    id: '01953538-9033-7d09-bac5-72b5a20dff97',
                    meta: { interactionType: 'silent' }
                }),
                response_mode: 'fragment',
                nonce: '01953538-9036-714d-8fe0-7bbece835b37',
                prompt: 'none',
                code_challenge: 'xswOYL-ebFq3H_Uqbh97hor_QAZbR36pqSduoDPM6oI',
                code_challenge_method: 'S256',
                'x-client-SKU': 'msal.js.browser',
                'x-client-Ver': '3.20.0',
                uaid: '3436df88b3624c9db648e5333a13f3d5',
                msproxy: '1',
                issuer: 'mso',
                tenant: 'consumers',
                ui_locales: 'fr-FR',
                client_info: '1',
                epct: 'PAQABDgEAAABVrSpeuWamRam2jAF1XRQEtKK1EG4g7LUgHirx3CbvfxdQdPu_3GPVlxyRfWYRfPiPzgSJKjYSre_7OLRBvw4nEx_TXSDbJajSDmz392Wmr9UDJysPuX1V2JKud0mkHdPiZFS1ffrBBVVX7ylykJRvC7jDaZJtFSkOyMi5VK6zwA7Xnw2A-FH-35sHNyocSUzRolqc3NSfnpW-X73zg1b_ZRwz5elI7J3JVHBE-KuPKSAA',
                jshs: '0'
            },
            headers: {
                'Cookie': `__Host-MSAAUTHP=${hostCookie}`,
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Dest': 'iframe',
                'Sec-Fetch-Storage-Access': 'active',
                'Sec-Ch-Ua': '"Chromium";v="133", "Not(A:Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Referer': 'https://www.xbox.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=0, i',
                'Connection': 'keep-alive'
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });

        if (response.headers.location) {
            const location = response.headers.location;
            const fragment = location.split('#')[1];
            if (fragment) {
                const params = new URLSearchParams(fragment);
                const code = params.get('code');
                if (code) {
                    return code;
                }
            }
            // console.log('Failed to grab OAuth code');
            return null;
        } else {
            // console.log('Failed to grab OAuth code');
            return null;
        }
    } catch {
        // console.log('Failed to grab OAuth code');
        return null;
    }
}

async function getRefreshToken(code) {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
    const data = {
        client_id: '1f907974-e22b-4810-a9de-d9647380c97e',
        redirect_uri: 'https://www.xbox.com/auth/msa/blank.html',
        scope: 'openid profile offline_access',
        code: code,
        code_verifier: '9E5uTBjbsOibt6CLef8xi5x0MGsMA4NTvih90oy6Yw0',
        grant_type: 'authorization_code'
    };

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://www.xbox.com',
        'Referer': 'https://www.xbox.com/',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Des': 'empty',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
    };

    try {
        const response = await axios.post(url, qs.stringify(data), { headers });
        return response.data.refresh_token;
    } catch {
        // console.log('Failed to grab refresh token');
        return null;
    }
}

async function getRpsTicket(refreshToken) {
    const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
    const data = {
        client_id: '1f907974-e22b-4810-a9de-d9647380c97e',
        redirect_uri: 'https://www.xbox.com/auth/msa/blank.html',
        scope: 'xboxlive.signin openid profile offline_access',
        grant_type: 'refresh_token',
        client_info: '1',
        x_client_SKU: 'msal.js.browser',
        x_client_VER: '3.20.0',
        x_ms_lib_capability: 'retry-after, h429',
        x_client_current_telemetry: '5|61,0,,,|,',
        x_client_last_telemetry: '5|0|||0,0',
        client_request_id: '01953538-987d-7579-80c1-41e298344351',
        refresh_token: refreshToken
    };

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Origin': 'https://www.xbox.com',
        'Referer': 'https://www.xbox.com/',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Des': 'empty',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
    };

    try {
        const response = await axios.post(url, qs.stringify(data), { headers });
        return  `d=${response.data.access_token}`;
    } catch {
        // console.log('Failed to grab RPS ticket');
        return null;
    }
}

async function getUserToken(RpsTicket) {
    try {
        const response = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
            Properties: {
                AuthMethod: 'RPS',
                RpsTicket: RpsTicket,
                SiteName: 'user.auth.xboxlive.com'
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Origin': 'https://www.xbox.com',
                'Referer': 'https://www.xbox.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'X-Xbl-Contract-Version': '1',
                'Sec-Ch-Ua': '"Chromium";v="133", "Not(A:Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Des': 'empty'
            }
        });

        return response.data.Token;
    } catch {
        // console.log('Failed to grab user token');
        return null;
    }
}

async function getXBL3(userToken) {
    try {
        const response = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
            Properties: { "SandboxId": "RETAIL", "UserTokens": [userToken] },
            RelyingParty: 'http://mp.microsoft.com/',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Origin': 'https://www.xbox.com',
                'Referer': 'https://www.xbox.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'X-Xbl-Contract-Version': '1',
                'Sec-Ch-Ua': '"Chromium";v="133", "Not(A:Brand";v="99"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Des': 'empty'
            }
        });


        // console.log(response.data)
        const token = response.data.Token;
        const uhs = response.data.DisplayClaims.xui[0].uhs;
        return `XBL3.0 x=${uhs};${token}`;
    } catch {
        // console.log('Failed to grab XBL3');
        return null;
    }
}

async function disableMulti(xbl3) {
    try {
        const response = await axios.post('https://emerald.xboxservices.com/xboxcomfd/settings/privacyonlinesafety', {
            setOnlineSafetySettings: [254, 185],
            clearOnlineSafetySettings: [188, 190, 198, 199, 220, 255]
        }, {
            headers: {
                'Host': 'emerald.xboxservices.com',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Authorization': xbl3,
                'Accept-Language': 'fr-FR,fr;q=0.9',
                'Sec-Ch-Ua': '"Chromium";v="133", "Not(A:Brand";v="99"',
                'Ms-Cv': 'DjKV+V0A+lsFOoIcNECzJ6.41',
                'Sec-Ch-Ua-Mobile': '?0',
                'X-Ms-Api-Version': '1.0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'Origin': 'https://www.xbox.com',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Des': 'empty',
                'Referer': 'https://www.xbox.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=1, i'
            }
        });

        return response.status;
    } catch (error) {
        if (error.response && error.response.status === 403) {
            // console.log('Family settings blocked multiplayer!');
        } else {
            // console.log('Failed to disable multiplayer');
        }
        return null;
    }
}



/*
Testing new xbox xbl
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
    console.log('getXBL3 request payload:', JSON.stringify(payload, null, 2));
    console.log('getXBL3 request headers:', JSON.stringify(headers, null, 2));
    try {
        const response = await axios.post(url, payload, { headers });
        console.log('getXBL3 response status:', response.status);
        console.log('getXBL3 response data:', JSON.stringify(response.data, null, 2));
        const token = response.data.Token;
        const uhs = response.data.DisplayClaims.xui[0].uhs;
        const xbl3 = `XBL3.0 x=${uhs};${token}`;
        console.log('getXBL3 extracted token:', token);
        console.log('getXBL3 extracted uhs:', uhs);
        console.log('getXBL3 final xbl3 string:', xbl3);
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


async function getmxbl(hostCookie, usertoken) {
    let userToken;

    if (usertoken) {
        userToken = usertoken;
    } else {
        const code = await getOAuthCode(hostCookie);
        if (!code) return null;

        const refreshToken = await getRefreshToken(code);
        if (!refreshToken) return null;

        const rpsTicket = await getRpsTicket(refreshToken);

     //   // console.log(`rps: ${rpsTicket}`);
        if (!rpsTicket) return null;

        userToken = await getUserToken(rpsTicket);
             //   await getminecraft(userToken)
        if (!userToken) return null;
    }

    /*
    let result = await getxblx(userToken)
    console.log(result)

    let xuid = await getXUID(result)
    console.log(`xuid: ${xuid}`)
    */

    const xbl3 = await getXBL3(userToken);
    let mxblresult = {
        xbl: xbl3,
        refresh: userToken
    };
    return mxblresult;
}

module.exports = {
    getmxbl
}


getmxbl("11-M.C518_BL2.0.U.CnsFDkNUjjiVj8YXhh85ALTINfuBOKZFyYgmK6N8W5Z6oja0tOOA0nhfdKSHFtEPLXXvge03nrCcRwgUdIQvtz8FoaDfm99QDW4lyYxevresOo6ER4eCWkxy6rOmKVqCvyO8sMCqRDM6xuw7ynl2w4r3vbU0qJq0xyEhGKESz!jBrxEQDn8yPRvAWab3kLwLKp!OLNvxZYYZtqFSbHZwNd9BSYyaEGbPb8b1jArOJCFwgEuJsuaKfnW5NaJFwi4HTHSMZFDtNt!1axExf9g6!iArY*msPMVyZuiBLd6xvj79")
