const { TextInputStyle } = require("discord.js")
const modalBuilder = require('../../utils/modalBuilder')

module.exports = {
    name: "emaildomain",
    editsettings: true,
    callback: async (client, interaction) => {
        const name = module.exports.name
        const modalId = interaction.customId.includes("|") ? `${name}|true` : name
 

        interaction.showModal(modalBuilder(modalId, name,
            [{
                setCustomId: 'domain',
                setMaxLength: 253,
                setMinLength: 0,
                setRequired: false,
                setLabel: "Domain",
                setPlaceholder: "Example: oldward.fun",
                setStyle: TextInputStyle.Short
            }]
        ))
    }
}
