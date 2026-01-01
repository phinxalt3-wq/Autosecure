const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const qs = require('querystring');
const { exec } = require('child_process');
const { promisify } = require('util');

const CLIENT_ID = '42a60a84-599d-44b2-a7c6-b00cdef1d6a2';
const REDIRECT_URI = 'http://localhost:25575/callback';
const PORT = 25575;

// Extract hostcookie from your existing cookies
const hostCookie = '11-M.C509_BL2.0.U.CmlvnY1OUOg1cjFLpXf**RyEg!UvMR2zOSXWIlUF8LpAmPk8mcz60PX!0*p374dfut5uSN764s902L!Dxy18XqjFBnFSSNSFgxtxlugs1KpVp0RzXRBXQhyutVrGOW*!bRIJ1bgq5ySAHyPnsN7DITaBhXx*aBqWRyoaLKd0PdT2ygGVwCm0f968Bd4uKVcAO!PieISliUWhxg8pSEtLILuIFHgz*NKgJCxRWvH2srGY5pgqtyQFo7a42xihBoFMPWltfVKjq1*!0PvUNr5A*MfE9hYI!Kyq4pP*Auy7696R';

// Your existing Microsoft authentication cookies (paste them here)
const msAuthCookies = {
    'uaid': 'e1bc9e1b7c984ddcbd2b68cb0b344fd6',
    'MSPRequ': 'id=N^&lt=1751584427^&co=0',
    'MSCC': '185.175.113.241-GB',
    '__Host-MSAAUTHP': hostCookie,
    'MSPAuth': 'Disabled',
    'MSPProf': 'Disabled',
    'MUID': '8458f34d47c348a4a57b898fa4b4013d',
    'WLSSC': 'EgA4AgMAAAAMgAAArwAB4F7Lv9xPGPxE2RZqqid61IVg8kiTQQ2OPSVvBINPu6MqMqU/ze6zIcw4givVrXQuCZD+KtSqiQ2QxLwDmYWsoSSUYPKDYdNAeevg33Bvgls98Vo5TQhnvUAYxg87NZq+uQwHN0nqhQevbk7en2cnQM8XqhaMSR9KENsxDL90VYmIX/LSC8aCC9fsOAmsVw5JSX+USTx3Si3eSncVZcZ28JiOaCSdKfwHVstIzwX6QfRMFiNVm+eKZP91sP6A1gsvUuemu10clZJShi928lqEbut7IJn815yktJqucfORKsbX+0IqZt3nWMeitABXNytEG68ezyCzjrVA+hPVcbhUKicBgQAnAQFAAwC/mWYUAwxnaPkLZ2gQJwAAChCgABAcAGlubG92ZXlhaGJueml3dUBvdXRsb29rLmNvbQBhAAAoaW5sb3ZleWFoYm56aXd1JW91dGxvb2suY29tQHBhc3Nwb3J0LmNvbQAAAE1HTgAAAAAAAAgJAgAAii9VQAAGQwAFRW1pbGUABk1hZ2dpbwAAAAAAAAAAAAAAAAAAAAAAABdXBuO6d9qkAAADDGdo+bLdaAAAAAAAAAAAAAAAABAAMTg1LjE3NS4xMTMuMjQxAAIKAAAAAAAAAAAAAAAAAQQAAAAAAAAAAAAAAAAAAAAXURoYsIwLDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAA==',
    'mkt': 'en-US',
    'mkt1': 'en-US',
    'MSPCID': 'ba77daa4175706e3'
};

// Cross-platform browser opening function
async function openBrowser(url) {
    const execAsync = promisify(exec);
    let command;
    
    switch (process.platform) {
        case 'win32':
            command = `start "${url}"`;
            break;
        case 'darwin':
            command = `open "${url}"`;
            break;
        default:
            command = `xdg-open "${url}"`;
            break;
    }
    
    try {
        await execAsync(command);
        console.log('🌐 Browser opened successfully');
    } catch (error) {
        console.log('❌ Could not open browser automatically. Please open:', url);
    }
}

