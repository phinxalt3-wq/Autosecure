const { queryParams } = require("../../../db/database");
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const dns = require("dns").promises;
const config = require('../../../config.json');

module.exports = {
    name: "setupdomain",
    userOnly: true,
    callback: async (client, interaction) => {
        const [t, domain] = interaction.customId.split("|");
        const vpsip = config.vpsip;

        if (!domain || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(domain)) {
            return interaction.reply({
                content: "Invalid domain format!",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setDescription(`In your domain registrar (e.g., Namecheap, GoDaddy, etc.), create the DNS records with the following:\n\n\`\`\`\nType: A\nName: ${domain}\nContent/Value: ${vpsip}\nTTL: Automatic\n\`\`\`\n\n\`\`\`\nType: MX\nName: ${domain}\nContent/Value: ${domain}\nPriority: 10\nTTL: Automatic\n\`\`\``)
            .setFooter({ text: "Note: It may take up to 72h for the records to be updated." })
            .setColor("#b2c7e0");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`dns|${vpsip}|${domain}`)
                .setLabel('Confirm Domain!')
                .setStyle(1) 
        );

        return interaction.reply({
            content: "Follow the steps to link your domain. Once you've finished these steps, click the confirm button to check if your setup was right!",
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
};