const { quarantineMap } = require('./quarantineMap');
const { getproxy, removequarantine } = require('./quarantineutils');
const mineflayer = require("mineflayer");
const { SocksClient } = require('socks');
const { bancheck } = require("../../autosecure/utils/bancheckappeal/bancheck");
const { queryParams } = require("../../db/database")

const activeBots = new Map();

const goodProxiesMap = new Map();
const badProxiesMap = new Map();
const proxyRetryCountMap = new Map();

const authFailuresMap = new Map();

function generaterandomdelay() {
  return Math.floor(Math.random() * 8000) + 5000;
}

/**
 * Start all bots for users in quarantine
 */
async function startnewbots() {
  try {
    console.log(`Starting bots for quarantine`);
    
    goodProxiesMap.clear();
    badProxiesMap.clear();
    proxyRetryCountMap.clear();
    
    for (const [id, data] of quarantineMap.entries()) {
      try {
        console.log(`Starting bot for ${data.username} (ID: ${id})`);
        await startBot(id, data);
      } catch (err) {
        console.error(`Failed to start bot for ${id}:`, err);
      }
    }
  } catch (err) {
    console.error("Error in startnewbots:", err);
  }
}

async function initializeUserProxies(userId) {
  if (!goodProxiesMap.has(userId)) {
    try {
      const allProxies = await getAllUserProxies(userId);
      
      if (allProxies && allProxies.length > 0) {
        goodProxiesMap.set(userId, [...allProxies]);
        badProxiesMap.set(userId, []);
        console.log(`Initialized ${allProxies.length} proxies for user ${userId}`);
      } else {
        console.error(`No proxies found for user ${userId}`);
        goodProxiesMap.set(userId, []);
        badProxiesMap.set(userId, []);
      }
    } catch (err) {
      console.error(`Error initializing proxies for user ${userId}:`, err);
      goodProxiesMap.set(userId, []);
      badProxiesMap.set(userId, []);
    }
  }
}

async function getAllUserProxies(userId) {
  try {
    const proxyString = await getproxy(userId);
    if (!proxyString) return [];
    
    return [proxyString];
  } catch (err) {
    console.error(`Error getting all proxies for user ${userId}:`, err);
    return [];
  }
}

async function getNextGoodProxy(userId) {
  if (!goodProxiesMap.has(userId)) {
    await initializeUserProxies(userId);
  }
  
  const goodProxies = goodProxiesMap.get(userId) || [];
  
  if (goodProxies.length === 0) {
    console.error(`No good proxies left for user ${userId}`);
    return null;
  }
  
  return goodProxies[0];
}

/**
 * Mark a proxy as bad and remove it from good proxies list
 */
function markProxyAsBad(userId, proxyString) {
  if (!goodProxiesMap.has(userId) || !badProxiesMap.has(userId)) {
    goodProxiesMap.set(userId, []);
    badProxiesMap.set(userId, []);
  }
  
  const goodProxies = goodProxiesMap.get(userId);
  const badProxies = badProxiesMap.get(userId);
  
  const proxyIndex = goodProxies.indexOf(proxyString);
  if (proxyIndex !== -1) {
    goodProxies.splice(proxyIndex, 1);
  }
  
  if (!badProxies.includes(proxyString)) {
    badProxies.push(proxyString);
  }
  
  console.log(`Marked proxy as bad for user ${userId}. Good proxies left: ${goodProxies.length}`);
}

/**
 * Check if an error is a proxy-related error
 */
function isProxyError(err) {
  if (!err || !err.message) return false;
  
  const errMsg = err.message.toLowerCase();
  return (
    errMsg.includes('authentication failed') || 
    errMsg.includes('getaddrinfo') || 
    errMsg.includes('invalid socks proxy details') ||
    errMsg.includes('hostunreachable') ||
    errMsg.includes('host unreachable') ||
    errMsg.includes('connection refused') ||
    errMsg.includes('timeout') ||
    errMsg.includes('econnrefused') ||
    errMsg.includes('enotfound') ||
    errMsg.includes('enetunreach') ||
    errMsg.includes('ehostunreach') ||
    errMsg.includes('socket hang up') ||
    errMsg.includes('proxy') ||
    errMsg.includes('socks')
  );
}