// Convert cookies object to cookie string
function cookiesToString(cookies) {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

// Extract SSID from hostcookie or response
function extractSSID(data) {
    // Look for SSID in various formats
    const ssidRegex = /SSID[=:]([^;,\s]+)/i;
    const match = data.match(ssidRegex);
    return match ? match[1] : null;
}

const app = express();

async function authenticateWithExistingCookies() {
    try {
        console.log('🔑 Using existing Microsoft authentication cookies...');
        
        const state = crypto.randomUUID();
        const cookieString = cookiesToString(msAuthCookies);
        
        // Step 1: Try to get authorization code using existing cookies
        const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}` +
            `&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&scope=XboxLive.signin%20XboxLive.offline_access&state=${state}`;
        
        console.log('🌐 Attempting to get auth code with existing session...');
        console.log(authUrl)
        const authResponse = await axios.get(authUrl, {
            headers: {
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0'
            },
            maxRedirects: 0,
            validateStatus: function (status) {
                return status >= 200 && status < 400;
            }
        });

        // Check if we got redirected with an auth code
        let authCode = null;
        if (authResponse.headers.location) {
            const redirectUrl = new URL(authResponse.headers.location);
            authCode = redirectUrl.searchParams.get('code');
        }

        console.log(authResponse.headers.location)
        console.log(`${JSON.stringify(authResponse?.data)}`)

        if (!authCode) {
            console.log('❌ No direct auth code found. Starting interactive flow...');
            return await interactiveAuth();
        }



        console.log('🎯 Auth code obtained:', authCode.substring(0, 20) + '...');
        
        // Continue with the rest of the flow
        return await completeAuthentication(authCode);
        
    } catch (error) {
        console.log('❌ Cookie auth failed:', error.message);
        console.log('🔄 Falling back to interactive authentication...');
        return await interactiveAuth();
    }
}

async function interactiveAuth() {
    const state = crypto.randomUUID();
    
    const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}` +
        `&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=XboxLive.signin%20XboxLive.offline_access&state=${state}`;

    console.log('🌐 Opening browser for interactive login...');
    await openBrowser(authUrl);
    
    console.log('🧭 Waiting for Microsoft login...');

    const authCode = await new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`🚪 Listening at http://localhost:${PORT}/callback`);
        });

        app.get('/callback', async (req, res) => {
            const { code, state: returnedState, error, error_description } = req.query;

            if (error) {
                server.close();
                reject(`OAuth Error: ${error_description || error}`);
                return res.send(`<h1>❌ Error: ${error_description || error}</h1>`);
            }

            if (returnedState !== state) {
                server.close();
                reject('State mismatch!');
                return res.send(`<h1>❌ State mismatch!</h1>`);
            }

            if (!code) {
                server.close();
                reject('No code returned.');
                return res.send(`<h1>❌ No code received.</h1>`);
            }

            res.send(`<h1>✅ Auth Complete. You can close this window.</h1>`);
            server.close();
            resolve(code);
        });
    });

    return await completeAuthentication(authCode);
}

