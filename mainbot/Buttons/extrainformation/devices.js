const { queryParams } = require('../../../db/database');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "devices",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const deviceData = await fetchDeviceData(uid);

            if (!deviceData || !deviceData.devices || deviceData.devices.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Devices")
                    .setColor('#b2c7e0')
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("Devices")
                .setColor('#b2c7e0');

            const status = await fetchDeviceStatus(uid);
            if (status) {
                if (!status.status) {
                    embed.addFields({
                        name: `Removal Status`,
                        value: status.reason,
                    });
                } else {
                    const maxdevices = deviceData.devices.length;
                    embed.addFields({
                        name: `Removal Status`,
                        value: `Removed ${status.reason}/${maxdevices} devices`,
                    });
                }
            }

            deviceData.devices.forEach((device, index) => {
                const deviceId = device.id || "N/A";
                const name = device.name || "N/A";
                const model = device.model || "N/A";

                embed.addFields({
                    name: `Device #${index + 1}`,
                    value: `Device ID: ${deviceId} | Name: ${name} | Model: ${model}`,
                    inline: false,
                });
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error fetching or displaying device data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchDeviceStatus(uid) {
    try {
        const result = await queryParams('SELECT devicestatus FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(result[0].devicestatus);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching device status:", error);
        return null;
    }
}

async function fetchDeviceData(uid) {
    try {
        const result = await queryParams('SELECT devices FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(JSON.parse(result[0].devices));
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching device data:", error);
        return null;
    }
}
