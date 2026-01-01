const accountsmsg = require('../../utils/accounts/accountsmsg');

module.exports = {
    name: "backtoaccounts",
    callback: async (client, interaction) => {
        let [t, id, current] = interaction.customId.split("|");
        return interaction.update(await accountsmsg(interaction.user.id, current));
    }
}