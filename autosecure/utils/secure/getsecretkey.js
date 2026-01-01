module.exports = async function getSecretKey(axios) {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[getsecretkey] Attempt ${attempt}/${maxRetries}`);
            
            const response = await axios.get(
                "https://account.live.com/proofs/Add?mkt=en-gb&apt=2%7c1%7c3&uaid=489c69cebc8e46bdbffc31d0b05eb727&orc=1&rc=1&mpcxt=CatA",
                {
                    timeout: 15000,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-GB,en;q=0.5",
                        "Accept-Encoding": "gzip, deflate, br, zstd",
                        "Referer": "https://account.live.com/proofs/EnableTfa",
                        "Connection": "keep-alive",
                        "Upgrade-Insecure-Requests": "1",
                        "Sec-Fetch-Dest": "document",
                        "Sec-Fetch-Mode": "navigate",
                        "Sec-Fetch-Site": "same-origin",
                        "Sec-Fetch-User": "?1",
                        "Priority": "u=0, i",
                        "TE": "trailers",
                    }
                }
            );

            const htmlData = response.data;
            
            // Early exit if page indicates auth failure
            if (htmlData.includes("Sign in") && htmlData.includes("outlook.com")) {
                console.error(`[getsecretkey] Session likely expired or page redirected`);
                if (attempt < maxRetries) {
                    console.log(`[getsecretkey] Retrying after 2s delay...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                return { secretKey: null, proof: null, rvtkn: null };
            }

            const lines = htmlData.split('\n');

            let secretKey = '';
            let proof = '';
            let rvtkn = '';

            // Extract secret key - try multiple patterns
            let secretKeyLine = lines.find(line => line.includes('Secret key:'));
            if (secretKeyLine) {
                let secretKeyRegex = /<span class="dirltr bold">([^<]+)<\/span>/;
                let match = secretKeyLine.match(secretKeyRegex);
                
                // Fallback regex patterns if first doesn't match
                if (!match || !match[1]) {
                    secretKeyRegex = /<span[^>]*>([A-Z0-9\s]+)<\/span>/;
                    match = secretKeyLine.match(secretKeyRegex);
                }
                
                if (match && match[1]) {
                    secretKey = match[1].replace(/&nbsp;/g, ' ').trim();
                    console.log(`[getsecretkey] Found secretkey: ${secretKey.substring(0, 20)}...`);
                }
            } else {
                // Try to find secret key anywhere in the HTML
                const keyPatterns = [
                    /Secret key[:\s<>]*([A-Z0-9\s]{25,})/i,
                    /securityVerificationKey['\"]?\s*[=:]\s*['\"]?([A-Z0-9\s]{25,})['\"]?/i,
                    /class="[^"]*bold[^"]*">([A-Z0-9\s]{25,})<\/span>/
                ];
                
                for (const pattern of keyPatterns) {
                    const match = htmlData.match(pattern);
                    if (match && match[1]) {
                        secretKey = match[1].replace(/&nbsp;/g, ' ').trim();
                        console.log(`[getsecretkey] Found secretkey via pattern: ${secretKey.substring(0, 20)}...`);
                        break;
                    }
                }
            }

            // Extract proof ID
            const proofLine = lines.find(line => line.includes('name="ProofId"'));
            if (proofLine) {
                let proofRegex = /<input[^>]+id="ProofId"[^>]+value="([^"]+)"/;
                let proofMatch = proofLine.match(proofRegex);
                
                // Fallback: try reverse order
                if (!proofMatch) {
                    proofRegex = /<input[^>]+value="([^"]+)"[^>]+id="ProofId"/;
                    proofMatch = proofLine.match(proofRegex);
                }
                
                if (proofMatch && proofMatch[1]) {
                    proof = proofMatch[1];
                    console.log(`[getsecretkey] Found proof: ${proof.substring(0, 20)}...`);
                }
            }

            // Extract rvtkn
            const rvtknRegex = /rvtkn=([^"&\s;]+)/;
            const rvtknMatch = htmlData.match(rvtknRegex);
            if (rvtknMatch && rvtknMatch[1]) {
                rvtkn = rvtknMatch[1];
                console.log(`[getsecretkey] Found rvtkn: ${rvtkn.substring(0, 20)}...`);
            }

            if (!secretKey || !proof || !rvtkn) {
                console.error(`[getsecretkey] Missing fields - secretKey: ${!!secretKey}, proof: ${!!proof}, rvtkn: ${!!rvtkn}`);
                if (attempt < maxRetries) {
                    console.log(`[getsecretkey] Retrying after 3s delay...`);
                    await new Promise(r => setTimeout(r, 3000));
                    continue;
                }
                // Last attempt - save debug info
                const fs = require('fs');
                const path = require('path');
                const debugDir = path.join(__dirname, '../../../debug/getsecretkey');
                if (!require('fs').existsSync(debugDir)) {
                    require('fs').mkdirSync(debugDir, { recursive: true });
                }
                const debugFile = path.join(debugDir, `failed-${Date.now()}.html`);
                fs.writeFileSync(debugFile, htmlData);
                console.error(`[getsecretkey] Debug HTML saved to ${debugFile}`);
                return { secretKey: null, proof: null, rvtkn: null };
            }

            console.log(`[getsecretkey] ✓ Successfully extracted all fields on attempt ${attempt}`);
            return { secretKey, proof, rvtkn };
            
        } catch (error) {
            console.error(`[getsecretkey] Error on attempt ${attempt}: ${error.message}`);
            if (attempt < maxRetries) {
                console.log(`[getsecretkey] Retrying after 3s delay...`);
                await new Promise(r => setTimeout(r, 3000));
            } else {
                console.error(`[getsecretkey] All retry attempts exhausted`);
                return { secretKey: null, proof: null, rvtkn: null };
            }
        }
    }
    
    return { secretKey: null, proof: null, rvtkn: null };
};
