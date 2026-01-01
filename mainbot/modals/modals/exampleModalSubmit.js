module.exports = {
    name: 'exampleSubmit',
    callback: async (client, interaction) => {
      await interaction.reply({
        content: 'This was just an example of how your modal would look!',
        ephemeral: true,
      });
    },
  };
  