/**
 * Check if an error is an authentication-related error
 */
function isAuthError(err) {
  if (!err || !err.message) return false;
  
  const errMsg = err.message.toLowerCase();
  return (
    errMsg.includes('failed to authenticate') ||
    errMsg.includes('invalid profileid') ||
    errMsg.includes('forbiddenoperationexception') ||
    errMsg.includes('forbidden operation') ||
    errMsg.includes('invalid session') ||
    errMsg.includes('authentication')
  );
}

/**
 * Handle proxy errors with proper retry logic
 */
async function handleProxyError(id, data, proxyString, err) {
  const userId = id.split('|')[1];
  const { username } = data;
  
  console.error(`Proxy error for ${username}: ${err.message}`);
  
  if (!proxyRetryCountMap.has(id)) {
    proxyRetryCountMap.set(id, {});
  }
  
  const proxyRetries = proxyRetryCountMap.get(id);
  if (!proxyRetries[proxyString]) {
    proxyRetries[proxyString] = 0;
  }
  
  proxyRetries[proxyString]++;
  
  const goodProxies = goodProxiesMap.get(userId) || [];
  const isOnlyProxy = goodProxies.length <= 1;
  const maxRetries = isOnlyProxy ? 15 : 1;
  
  console.log(`Proxy retry ${proxyRetries[proxyString]}/${maxRetries} for ${username}`);
  
  if (proxyRetries[proxyString] > maxRetries) {
    console.log(`Proxy ${proxyString} failed too many times. Marking as bad.`);
    markProxyAsBad(userId, proxyString);
    
    if (goodProxiesMap.get(userId).length === 0) {
      console.log(`Calling bot.end() - Reason: No good proxies left`);
      await removeQuarantineAndStopBot(id, "No good proxies left, retry!", "No good proxies left");
      return false; // Don't retry
    }
  }
  
  return true; // Allow retry
}

/**
 * Handle authentication errors with rate limiting
 */
async function handleAuthError(id, data, err) {
  const { username } = data;
  const errMsg = err.message.toLowerCase();
  
  if (errMsg.includes('failed to authenticate')) {
    if (!authFailuresMap.has(id)) {
      authFailuresMap.set(id, []);
    }
    
    const failures = authFailuresMap.get(id);
    const currentTime = Date.now();
    
    failures.push(currentTime);
    
    const recentFailures = failures.filter(time => currentTime - time <= 25000);
    authFailuresMap.set(id, recentFailures);
    
    if (recentFailures.length >= 5) {
      console.log(`Calling bot.end() - Reason: Too many authentication failures (${recentFailures.length} in 25s)`);
      await removeQuarantineAndStopBot(id, `Minecraft Username isn't correct, ssid is likely expired. Use /quarantine to start quarantine up again using a valid SSID!`, "Authentication failure");
      return false; // Don't retry
    }
    
    return true; // Allow retry
  } else if (errMsg.includes('invalid profileid')) {
    console.log(`Calling bot.end() - Reason: Invalid profile ID`);
    await removeQuarantineAndStopBot(id, `Minecraft UUID isn't correct, ssid is likely expired. Use /quarantine to start quarantine up again using a valid SSID!`, "Invalid profile ID");
    return false;
  } else if (errMsg.includes('forbiddenoperationexception') || errMsg.includes('forbidden operation')) {
    console.log(`Calling bot.end() - Reason: Forbidden operation`);
    await removeQuarantineAndStopBot(id, `Got forbidden error, SSID likely got invalidated. Generate a new one and restart quarantine using /quarantine if you wish to.`, "Forbidden operation");
    return false;
  } else if (errMsg.includes('invalid session') || errMsg.includes('authentication')) {
    console.log(`Calling bot.end() - Reason: Session error`);
    await removeQuarantineAndStopBot(id, `Session error: ${err.message}`, "Session error");
    return false;
  }
  
  return true; // Allow retry for other auth errors
}

/**
 * Start a bot for a specific user in quarantine
 */
