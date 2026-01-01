const blacklistedmsg = require("../../../autosecure/utils/bot/blacklistedmsg");


module.exports = {
    name: "blacklistedusers",
    editblacklist: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split("|")[2]
        let botnumber = interaction.customId.split("|")[1]
        let msg = await blacklistedmsg(botnumber, client, id, "blacklisted", 1)
        return interaction.reply(msg)
    }
};
