module.exports = {
    name: 'video_guide',
    useronly: true,
    callback: async (client, interaction) => {
      await interaction.reply({
        content: 'https://cdn.discordapp.com/attachments/1215933947842662420/1215934984255438929/2024-03-09_09-42-41_1.compressed.mp4',
        ephemeral: true,
      });
    },
  };
  