async function startBot(id, data, attempt = 0) {
  let bot = null;
  
  try {
    if (activeBots.has(id)) {
      const existingBot = activeBots.get(id);
      console.log(`Calling bot.end() - Reason: Restarting existing bot`);
      try {
        existingBot.end();
      } catch (endErr) {
        console.error(`Error ending existing bot:`, endErr);
      }
      activeBots.delete(id);
    }
    
    const { username, uuid, ssid } = data;
    const userId = id.split('|')[1];
    
    if (!proxyRetryCountMap.has(id)) {
      proxyRetryCountMap.set(id, {});
    }
    
    if (!goodProxiesMap.has(userId)) {
      await initializeUserProxies(userId);
    }
    
    const proxyString = await getNextGoodProxy(userId);
    if (!proxyString) {
      console.error(`No proxy found for user ${userId}. Cannot start bot for ${username}`);
      console.log(`Calling bot.end() - Reason: No available proxies`);
      await removeQuarantineAndStopBot(id, `No good proxies left, retry!`, "No available proxies");
      return;
    }
    
    const proxyRetries = proxyRetryCountMap.get(id);
    if (!proxyRetries[proxyString]) {
      proxyRetries[proxyString] = 0;
    }
    
    const proxyParts = proxyString.split(':');
    const proxy = {
      host: proxyParts[0],
      port: parseInt(proxyParts[1]),
      type: 5
    };
    
    if (proxyParts.length >= 4) {
      proxy.userId = proxyParts[2];
      proxy.password = proxyParts[3];
    }
    
    const botOptions = {
      host: 'mc.hypixel.net',
      port: 25565,
      version: '1.8.9',
      username: username,
      session: {
        accessToken: ssid,
        clientToken: uuid,
        selectedProfile: {
          id: uuid,
          name: username,
        },
      },
      auth: 'mojang',
      skipValidation: true,
      connect: (client) => {
        return new Promise((resolve, reject) => {
          const options = {
            proxy: proxy,
            destination: {
              host: 'mc.hypixel.net',
              port: 25565
            },
            command: 'connect'
          };
          
          const connectionTimeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 30000);
          
          SocksClient.createConnection(options, (err, info) => {
            clearTimeout(connectionTimeout);
            
            if (err) {
              console.error(`Error creating SOCKS connection for ${username}:`, err);
              reject(err);
              return;
            }
            
            proxyRetries[proxyString] = 0;
            
            console.log(`Connected through proxy for ${username}.`);
            client.setSocket(info.socket);
            client.emit('connect');
            resolve();
          });
        });
      }
    };

    bot = mineflayer.createBot(botOptions);
    activeBots.set(id, bot);
    
    bot.on('spawn', () => {
      console.log(`Bot ${username} spawned successfully`);
    });
    
    bot.on('login', () => {
      console.log(`Bot ${username} logged in successfully`);
    });

    bot.on('kicked', async (reason) => {
      console.log(`Bot ${username} was kicked: ${reason}`);
      
      const reasonStr = String(reason).toLowerCase();
      
      if (reasonStr.includes('ban') || reasonStr.includes('blocked')) {
        try {
          const banData = await bancheck(ssid);
          if (banData && banData.ban) {
            console.log(`Calling bot.end() - Reason: Account banned (${banData.banReason})`);
            await removeQuarantineAndStopBot(id, `Banned: ${banData.banReason}`, "Account banned");
            return;
          }
        } catch (err) {
          console.error(`Error checking ban status for ${username}:`, err);
        }
      }

      if (reasonStr.includes('failed to authenticate your connection')) {
        const shouldRetry = await handleAuthError(id, data, { message: reason });
        if (!shouldRetry) return;
      } else if (reasonStr.includes('invalid profileid')) {
        console.log(`Calling bot.end() - Reason: Invalid profile ID in kick`);
        await removeQuarantineAndStopBot(id, `Minecraft UUID isn't correct, ssid is likely expired. Use /quarantine to start quarantine up again using a valid SSID!`, "Invalid profile ID");
        return;
      } else if (reasonStr.includes('forbiddenoperationexception') || reasonStr.includes('forbidden operation')) {
        console.log(`Calling bot.end() - Reason: Forbidden operation in kick`);
        await removeQuarantineAndStopBot(id, `Got forbidden error, SSID likely got invalidated. Generate a new one and restart quarantine using /quarantine if you wish to.`, "Forbidden operation");
        return;
      }

      if (reasonStr.includes('invalid session') || reasonStr.includes('authentication')) {
        console.log(`Calling bot.end() - Reason: Session issue in kick`);
        await removeQuarantineAndStopBot(id, `session_issue|${reason}`, "Session issue");
        return;
      }
      
      // For regular kicks, just reconnect without ending the bot
      if (quarantineMap.has(id)) {
        const delay = generaterandomdelay();
        console.log(`Reconnecting bot for ${username} in ${delay/1000} seconds after kick (not ending bot)`);
        setTimeout(() => {
          startBot(id, data, attempt + 1).catch(err => {
            console.error(`Error restarting bot for ${username}:`, err);
          });
        }, delay);
      }
    });

    bot.on("error", async (err) => {
      console.error(`Bot ${username} encountered an error:`, err);
      
      if (err.message && err.message.toLowerCase().includes('insufficient')) {
        console.log(`Calling bot.end() - Reason: Multiplayer disabled`);
        await removeQuarantineAndStopBot(id, "Multiplayer is disabled on this SSID.", "Multiplayer disabled");
        return;
      }
      
      if (err.message === 'no_good_proxies') {
        console.log(`Calling bot.end() - Reason: No good proxies left`);
        await removeQuarantineAndStopBot(id, "No good proxies left, retry!", "No good proxies left");
        return;
      }

      if (isAuthError(err)) {
        const shouldRetry = await handleAuthError(id, data, err);
        if (!shouldRetry) return;
      }

      if (isProxyError(err)) {
        const shouldRetry = await handleProxyError(id, data, proxyString, err);
        if (!shouldRetry) return;
      }

      if (err.message && (err.message.toLowerCase().includes('ban') || err.message.toLowerCase().includes('blocked'))) {
        try {
          const banData = await bancheck(ssid);
          if (banData && banData.ban) {
            console.log(`Calling bot.end() - Reason: Account banned (${banData.banReason})`);
            await removeQuarantineAndStopBot(id, `Account is banned: ${banData.banReason}`, "Account banned");
            return;
          }
        } catch (banErr) {
          console.error(`Error checking ban status for ${username}:`, banErr);
        }
      }

      // For other errors, just reconnect without ending the bot
      if (quarantineMap.has(id)) {
        const delay = generaterandomdelay();
        console.log(`Reconnecting bot for ${username} in ${delay/1000} seconds after error (not ending bot)`);
        setTimeout(() => {
          startBot(id, data, attempt + 1).catch(err => {
            console.error(`Error restarting bot for ${username}:`, err);
          });
        }, delay);
      }
    });

    bot.on('end', (reason) => {
      console.log(`Bot ${username} ended`, reason ? `with reason: ${reason}` : '');
      activeBots.delete(id);
    });

  } catch (err) {
    console.error(`Error in startBot for ${data ? data.username : 'unknown'}:`, err);
    
    if (bot) {
      console.log(`Calling bot.end() - Reason: Error in startBot catch block`);
      try {
        bot.end();
      } catch (endErr) {
        console.error(`Error ending bot in catch block:`, endErr);
      }
      activeBots.delete(id);
    }
    
    if (err.message === 'no_good_proxies') {
      console.log(`Calling bot.end() - Reason: No good proxies in catch`);
      await removeQuarantineAndStopBot(id, "No good proxies left, retry!", "No good proxies left");
      return;
    }

    if (isAuthError(err)) {
      const shouldRetry = await handleAuthError(id, data, err);
      if (!shouldRetry) return;
    }
    
    if (isProxyError(err)) {
      const proxyString = await getNextGoodProxy(data.id ? data.id.split('|')[1] : id.split('|')[1]);
      const shouldRetry = await handleProxyError(id, data, proxyString, err);
      if (!shouldRetry) return;
    }
    
    if (quarantineMap.has(id)) {
      const delay = generaterandomdelay();
      console.log(`Retrying bot start for ${data.username} in ${delay/1000} seconds`);
      setTimeout(() => {
        startBot(id, data, attempt + 1).catch(err => {
          console.error(`Error retrying bot start for ${data.username}:`, err);
        });
      }, delay);
    }
  }
}

