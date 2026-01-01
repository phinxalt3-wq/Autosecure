const { queryParams } = require("../../db/database");
const { autosecureMap } = require("./botHandler");
const autosecure = require("../../autosecure/autosecure");
const { autosecurelogs } = require("../../autosecure/utils/embeds/autosecurelogs");
const { client } = require("../controllerbot");

module.exports = async () => {
  const startTime = Date.now();

  let autosecures = await queryParams(`SELECT * FROM autosecure`);

  const botPromises = autosecures
    .filter(autosec => autosec.token) 
    .map(async (autosec) => {
    //  console.log(`Bot number ${autosec.botnumber}`);
      const bot = await autosecure(autosec.token, autosec.user_id, autosec.botnumber);
      if (bot) {
        const key = `${autosec.user_id}|${autosec.botnumber}`;
        autosecureMap.set(key, bot);
        return 1; 
      }
      return 0;  
    });

  const botCounts = await Promise.all(botPromises);
  const d = botCounts.reduce((sum, count) => sum + count, 0);  

  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

  autosecurelogs(client, 'initialize', null, null, null, null, timeTaken, d);
  return d
};