async function completeAuthentication(authCode) {
    console.log('🎯 Processing auth code...');

    // Step 2: Exchange auth code for Microsoft token
    const msRes = await axios.post(
        'https://login.live.com/oauth20_token.srf',
        qs.stringify({
            client_id: CLIENT_ID,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    const msAccessToken = msRes.data.access_token;
    const msRefreshToken = msRes.data.refresh_token;
    console.log('🔑 MS Access Token acquired');
    
    // Extract SSID from access token or response
    const ssid = extractSSID(msAccessToken) || extractSSID(JSON.stringify(msRes.data));
    if (ssid) {
        console.log('🎫 SSID extracted:', ssid);
    }

    // Step 3: Get Xbox Live token
    const xboxRes = await axios.post('https://user.auth.xboxlive.com/user/authenticate', {
        Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `d=${msAccessToken}`
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT'
    });

    const xboxToken = xboxRes.data.Token;
    console.log('🎮 Xbox Token acquired');

    // Step 4: Get XSTS token for Minecraft
    const xstsRes = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [xboxToken]
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT'
    });

    const xstsToken = xstsRes.data.Token;
    const uhs = xstsRes.data.DisplayClaims.xui[0].uhs;
    console.log('🔐 XSTS Token and UHS acquired');

    // Step 5: Get PlayFab XSTS token
    let playfabXstsToken = null;
    let playfabUhs = null;
    
    try {
        const playfabRes = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
            Properties: {
                SandboxId: 'RETAIL',
                UserTokens: [xboxToken]
            },
            RelyingParty: 'http://playfab.xboxlive.com/',
            TokenType: 'JWT'
        });

        playfabXstsToken = playfabRes.data.Token;
        playfabUhs = playfabRes.data.DisplayClaims.xui[0].uhs;
        console.log('🎯 PlayFab XSTS Token acquired');
        console.log('📋 PlayFab Response:', JSON.stringify(playfabRes.data, null, 2));
    } catch (error) {
        console.log('⚠️ PlayFab XSTS Token failed:', error.response?.data || error.message);
    }

    // Step 6: Get Minecraft token
    const mcRes = await axios.post('https://api.minecraftservices.com/authentication/login_with_xbox', {
        identityToken: `XBL3.0 x=${uhs};${xstsToken}`
    });

    const mcToken = mcRes.data.access_token;
    console.log('🟩 Minecraft Access Token acquired');

    // Step 7: Get Minecraft profile
    const profileRes = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
        headers: { Authorization: `Bearer ${mcToken}` }
    });

    console.log('🧍 Minecraft Profile:', profileRes.data);

    // Step 8: Check Minecraft ownership
    let ownershipInfo = null;
    try {
        const ownershipRes = await axios.get('https://api.minecraftservices.com/entitlements/mcstore', {
            headers: { Authorization: `Bearer ${mcToken}` }
        });
        ownershipInfo = ownershipRes.data;
        console.log('🎮 Minecraft Ownership Info:', ownershipInfo);
    } catch (error) {
        console.log('⚠️ Could not fetch ownership info:', error.response?.data || error.message);
    }
    
    // Return all important tokens
    return {
        hostCookie: hostCookie,
        ssid: ssid,
        msAccessToken: msAccessToken,
        msRefreshToken: msRefreshToken,
        xboxToken: xboxToken,
        xstsToken: xstsToken,
        playfabXstsToken: playfabXstsToken,
        playfabUhs: playfabUhs,
        mcToken: mcToken,
        profile: profileRes.data,
        ownership: ownershipInfo
    };
}

// Helper function to refresh Microsoft access token
async function refreshMicrosoftToken(refreshToken) {
    try {
        const response = await axios.post(
            'https://login.live.com/oauth20_token.srf',
            qs.stringify({
                client_id: CLIENT_ID,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log('🔄 Microsoft token refreshed successfully');
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token
        };
    } catch (error) {
        console.error('❌ Token refresh failed:', error.response?.data || error.message);
        throw error;
    }
}

// Helper function to validate Minecraft token
async function validateMinecraftToken(mcToken) {
    try {
        const response = await axios.get('https://api.minecraftservices.com/minecraft/profile', {
            headers: { Authorization: `Bearer ${mcToken}` }
        });
        console.log('✅ Minecraft token is valid');
        return response.data;
    } catch (error) {
        console.log('❌ Minecraft token is invalid:', error.response?.status);
        return null;
    }
}

// Main execution
async function start() {
    try {
        console.log('🚀 Starting Microsoft to Minecraft authentication flow...');
        const result = await authenticateWithExistingCookies();
        
        console.log('✅ Authentication complete!');
        console.log('📋 Summary:');
        console.log(`   Host Cookie: ${result.hostCookie ? result.hostCookie.substring(0, 30) + '...' : 'Not found'}`);
        console.log(`   SSID: ${result.ssid || 'Not extracted'}`);
        console.log(`   MS Access Token: ${result.msAccessToken.substring(0, 30)}...`);
        console.log(`   MS Refresh Token: ${result.msRefreshToken.substring(0, 30)}...`);
        console.log(`   Xbox Token: ${result.xboxToken.substring(0, 30)}...`);
        console.log(`   XSTS Token: ${result.xstsToken.substring(0, 30)}...`);
        console.log(`   PlayFab XSTS Token: ${result.playfabXstsToken ? result.playfabXstsToken.substring(0, 30) + '...' : 'Not available'}`);
        console.log(`   Minecraft Token: ${result?.mcToken}`);
        console.log(`   Username: ${result.profile.name}`);
        console.log(`   UUID: ${result.profile.id}`);
        console.log(`   Ownership: ${result.ownership ? 'Verified' : 'Not verified'}`);
        
        return result;
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
        throw error;
    }
}

// Run the authentication flow
if (require.main === module) {
   // start().catch(console.error);
}

module.exports = { 
    start, 
    authenticateWithExistingCookies, 
    completeAuthentication, 
    refreshMicrosoftToken, 
    validateMinecraftToken 
};