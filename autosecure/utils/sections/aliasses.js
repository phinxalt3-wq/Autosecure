const makePrimary = require("../secure/makePrimary")
const addAlias = require("../secure/addAlias")
const removeAlias = require("../secure/removeAlias")
const {
    updateStatus,
    updateExtraInformation,
    logDuration,
    getAcc,
    initializesecure,
    newgamertag,
    generateValidGamertag
} = require("../process/helpers");
const generate = require("../generate")

module.exports = async function aliasses(
    axios,
    canary2,
    uid,
    acc,
    aliases,
    primary,
    settings,
    apicanary,
    cookiedata,
    amsc
) {

    console.log(`Got into alias!`)

    console.log(`Aliasses canary: ${apicanary}`)
    console.log(`Canary 2: ${canary2}`)
    
    const changeCount = parseInt(settings.changeprimary) || 0;
    
    // Helper function to safely remove aliases
    const removeAliasesSafely = async (aliasesToRemove, excludeEmail = null) => {
        await Promise.all(aliasesToRemove.map(async (alias) => {
            if (!alias || typeof alias !== 'string' || alias === excludeEmail || alias === primary) return;
            try {
                await removeAlias(axios, alias, canary2);
            } catch (error) {
                console.error(`[X] Error removing alias ${alias}:`, error.message);
            }
        }));
    };
    
    if (changeCount === 0) {
        console.log(`[*] Removing non-primary aliases as changeprimary is disabled`);
        await removeAliasesSafely(aliases, primary);
        await updateStatus(uid, "email", acc.email);
    } else if (changeCount >= 1 && changeCount <= 2) {
        // Sequential pattern: add → delete old → (if 2 changes) add new → delete old
        let currentPrimary = primary;
        let currentEmail = primary;
        
        // Get alias prefix from settings (defined here so it's available for both first and second alias)
        const aliasPrefix = settings.aliasPrefix || "";
        
        // Helper function to generate alias with prefix
        const generateAliasWithPrefix = () => {
            if (!aliasPrefix) return generate(16);
            const remainingLength = Math.max(1, 16 - aliasPrefix.length);
            return `${aliasPrefix}${generate(remainingLength)}`;
        };
        
        // First change: add alias → delete old
        let firstAlias = generateAliasWithPrefix();
        await updateStatus(uid, "email", `Adding first alias: ${firstAlias}@outlook.com...`);
        let isAdded = await addAlias(firstAlias, canary2, cookiedata.cookies.amrp, amsc);
        
        if (isAdded) {
            console.log(`[✔] Added alias ${firstAlias}@outlook.com to the Account!`);
            let firstEmail = firstAlias + "@outlook.com";
            await updateStatus(uid, "email", `Making ${firstEmail} primary...`);
            let isPrimary = await makePrimary(cookiedata, firstEmail, apicanary, amsc);
            
            if (isPrimary) {
                currentEmail = firstEmail;
                acc.email = firstEmail;
                await updateStatus(uid, "email", acc.email);
                console.log(`[✔] Set ${firstAlias}@outlook.com as a Primary Alias for the Account!`);
                
                // Delete old primary alias
                if (currentPrimary && currentPrimary !== firstEmail) {
                    try {
                        const oldAliasName = currentPrimary.includes('@') ? currentPrimary.split('@')[0] : currentPrimary;
                        await updateStatus(uid, "email", `Removing old primary alias: ${currentPrimary}...`);
                        await removeAlias(axios, oldAliasName, canary2);
                        console.log(`[✔] Removed old primary alias ${currentPrimary}`);
                    } catch (error) {
                        console.error(`[X] Error removing old primary alias ${currentPrimary}:`, error.message);
                    }
                }
                
                // If 2 changes requested, do second change: add new → delete old
                if (changeCount === 2) {
                    // Wait a bit before second change
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Generate second alias with prefix
                    let secondAlias = generateAliasWithPrefix();
                    await updateStatus(uid, "email", `Adding second alias: ${secondAlias}@outlook.com...`);
                    let isSecondAdded = await addAlias(secondAlias, canary2, cookiedata.cookies.amrp, amsc);
                    
                    if (isSecondAdded) {
                        console.log(`[✔] Added second alias ${secondAlias}@outlook.com to the Account!`);
                        let secondEmail = secondAlias + "@outlook.com";
                        await updateStatus(uid, "email", `Making ${secondEmail} primary...`);
                        let isSecondPrimary = await makePrimary(cookiedata, secondEmail, apicanary, amsc);
                        
                        if (isSecondPrimary) {
                            currentEmail = secondEmail;
                            acc.email = secondEmail;
                            await updateStatus(uid, "email", acc.email);
                            console.log(`[✔] Set ${secondAlias}@outlook.com as a Primary Alias for the Account!`);
                            
                            // Delete the first alias we added
                            try {
                                await updateStatus(uid, "email", `Removing first alias: ${firstAlias}@outlook.com...`);
                                await removeAlias(axios, firstAlias, canary2);
                                console.log(`[✔] Removed first alias ${firstAlias}@outlook.com`);
                            } catch (error) {
                                console.error(`[X] Error removing first alias ${firstAlias}@outlook.com:`, error.message);
                            }
                        } else {
                            console.log(`[X] Failed to Set ${secondAlias}@outlook.com as a Primary Alias for the Account!`);
                            await updateStatus(uid, "email", `Failed to set second alias as primary. Using ${firstEmail}`);
                        }
                    } else {
                        console.log(`[X] Failed to add second alias ${secondAlias}@outlook.com to the Account!`);
                        await updateStatus(uid, "email", `Failed to add second alias. Using ${firstEmail}`);
                    }
                }
                
                // Remove all other non-primary aliases
                await removeAliasesSafely(aliases, currentEmail);
            } else {
                console.log(`[X] Failed to Set ${firstAlias}@outlook.com as a Primary Alias for the Account!`);
                acc.email = primary;
                await updateStatus(uid, "email", acc.email);
                await removeAliasesSafely(aliases, primary);
            }
        } else {
            console.log(`[X] Failed to add ${firstAlias}@outlook.com as an Alias for the Account!`);
            acc.email = primary;
            await updateStatus(uid, "email", acc.email);
            await removeAliasesSafely(aliases, primary);
        }
    } else {
        console.log(`[!] Invalid changeprimary value: ${changeCount}. Must be 0, 1, or 2.`);
        acc.email = primary;
        await updateStatus(uid, "email", acc.email);
        await removeAliasesSafely(aliases, primary);
    }

    return acc
}
