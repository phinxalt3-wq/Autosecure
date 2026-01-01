const accountsmsg = require('../../utils/accounts/accountsmsg')


module.exports={
    name:"accounts",
    userOnly: true,
    description: 'List all your accounts',
    userOnly: true,
    callback:async (client,interaction)=>{
      let id = interaction.user.id
      await interaction.reply(await accountsmsg(id,"1"))
    }
}