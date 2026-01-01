const listSettings = require("../../utils/settings/listSettings");

module.exports = {
    name: "switchpanel",
    callback: async (client, interaction) => {
        const isFeaturepanelRaw = interaction.customId.split("|")[1];
        const isFeaturepanel = isFeaturepanelRaw === "true";
        const oppositeValue = !isFeaturepanel;

        const userId = interaction.user.id;
        const ownerId = client.username;

        let canSwitch = false;
        let errorMessage = null;

        const users = await client.queryParams(
            `SELECT * FROM users WHERE user_id=? AND child=?`,
            [ownerId, userId]
        );

        if (!isFeaturepanel) {
            // Currently on settings panel, switching to features panel
            if (userId === ownerId || (users.length > 0 && users[0].editfeatures === 1)) {
                canSwitch = true;
            } else {
                errorMessage = users.length === 0 ? "Invalid permissions!" : "You don't have permission to edit features!";
            }
        } else {
            // Currently on features panel, switching to settings panel
            if (userId === ownerId || (users.length > 0 && users[0].editsettings === 1)) {
                canSwitch = true;
            } else {
                errorMessage = users.length === 0 ? "Invalid permissions!" : "You don't have permission to edit settings!";
            }
        }

        // console.log(`Can switch: ${canSwitch}`);
        // console.log(`Featurepanel: ${isFeaturepanel}`);
        // console.log(`Opposite value: ${oppositeValue}`);

        const finalValue = canSwitch ? oppositeValue : isFeaturepanel;
        const msg = await listSettings(client, ownerId, finalValue);

        if (!canSwitch) msg.content = errorMessage;

        return interaction.update(msg);
    }
};
