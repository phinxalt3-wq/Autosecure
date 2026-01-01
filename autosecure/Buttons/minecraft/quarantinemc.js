const { quarantinemsg } = require('../../utils/bancheckappeal/quarantinemsg');


module.exports = {
  name: "quarantinemc",
  ownerOnly: true,
  callback: async (client, interaction) => {
   try {
        await interaction.deferReply({ ephemeral: true });
        const [t, ssid] = interaction.customId.split("|")
        const result = await quarantinemsg(ssid);
        await interaction.editReply(result);
   } catch (err){
    console.log(err)
    await interaction.editReply(`erm, something went wrong dm me!`)
   }
  }
};
