const bancheckmsg = require("../../../autosecure/utils/bancheckappeal/bancheckmsg");


module.exports = {
  name: "checkbanmc",
  userOnly: true,
  callback: async (client, interaction) => {
   try {
        await interaction.deferReply({ ephemeral: true });
        const [t, ssid] = interaction.customId.split("|")
        const result = await bancheckmsg(ssid);
        await interaction.editReply(result);
   } catch (err){
    console.log(err)
   }
  }
};
