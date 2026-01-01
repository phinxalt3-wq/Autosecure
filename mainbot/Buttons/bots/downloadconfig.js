const sendconfigmsg = require("../../../autosecure/utils/utils/sendconfigmsg");


module.exports = {
    name: "botsconfig",
    userOnly: true,
    callback: async (client, interaction) => {
    const botnumber = interaction.customId.split("|")[1]
    const ownerid = interaction.customId.split("|")[2]
    await interaction.deferReply({ ephemeral: true });
    let msg = await sendconfigmsg(ownerid, botnumber)
    return await interaction.editReply(msg)
    }
};
