const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const getbotnumber = require("../../../db/getbotnumber");

module.exports = {
    name: "editbuttons",
    editbuttons: true,
    callback: async (client, interaction) => {
        let botnumber = await getbotnumber(interaction, client, 1, "editbuttons");
        let ownerid = interaction.customId.split("|")[2];
        let id = ownerid; 

     //   console.log(`id: ${id}`)

        return interaction.reply({
            embeds: [{
                title: `Which Button do you want to change?`,
                color: 0xC8C8C8
            }],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`changebutton|link account|${botnumber}|${id}`)
                        .setLabel("Link Account Button")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|extrabutton|${botnumber}|${id}`)
                        .setLabel("Extra Button")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|code|${botnumber}|${id}`)
                        .setLabel("Submit Code Button")
                        .setStyle(ButtonStyle.Primary)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`changebutton|oauth|${botnumber}|${id}`)
                        .setLabel("OAuth Button")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|howto|${botnumber}|${id}`)
                        .setLabel("How To Button")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|howtoauth|${botnumber}|${id}`)
                        .setLabel("How To Button [Authenticator]")
                        .setStyle(ButtonStyle.Primary)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`changebutton|alternative|${botnumber}|${id}`)
                        .setLabel("Alternative Method Button")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|continue|${botnumber}|${id}`)
                        .setLabel("Continue [Failed username check]")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`changebutton|retry|${botnumber}|${id}`)
                        .setLabel("Retry [Failed username check]")
                        .setStyle(ButtonStyle.Primary)
                ),
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`changebutton|entercodepreset|${botnumber}|${id}`)
                        .setLabel("Enter Code [Preset]")
                        .setStyle(ButtonStyle.Primary)
                )
            ],
            ephemeral: true
        });
    }
};
