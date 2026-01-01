const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../../autosecure/utils/modalBuilder")

module.exports = {
    name: "addproxy",
    callback: async (client, interaction) => {

        return interaction.showModal(modalBuilder(`addproxymodal`, `Add Proxies`, [{
            setCustomId: 'proxyfield',
            setMaxLength: 4000,
            setMinLength: 0,
            setRequired: false,
            setLabel: "Enter list of proxies (line per line)",
            setPlaceholder: "ip:port:user:pass",
            setStyle: TextInputStyle.Paragraph
        }]))
    }
}