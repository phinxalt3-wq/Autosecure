
const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg");


module.exports = {
    name: "editpresets",
    editpresets: true,  
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        let msg = await editpresetsmsg(botnumber, ownerid, 1)
        return interaction.reply(msg)
    }
};
