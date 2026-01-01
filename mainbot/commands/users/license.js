const { queryParams } = require("../../../db/database");
const hasAccess = require("../../../db/access");
const { discordServer, footer1 } = require("../../../config.json");
const isOwner = require("../../../db/isOwner");

module.exports = {
    name: "license",
    userOnly: true,
    description: "Access your license",
    options: [
        {
            name: "user_id",
            description: "View license info for a user (Owner only)",
            type: 3,
            required: false
        }
    ],
    callback: async (client, interaction) => {
        try {
            let entered = await interaction.options.getString("user_id");
            if (!entered || !await isOwner(interaction.user.id)) {
                await interaction.deferReply({ ephemeral: true });
                const userId = interaction.user.id;
                const access = await hasAccess(userId);
                if (access === false) {
                    return await interaction.editReply({
                        content: `You don't own a license! Join ${discordServer} to purchase one!`
                    });
                }
                const info = await queryParams(`SELECT * FROM usedLicenses WHERE user_id=?`, [userId]);
                if (!info || info.length === 0) {
                    if (await isOwner(userId)) {
                        return await interaction.editReply({
                            content: "You have access but not a license since you're the owner!"
                        });
                    } else {
                        return await interaction.editReply({
                            content: "You have access but your license couldn't be found!"
                        });
                    }
                }
                let d = await queryParams(`SELECT * FROM slots WHERE user_id=?`, [userId]);
                let botcounts = d[0].slots;
                const expiryEpoch = Math.floor(info[0].expiry / 1000);
                const discordTimestamp = `<t:${expiryEpoch}:R>`;
                const info2 = await queryParams(`SELECT * FROM leaderboard WHERE user_id=?`, [userId]);
                let amountSecured = 0;
                let networthValue = 0;
                if (info2 && info2.length > 0) {
                    amountSecured = info2[0].amount;
                    networthValue = info2[0].networth;
                }
                const embed = {
                    title: `License Information`,
                    color: 0x808080,
                    fields: [
                        {
                            name: "Product",
                            value: !info[0].istrial ? "Autosecure Monthly" : "Autosecure Trial",
                            inline: true
                        },
                        {
                            name: "Bot Slots",
                            value: String(botcounts),
                            inline: true
                        },
                        {
                            name: "Key Redeemed",
                            value: info[0].license,
                            inline: true
                        },
                        {
                            name: "Expires",
                            value: discordTimestamp,
                            inline: true
                        },
                        {
                            name: "Accounts secured",
                            value: String(amountSecured),
                            inline: true
                        },
                        {
                            name: "Networth",
                            value: String(networthValue),
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: footer1
                    }
                };
                await interaction.editReply({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                await interaction.deferReply({ ephemeral: true });
                let targetUserId = entered;
                let access = await hasAccess(targetUserId);
                if (access === false) {
                    const licenseCheck = await queryParams(`SELECT * FROM usedLicenses WHERE license = ?`, [entered]);
                    if (!licenseCheck || licenseCheck.length === 0) {
                        return await interaction.editReply({
                            content: "This license hasn't been redeemed or this user doesn't have access!"
                        });
                    }
                    targetUserId = licenseCheck[0].user_id;
                    access = true;
                }
                const info = await queryParams(`SELECT * FROM usedLicenses WHERE user_id=?`, [targetUserId]);
                if (!info || info.length === 0) {
                    if (await isOwner(targetUserId)) {
                        return await interaction.editReply({
                            content: "This user has access but not a license (Owner account)."
                        });
                    } else {
                        return await interaction.editReply({
                            content: "This user's license couldn't be found!"
                        });
                    }
                }
                let d = await queryParams(`SELECT * FROM slots WHERE user_id=?`, [targetUserId]);
                let botcounts = d[0].slots;
                const expiryEpoch = Math.floor(info[0].expiry / 1000);
                const discordTimestamp = `<t:${expiryEpoch}:R>`;
                const info2 = await queryParams(`SELECT * FROM leaderboard WHERE user_id=?`, [targetUserId]);
                let amountSecured = 0;
                let networthValue = 0;
                if (info2 && info2.length > 0) {
                    amountSecured = info2[0].amount;
                    networthValue = info2[0].networth;
                }
                const embed = {
                    title: `License Information (Admin View)`,
                    color: 0x808080,
                    fields: [
                        {
                            name: "Product",
                            value: !info[0].istrial ? "Autosecure Monthly" : "Autosecure Trial",
                            inline: true
                        },
                        {
                            name: "Bot Slots",
                            value: String(botcounts),
                            inline: true
                        },
                        {
                            name: "Key Redeemed",
                            value: info[0].license,
                            inline: true
                        },
                        {
                            name: "Expires",
                            value: discordTimestamp,
                            inline: true
                        },
                        {
                            name: "Accounts secured",
                            value: String(amountSecured),
                            inline: true
                        },
                        {
                            name: "Networth",
                            value: String(networthValue),
                            inline: true
                        },
                        {
                            name: "User",
                            value: `<@${targetUserId}> (${targetUserId})`,
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: footer1
                    }
                };
                await interaction.editReply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("Error in license command:", error);
            await interaction.editReply({
                content: "An error occurred while retrieving your license. Please try again later."
            });
        }
    }
};
