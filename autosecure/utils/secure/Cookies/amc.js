const generate = require("../../generate")
const fs = require("fs")
const path = require("path")
const cheerio = require('cheerio')
const { getRandomUserAgent } = require("../userAgentRotator")

/**
 * 
 * @param {HttpClient} axios 
 * @param {Object} context - Optional context with apiCanary and telemetryContext
 */
module.exports = async (axios, context = {}) => {
    const maxRetries = 3;
    let lastError = null;
    const { apiCanary = null, telemetryContext = null } = context;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
        console.log(`[AMC] Attempt ${attempt}/${maxRetries}`);
        let amct = null;
        
        const amcHeaders = {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        };
        if (apiCanary) {
            amcHeaders['Canary'] = apiCanary;
            amcHeaders['canary'] = apiCanary;
        }
        if (telemetryContext) {
            amcHeaders['TelemetryContext'] = telemetryContext;
            amcHeaders['telemetrycontext'] = telemetryContext;
        }
        
        let fetchtreq = await axios.get('https://login.live.com/login.srf?wa=wsignin1.0&rpsnv=170&checkda=1&rver=7.5.2112.0&wp=MBI_SSL&wreply=https:%2F%2Faccount.microsoft.com%2Fauth%2Fcomplete-silent-signin%3Fru%3Dhttps%3A%2F%2Faccount.microsoft.com%2F%3Flang%3Dfr-FR%26refd%3Daccount.live.com%26refp%3Dlanding%26mkt%3DFR-FR&lc=1036&id=292666', {
            timeout: 10000,
            headers: amcHeaders
        })

        // Try parsing HTML with cheerio first
        let match = null;
        try {
            const $ = cheerio.load(fetchtreq.data);
            const val = $("input[name='t']").attr('value') || $("input#t").attr('value');
            if (val) match = [null, val];
        } catch (e) {
            match = null;
        }

        // Fallback to permissive regex
        if (!match) {
            match = fetchtreq.data.match(/<input\s+type="hidden"\s+name="t"\s+id="t"\s+value="([^"]+)"\s*\/?>/i)
            if (!match) {
                const regex = /name=["']?t["']?[^>]*value=["']([^"']+)["']/i;
                const m = fetchtreq.data.match(regex);
                if (m) match = [null, m[1]];
            }
        }

        // Debug directory setup
        const debugBaseDir = path.join(__dirname, "../../../../debug/amc")
        if (!fs.existsSync(debugBaseDir)) {
            fs.mkdirSync(debugBaseDir, { recursive: true })
        }

        if (!match || !match[1]) {
            // Failed to get T parameter
            lastError = "Failed to extract T token from response";
            console.log(`[AMC] ${lastError}`);
            const fileName = `failedamct-${generate(16)}.txt`
            const filePath = path.join(debugBaseDir, fileName)
            fs.writeFileSync(filePath, fetchtreq.data, "utf-8")
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            return false
        }

        amct = match[1]

        const url = "https://account.microsoft.com/auth/complete-silent-signin?ru=https://account.microsoft.com/?lang=nl-NL&refd=account.live.com&refp=landing&mkt=NL-NL&wa=wsignin1.0"
        const data = `t=${encodeURIComponent(amct)}`

        const postHeaders = {
            "Cache-Control": "max-age=0",
            "Sec-Ch-Ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\"",
            "Origin": "https://login.live.com",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": getRandomUserAgent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Referer": "https://login.live.com/",
        };
        if (apiCanary) {
            postHeaders['Canary'] = apiCanary;
            postHeaders['canary'] = apiCanary;
        }
        if (telemetryContext) {
            postHeaders['TelemetryContext'] = telemetryContext;
            postHeaders['telemetrycontext'] = telemetryContext;
        }

        const response = await axios.post(url, data, {
            headers: postHeaders,
            maxRedirects: 0,
            timeout: 10000,
            validateStatus: (status) => status === 302 || status === 200
        })

        const amcAuthCookie = axios.getCookie("AMCSecAuth")
        if (amcAuthCookie) {
            console.log(`[AMC] ✓ Got AMC cookie`);
            return true
        } else {
            // Failed to get AMC cookie but has T parameter
            lastError = "Got T token but no AMCSecAuth cookie in response";
            console.log(`[AMC] ${lastError}`);
            const folderName = `failedamc-${generate(16)}`
            const folderPath = path.join(debugBaseDir, folderName)
            fs.mkdirSync(folderPath)

            // Write AMC cookie data
            const amcFileName = `failedamc.amc-${generate(16)}.txt`
            const amcFilePath = path.join(folderPath, amcFileName)
            const amcData = {
                cookies: axios.getCookies(),
                headers: response.headers,
                status: response.status
            }
            fs.writeFileSync(amcFilePath, JSON.stringify(amcData, null, 2), "utf-8")

            // Write T parameter data
            const tFileName = `failedamc.t-${generate(16)}.txt`
            const tFilePath = path.join(folderPath, tFileName)
            fs.writeFileSync(tFilePath, fetchtreq.data, "utf-8")

            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
                continue;
            }
            return false
        }
    } catch (e) {
        lastError = e.message;
        console.error(`[AMC] Request failed on attempt ${attempt}: ${e.message}`);
        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
        }
        return false
    }
    }

    console.error(`[AMC] Failed after ${maxRetries} attempts. Last error: ${lastError}`);
    return false;
}