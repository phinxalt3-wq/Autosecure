const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../utils/modalBuilder")

module.exports = {
    name: "oauthset",
    editsettings: true,
    callback: async (client, interaction) => {
        return interaction.showModal(modalBuilder(`oauthlink`, `OAUTH Link`, [{
            setCustomId: 'oauthlink',
            setMaxLength: 4000,
            setMinLength: 0,
            setRequired: false,
            setLabel: "OAUTH Link",
            setPlaceholder: "Type the desired OAUTH Link.",
            setStyle: TextInputStyle.Short
        }]))
    }
}