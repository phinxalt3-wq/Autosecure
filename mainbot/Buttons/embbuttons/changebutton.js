const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const editbuttonsmsg = require('../../../autosecure/utils/responses/editbuttonsmsg');
const getbotnumber = require("../../../db/getbotnumber");

module.exports = {
    name: "changebutton",
    editbuttons: true,
    callback: async (client, interaction) => {
      //  console.log(`${interaction.customId}`)
        // Needs to add botnumber
        /// THE OWNERID is NULL
        let botnumber = await getbotnumber(interaction, client, 2, "changebutton.js");
        let type = interaction.customId.split("|")[1]
        let ownerid = interaction.customId.split("|")[3]
        let msg = await editbuttonsmsg(type, botnumber, ownerid) 
        
        return interaction.reply(msg) 
    }
}
