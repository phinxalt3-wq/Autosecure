const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { queryParams } = require("../../../db/database");
const defaultpresets = require("./defaultpresets");





module.exports = async function presetsMessage(name, client, extrabutton = null) {
    let existingPreset = null;
    let codeButtonEnabled = false;
    let isDefault = false;
    let preset = null;

    if (name.startsWith("default|")) {
        isDefault = true;
    }

    try {
        if (!isDefault) {
            const result = await client.queryParams("SELECT * FROM presets WHERE user_id=? AND name=? LIMIT 1", [client.username, name]);
            if (result.length > 0) {
                existingPreset = result[0];
                codeButtonEnabled = result[0].codebutton === 1;
                if (extrabutton === null) {
                    extrabutton = codeButtonEnabled;
                }
            }
        } else {
            preset = defaultpreset(name);
            if (extrabutton === null) {
                extrabutton = false;
            }
        }
    } catch (error) {
        console.error("Error fetching preset:", error);
    }

    let extra = extrabutton ? "0" : "1";
    let extraButtonStatus = extrabutton ? "Enabled" : "Disabled";

    const title = new ButtonBuilder().setCustomId("title").setLabel("Title").setStyle(ButtonStyle.Primary);
    const description = new ButtonBuilder().setCustomId("description").setLabel("Description").setStyle(ButtonStyle.Primary);
    const author = new ButtonBuilder().setCustomId("author").setLabel("Author").setStyle(ButtonStyle.Primary);
    const authorUrl = new ButtonBuilder().setCustomId("authorurl").setLabel("Author URL").setStyle(ButtonStyle.Primary);
    const thumbnail = new ButtonBuilder().setCustomId("thumbnail").setLabel("Thumbnail").setStyle(ButtonStyle.Primary);
    const image = new ButtonBuilder().setCustomId("image").setLabel("Image").setStyle(ButtonStyle.Primary);
    const footer = new ButtonBuilder().setCustomId("footer").setLabel("Footer").setStyle(ButtonStyle.Primary);
    const footerUrl = new ButtonBuilder().setCustomId("footerurl").setLabel("Footer URL").setStyle(ButtonStyle.Primary);
    const color = new ButtonBuilder().setCustomId("color").setLabel("Color").setStyle(ButtonStyle.Primary);
    const addField = new ButtonBuilder().setCustomId("addfield").setLabel("Add Field").setStyle(ButtonStyle.Primary);
    const save = new ButtonBuilder().setCustomId(`savepreset|${name}|${extrabutton ? "1" : "0"}`).setLabel("Save").setStyle(ButtonStyle.Success);
    const reset = new ButtonBuilder().setCustomId(`deletepreset|${name}`).setLabel("Reset").setStyle(ButtonStyle.Danger);
    const removeField = new ButtonBuilder().setCustomId("removefield").setLabel("Remove Field").setStyle(ButtonStyle.Danger);
    const importJson = new ButtonBuilder().setCustomId(`embedjson|${name}|preset`).setLabel("Import").setStyle(ButtonStyle.Secondary);
    const exportJson = new ButtonBuilder().setCustomId("exportjson").setLabel("Export").setStyle(ButtonStyle.Secondary);
    const toggleCodeButton = new ButtonBuilder().setCustomId(`addentercode|${name}|${extra}|${client.username}`).setLabel("Toggle Enter Code Button").setStyle(ButtonStyle.Secondary);

    let embed;
    let contentMessage;

    if (isDefault) {
        try {
            embed = new EmbedBuilder(JSON.parse(preset));
            contentMessage = `Editing default embed | Button: ${extraButtonStatus}`;
        } catch (error) {
            console.error("Error parsing default preset JSON:", error);
            embed = new EmbedBuilder().setTitle("Error loading default preset!");
            contentMessage = `Error loading default preset \`${name}\`. | Enter Code Button: ${extraButtonStatus}`;
        }
    } else if (existingPreset) {
        try {
            embed = new EmbedBuilder(JSON.parse(existingPreset.preset));
            contentMessage = `Overwriting \`${name}\` | Button: ${extraButtonStatus}`;
        } catch (error) {
            console.error("Error parsing preset JSON:", error);
            embed = new EmbedBuilder().setTitle("Error loading preset!");
            contentMessage = `Error loading preset \`${name}\`. | Enter Code Button: ${extraButtonStatus}`;
        }
    } else {
        embed = new EmbedBuilder().setTitle("Edit your preset using the buttons!");
        contentMessage = `Editing preset: \`${name}\` | Button: ${extraButtonStatus}`;
    }

    const loadEmbed = new ButtonBuilder().setCustomId("loadembed").setLabel("Load Embed").setStyle(ButtonStyle.Primary);
    const saveEmbed = new ButtonBuilder().setCustomId("saveembed").setLabel("Save Embed").setStyle(ButtonStyle.Success);
    const resetEmbed = new ButtonBuilder().setCustomId("resetembed").setLabel("Reset Embed").setStyle(ButtonStyle.Danger);
    const exportEmbed = new ButtonBuilder().setCustomId("exportembed").setLabel("Export Embed").setStyle(ButtonStyle.Secondary);
    const placeholders = new ButtonBuilder().setCustomId("placeholders").setLabel("Placeholders").setStyle(ButtonStyle.Secondary);
    const basicEditor = new ButtonBuilder().setCustomId("basiceditor").setLabel("Basic Editor").setStyle(ButtonStyle.Secondary);

    const components = [
        new ActionRowBuilder().addComponents(loadEmbed, saveEmbed, resetEmbed, exportEmbed, placeholders),
        new ActionRowBuilder().addComponents(basicEditor)
    ];

    return {
        content: contentMessage,
        embeds: [embed],
        components,
        ephemeral: true
    };
};