/**
 * Initialize the quarantine handler
 */
async function quarantinehandler() {
  try {
    console.log("Starting quarantine handler...");
    await startnewbots();
    
    setInterval(async () => {
      try {
        await checkQuarantineStatus();
      } catch (err) {
        console.error("Error in quarantine status check:", err);
      }
    }, 60000);
    
    console.log("Quarantine handler started successfully");
  } catch (err) {
    console.error("Error in quarantinehandler:", err);
  }
}

/**
 * Check status of all bots in quarantine and restart if needed
 */
async function checkQuarantineStatus() {
  try {
    for (const [id, data] of quarantineMap.entries()) {
      if (!activeBots.has(id)) {
        console.log(`Detected inactive bot for ${data.username}, restarting...`);
        try {
          await startBot(id, data);
        } catch (err) {
          console.error(`Failed to restart bot for ${data.username}:`, err);
        }
      }
    }

    for (const id of activeBots.keys()) {
      if (!quarantineMap.has(id)) {
        const bot = activeBots.get(id);
        const username = bot.username || "unknown";
        console.log(`Calling bot.end() - Reason: No longer in quarantine map`);
        try {
          bot.end();
        } catch (endErr) {
          console.error(`Error ending bot in status check:`, endErr);
        }
        activeBots.delete(id);
      }
    }
  } catch (err) {
    console.error("Error in checkQuarantineStatus:", err);
  }
}

