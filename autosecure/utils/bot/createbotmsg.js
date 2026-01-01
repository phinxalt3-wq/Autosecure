const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder
} = require("discord.js");
const config = require("../../../config.json");
const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const showbotmsg = require("../bot/showbotmsg");
const { initializationStatus } = require("../../../autosecure");

module.exports = async (client, username) => {
  try {
    let initialized = initializationStatus.get("botsInitialized");
    if (!initialized) {
      const startTime = Date.now();
      const timeout = 30000;
      const checkInterval = 500;

      while (!initialized && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        initialized = initializationStatus.get("botsInitialized");
      }

      if (!initialized) {
        return {
          embeds: [
            new EmbedBuilder()
              .setDescription("Loading bots took way longer than expected, please report this.")
              .setColor(0x40e0d0)
          ],
          ephemeral: true
        };
      }
    }

    const bots = await queryParams(
      `SELECT botnumber, token FROM autosecure WHERE user_id = ? ORDER BY botnumber ASC`,
      [username]
    );

    let slots = 1;
    const slotsResult = await queryParams(
      `SELECT slots FROM slots WHERE user_id = ?`,
      [username]
    );

    if (slotsResult.length > 0) {
      slots = slotsResult[0].slots;
    }

    const filteredBots = bots.filter(bot => bot.token && bot.token.trim() !== "");
    const currentUsedSlots = filteredBots.length;
    const openSlots = Math.max(0, slots - currentUsedSlots);

    if (slots === 1 && currentUsedSlots === 1) {
      const singleBot = filteredBots[0];
      return await showbotmsg(username, singleBot.botnumber, username, client);
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("managebots")
      .setPlaceholder("Manage bots");

    const maxOptions = 25;
    const optionValues = new Set();
    const botsToShow = filteredBots.slice(0, maxOptions - openSlots);

    botsToShow.forEach(bot => {
      const key = `bot|${username}|${bot.botnumber}`;
      if (!optionValues.has(key)) {
        optionValues.add(key);
        const clientInstance = autosecureMap.get(`${username}|${bot.botnumber}`);
        const label = clientInstance
          ? `${clientInstance.botnumber}| ${clientInstance.user.username} (${clientInstance.user.id})`
          : `Bot #${bot.botnumber} (Offline)`;
        selectMenu.addOptions([{ label, value: key }]);
      }
    });

    const emptyTokenBot = bots.find(bot => !bot.token || bot.token.trim() === "");
    let nextBotNumber = await getNextAvailableBotNumber(client, username, slots, emptyTokenBot ? [emptyTokenBot.botnumber] : []);

    if (openSlots > 0 && selectMenu.options.length < maxOptions) {
      const newBotKey = `newbot|${username}|${nextBotNumber}`;
      if (!optionValues.has(newBotKey)) {
        optionValues.add(newBotKey);
        selectMenu.addOptions([{ label: `Create a new bot`, value: newBotKey }]);
      }
    }

    if (slots === 1 && currentUsedSlots === 1) {
      const purchaseSlotKey = `purchaseslot`;
      if (!optionValues.has(purchaseSlotKey)) {
        optionValues.add(purchaseSlotKey);
        selectMenu.addOptions([{ label: `Add an extra bot slot!`, value: purchaseSlotKey }]);
      }
    }

    if (selectMenu.options.length === 0) {
      selectMenu.addOptions([
        {
          label: "Create your first bot",
          value: `newbot|${username}|1`,
          description: "You don't have any bots yet",
        }
      ]);
    }

    const embed = new EmbedBuilder()
      .setTitle("Manage your bots")
      .setDescription(`The maximum number of bots you can manage is ${slots}. If you want more slots, buy additional ones [**Click here to buy**](${config.botslotslink}) .\n\n**Please Note:** Bot updates may take up to 30s.`)
      .setColor(8308963);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return {
      embeds: [embed],
      components: [row],
      ephemeral: true
    };

  } catch (error) {
    console.error('Error in bot management:', error);
    return {
      content: 'An error occurred while processing your request.',
      ephemeral: true
    };
  }
};

async function getNextAvailableBotNumber(client, username, slots, availableBotNumbers) {
  if (availableBotNumbers.length > 0) {
    return availableBotNumbers[0];
  }

  const bots = await queryParams(
    `SELECT botnumber FROM autosecure WHERE user_id = ?`,
    [username]
  );

  const usedNumbers = bots.map(b => b.botnumber);

  const maxCheck = Math.max(slots, 100); 
  for (let i = 1; i <= maxCheck; i++) {
    if (!usedNumbers.includes(i)) {
      return i;
    }
  }


  return usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
}
