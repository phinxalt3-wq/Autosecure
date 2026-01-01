const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require("../../../config.json");
const { saveFullConfig } = require("../bot/configutils");
const { codeblock } = require("../process/helpers");
const { text } = require("stream/consumers");

let neededclient;

async function autosecurelogs(client, reason, user, seconduser, botid, blacklistreason, generatetext, botamount) {
    if (!client) {
        client = neededclient;
    }

    if (!client) return;

    const timeout = 30000;
    const start = Date.now();
    while (!client.readyAt) {
        if (Date.now() - start > timeout) {
            console.log(`Client is not ready after 30s, ddos?`);
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const logChannelId = config.log;
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) {
        console.error(`Log channel with ID ${logChannelId} not found.`);
        return;
    }

    let embed;
    const color = 0x5f9ea0;

    if (reason === "config") {
        embed = new EmbedBuilder()
            .setTitle('Autosaved backup config!')
            .setDescription(`Generated config backup for expired user: <@${user}> (\`${user}\`)`)
            .setColor(color);

        try {
            const config = await saveFullConfig(user);
            const buffer = Buffer.from(JSON.stringify(config, null, 2));
            const attachment = new AttachmentBuilder(buffer, { name: `full_config_${user}.json` });

            const message = await logChannel.send({
                embeds: [embed],
                files: [attachment]
            });

            try {
                await message.pin();
            } catch (pinError) {
                console.error(`Failed to pin config backup message for user ${user}:`, pinError);
                const pinErrorEmbed = new EmbedBuilder()
                    .setTitle('Pin Failed')
                    .setDescription(`Could not pin the backup message for <@${user}>`)
                    .setColor(0xFFA500);
                await logChannel.send({ embeds: [pinErrorEmbed] });
            }

        } catch (error) {
            console.error(`Failed to generate or send config backup for user ${user}:`, error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('Config Backup Failed')
                .setDescription(`Failed to generate backup for <@${user}>`)
                .setColor(0xFF0000);
            await logChannel.send({ embeds: [errorEmbed] });
        }
        return;
    }

    if (reason === "transfer") {
        console.log(`Transferring license!`);
        if (botid === "failed") {
            embed = new EmbedBuilder()
                .setTitle(`License transfer failed, fix: ${config.owners[0]}`)
                .setDescription(`<@${user}> (\`${user}\`) > <@${seconduser}> (\`${seconduser}\`).`);
        } else {
            embed = new EmbedBuilder()
                .setTitle('License transfer')
                .setDescription(`<@${user}> (\`${user}\`) > <@${seconduser}> (\`${seconduser}\`).`)
                .addFields(
                    { name: 'Old Key', value: `${botid}` },
                    { name: 'New Key', value: `${blacklistreason}` }
                );
        }
    } else if (reason === "start") {
        embed = new EmbedBuilder()
            .setTitle('New bot started!')
            .setDescription(`<@${user}> (\`${user}\`) has started a new bot.`)
            .addFields({ name: 'Bot ID', value: `${botid}` });
    } else if (reason === "stop") {
        embed = new EmbedBuilder()
            .setTitle('Bot has been stopped!')
            .setDescription(`<@${user}> (\`${user}\`) stopped a bot.`)
            .addFields({ name: 'Bot ID', value: `${botid}` });
    } else if (reason === "guide") {
        embed = new EmbedBuilder()
            .setTitle('Guide Opened')
            .setDescription(`<@${usBoter}> (\`${user}\`) has visited the guide!`);
    } else if (reason === "blacklist") {
        embed = new EmbedBuilder()
            .setTitle('New user blacklisted!')
            .setDescription(`<@${user}> (\`${user}\`) has been blacklisted by <@${seconduser}> (\`${seconduser}\`).`)
            .addFields({ name: 'Reason', value: `${blacklistreason}` });
    } else if (reason === "remove") {
        embed = new EmbedBuilder()
            .setTitle('Access removed!')
            .setDescription(`<@${user}> (\`${user}\`) has been removed access by <@${seconduser}> (\`${seconduser}\`).`)
            .addFields({ name: 'Reason', value: `${blacklistreason}` });
    } else if (reason === "generatelicenses") {
        let [amount, duration] = generatetext.split('|');
        embed = new EmbedBuilder()
            .setTitle('New license keys!')
            .setDescription(`<@${user}> (\`${user}\`) has generated new Autosecure licenses.`)
            .addFields(
                { name: 'Amount', value: `${amount}`, inline: true },
                { name: "Duration", value: `${duration}d`, inline: true }
            );
    } else if (reason === "extendlicenses") {
        let [extAmount, extDuration] = generatetext.split('|');
        embed = new EmbedBuilder()
            .setTitle('All Licenses extended!')
            .setDescription(`<@${user}> (\`${user}\`) extended all licenses!`)
            .addFields(
                { name: 'Amount affected', value: `${extAmount}`, inline: true },
                { name: "Duration", value: `${extDuration}d`, inline: true }
            );
    } else if (reason === "unblacklist") {
        embed = new EmbedBuilder()
            .setTitle('Blacklist removed!')
            .setDescription(`<@${user}> (\`${user}\`) has been unblacklisted by <@${seconduser}> (\`${seconduser}\`).`);
    } else if (reason === "deletelicense") {
        embed = new EmbedBuilder()
            .setTitle('License key deleted!')
            .setDescription(`<@${user}> (\`${user}\`) has deleted key \`${generatetext}\`.`);
    } else if (reason === "deletealllicenses") {
        embed = new EmbedBuilder()
            .setTitle('All License Keys deleted!')
            .setDescription(`<@${user}> (\`${user}\`) has deleted all keys!`);
    } else if (reason === "trial") {
        embed = new EmbedBuilder()
            .setTitle('New trial')
            .setDescription(`<@${user}> (\`${user}\`) has claimed a trial!`)
            .addFields({ name: 'Expires', value: `<t:${generatetext}:R>` });
    } else if (reason === "issue") {
        embed = new EmbedBuilder()
            .setTitle(`<@${user}> (\`${user}\`) has encountered the recovery issue!`)
            .setDescription(`\`\`\`${generatetext}\`\`\``);
    } else if (reason === "redeem") {
        embed = new EmbedBuilder()
            .setTitle('New license claimed!')
            .setDescription(`${generatetext}`);
    } else if (reason === "redeemslot") {
    let keytext = codeblock(user)
    let slotstext = codeblock(botid)
    embed = new EmbedBuilder()
        .setTitle('New extra bot key claimed!')
        .addFields(
            {
                name: 'Key',
                value: `${keytext}`,
                inline: true
            },
            {
                name: 'User',
                value: `<@${seconduser}> (\`${seconduser}\`)`,
                inline: true
            },
            {
                name: 'Updated slots',
                value: `${slotstext}`,
                inline: true   
            }
        )
}
    else if (reason === "initialize") {
        embed = new EmbedBuilder()
            .setTitle(`Initialized ${botamount} bots!`)
            .addFields({ name: 'Time', value: `\`\`\`${generatetext}s\`\`\`` });
    } else if (reason === "startbots") {
        embed = new EmbedBuilder()
            .setTitle('Starting Autosecure...')
            .setDescription(`<@${user}> (\`${user}\`) has been started as the main Autosecure bot.`)
            .setFooter({ text: "If it goes down, blame Phinxz!" });
    } else if (reason === "secure") {
        embed = new EmbedBuilder()
            .setTitle('New secure')
            .setDescription(`<@${user}> (\`${user}\`) has secured a new account!`)
            .addFields({ name: 'UID', value: `\`\`\`${generatetext}\`\`\`` });
    } else if (reason === "refreshkey") {
        embed = new EmbedBuilder()
            .setTitle("Refreshing Key!")
            .setTimestamp();
    } else if (reason === "newkey") {
    let text = codeblock(user);
    const converted = `<t:${Math.floor(seconduser / 1000)}:R>`;

    embed = new EmbedBuilder()
        .setTitle("Generated new Hypixel API-Key")
        .addFields(
            { name: `Key`, value: text },
            { name: `Expiration`, value: converted }
        )
        .setTimestamp();
} else if (reason === "indian"){
                let text = codeblock(seconduser)
                let text2 = codeblock(botid)
        embed = new EmbedBuilder()
        .setTitle("New indian!")
        .setDescription(`<@${user}> (\`${user}\`)`)
        .addFields(
            { name: `Flagged message`, value: text },
            { name: `Action taken`, value: text2 }
        )
    }   else {
        console.log(`not found within logs: ${reason}`);
        return;
    }

    embed.setColor(color);

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to send autosecure log:', error);
    }
}

async function initializelogs(discordClient) {
    neededclient = discordClient;
    console.log(`Initiailized LOGS`)
}

module.exports = {
    autosecurelogs,
    initializelogs
}
