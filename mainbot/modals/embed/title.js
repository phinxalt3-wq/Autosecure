module.exports = {
  name: "title",
  callback: (client, interaction) => {
    let title = interaction.components[0].components[0].value?.trim() || null;
    const embed = interaction.message.embeds[0].data;
    let newContent = interaction.message.content; // keep original unless we need to change it

    if (title === null) {
      const hasOtherContent =
        (embed.description && embed.description.trim().length > 0) ||
        (embed.fields && embed.fields.length > 0) ||
        (embed.image && embed.image.url) ||
        (embed.thumbnail && embed.thumbnail.url) ||
        (embed.footer && embed.footer.text) ||
        (embed.author && embed.author.name);

      if (hasOtherContent) {
        delete embed.title;
      } else {
        newContent = "Couldn't delete title: Embed cannot be nothing!";
        title = embed.title || " "; // keep old title to prevent empty embed error
      }
    }

    if (title !== null) {
      embed.title = title;
    }

    interaction.update({
      content: newContent,
      embeds: [embed]
    });
  }
};
