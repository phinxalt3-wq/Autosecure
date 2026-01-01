const { queryParams } = require("../../../db/database");
const accountsmsg = require('../../utils/accounts/accountsmsg');

module.exports = {
    name: "searchmodal",
    callback: async (client, interaction) => {
        try {


            const userId = interaction.user.id;
            const searchQuery = interaction.fields.getTextInputValue('searchQuery');




            const userAccounts = await client.queryParams(`SELECT * FROM accountsbyuser WHERE user_id=? ORDER BY time DESC`, [userId]);

            if (!userAccounts || userAccounts.length === 0) {

                return interaction.reply({
                    content: "No accounts found to search.",
                    ephemeral: true
                });
            }




            let allAccounts = [];

            for (const userAccount of userAccounts) {

                const accountDetails = await client.queryParams(`SELECT * FROM accounts WHERE uid=?`, [userAccount.uid]);
                if (accountDetails && accountDetails.length > 0) {

                    allAccounts = allAccounts.concat(accountDetails);
                } else {

                }
            }





            const matchingAccounts = allAccounts.filter(account => {

                const matchesUsername = account.username?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesOwnsMc = account.ownsmc?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCapes = account.capes?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesRecoveryCode = account.recoverycode?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesEmail = account.email?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSecEmail = account.secemail?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSecretKey = account.secretkey?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesPassword = account.password?.toLowerCase().includes(searchQuery.toLowerCase());











                return (
                    matchesUsername ||
                    matchesOwnsMc ||
                    matchesCapes ||
                    matchesRecoveryCode ||
                    matchesEmail ||
                    matchesSecEmail ||
                    matchesSecretKey ||
                    matchesPassword
                );
            });

            if (matchingAccounts.length === 0) {

                return interaction.reply({
                    content: "No matching accounts found.",
                    ephemeral: true
                });
            }




            const firstMatchUid = matchingAccounts[0].uid;




            const updatedMsg = await accountsmsg(userId, 1, firstMatchUid); // Pass UID as the third parameter
            await interaction.update(updatedMsg);
        } catch (error) {
            console.error("[ERROR] Error in searchmodal_submit:", error);
            return interaction.reply({
                content: "An error occurred while searching for accounts.",
                ephemeral: true
            });
        }
    }
};