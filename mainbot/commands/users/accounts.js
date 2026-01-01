const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg")


module.exports={
    name:"accounts",
    description: 'List and manage all your accounts',
    userOnly: true,
    callback:async (client,interaction)=>{
      let id = interaction.user.id
      await interaction.reply(await accountsmsg(id,"1"))
    }
}