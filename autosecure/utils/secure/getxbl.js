const { xblhelper } = require('./xblhelper');
const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (loginCookie) => {
    try {
        console.log(`Got loginCookie: ${loginCookie}`)
        return await xbldata(loginCookie, 0);
    } catch (e) {
        return null;
    }
};

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...options.headers
            },
            maxHeaderSize: 32768,
            timeout: 30000
        };
        
        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

function base64Decode(str) {
    const padding = '='.repeat((4 - str.length % 4) % 4);
    const paddedStr = str + padding;
    return Buffer.from(paddedStr, 'base64').toString('utf-8');
}

async function processData(data) {
    const host = data.host;
    const loginRedirectUrl = "https://sisu.xboxlive.com/connect/XboxLive/?state=login&cobrandId=8058f65d-ce06-4c30-9559-473c9275a65d&tid=896928775&ru=https://www.minecraft.net/en-us/login&aid=1142970254";
    
    try {
        const loginResponse = await makeRequest(loginRedirectUrl);
        if (loginResponse.statusCode !== 302) {
            return { error: "Initial login redirect did not return a 302 status." };
        }
        
        const location1 = loginResponse.headers.location;
        if (!location1) {
            return { error: "No location header found after first redirect." };
        }
        
        const cookie = `__Host-MSAAUTH=${host}`;
        const accessTokenRedirect = await makeRequest(location1, {
            headers: { Cookie: cookie }
        });
        
        if (accessTokenRedirect.statusCode !== 302) {
            return { error: "Second access token redirect did not return a 302 status." };
        }
        
        const location2 = accessTokenRedirect.headers.location;
        if (!location2) {
            return { error: "No location header found for final redirect." };
        }
        
        const thirdRedirect = await makeRequest(location2);
        if (thirdRedirect.statusCode !== 302) {
            return { error: "Third access token redirect did not return a 302 status." };
        }
        
        const location3 = thirdRedirect.headers.location;
        if (!location3) {
            return { error: "No location header found after second access token redirect." };
        }
        
        const match = location3.match(/accessToken=([A-Za-z0-9\-_]+)/);
        if (!match) {
            return { error: "Access token not found in location URL." };
        }
        
        const accessToken = match[1];
        
        try {
            const decodedData = base64Decode(accessToken);
            const jsonData = JSON.parse(decodedData);
            
            const uhs = jsonData[0]?.Item2?.DisplayClaims?.xui?.[0]?.uhs;
            if (!uhs) {
                return { error: "Failed to extract 'uhs' from access token." };
            }
            
            let xsts = "";
            for (const item of jsonData) {
                if (item.Item1 === "rp://api.minecraftservices.com/") {
                    xsts = item.Item2?.Token || '';
                    break;
                }
            }
            
            if (!xsts) {
                return { error: "Failed to extract 'xsts' token." };
            }
            
            return { xbl: `XBL3.0 x=${uhs};${xsts}`, jsonData: jsonData, uhs: uhs };
            
        } catch (e) {
            return { error: `Error decoding access token: ${e.message}` };
        }
        
    } catch (e) {
        return { error: `Error processing data: ${e.message}` };
    }
}

async function xbldata(loginCookie, retryCount) {
    console.log(`Trying to get XBL! Retry: ${retryCount}`);
    const maxRetries = 1;
    
    try {
        const data = { host: loginCookie };
        const result = await processData(data);
        
        if (result && result.xbl) {
            console.log(`Got accesstoken!`)
            const json = result.jsonData;
            const uhs = result.uhs;
            
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
            
            if (!xsts) return false;
            
            console.log(`XBL: XBL3.0 x=${uhs};${xsts}`);
            
            return {
                XBL: `XBL3.0 x=${uhs};${xsts}`,
                gtg: gtg,
                xuid: xuid,
                playxbl: playfabxbl,
                purchasingtoken: purchasetoken
            };
        } else if (result && result.error) {
            console.log(`Error: ${result.error}`)
            if (retryCount < maxRetries) {
                return await xbldata(loginCookie, retryCount + 1);
            } else {
                return null;
            }
        } else {
            console.log(`Didn't get accesstoken!`)
            if (retryCount < maxRetries) {
                return await xbldata(loginCookie, retryCount + 1);
            } else {
                return null;
            }
        }
    } catch (e) {
        if (retryCount < maxRetries) {
            return await xbldata(loginCookie, retryCount + 1);
        } else {
            return "tfa";
        }
    }
}

function validatedstatus(status) {
    return status >= 200 && status < 400;
}