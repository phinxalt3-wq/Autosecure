const axios = require("axios");

module.exports = {
  name: "skinchangemodal",
  callback: async (client, interaction) => {
    let ssid = interaction.customId.split("|")[1]
    let newSkinUrl = interaction.components[0].components[0].value;
    let data = await axios({
      method: "POST",
      url: `https://api.minecraftservices.com/minecraft/profile/skins`,
      headers: {
        "Content-Type": "Application/json",
        Authorization: `Bearer ${ssid}`
      },
      data: {
        "variant": "classic",
        "url": newSkinUrl
      },
      validateStatus: (status) => status >= 200 && status < 501
    })
    switch (data.status) {
      case 400:
        return interaction.update({ content: `Invalid Skin URL` })
      case 401:
        return interaction.update({ content: `Unauthorized (Bearer token expired or is not correct)` })
      case 429:
        return interaction.update({ content: `Too many requests sent` })
      case 500:
        return interaction.update({ content: `Timed out (API lagged out and could not respond)` })

      case 200:
        return interaction.update({ content: `Success (Skin changed)` })

      default:
        console.log(data)
        return interaction.update({ content: `Unexpected error occured!` })
    }
  }
}