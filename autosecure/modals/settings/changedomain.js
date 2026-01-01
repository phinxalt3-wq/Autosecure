

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { queryParams } = require("../../../db/database");
const dns = require("dns").promises;
const config = require('../../../config.json');

const VPS_IP = config.vpsip; // Get VPS IP from config.json

const isValidDomain = (domain) => {
    const regex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(domain);
};



module.exports = {
    name: "changedomain", // This handler is for modal submissions
    async callback(client, interaction) {

    
        let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);


        if (settings.length === 0) {
            return interaction.reply({
                content: "You have no settings (likely due to a database issue), report this to an admin!",
                ephemeral: true
            });
        }
        

        const domain = interaction.fields.getTextInputValue('changedomain');
             if (!isValidDomain(domain) || domain === settings[0].domain) {
            return interaction.reply({
                content: "Domain already set or invalid domain!",
                ephemeral: true
            });
        }


const embed = new EmbedBuilder()
    .setDescription(`In your domain registrar (e.g., Namecheap, GoDaddy, etc.), create the DNS records with the following:\n\n\`\`\`\nType: A\nName: ${domain}\nContent/Value: ${VPS_IP}\nTTL: Automatic\n\`\`\`\n\n\`\`\`\nType: MX\nName: ${domain}\nContent/Value: ${domain}\nPriority: 10\nTTL: Automatic\n\`\`\``)
    .setFooter({ text: "Note: It may take up to 72h for the records to be updated. Please remove any unnecessary MX records." })
    .setColor("#b2c7e0");

     


        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`dns|${VPS_IP}|${domain}`)
                .setLabel('Confirm Domain!')
                .setStyle('1'),
            new ButtonBuilder()
                .setCustomId(`changedomain`)
                .setLabel(`${domain}`)
                .setStyle('2')
        );


        await interaction.update({
            content: "Follow the steps to setup your domain. Once you've finished these steps, click the confirm button!",
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
};