/**
 * Stop a bot by its ID
 */
function stopBotById(id) {
  if (activeBots.has(id)) {
    const bot = activeBots.get(id);
    const username = bot.username || "unknown";
    console.log(`Calling bot.end() - Reason: Manual stop requested`);
    try {
      bot.end();
    } catch (endErr) {
      console.error(`Error stopping bot by ID:`, endErr);
    }
    activeBots.delete(id);
    return true;
  }
  console.log(`No active bot found with ID ${id}`);
  return false;
}

/**
 * Remove a user from quarantine and stop their bot
 */
async function removeQuarantineAndStopBot(id, reason, endReason = "Quarantine removed") {
  try {
    await removequarantine(id, reason);
    
    if (activeBots.has(id)) {
      const bot = activeBots.get(id);
      const username = bot.username || "unknown";

      console.log(`Calling bot.end() - Reason: ${endReason}`);
      try {
        bot.end();
      } catch (endErr) {
        console.error(`Error ending bot in removeQuarantine:`, endErr);
      }
      activeBots.delete(id);
    }
    
    if (authFailuresMap.has(id)) {
      authFailuresMap.delete(id);
    }
    
    if (proxyRetryCountMap.has(id)) {
      proxyRetryCountMap.delete(id);
    }
    
    return true;
  } catch (err) {
    console.error(`Error removing quarantine and stopping bot ${id}:`, err);
    return false;
  }
}

const MS_IN_24H = 23 * 60 * 60 * 1000 + 59 * 60 * 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkexpiredq() {
  while (true) {
    try {
      const rows = await queryParams("SELECT id, name, time FROM quarantine", [], "all");
      const now = Date.now();

      for (const data of rows) {
        const quarantinedAt = new Date(data.time).getTime();
        if (now - quarantinedAt >= MS_IN_24H) {
          console.log(`Calling bot.end() - Reason: Quarantine timed out (24h)`);
          await removeQuarantineAndStopBot(data.id, "Quarantine timed out (24h)", "Finished quarantine!");
          console.log(`Removed expired quarantine entry for ${data.name} (ID: ${data.id})`);
        }
      }
    } catch (error) {
      console.error("Error checking expired quarantine entries:", error);
    }

    await sleep(60000);
  }
}

module.exports = {
  quarantinehandler,
  startnewbots,
  startBot,
  stopBotById,
  removeQuarantineAndStopBot,
  checkexpiredq
};