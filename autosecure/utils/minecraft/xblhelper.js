function extractValues(html) {
    let verifyUrl = null;
    let uaid = null;
    let pprid = null;
    let ipt = null;
    let reason = null;

    try {
        const actionMatch = html.match(/action="([^"]+)"/);
        if (actionMatch && actionMatch[1]) {
            verifyUrl = actionMatch[1];
        }
    } catch (error) {
        console.error("Method 1 failed");
    }

    if (!verifyUrl) {
        try {
            const urlRegex = /(https:\/\/[^"]+verify\?[^"]*)/i;
            const urlMatch = html.match(urlRegex);
            if (urlMatch && urlMatch[1]) {
                verifyUrl = urlMatch[1];
            }
        } catch (error) {
            console.error("Method 2 failed");
        }
    }

    const htmlLower = html.toLowerCase();

    if (htmlLower.includes('recoveraccount')) {
        reason = 'closedaccount';
    } else if (htmlLower.includes('verify')) {
        reason = 'verify';
    }

    const uaidMatch = html.match(/name="uaid"[^>]+value="([^"]+)"/);
    if (uaidMatch && uaidMatch[1]) uaid = uaidMatch[1];

    const ppridMatch = html.match(/name="pprid"[^>]+value="([^"]+)"/);
    if (ppridMatch && ppridMatch[1]) pprid = ppridMatch[1];

    const iptMatch = html.match(/name="ipt"[^>]+value="([^"]+)"/);
    if (iptMatch && iptMatch[1]) ipt = iptMatch[1];

    if (!reason) {
        console.log(`NEW XBL ISSUE: ${html}`);
    }

    return { verifyUrl, uaid, pprid, ipt, reason };
}

function extractSecondLink(html) {
    const primaryRegex = /<form[^>]*id="frmVerifyProof"[^>]*action="([^"]+)"[^>]*>[\s\S]*?<div[^>]*id="iSendCode"/i;
    const fallbackRegex = /https:\/\/[^"' >]+\/Verify\?[^"' >]*/i;

    const primaryMatch = html.match(primaryRegex);
    if (primaryMatch) return primaryMatch[1];

    const fallbackMatch = html.match(fallbackRegex);
    if (fallbackMatch) return fallbackMatch[0];

    return null;
}

function proofValue(htmlContent) {
    const proofValue = htmlContent.match(/<input[^>]+name=["']proof["'][^>]+value=["']OTT\|\|([^"']+)["']/)?.[1] 
        || htmlContent.match(/<input[^>]+name=["']proof["'][^>]+value=["']([^"']+\|\|[^"']+\|\|[^"']+\|\|[^"']+)["']/)?.[1] 
        || htmlContent.match(/<input[^>]+name=["']proof["'][^>]+value=["']([^"']+)["']/)?.[1] 
        || null;

    return proofValue;
}

async function handlegenericissue(reason, axios, verifyUrl, pprid, ipt, uaid) {
    console.log(`${reason}`);
    try {
        const verify = await axios.post(
            verifyUrl,
            `pprid=${pprid}&ipt=${ipt}&uaid=${uaid}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const amsc = axios.getCookie("amsc");
        const iptCookie = axios.getCookie("ipt");

        if (amsc && iptCookie) {
            console.log(`Have both cookies!`);
        }

        console.log(`received data: ${verify.data}`);
    } catch (err) {
        console.log(`Error handling generic issue: ${err.message}`);
    }
}

async function xblhelper(axios) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`At xbl helper! Attempt: ${attempt}`);

        try {
            const loginRedirect = await axios.get(`https://sisu.xboxlive.com/connect/XboxLive/?state=login&cobrandId=8058f65d-ce06-4c30-9559-473c9275a65d&tid=896928775&ru=https://www.minecraft.net/en-us/login&aid=1142970254`);
            if (!loginRedirect.headers.location) continue;

            const accessTokenRedirect = await axios.get(loginRedirect.headers.location);
            const { verifyUrl, uaid, pprid, ipt, reason } = extractValues(accessTokenRedirect.data);

            if (reason === "closedaccount") {
                console.log("Closed account");
                return { success: false };
            }

            if (!verifyUrl || !uaid || !pprid || !ipt) {
                console.log("Missing form fields");
                console.log(`maybe already in?`);
                console.log(accessTokenRedirect.data);
                return { success: true };
            }

            console.log(`Got first link ${verifyUrl}`);

            if (verifyUrl.includes("/remind")) {
                console.log(`Includes new remind issue!`);
                await handlegenericissue(reason, axios, verifyUrl, pprid, ipt, uaid);
                return { success: true };
            }

            const getamsc = await axios.post(
                verifyUrl,
                `pprid=${pprid}&ipt=${ipt}&uaid=${uaid}`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const verifycanary = getamsc?.data?.match(/<input[^>]+name=["']canary["'][^>]+value=["']([^"']+)["']/)?.[1]
                || decodeURIComponent(getamsc?.data?.match(/"sCanary":"([^"]*)"/)?.[1] || "");

            const newlink = extractSecondLink(getamsc.data);
            let proofoption = proofValue(getamsc?.data);
            console.log(`Got proofoption: ${proofoption}`);
            if (!newlink || !verifycanary || !proofoption) continue;

            console.log(`Got new link: ${newlink}`);
            console.log(`Got verifycanary: ${verifycanary}`);

            const newreqdata = `iProofOptions=${proofoption}&iOttText=&action=Skip&canary=${verifycanary}`;

            const newreq = await axios.post(
                newlink,
                newreqdata,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            console.log(newreq.data);

            if (newreq.status >= 300 && newreq.status < 400) {
                console.log(`redirect`);
                continue;
            }

            console.log("Got through!");
            return { success: true };

        } catch (err) {
            console.log(`error xblhelper, attempt: ${attempt}: ${err.message}`);
            return { success: false };
        }
    }

    console.error("Max retries");
    return { success: false };
}

module.exports = {
    xblhelper
};
