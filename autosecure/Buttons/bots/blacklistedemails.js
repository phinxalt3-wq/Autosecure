const blacklistedmsg = require("../../../autosecure/utils/bot/blacklistedmsg");


module.exports = {
    name: "blacklistedemails",
    editblacklist: true,
    callback: async (client, interaction) => {
        let botnumber = interaction.customId.split("|")[1]
        let msg = await blacklistedmsg(botnumber, client, interaction.user.id, "blacklistedemails", 1)
        return interaction.reply(msg)
    }
};
