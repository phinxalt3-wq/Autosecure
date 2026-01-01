const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { queryParams } = require('../../../db/database');
const { removeQuarantineAndStopBot } = require('../../../mainbot/handlers/quarantinehandler'); 


function safeToString(value) {
    if (value === null || value === undefined) return 'invalid';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    if (typeof value === 'object') {
        try { return String(value); } catch { return 'invalid'; }
    }
    return String(value);
}

function formatTimeSince(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

module.exports = {
    name: "removequarantine",
    description: 'Remove an account from Hypixel quarantine',
    enabled: true,
    userOnly: true,
    options: [
        {
            name: "account",
            description: "Select the account to remove from quarantine",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],

    async autocomplete(client, interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const accounts = await queryParams(
                'SELECT id, name, time FROM quarantine WHERE user_id = ?',
                [safeToString(interaction.user.id)]
            );

            if (!accounts?.length) {
                return await interaction.respond([{
                    name: "No accounts in quarantine",
                    value: "none"
                }]);
            }

            let choices = accounts.map(account => {
                try {
                    if (!account?.id || !account.name || !account.time) return null;
                    const timeAgo = formatTimeSince(parseInt(account.time));
                    return {
                        name: `${account.name} (${timeAgo} ago)`,
                        value: safeToString(account.id)
                    };
                } catch (err) {
                    console.error('Error processing account:', err);
                    return null;
                }
            }).filter(Boolean);

            if (focusedValue) {
                choices = choices.filter(choice =>
                    choice.name.toLowerCase().includes(focusedValue.toLowerCase())
                );
            }

            await interaction.respond(
                choices.length ? choices.slice(0, 25) : [{
                    name: "No matching accounts",
                    value: "none"
                }]
            );
        } catch (error) {
            console.error('Autocomplete Error:', error);
            await interaction.respond([{
                name: "Error loading accounts",
                value: "error"
            }]);
        }
    },

    async execute(client, interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const selectedId = interaction.options.getString('account');

            if (selectedId === 'none' || selectedId === 'error') {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('No Accounts Found')
                            .setDescription('You have no accounts in quarantine. Start a quarantine with `/quarantine`')
                    ]
                });
            }

            // Verify the account exists and belongs to the user
            const [account] = await queryParams(
                'SELECT * FROM quarantine WHERE id = ? AND user_id = ?',
                [selectedId, safeToString(interaction.user.id)]
            );

            if (!account) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle('Account Not Found')
                            .setDescription('The selected account was not found in quarantine.')
                    ]
                });
            }

            await interaction.editReply({
                content: `Shutting down bot!`,
                ephemeral: true
            })

            // Remove quarantine and stop bot
            const success = await removeQuarantineAndStopBot(
                account.id,
                `Manually removed`
            );

            if (success) {
                await interaction.editReply({
                    content: null,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00ff00)
                            .setTitle('Bot has been shut down!')
                    ]
                });
            } else {
                await interaction.editReply({
                    content: null,
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle(`Couldn't shut down the bot! It may still be running. Please make a ticket.`)
                    ]
                });
            }
        } catch (error) {
            console.error('Remove Quarantine Error:', error);
            await interaction.editReply({
                content: null,
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('Error')
                        .setDescription('An unexpected error occurred while removing quarantine.')
                ]
            });
        }
    }
};