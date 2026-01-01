const { quarantineMap } = require('./quarantineMap');
const { queryParams } = require("../../db/database");
const { EmbedBuilder } = require('discord.js');
const sleep = require("../utils/sleep");
const getProfile = require("../../autosecure/utils/minecraft/profile");

/** 
* Generate random ID for quarantines
*/
function generate(length = 7) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Add a session to quarantine
 */
async function addquarantine(userid, ssid, profile, delay, reason = null) {
    if (reason) {
        console.log(reason);
    }

    if (delay) {
        await sleep(Number(delay));
    }

    if (!profile) {
        profile = await getProfile(ssid);
    }

    try {
        let randomid = generate();
        let quarantineData = {
            username: profile.name,
            uuid: profile.uuid,
            ssid: ssid
        };

        const d = `${randomid}|${userid}`;
        quarantineMap.set(d, quarantineData);

        const time = Date.now().toString();
        await queryParams(
            `INSERT INTO quarantine (id, user_id, ssid, uuid, name, time) VALUES (?, ?, ?, ?, ?, ?)`,
            [d, userid, ssid, profile.uuid, profile.name, time]
        );

        const { startBot } = require('./quarantinehandler');
        await startBot(d, quarantineData);

        console.log(`Added quarantine for ${profile.name} (${userid}) with ID ${randomid}`);
        return d;
    } catch (err) {
        console.error("Error adding quarantine:", err);
        throw err;
    }
}



async function removequarantine(d, reason) {
    try {
        const quarantineData = quarantineMap.get(d);
        console.log(`quarantinedata: ${quarantineData}`)
        quarantineMap.delete(d);
        

        const { stopBotById } = require('./quarantinehandler');
        stopBotById(d);
       
        let [id, userid] = d.split('|');
        await queryParams(
            `DELETE FROM quarantine WHERE id = ?`,
            [d]
        );

        const { client } = require("../controllerbot");
       
        try {
            const user = await client.users.fetch(userid);
            if (user) {
                const embed = new EmbedBuilder()
                    .setTitle("Quarantine Ended")
                    .setDescription(`Your quarantine for **${quarantineData?.username ?? 'Unknown'}** (\`${id}\`) has been stopped.`)
                    .addFields({ name: "Reason", value: `\`\`\`\n${reason}\n\`\`\`` })
                    .setColor(0xADD8E6)
                await user.send({ embeds: [embed] });
                console.log(`Sent quarantine end notification to user ${userid}`);
            }
        } catch (err) {
            console.error(`Failed to DM user ${userid}:`, err);
        }
       
        console.log(`Removed quarantine ${id} for user ${userid}. Reason: ${reason}`);
        return quarantineData;
    } catch (err) {
        console.error(`Error removing quarantine ${d}:`, err);
        throw err;
    }
}

/**
 * Get a random proxy for a user
 */
async function getproxy(userid) {
    try {
        let proxiesrow = await queryParams(`SELECT proxy FROM proxies WHERE user_id = ?`, [userid]);
        if (!proxiesrow || proxiesrow.length === 0) {
            console.log(`No proxies found for user ${userid}`);
            return null;
        }
       
        let random = Math.floor(Math.random() * proxiesrow.length);
        console.log(`Selected proxy ${random + 1}/${proxiesrow.length} for user ${userid}`);
        return proxiesrow[random].proxy;
    } catch (err) {
        console.error(`Error fetching proxy for user ${userid}:`, err);
        return null;
    }
}

module.exports = {
    getproxy,
    addquarantine,
    removequarantine,
    generate
};