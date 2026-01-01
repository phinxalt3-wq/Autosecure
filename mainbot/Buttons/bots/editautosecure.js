
const editautosecuremsg = require("../../../autosecure/utils/embeds/editautosecuremsg");


module.exports = {
    name: "editautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        let msg = await editautosecuremsg(botnumber, ownerid)
        return interaction.reply(msg)
    }
};
