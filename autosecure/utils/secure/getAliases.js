

async function getAliases(axios) {
    if (!axios.getCookie(`AMRPSSecAuth`)) return false
    try {
        let aliasData = await axios.get(`https://account.live.com/names/manage`)

        const result = {
            aliases: [],
            canary: null,
            primary: null
        };

        const canaryMatch = aliasData.data.match(/<input type="hidden" id="canary" name="canary" value="([^"]+)" \/>/);
        if (canaryMatch) {
            result.canary = canaryMatch[1];
        }

        const jsObjectMatch = aliasData.data.match(/var\s+t0\s*=\s*({[^;]+})/);
        if (jsObjectMatch && jsObjectMatch[1]) {
            const accountData = JSON.parse(jsObjectMatch[1]);

            if (accountData?.WLXAccount?.addAlias?.phoneAliases) {
                result.aliases.push(...accountData.WLXAccount.addAlias.phoneAliases);
            }

            if (accountData?.WLXAccount?.manageNames?.mxAliases) {
                result.aliases.push(...accountData.WLXAccount.manageNames.mxAliases);
            }

            if (accountData?.WLXAccount?.accountManagement?.membername) {
                result.primary = accountData.WLXAccount.accountManagement.membername;

                if (!result.aliases.includes(result.primary)) {
                    result.aliases.push(result.primary);
                }
            }
        }

    //    console.log(`getAlias result: ${JSON.stringify(result)}`);

        return [result.aliases, result.canary, result.primary];


    } catch (error) {
        console.error("Error fetching aliases:", error.message);
        throw error;
    }
}

module.exports = getAliases;
