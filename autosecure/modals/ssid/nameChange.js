const axios = require("axios");

module.exports = {
  name: "namechangemodal",
  callback: async (client, interaction) => {
    let ssid = interaction.customId.split("|")[1]
    let newName = interaction.components[0].components[0].value;
    let data = await axios({
      method: "PUT",
      url: `https://api.minecraftservices.com/minecraft/profile/name/${newName}`,
      headers: {
        "Content-Type": "Application/json",
        Authorization: `Bearer ${ssid}`
      },
      validateStatus: (status) => status >= 200 && status < 501
    })
    
    switch (data.status) {
      case 400:
        return interaction.update({ content: `Name is invalid, longer than 16 characters or contains characters other than (a-zA-Z0-9_)` })
      case 403:
        return interaction.update({ content: `Name is unavailable (Either taken or has not become available)` })
      case 401:
        return interaction.update({ content: `Unauthorized (Bearer token expired or is not correct)` })
      case 429:
        return interaction.update({ content: `Too many requests sent` })
      case 500:
        return interaction.update({ content: `Timed out (API lagged out and could not respond)` })
      case 200:

        let updatedEmbed = interaction.message.embeds[0]


        let description = updatedEmbed.description || '';
        let uuid = description.match(/UUID:\s*(\S+)/);
        let capes = description.match(/Capes:\s*(\d+)/);
        let onlineChat = description.match(/Online chat\s*[:\s]?\S+/);
        let multiplayer = description.match(/Multiplayer\s*[:\s]?\S+/);


        uuid = uuid ? uuid[0] : 'UUID: Not found';
        capes = capes ? capes[0] : 'Capes: Not found';
        onlineChat = onlineChat ? onlineChat[0] : 'Online chat: Not found';
        multiplayer = multiplayer ? multiplayer[0] : 'Multiplayer: Not found';


        updatedEmbed.description = `**IGN**: \`${newName}\`\n${uuid}\n${capes}\n${onlineChat}\n${multiplayer}`;

        return interaction.update({
          content: `Success (Name changed)`,
          embeds: [updatedEmbed],
          components: interaction.message.components, // Keep existing buttons
        })
      default:
        console.log(data)
        return interaction.update({ content: `Couldn't change name.` })
    }
  }
}
