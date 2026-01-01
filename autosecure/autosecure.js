const discord = require("discord.js");
const eventHandler = require("./Handlers/eventHandler");
const { queryParams } = require("../db/database.js");
const { ActivityType } = require("discord.js");
const { tablesbotnumber } = require("../db/gettablesarray.js")

module.exports = async (token, username, d = 1, dmmode = false) => {
try {
    const clientOptions = {
      intents: [
        discord.GatewayIntentBits.Guilds,
        ...(dmmode ? [
          discord.GatewayIntentBits.DirectMessages,
          discord.GatewayIntentBits.MessageContent,
          discord.GatewayIntentBits.GuildMessages
        ] : [])
      ],
      partials: dmmode ? [
        discord.Partials.Channel 
      ] : []
    };

    /*
    Initialize Client with new botnumber
    */
    const client = new discord.Client(clientOptions);
    client.username = username;
    client.botnumber = d; 
    client.isuserbot = true;



/*
    Multiple botfix (adds bot slot for every sql argument)
*/

client.queryParams = async (query, params = [], method = "all") => {
  const normalizedQuery = query.replace(/\s+/g, ' ').trim();
  const command = normalizedQuery.split(' ')[0].toUpperCase();
  let table = null;
  if (command === "SELECT" || command === "DELETE") {
    const fromMatch = normalizedQuery.match(/FROM\s+([^\s(,;]+)/i);
    table = fromMatch ? fromMatch[1].replace(/[`"'[\]]/g, "") : null;
  } 
  else if (command === "UPDATE") {
    const updateMatch = normalizedQuery.match(/UPDATE\s+([^\s(,;]+)/i);
    table = updateMatch ? updateMatch[1].replace(/[`"'[\]]/g, "") : null;
  }
  else if (command === "INSERT") {
    const insertMatch = normalizedQuery.match(/INSERT\s+INTO\s+([^\s(,;]+)/i);
    table = insertMatch ? insertMatch[1].replace(/[`"'[\]]/g, "") : null;
  }

  const allowed = tablesbotnumber();
  const needsBotNumber = table && allowed.includes(table);

  if (needsBotNumber) {
    if (command === "INSERT") {
      const valuesIndex = normalizedQuery.toUpperCase().indexOf('VALUES');
      if (valuesIndex > -1) {
        const beforeValues = query.substring(0, valuesIndex);
        const afterValues = query.substring(valuesIndex);
        const columnsMatch = beforeValues.match(/\(([^)]+)\)/);
        if (columnsMatch) {
          const newBeforeValues = beforeValues.replace(
            `(${columnsMatch[1]})`, 
            `(${columnsMatch[1]}, botnumber)`
          );
          const valuesMatch = afterValues.match(/\(([^)]*)\)/);
          if (valuesMatch) {
            const newAfterValues = afterValues.replace(
              `(${valuesMatch[1]})`, 
              `(${valuesMatch[1]}, ?)`
            );
            
            query = newBeforeValues + newAfterValues;
            params.push(client.botnumber);
          }
        }
      }
    }
    else if (command === "UPDATE") {
      const whereIndex = normalizedQuery.toUpperCase().indexOf('WHERE');
      if (whereIndex > -1) {
        query = query.substring(0, whereIndex + 5) + ' botnumber = ? AND ' + query.substring(whereIndex + 5);
        params.splice(query.indexOf('SET') < whereIndex ? 
                     query.substring(query.indexOf('SET') + 3, whereIndex).split('?').length - 1 : 
                     0, 0, client.botnumber);
      } else {
        query += ' WHERE botnumber = ?';
        params.push(client.botnumber);
      }
    }
    else {
      const whereIndex = normalizedQuery.toUpperCase().indexOf('WHERE');
      if (whereIndex > -1) {
        query = query.substring(0, whereIndex + 5) + ' botnumber = ? AND ' + query.substring(whereIndex + 5);
        params = [client.botnumber, ...params];
      } else {
        query += ' WHERE botnumber = ?';
        params.push(client.botnumber);
      }
    }
  }

  // Return edited queryParams
  
  try {
    const result = await queryParams(query, params, method);
    return result;
  } catch (error) {
    console.error(`[Bot ${client.botnumber}] Query error:`, error);
    throw error;
  }
};

    let activityData = await client.queryParams("SELECT * FROM autosecure WHERE user_id = ?", [username]);
    activityData = activityData.length > 0 ? JSON.parse(activityData[0].activity) : null;

    if (activityData) {

      const activityMap = {
        "Playing": ActivityType.Playing,
        "Streaming": ActivityType.Streaming,
        "Competing": ActivityType.Competing,
        "Listening": ActivityType.Listening,
        "Watching": ActivityType.Watching,
      };

      client.once("ready", async () => {
        try {
          const selectedActivity = activityData?.activity ? activityMap[activityData.activity] : null;
          const activityName = activityData?.activityData || null;
          const visibility = activityData?.visibility || 'online';

     //     console.log(`Setting: ${activityData?.visibility}`)
          
          if (selectedActivity && activityName) {
            await client.user.setPresence({
              activities: [{
                name: activityName,
                type: selectedActivity,
              }],
              status: visibility
            });
          } else {
            await client.user.setPresence({
              status: visibility,
              activities: [] 
            });
          }
      //    console.log(`[Bot ${client.botnumber}] Presence updated successfully`);
        } catch (error) {
          console.error(`[Bot ${client.botnumber}] Error setting presence:`, error);
        }
      });
    }

    eventHandler(client, token);
    await client.login(token);
    return client;
} catch (e) {
  if (String(e).includes("[TokenInvalid]")) {
    console.log("Invalid token");
    return;
  }
  console.error("Initialization error:", e);
  return false;
}

};