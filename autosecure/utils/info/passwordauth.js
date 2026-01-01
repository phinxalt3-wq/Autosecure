const HttpClient = require("../process/HttpClient");
const { URL } = require('url');
const querystring = require('querystring');
const fs = require('fs')

const sFTTag_url = "https://login.live.com/oauth20_authorize.srf?client_id=00000000402B5328&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=service::user.auth.xboxlive.com::MBI_SSL&display=touch&response_type=token&locale=en";

async function get_urlPost_sFTTag(HttpClientfix) {
    try {
        const response = await HttpClientfix.get(sFTTag_url);
        const text = response.data;
        
        const sFTTagMatch = text.match(/value="(.+?)"/);
        const urlPostMatch = text.match(/urlPost:'(.+?)'/);
        
        if (sFTTagMatch && urlPostMatch) {
            // console.log('urlPost:', urlPostMatch[1]);
            // console.log('sFTTag:', sFTTagMatch[1]);
            return {
                urlPost: urlPostMatch[1],
                sFTTag: sFTTagMatch[1]
            };
        }
        throw new Error("Failed to extract sFTTag or urlPost");
    } catch (error) {
        console.error("Error in get_urlPost_sFTTag:", error.message);
        throw error;
    }
}

async function get_xbox_rps(HttpClientfix, email, password, urlPost, sFTTag) {
    try {
        const data = {
            login: email,
            loginfmt: email,
            passwd: password,
            PPFT: sFTTag
        };

        const login_request = await HttpClientfix.post(urlPost, querystring.stringify(data), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            maxRedirects: 10,
            validateStatus: (status) => status >= 200 && status < 500
        });

        // console.log('Login request response:', login_request.data);

        const finalUrl = login_request.request?.path || login_request.request?.res?.responseUrl || login_request.request?.res?.req?.path;
        // console.log('Final URL after redirects:', finalUrl);

        if (finalUrl && finalUrl.includes('#')) {
            console.log(`${finalUrl}`)
            const urlObj = new URL(`http://placeholder.com${finalUrl}`);
            const fragment = urlObj.hash.substring(1);
            const params = querystring.parse(fragment);
            const token = params.access_token;
            if (token) {
                // console.log('Access token extracted:', token);
                return token;
            }
        }

        const responseText = login_request.data;
        // console.log('Response Text:', responseText);

        if (responseText.includes('action="https://account.live.com/ar/cancel')) {
            // console.log('Recovery URL detected!');
            try {
                const actionUrlMatch = responseText.match(/<form[^>]*action="([^"]*cancel\?[^"]*)"/);
                // console.log('Action URL match:', actionUrlMatch);
                
                if (actionUrlMatch) {
                    const cancelUrl = actionUrlMatch[1];
                    // console.log('Cancel URL found:', cancelUrl);

                    const iptMatch = responseText.match(/(?<="ipt" value=")(.+?)(?=">)/);
                    const ppridMatch = responseText.match(/(?<="pprid" value=")(.+?)(?=">)/);
                    const uaidMatch = responseText.match(/(?<="uaid" value=")(.+?)(?=">)/);

                    // console.log('iptMatch:', iptMatch);
                    // console.log('ppridMatch:', ppridMatch);
                    // console.log('uaidMatch:', uaidMatch);

                    if (iptMatch && ppridMatch && uaidMatch) {
                        const formData = {
                            ipt: iptMatch[0],
                            pprid: ppridMatch[0],
                            uaid: uaidMatch[0]
                        };

                        // console.log('Form data:', formData);

                        const ret = await HttpClientfix.post(cancelUrl, querystring.stringify(formData), {
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            maxRedirects: 10
                        });

                        // console.log('Cancel URL response:', ret.data);

                        const returnUrlMatch = ret.data.match(/(?<="recoveryCancel":{"returnUrl":").+?(?=",)/);
                        // console.log('Return URL match:', returnUrlMatch);

                        if (returnUrlMatch) {
                            const returnUrl = returnUrlMatch[0];
                            // console.log('Return URL:', returnUrl);

                            const fin = await HttpClientfix.get(returnUrl, {
                                maxRedirects: 10
                            });

                            const finalRedirectUrl = fin.request?.res?.responseUrl;
                            // console.log('Final redirect URL:', finalRedirectUrl);

                            if (finalRedirectUrl && finalRedirectUrl.includes('#')) {
                                const urlObj = new URL(finalRedirectUrl);
                                const fragment = urlObj.hash.substring(1);
                                const params = querystring.parse(fragment);
                                const token = params.access_token;
                                // console.log('Final token:', token);

                                if (token) return token;
                            }
                        }
                    } else {
                        console.error('Missing form data:', {
                            ipt: iptMatch,
                            pprid: ppridMatch,
                            uaid: uaidMatch
                        });
                    }
                } else {
                    console.error('Cancel URL not found in response text');
                }
            } catch (innerError) {
                console.error("Error in recovery flow:", innerError.message);
            }
        }

        if (typeof responseText === 'string') {
            if (responseText.includes("recover?mkt") || 
                responseText.includes("account.live.com/identity/confirm?mkt") ||
                responseText.includes("Email/Confirm?mkt") ||
                responseText.includes("/Abuse?mkt=")) {
                // console.log('2FA detected or confirmation required');
                return "tfa"
            }

            if (responseText.toLowerCase().includes("password is incorrect") ||
                responseText.toLowerCase().includes("account doesn't exist") ||
                responseText.toLowerCase().includes("sign in to your microsoft account") ||
                responseText.toLowerCase().includes("tried to sign in too many times")) {
                // console.log('Bad credentials detected');
                return "bad"
            }
        }



        return "unknown";
    } catch (error) {
        console.error("Error in get_xbox_rps:", error.message);
        return null;
    }
}

