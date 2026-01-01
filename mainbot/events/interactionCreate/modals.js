const { queryParams } = require('../../../db/database');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const clicolor = require("cli-color");
const isblacklisted = require('../../../db/blacklist');
const access = require('../../../db/access');
const isOwner = require('../../../db/isOwner');
const userpermissions = require('../../../autosecure/utils/embeds/userpermissions');
const config = require('../../../config.json'); // Make sure this path is correct

module.exports = async (client, interaction) => {
  if (!interaction.isModalSubmit()) return;
  
  // Check blacklist first
  if (await checkBlacklist(interaction)) return;

  try {
    const [userperms] = await userpermissions();

    let modal = client.modals.find((modal) => modal.name === interaction.customId.split("|")[0]);
    
    // Handle action modals
    if (interaction.customId.split("|")[0] === "action") {
      let action = await queryParams(`SELECT * FROM actions WHERE id=?`, [
        interaction.customId.split("|")[1],
      ]);
      
      if (action.length === 0) {
        return interaction.reply({
          embeds: [
            {
              title: `Error :x:`,
              description: `Please try again later!`,
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
      
      interaction.customId = action[0].action;
      modal = client.modals.find((modal) => modal.name === interaction.customId.split("|")[0]);
    }

    if (!modal) return;

    // Owner-only check
    if (modal.ownerOnly) {
      const isUserOwner = await isOwner(interaction.user.id);
      
      if (!isUserOwner) {
        return interaction.reply({ 
          content: "Invalid permissions!", 
          ephemeral: true 
        });
      }
    }

    // User-only check
    if (modal.userOnly) {
      if (!await access(interaction.user.id)) {
        const embed = new EmbedBuilder()
          .setColor('#d22b2b')
          .setDescription(`### You do not have an active license\n\nIf you wish to purchase a subscription, you can purchase a 30d key from [here](${config.shoplink}) and use \`/redeem\` to redeem it.`);

        const button = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.shoplink);

        const button2 = new ButtonBuilder()
          .setLabel('Join Server')
          .setCustomId('joinserver')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button, button2);

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }
    }

    // Permission checks
    for (const [permKey, { permission: dbColumn, description }] of Object.entries(userperms)) {
      if (modal[permKey] && !await access(interaction.user.id)) {
        const button1 = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.shoplink);

        const button2 = new ButtonBuilder()
          .setLabel('Join Server')
          .setCustomId('joinserver')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button1, button2);

return interaction.reply({
  embeds: [
    new EmbedBuilder()
      .setTitle("This modal is only for managing your own bots, and you don't have access!\n(anymore)")
      .setColor('#d22b2b')
  ],
  components: [row],
  ephemeral: true
});

      }
    }

    // Log and execute modal
    console.log(`${modal.name}|${interaction.user.username}|Modal|${interaction.customId}|${new Date().toISOString()}`);
    await modal.callback(client, interaction);
  } catch (e) {
    console.error('Error in modal handler:', e);
    // Consider sending an error message to the user
    if (!interaction.replied) {
      await interaction.reply({
        content: 'An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }
};

async function checkBlacklist(interaction) {
  const blacklisted = await isblacklisted(interaction.user.id);
  
  if (blacklisted.blacklisted) {
    const embed = new EmbedBuilder()
      .setColor('#d22b2b')
      .setDescription(`### You're blacklisted from using Autosecure\n\n Reason: ${blacklisted.reason}`);
    
    await interaction.reply({ 
      embeds: [embed], 
      ephemeral: true 
    });
    return true;
  }
  return false;
}