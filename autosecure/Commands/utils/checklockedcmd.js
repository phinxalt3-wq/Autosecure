const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const checklockedmsg = require('../../../autosecure/utils/bancheckappeal/checklockedmsg');

module.exports = {
    name: "check",
    description: 'Check if an account is locked on Microsoft by email',
    enabled: true,
    options: [
        {
            name: "locked",
            description: "Check account status (if it's locked) by email",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "email",
                    description: "Email to check account status",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ],
    userOnly: true,
    callback: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "locked") {
            const email = interaction.options.getString("email");
            await interaction.deferReply({ ephemeral: true });

            try {
                const msg = await checklockedmsg(email);
                await interaction.editReply(msg);
            } catch (err) {
                console.error(err);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Error. Report this as ID: checklockedcmd1")
                            .setColor("Red")
                    ]
                });
            }
        }
    }
};