async function mc_token(HttpClientfix, uhs, xsts_token) {
    try {
        const response = await HttpClientfix.post(
            'https://api.minecraftservices.com/authentication/login_with_xbox',
            { identityToken: `XBL3.0 x=${uhs};${xsts_token}` },
            { 
                headers: { 'Content-Type': 'application/json' },
                validateStatus: (status) => status >= 200 && status < 500
            }
        );
        
        if (response.status === 429) {
            // console.log("Rate limited by Minecraft services. Waiting...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await mc_token(HttpClientfix, uhs, xsts_token);
        }
        
        return response.data?.access_token || null;
    } catch (error) {
        console.error("Error getting Minecraft token:", error.message);
        return null;
    }
}

async function passwordAuth(email, password) {
    try {
       // console.log('Password auth is being called!')
        const HttpClientfix = new HttpClient();
        
        const { urlPost, sFTTag } = await get_urlPost_sFTTag(HttpClientfix);
        // console.log('Step 1 complete: Retrieved urlPost and sFTTag');

        const token = await get_xbox_rps(HttpClientfix, email, password, urlPost, sFTTag);
        if (token === "noxbox" || token === "failed" || token === "tfa" || token === "bad" || token === "unknown"){
            // console.log('Step 2 failed: Token is invalid or unknown');
            return token;
        }
        // console.log('Step 2 complete: Microsoft authentication successful');

        const xboxResponse = await HttpClientfix.post(
            'https://user.auth.xboxlive.com/user/authenticate',
            {
                Properties: {
                    AuthMethod: "RPS",
                    SiteName: "user.auth.xboxlive.com",
                    RpsTicket: token
                },
                RelyingParty: "http://auth.xboxlive.com",
                TokenType: "JWT"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const xboxToken = xboxResponse.data?.Token;
        if (!xboxToken) {
            // console.log("Xbox authentication failed");
            return "noxbox"
        }
        // console.log("Xbox authentication successful");

        const uhs = xboxResponse.data?.DisplayClaims?.xui?.[0]?.uhs;
        if (!uhs) {
            // console.log("Failed to get UHS");
            return "failed"
        }

        const xstsResponse = await HttpClientfix.post(
            'https://xsts.auth.xboxlive.com/xsts/authorize',
            {
                Properties: {
                    SandboxId: "RETAIL",
                    UserTokens: [xboxToken]
                },
                RelyingParty: "rp://api.minecraftservices.com/",
                TokenType: "JWT"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const xstsToken = xstsResponse.data?.Token;
        if (!xstsToken) {
            // console.log("XSTS authentication failed");
            return "failed"
        }
        // console.log("XSTS authentication successful");

        const mcToken = await mc_token(HttpClientfix, uhs, xstsToken);
        if (!mcToken) {
            // console.log("Minecraft authentication failed");
            return "nonmc"
        }
        // console.log("Minecraft authentication successful");
        // console.log("Minecraft Token:", mcToken);
        return mcToken;
    } catch (error) {
        console.error("Authentication error:", error.message);
        return null;
    }
}


/*
(async () => {
    const email = "bdkmevnniexgh9m7@outlook.com";
    const password = "gnj5b6waf0d1wjq1";
    const token = await passwordAuth(email, password);
    if (token) {
         console.log('Final Token:', token);
    } else {
        console.log("Authentication failed");
    }
})();
*/

module.exports = { passwordAuth }
