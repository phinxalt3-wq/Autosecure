const { getUserBotNumbers } = require("../autosecure/utils/bot/configutils");
const { autosecureMap } = require("../mainbot/handlers/botHandler");

module.exports = async function destroybots(user) {
  try {
    const botNumbers = await getUserBotNumbers(user);
    let destroyed = 0;

    for (const botnumber of botNumbers) {
      const key = `${user}|${botnumber}`;
      const instance = autosecureMap.get(key);
      if (instance) {
        try {
          instance.destroy();
          destroyed++;
        } catch (e) {
          console.log(`Error destroying bot ${key}:`, e);
        }
        autosecureMap.delete(key);
      }
    }

    return { destroyed, total: botNumbers.length };
  } catch (err) {
    console.log(`Failed to delete bots for user ${user}:`, err);
    return { destroyed: 0, total: 0 };
  }
}
