const axios = require('axios');
const qs = require('querystring');
const getLiveData = require('../secure/getLiveData');
const generateotp = require('../secure/codefromsecret')
const login = require("../secure/login")

async function authenticate(email, password) {
    try {
        const data = await getLiveData();
        
        const loginPasswordResponse = await axios({
            method: "POST",
            url: "https://login.live.com/ppsecure/post.srf",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Cookie: data.cookies,
            },
            data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${data.ppft}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${email}&loginfmt=${email}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${password}`,
        });

        if (loginPasswordResponse.status < 200 || loginPasswordResponse.status >= 400) {
            return { success: false, message: "Invalid email/password."};
        }
        

        
        let passwordhost = null;
        loginPasswordResponse.headers["set-cookie"].forEach((cookie) => {
            const [name, ...values] = cookie.split("=");
            if (name === "__Host-MSAAUTH") {
                passwordhost = values.join("=").split(";").shift();
            } else{
                return { success: false, message: "Invalid email/password."};
            }
        });

        if (!passwordhost) {
            console.log("Failed to get authentication token");
            return { success: false, message: "Authentication failed" };
        }

        return { success: true, hostCookie: passwordhost };
    } catch (error) {
        console.error("Error during authentication process:", error);
        return { success: false, message: "Unknown error" };
    }
}


async function authenticate2(email, password, secretkey){
    const { otp } = await generateotp(secretkey);
    if (!otp) {
    return { success: false, message: "Bad secretkey format!"};
    }
    let host = await login({ otp: otp, email: email, pw: password }, null);
    if (host === "tfa"){
        return { success: false, message: "2FA is not enabled, which is needed for this option! If this is wrong report it asap to me."};
    }
    if (!host){
        return { success: false, message: "Invalid email/password/secretkey"};
    }
    return { success: true, hostCookie: host };
}

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

        const location = response.headers.location;
        console.log('Redirected to:', location);

        if (!location) {
            return { success: false, message: "Microsoft changed something." };
        }



        const fragment = location.split('#')[1];
        let authed = true
        if (fragment) {
            const params = new URLSearchParams(fragment);
            const code = params.get('code');

            if (code) {
                return code;
            } else{
                authed = false;
            }
        } else{
        authed = false;
        }

        if (!authed){
            const has2FAIndicators = [
            'auth/msa/',
            'The+user+must+first+sign+in',
            'interaction_required',
            'Silent+authentication+was+denied',
            'grant+the+client+application+access'
        ].some(indicator => location.includes(indicator));

        if (has2FAIndicators) {
            return {
                success: false,
                message: "Account seems to have 2FA, enter the secretkey in the optional field."
            };
        }
        }
        


        return { success: false, message: "Microsoft changed something maybe or auth is just annoying" };

    } catch (error) {
        console.error('Error fetching authorization code:', error.message);
        return { success: false, message: "Request failed or Microsoft changed something." };
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
        'Sec-Fetch-Dest': 'empty',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
    };

    try {
        const response = await axios.post(url, qs.stringify(data), { headers });
        return response.data.refresh_token;
    } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        return { success: false, message: "Microsoft changed something."};
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
        'Sec-Fetch-Dest': 'empty',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br'
    };

    try {
        const response = await axios.post(url, qs.stringify(data), { headers });
        const rpsTicket = `d=${response.data.access_token}`;
        console.log(`rps: ${rpsTicket}`)
        return rpsTicket;
    } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        return { success: false, message: "Microsoft changed something."};
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
                'Sec-Fetch-Dest': 'empty'
            }
        }); 

        console.log(`${JSON.stringify(response.data)}`)
        
        return response.data.Token;
    } catch (error) {
        return { success: false, message: "Microsoft changed something."};
    }
}

async function getXBL3(userToken) {
    try {
        const response = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
            Properties: {"SandboxId":"RETAIL","UserTokens":[userToken]},
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
                'Sec-Fetch-Dest': 'empty'
            }
        });
        
        const token = response.data.Token;
        const uhs = response.data.DisplayClaims.xui[0].uhs;
        const xbl3 = `XBL3.0 x=${uhs};${token}`;
        return xbl3;
    } catch (error) {
        console.error('Error fetching XBL3 token:', error.response ? error.response.data : error.message);
        return { success: false, message: "No Xbox Profile?"};
    }
}

async function updateMultiplayerSettings(xbl3, action = 'disable') {
    try {
        const requestBody = action === 'enable' 
            ? {"setOnlineSafetySettings":[],"clearOnlineSafetySettings":[185,188,190,198,199,220,254,255]}
            : {"setOnlineSafetySettings":[254,185],"clearOnlineSafetySettings":[188,190,198,199,220,255]};

        const response = await axios.post('https://emerald.xboxservices.com/xboxcomfd/settings/privacyonlinesafety', 
            requestBody, 
            {
                headers: {
                    'Host': 'emerald.xboxservices.com',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Authorization': `${xbl3}`,
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
                    'Sec-Fetch-Dest': 'empty',
                    'Referer': 'https://www.xbox.com/',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Priority': 'u=1, i'
                }
            }
        );
        
        console.log(`Multiplayer settings update successful with status: ${response.status}`);
        return { success: true, status: response.status, action };
    } catch (error) {
        if (error.response) {
            console.log(`Error status code: ${error.response.status}`);
            if (error.response.status === 403) {
                console.log('Family settings blocked multiplayer!');
                return { success: false, status: error.response.status, message: 'Family settings blocked multiplayer' };
            }
        }
        console.error(`Error ${action === 'enable' ? 'enabling' : 'disabling'} multiplayer:`, error.message);
        return { success: false, message: "Unknown issue" };
    }
}

async function multiplayerhandler(email, password, action = 'disable', secretkey) {
    try {
        console.log(`Starting authentication process for ${email}...`);
        let authResult;
        if (secretkey) {
            console.log(`Has secretkey!`)
            authResult = await authenticate2(email, password, secretkey);  
        } else {
            authResult = await authenticate(email, password);
        }
        if (!authResult.success) {
            return { success: false, message: authResult.message };
        }
        
        console.log("Got msauth!");
        console.log("Getting OAuth code...");
        const code = await getOAuthCode(authResult.hostCookie);
        if (typeof code !== 'string') {
            return code; 
        }
        
        console.log("Getting refresh token...");
        const refreshToken = await getRefreshToken(code);
        if (typeof refreshToken !== 'string') {
            return refreshToken; 
        }
        
        console.log("Getting RPS ticket...");
        const rpsTicket = await getRpsTicket(refreshToken);
        if (typeof rpsTicket !== 'string') {
            return rpsTicket; 
        }
        
        console.log("Getting user token...");
        const userToken = await getUserToken(rpsTicket);
        console.log(`Usertoken: ${userToken}`)
        if (typeof userToken !== 'string') {
            return userToken; 
        }
        
        console.log("Getting XBL3 token...");
        const xbl3 = await getXBL3(userToken);
        if (typeof xbl3 !== 'string') {
            return xbl3; 
        }
        
        console.log(`${action === 'enable' ? 'Enabling' : 'Disabling'} multiplayer settings...`);
        const result = await updateMultiplayerSettings(xbl3, action);
        
        return {
            success: result.success,
            message: result.message || `Successfully ${action}d multiplayer settings`
        };
    } catch (error) {
        console.error(`Error in ${action === 'enable' ? 'enable' : 'disable'}MultiplayerWithCredentials:`, error);
        return { success: false, message: "An unknown error occured!" };
    }
}

module.exports = {
    multiplayerhandler
};

async function main() {
    try {
        const email = "";
        const password = "";
        const action = process.argv[2] || 'disable'; 
        

        
        const authResult = await authenticate(email, password);
        if (!authResult.success){
            console.log('wrong pass gng')
        } 
        
        const code = await getOAuthCode(authResult.hostCookie);
        const refreshToken = await getRefreshToken(code);
        const rpsTicket = await getRpsTicket(refreshToken);
        const userToken = await getUserToken(rpsTicket);
        const xbl3 = await getXBL3(userToken);
        
        const result = await updateMultiplayerSettings(xbl3, action);
        console.log(result.success ? "Success!" : `Failed: ${result.message}`);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

if (require.main === module) {
    main();
}