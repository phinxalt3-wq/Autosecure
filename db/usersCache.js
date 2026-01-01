    const { Client } = require("discord.js");
    const { tokens } = require("../config.json");
    console.log("[USERS_CACHE] Initializing users cache system...");
    
    let client = null;
    if (tokens && tokens[0]) {
        try {
            client = new Client({ intents: [] });
            client.login(tokens[0]).catch(err => {
                console.error("[USERS_CACHE] Failed to login:", err.message);
                client = null;
            });
            console.log("[USERS_CACHE] Discord client initialized");
        } catch (err) {
            console.error("[USERS_CACHE] Error creating Discord client:", err.message);
            client = null;
        }
    } else {
        console.error("[USERS_CACHE] No token found in config.json");
    }

    let usersCache = new Map()
    console.log("[USERS_CACHE] Users cache Map created");
    
    async function getUser(id) {
        console.log(`[USERS_CACHE] getUser() called with ID: ${id}`);
        if (isNaN(id) || id >= 9223372036854775807) {
            console.log(`[USERS_CACHE] Invalid ID provided: ${id}`);
            return { username: "Invalid ID" }
        }
        if (usersCache.has(id)) {
            console.log(`[USERS_CACHE] Cache HIT for user ID: ${id}`);
            let temp = usersCache.get(id)
            return temp
        } else {
            console.log(`[USERS_CACHE] Cache MISS for user ID: ${id}, fetching from Discord...`);
            let temp2 = await fetchUser(id)
            return temp2
        }
    }

    async function fetchUser(id) {
        console.log(`[USERS_CACHE] fetchUser() called with ID: ${id}`);
        if (!client) {
            console.log(`[USERS_CACHE] ERROR: Client not available for user ID: ${id}`);
            return { username: "User Cacher isn't accessible!" }
        }
        try {
            console.log(`[USERS_CACHE] Attempting to fetch user from Discord API: ${id}`);
            let user = await client.users.fetch(id)
            let resUser = {
                username: user.username,
                avatar: user.displayAvatarURL({ extension: "png", size: 128 }),
                discord_id: id
            }
            usersCache.set(id, resUser)
            console.log(`[USERS_CACHE] Successfully fetched and cached user: ${user.username} (${id})`);
            return resUser
        } catch (e) {
            console.log(`[USERS_CACHE] Error fetching user ${id}: ${e.message}`);
            if (e.message == "Expected token to be set for this request, but none was present") {
                console.log(`[USERS_CACHE] Token error for user ID: ${id}`);
                return { username: "User Cacher isn't accessible!" }
            } else if (e.message == "Unknown User") {
                console.log(`[USERS_CACHE] Unknown user ID: ${id}`);
                let resUser = { username: "Unknown User" }
                usersCache.set(id, resUser)
                return resUser
            } else {
                console.log(`[USERS_CACHE] Unexpected error for user ${id}: ${e.message}`);
                return { username: "Couldn't fetch your discord user" }
            }
        }
    }
    console.log("[USERS_CACHE] Module loaded successfully");
    module.exports = { getUser }
