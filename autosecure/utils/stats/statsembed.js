const getembedautosec = require("../responses/getembedsautosec");
const { EmbedBuilder } = require("discord.js");

async function statsembed(client, acc, interaction) {
    const raw = await getembedautosec(client, "statsmsg", acc, interaction);

    let embed = raw;

    if (raw && Array.isArray(raw.fields) && raw.fields.length > 0) {
        console.log(`Embed worked!`);
        
        // Add visage thumbnail if we have a Minecraft username
        if (acc.newName && acc.newName !== "No Minecraft!") {
            const encodedName = encodeURIComponent(acc.newName);
            embed.thumbnail = {
                url: `https://visage.surgeplay.com/bust/${encodedName}.png?y=-40&quality=lossless`
            };
        }
    } else {
        embed = new EmbedBuilder()
            .setTitle("Stats Overview")
            .setDescription("None found")
            .setColor(11716576);
            
        // Add visage thumbnail even for the fallback embed if we have a username
        if (acc.newName && acc.newName !== "No Minecraft!") {
            const encodedName = encodeURIComponent(acc.newName);
            embed.setThumbnail(`https://visage.surgeplay.com/bust/${encodedName}.png?y=-40&quality=lossless`);
        }
    }

    return { embeds: [embed] };
}

module.exports = statsembed;
