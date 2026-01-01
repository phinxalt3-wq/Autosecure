const { queryParams } = require("../../../db/database");
const { EmbedBuilder, Client, GatewayIntentBits } = require("discord.js");
const { autosecureMap } = require("../../handlers/botHandler");
const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const autosecure = require("../../../autosecure/autosecure");
const checkToken = require("../../../autosecure/utils/utils/checkToken");
const { owners } = require("../../../config.json");
const showbotmsg = require("../../../autosecure/utils/bot/showbotmsg");
const { getUserBotNumbers } = require("../../../autosecure/utils/bot/configutils");
const { getBotIdFromToken, codeblock } = require("../../../autosecure/utils/process/helpers");

module.exports = {
    name: "handlenewbot",
    userOnly: true,
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const [t, userid, botnumber] = interaction.customId.split('|');
        const token = interaction.components[0].components[0].value;

        let checked = await checkToken(token);
        if (!checked) {
            return await interaction.editReply({ content: `Invalid token! To retry: /bots` });
        }

        let intents = await checkPrivilegedIntents(token);
        if (!intents) {
            return await interaction.editReply({
                content: `Please enable all 3 Privileged Gateway Intents inside your bot's menu > bot > intents, then retry using /bots!`
            });
        }

        let botid = getBotIdFromToken(token);
    //    console.log(`Bot id: ${botid}`)

        let botnumbers = await getUserBotNumbers(interaction.user.id);

for (const existingBotNumber of botnumbers) {
    const botKey = `${userid}|${existingBotNumber}`;
    if (autosecureMap.has(botKey)) {
        const existingClient = autosecureMap.get(botKey);
        if (existingClient && existingClient.user && existingClient.user.id === botid) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`This bot is already running`)
                        .setDescription(`<@${botid}> (\`${botid}\`)`)
                        .addFields(
                            {
                                name: `Token`,
                                value: codeblock(token)
                            },
                            {
                                name: `Bot name`,
                                value: codeblock(`${existingBotNumber} | ${existingClient.user.username}`)
                            }
                        )
                        .setColor(0xADD8E6)
                ]
            });
        }
    }
}


        try {
            const botKey = `${userid}|${botnumber}`;
            const isBotRunning = autosecureMap.has(botKey);

            if (isBotRunning) {
                return await interaction.editReply({
                    content: `Your bot is already running. Please run /bots again to manage it.`
                });
            }

            let as = await autosecure(token, interaction.user.id, botnumber);

            if (as) {
                autosecureMap.set(botKey, as);
                autosecurelogs(client, "start", interaction.user.id, null, as.user.id);

                const bots = await queryParams(
                    `SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?`,
                    [userid, botnumber]
                );

                const now = Math.floor(Date.now() / 1000);
                if (!bots || bots.length === 0) {
                    await queryParams(
                        `INSERT INTO autosecure (user_id, botnumber, token, creationdate) VALUES (?, ?, ?, ?)`,
                        [userid, botnumber, token, now]
                    );
                } else {
                    await queryParams(
                        `UPDATE autosecure SET token = ?, creationdate = ? WHERE user_id = ? AND botnumber = ?`,
                        [token, now, userid, botnumber]
                    );
                }

                const inviteLink = `https://discord.com/oauth2/authorize?client_id=${as.user.id}&permissions=8&scope=bot+applications.commands`;

                const embed = new EmbedBuilder()
                    .setColor(0xADD8E6)
                    .setTitle("Created bot!")
                    .setDescription(`Bot has been setup and will start running soon! [Click to Invite](${inviteLink})`);

                await interaction.editReply({ embeds: [embed] });

                let msg = await showbotmsg(interaction.user.id, botnumber, interaction.user.id, client);
                await interaction.followUp(msg);
            } else {
                console.log(`[x] Bot couldn't start running`);
                return await interaction.editReply({ content: `DM <@${owners[0]}>` });
            }
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `Unexpected error has occurred` });
        }
    }
};

async function checkPrivilegedIntents(token) {
    try {
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.MessageContent
            ]
        });

        await client.login(token);
        await client.destroy();
        return true;
    } catch {
        return false;
    }
}
