const { TextInputStyle } = require("discord.js")
const modalBuilder = require('../../utils/modalBuilder')

module.exports = {
    name: "emailprefix",
    editsettings: true,
    callback: async (client, interaction) => {
        const name = module.exports.name
        const modalId = interaction.customId.includes("|") ? `${name}|config` : name

        interaction.showModal(modalBuilder(modalId, name,
            [{
                setCustomId: 'secEmailPrefix',
                setMaxLength: 20,
                setMinLength: 0,
                setRequired: false,
                setLabel: "Security Email Prefix",
                setPlaceholder: "e.g., old, secure, custom",
                setStyle: TextInputStyle.Short
            },
            {
                setCustomId: 'aliasPrefix',
                setMaxLength: 20,
                setMinLength: 0,
                setRequired: false,
                setLabel: "Alias Prefix (optional)",
                setPlaceholder: "Leave empty to use no prefix",
                setStyle: TextInputStyle.Short
            }]
        ))
    }
}
