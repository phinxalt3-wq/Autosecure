const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const { indianMap } = require("../../../autosecure/utils/process/helpers");
const { owners } = require("../../../config.json");
const config = require("../../../config.json");
const roleofbuyer = config.roleid;

module.exports = async (client, event) => {
    const msg = event.content;
    const userid = event.author.id;

   // console.log(`Incoming msg: ${msg}`);

    const isOwner = owners.includes(userid);
    const isDevMode = config.novps === true || config.novps === "true";
    // console.log(`isOwner: ${isOwner}, isdev: ${isDevMode}`);

    if (msg && isbannedword(msg)) {
        if (isDevMode || (!isDevMode && !isOwner)) {
            const channel = await client.channels.fetch(event.channelId);
            if (channel) {
                try {
                    const message = await channel.messages.fetch(event.id);
                    if (message) await message.delete();
                } catch (err) {}

                let numberofoffends = indianMap.get(userid) || 0;
                numberofoffends++;
                indianMap.set(userid, numberofoffends);

                let member = null;
                try {
                    const guild = await client.guilds.fetch(config.guildid);
                    // console.log(`Guild: ${JSON.stringify(guild)}`)
                    member = await guild.members.fetch(userid);
                } catch {}

                const isBuyer = member ? member.roles.cache.has(roleofbuyer) : false;
                let actiontaken = "Warning issued";

                if (!member){
                    // console.log(`Couldn't find member!`)
                }

                if (numberofoffends === 2) {
                    if (isBuyer) {
                        actiontaken = '6h timeout (buyer)';
                        if (member) {
                            try {
                                await member.timeout(6 * 60 * 60 * 1000, "Indian detection - 3 offenses - Buyer timeout");
                            } catch (err) {
                                // console.log("Failed to timeout buyer (3 offenses):", err.message);
                            }
                        }
                    } else {
                        actiontaken = '24h timeout (non-buyer)';
                        if (member) {
                            try {
                                await member.timeout(24 * 60 * 60 * 1000, "Indian detection - 3 offenses - Non-buyer timeout");
                            } catch (err) {
                                // console.log("Failed to timeout non-buyer (3 offenses):", err.message);
                            }
                        }
                    }
                } else if (numberofoffends >= 4) {
                    if (isBuyer) {
                        actiontaken = '12h timeout (buyer)';
                        if (member) {
                            try {
                                await member.timeout(12 * 60 * 60 * 1000, "Indian detection - 5+ offenses - Buyer mute");
                            } catch (err) {
                                // console.log("Failed to timeout buyer (5+ offenses):", err.message);
                            }
                        }
                    } else {
                        actiontaken = '7d timeout (non-buyer';
                        if (member) {
                            try {
                                await member.timeout(7 * 24 * 60 * 60 * 1000, "Indian detection - 5+ offenses - Non-buyer mute");
                            } catch (err) {
                                // console.log("Failed to timeout non-buyer (5+ offenses):", err.message);
                            }
                        }
                    }
                }

                // console.log(`action: ${actiontaken}`);

                await autosecurelogs(null, "indian", userid, msg, actiontaken);
                await channel.send({
                    content: `[Indian detection] <@${userid}> You cannot send that message. If you keep doing this, you will be punished.`,
                    allowedMentions: { users: [userid] }
                });
            }
            return;
        }
    }

    if (!isOwner) return;

    const args = msg.trim().split(/\s+/);
    const cmd = args.shift();

    // Adds command later if needed

};

function isbannedword(msg) {
    const banned = [
        "buying mfa", "selling mfa", "buying non", "selling non",
        "someone buying", "someone selling", "lf mfas", "lf mfas seller",
        "buying all ur mfa", "sell me", "selling ", "nons 4$", "buying ", "lf ratters"
    ];
    const lower = msg.toLowerCase();
    return banned.some(phrase => lower.includes(phrase));
}
