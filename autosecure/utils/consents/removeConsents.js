const removeConsent = require("./removeConsent");

const fetchOAuths = async (axios) => {
    const response = await axios.get("https://account.live.com/consent/Manage?guat=1", {
        headers: { "X-Requested-With": "XMLHttpRequest" }
    });

    const clientIdRegex = /data-clientid="([^"]+)"/gi;
    const clientIds = [];
    let match;

    while ((match = clientIdRegex.exec(response.data)) !== null) {
        clientIds.push(match[1]);
    }

    return clientIds;
};

module.exports = async (axios) => {
    try {
        const initialClientIds = await fetchOAuths(axios);
        
        if (initialClientIds.length === 0) return "No OAuths";

        console.log(`Found ${initialClientIds.length} OAuths! (1st)`);

 
        const results = await Promise.all(
            initialClientIds.map(async (clientId) => {
                try {
                    return await removeConsent(axios, clientId);
                } catch (err) {
                    console.error(`Failed to remove consent for ${clientId}:`, err.message);
                    return false;
                }
            })
        );

        const firstAttemptSuccessful = results.filter(success => success).length;

   
        const remainingClientIds = await fetchOAuths(axios);
        
        if (remainingClientIds.length > 0) {
            console.log(`Found ${remainingClientIds.length} remaining OAuths, removing..`);

            const retryResults = await Promise.all(
                remainingClientIds.map(async (clientId) => {
                    try {
                        return await removeConsent(axios, clientId);
                    } catch (err) {
                        console.error(`Retry failed to remove consent for ${clientId}:`, err.message);
                        return false;
                    }
                })
            );

            const secondAttemptSuccessful = retryResults.filter(success => success).length;
            
            // Return remaining OAuths that couldn't be removed
            return remainingClientIds.length - secondAttemptSuccessful;
        } else {
            // All removed in first attempt
            return 0;
        }
    } catch (err) {
        console.error("Failed to fetch OAuths:", err.message);
        return null;
    }
};