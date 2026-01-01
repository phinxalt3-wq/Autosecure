const generate = require("../../generate")
const fs = require("fs")
const path = require("path")
const cheerio = require('cheerio')
const { getRandomUserAgent } = require("../userAgentRotator")

/**
 * 
 * Split to getT and add checks
 * @param {*} axios - HTTP client
 * @param {Object} context - Optional context with apiCanary and telemetryContext
 */
module.exports = async (axios, context = {}) => {
    const maxRetries = 3;
    let lastError = null;
    const { apiCanary = null, telemetryContext = null } = context;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AMRP] Attempt ${attempt}/${maxRetries}`);
            
            const amrpHeaders = {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            };
            if (apiCanary) {
                amrpHeaders['Canary'] = apiCanary;
                amrpHeaders['canary'] = apiCanary;
            }
            if (telemetryContext) {
                amrpHeaders['TelemetryContext'] = telemetryContext;
                amrpHeaders['telemetrycontext'] = telemetryContext;
            }
            
            const amrpTRequest = await axios.get(
                `https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=21&ct=1708978285&rver=7.5.2156.0&wp=SA_20MIN&wreply=https://account.live.com/proofs/Add?apt=2&uaid=0637740e739c48f6bf118445d579a786&lc=1033&id=38936&mkt=en-US&uaid=0637740e739c48f6bf118445d579a786`,
                {
                    timeout: 10000,
                    headers: amrpHeaders
                }
            );

            // Prefer parsing with cheerio to handle varying HTML structures
            let amrpt = null;
            try {
                const $ = cheerio.load(amrpTRequest.data);
                amrpt = $("input[name='t']").attr('value') || $("input#t").attr('value') || $("input[name=\"t\"]").val();
            } catch (e) {
                amrpt = null;
            }

            // Fallback: permissive regex search for t value in the HTML or scripts
            if (!amrpt) {
                const regex = /name=["']?t["']?[^>]*value=["']([^"']+)["']/i;
                const m = amrpTRequest.data.match(regex);
                if (m && m[1]) amrpt = m[1];
            }

            if (amrpt) {
                console.log(`[AMRP] Got T token, posting...`);
                
                const postHeaders = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
                if (apiCanary) {
                    postHeaders['Canary'] = apiCanary;
                    postHeaders['canary'] = apiCanary;
                }
                if (telemetryContext) {
                    postHeaders['TelemetryContext'] = telemetryContext;
                    postHeaders['telemetrycontext'] = telemetryContext;
                }
                
                const postResponse = await axios.post(`https://account.live.com/proofs/Add?apt=2&wa=wsignin1.0`, `t=${amrpt}`, {
                    timeout: 10000,
                    headers: postHeaders
                });

                const amrp = axios.getCookie("AMRPSSecAuth");
                if (amrp) {
                    console.log(`[AMRP] ✓ Got AMRP cookie`);
                    return true;
                } else {
                    lastError = "Got T token but no AMRPSSecAuth cookie in response";
                    console.log(`[AMRP] ${lastError}`)
                    if (attempt < maxRetries) {
                        await new Promise(r => setTimeout(r, 1000 * attempt));
                        continue;
                    }
                    return false;
                }
            } else {
                lastError = "Failed to extract T token from response";
                console.log(`[AMRP] ${lastError}`);
                
                const dirPath = path.join(__dirname, "../../../../debug/amrpt")
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true })
                }
                const filePath = path.join(dirPath, `${generate(16)}.html`)
                fs.writeFileSync(filePath, amrpTRequest.data, "utf-8")
                
                if (attempt < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                    continue;
                }
                return false;
            }
        } catch (error) {
            lastError = error.message;
            console.error(`[AMRP] Request failed on attempt ${attempt}: ${error.message}`);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            return false;
        }
    }
    
    console.error(`[AMRP] Failed after ${maxRetries} attempts. Last error: ${lastError}`);
    return false;
}
