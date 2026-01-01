const mineflayer = require('mineflayer');
const { SocksClient } = require('socks');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const config = require('../../../config.json');

const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalProcessEmitWarning = process.emitWarning;

console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('[deprecated]') || message.includes('mojang auth') || 
        message.includes('https://help.minecraft.net/hc/en-us/articles/')) {
        return;
    }
    originalConsoleLog.apply(console, args);
};

console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('[deprecated]') || message.includes('mojang auth') || 
        message.includes('https://help.minecraft.net/hc/en-us/articles/')) {
        return;
    }
    originalConsoleWarn.apply(console, args);
};

process.emitWarning = function(warning, ...args) {
    if (typeof warning === 'string' && 
        (warning.includes('[deprecated]') || warning.includes('mojang auth'))) {
        return;
    }
    originalProcessEmitWarning.apply(process, [warning, ...args]);
};
let proxies = [];

try {
    if (config.useproxy === true || config.useproxy === "true") {
        if (Array.isArray(config.proxy) && config.proxy.length > 0) {
            proxies = config.proxy.map(proxyStr => {
                const [ip, port, username, password] = proxyStr.split(':');
                return { ip, port, username, password };
            });
        } else if (typeof config.proxy === 'string' && config.proxy) {
            const [ip, port, username, password] = config.proxy.split(':');
            proxies = [{ ip, port, username, password }];
        }
    }

    if (proxies.length === 0) {
        throw new Error('No valid proxies found in config.json');
    }
    console.log(`Loaded ${proxies.length} proxies from config.json`);
} catch (err) {
    console.error('Error loading proxies:', err.message);
}

let currentProxyIndex = 0;

function getNextProxy() {
    if (proxies.length === 0) {
        return null;
    }
    const proxy = proxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
    return proxy;
}

async function checkIfUserIsOnline(uuid) {
    try {
        const response = await axios({
            method: "GET",
            url: `https://hypixel.paniek.de/player/${uuid}/status`,
        });
        return response?.data?.status?.online === true;
    } catch (error) {
        return false;
    }
}

async function attemptConnection(username, uuid, ssid, proxy) {
    return new Promise((resolve, reject) => {
        console.log(`[BANCHECK] Connecting ${username} to Hypixel via proxy ${proxy.ip}:${proxy.port}`);

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
            hideErrors: true,
            connect: (client) => {
                if (!proxy || !proxy.ip || !proxy.port || !proxy.username || !proxy.password) {
                    client.emit('error', new Error('Invalid proxy configuration'));
                    return;
                }
                
                const options = {
                    proxy: {
                        host: proxy.ip,  
                        port: parseInt(proxy.port),
                        type: 5,
                        userId: proxy.username,
                        password: proxy.password
                    },
                    destination: {
                        host: 'mc.hypixel.net',
                        port: 25565
                    },
                    command: 'connect'
                };

                SocksClient.createConnection(options, (err, info) => {
                    if (err) {
                        console.log(`[BANCHECK] SOCKS connection failed: ${err.message}`);
                        let errmsg = err.message.toLowerCase();
                        if (errmsg.includes('authentication failed')) {
                            resolve({ 
                                status: 'proxyauth', 
                                username, 
                                uuid 
                            });
                        }
                        else if (errmsg.includes('getaddrinfo')) {
                            resolve({ 
                                status: 'proxyhost', 
                                username, 
                                uuid 
                            });
                        }
                        else if (errmsg.includes('invalid socks proxy details')) {
                            resolve({ 
                                status: 'proxy', 
                                username, 
                                uuid 
                            });
                        } 
                        else if (errmsg.includes('hostunreachable')) {
                            resolve({ 
                                status: 'proxydown', 
                                username, 
                                uuid 
                            }); 
                        }
                        else {
                            resolve({ 
                                status: 'proxyerror', 
                                error: 'Proxy connection failed',
                                username, 
                                uuid 
                            });
                        }
                        return;
                    }
                    console.log(`[BANCHECK] SOCKS proxy connected successfully`);
                    client.setSocket(info.socket);
                    client.emit('connect');
                });
            }
        };

        const bot = mineflayer.createBot(botOptions);
        let timeout;

        bot.once('spawn', () => {
            console.log(`[BANCHECK] ✅ ${username} successfully logged into Hypixel!`);

            timeout = setTimeout(() => {
                console.log(`[BANCHECK] ✅ ${username} stayed connected for 500ms - UNBANNED`);
                bot.end();
                resolve({ status: 'unbanned', username, uuid });
            }, 500);
        });


        bot.on('kicked', (reason) => {
            console.log(`[BANCHECK] ❌ ${username} was KICKED from Hypixel:`);
            console.log(`[BANCHECK] Kick reason: ${JSON.stringify(reason)}`);
            clearTimeout(timeout);
            bot.end();
            resolve({ status: 'kicked', reason, username, uuid });
        });

        bot.on('end', () => {
            console.log(`[BANCHECK] Connection ended for ${username}`);
            clearTimeout(timeout);
        });

        bot.on('error', (error) => {
            console.log(`[BANCHECK] ❌ Bot error for ${username}: ${error.message}`);
            clearTimeout(timeout);
            bot.end();
            reject(error);
        });
    });
}

function parseBanTime(timeStr) {
    let seconds = 0;
    const matches = timeStr.match(/\d+[dhms]/g) || [];

    matches.forEach(match => {
        const value = parseInt(match);
        switch(match.slice(-1)) {
            case 'd': seconds += value * 86400; break;
            case 'h': seconds += value * 3600; break;
            case 'm': seconds += value * 60; break;
            case 's': seconds += value; break;
        }
    });

    return seconds > 0 ? Math.floor(Date.now() / 1000) + seconds : null;
}

function getBanId(text) {
    const fullText = text.toLowerCase();
    let banIdMatch = fullText.match(/ban id: (#[a-z0-9]+)/i);
    if (!banIdMatch) banIdMatch = fullText.match(/block id: (#[a-z0-9]+)/i);
    if (!banIdMatch) banIdMatch = fullText.match(/#([a-z0-9]+)\b/);
    return banIdMatch ? (banIdMatch[1].startsWith('#') ? banIdMatch[1] : `#${banIdMatch[1]}`) : null;
}

function parseBanReason(reason, profile) {
    try {
        const reasonJson = typeof reason === 'string' ? JSON.parse(reason) : reason;
        const fullText = reasonJson.extra ? reasonJson.extra.map(e => e.text).join('').toLowerCase() : '';

        if (fullText.includes('failed to authenticate') || fullText.includes('invalid session')){
                return { 
                banId: null, 
                banReason: 'Invalid SSID - authentication failed',
                unbanTime: null,
                ban: `Couldn't check ban:`,
                username: profile?.name || null,
                uuid: profile?.id || null
            };
        }
        
        if (fullText.includes('you logged in from another location') || fullText.includes('disconnected')) {
            return { 
                banId: null, 
                banReason: 'online',
                unbanTime: null,
                ban: `Couldn't check ban:`,
                username: profile?.name || null,
                uuid: profile?.id || null
            };
        }
        
        if (fullText.includes('closed')) {
            return { 
                banId: null, 
                banReason: null, 
                unbanTime: null,
                ban: false,
                username: profile?.name || null,
                uuid: profile?.id || null
            };
        }
        
        const banId = getBanId(fullText);
        let banReason = 'unknown';
        let unbanTime = null;

        const timeMatch = fullText.match(/(\d+[dhms]\s*)+/);
        if (timeMatch) {
            unbanTime = parseBanTime(timeMatch[0]);
        }

        if (fullText.includes('blocked') || fullText.includes('permanent')) {
            unbanTime = 'never';
        }

        if (fullText.includes('suspicious activity has been detected on your account')) {
            banReason = 'security';
        } else if (fullText.includes('cheating through the use of unfair game advantages')) {
            banReason = 'cheating';
        } else if (fullText.includes('boosting detected')) {
            banReason = 'sbboosting';
        } else if (fullText.includes('boosting to')) {
            banReason = 'boosting';
        } else if (fullText.includes('extreme chat infraction')) {
            banReason = 'chat';
        } else if (fullText.includes('team')) {
            banReason = 'teaming';
        } else if (fullText.includes(`your account's security appeal was processed and the account has entered a recovery phase`)) {
            banReason = 'already appealed';
        }

        return { 
            banId, 
            banReason, 
            unbanTime, 
            ban: true,
            username: profile?.name || null,
            uuid: profile?.id || null,
            banTimeFormatted: unbanTime === 'never' ?
                'Permanent' :
                (unbanTime ? new Date(unbanTime * 1000).toLocaleString() : 'Unknown duration')
        };
    } catch (e) {
        return { 
            banId: null, 
            banReason: 'error', 
            unbanTime: null,
            ban: `Couldn't check ban:`,
            username: profile?.name || null,
            uuid: profile?.id || null
        };
    }
}

async function getProfileData(sessionId) {
    try {
        const response = await fetch('https://api.minecraftservices.com/minecraft/profile', {
            headers: {
                'Authorization': `Bearer ${sessionId}`,
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            },
            timeout: 3000 
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data?.id && data?.name ? { id: data.id, name: data.name } : null;
    } catch (error) {
        return null;
    }
}

async function banchecker(username, uuid, ssid, retries = 1) {
    let lastError = null;
    

    for (let attempt = 0; attempt <= retries; attempt++) {
        const proxy = getNextProxy();
        console.log(`Bancheck Proxy: ${JSON.stringify(proxy)}`)
        
        if (!proxy) {
            return {
                status: 'error',
                error: 'No proxies configured in config.json',
                username,
                uuid
            };
        }

        try {
            const result = await attemptConnection(username, uuid, ssid, proxy);
            
            if (result.status === 'unbanned') {
                return { status: 'unbanned', username, uuid };
            }
            
            if (result.status === 'kicked') {
                return result;
            }

            if (['proxyauth', 'proxyhost', 'proxy', 'proxydown', 'proxyerror'].includes(result.status)) {
                return result; 
            }

            lastError = new Error('Unknown connection result');
        } catch (error) {
            lastError = error;
          
            if (error.message && error.message.toLowerCase().includes('insufficient')) {
                return { 
                    status: 'error', 
                    error: 'Multiplayer is off', 
                    username, 
                    uuid 
                };
            }

            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay between retries
            }
        }
    }

    throw lastError || new Error('All connection attempts failed');
}

async function bancheck(ssid) {
    console.log(`[BANCHECK] Starting ban check for SSID: ${ssid.substring(0, 10)}...`);
    
    const profile = await getProfileData(ssid);
    if (!profile) {
        console.log(`[BANCHECK] Failed to get profile data - invalid SSID`);
        return { 
            banReason: 'invalid_token', 
            ban: `Couldn't check ban:` 
        };
    }

    console.log(`[BANCHECK] Profile found: ${profile.name} (${profile.id})`);

    try {
        const result = await banchecker(profile.name, profile.id, ssid, 1);
        console.log(`[BANCHECK] Final result: ${JSON.stringify(result)}`);
        
        if (result.status === 'online') {
            return {
                banReason: 'User is online!',
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'unbanned') {
            return {
                ban: false,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'kicked') {
            return parseBanReason(result.reason, profile);
        } 
        else if (result.status === 'proxyauth') {
            return {
                banReason: "Invalid proxy authentication (username/password)",
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'proxyhost') {
            return {
                banReason: "Invalid proxy host (getaddrinfo error)",
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'proxy') {
            return {
                banReason: "Invalid proxy details",
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'proxydown') {
            return {
                banReason: "Proxy is down!",
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            }; 
        } else if (result.status === 'proxyerror') {
            return {
                banReason: result.error || "General proxy error",
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        } else if (result.status === 'error') {
            return {
                banReason: result.error || 'error',
                ban: `Couldn't check ban:`,
                username: profile.name,
                uuid: profile.id
            };
        }
    } catch (error) {
        if (error.message && error.message.toLowerCase().includes('insufficient')) {
            return {
                ban: `Couldn't check ban:`,
                banReason: "multiplayer",
                username: profile.name,
                uuid: profile.id
            };
        }

        if (
            error.message &&
            (
                error.message.toLowerCase().includes('authentication failed') ||
                error.message.toLowerCase().includes('getaddrinfo enotfound') ||
                error.message.toLowerCase().includes('invalid socks proxy details') ||
                error.message.toLowerCase().includes('hostunreachable')
            )
        ) {
            let reason = 'Proxy error';
            
            if (error.message.toLowerCase().includes('authentication failed')) {
                reason = 'Wrong Auth';
            } else if (error.message.toLowerCase().includes('getaddrinfo enotfound')) {
                reason = 'Wrong Host';
            } else if (error.message.toLowerCase().includes('invalid socks proxy details')) {
                reason = 'Invalid Proxy Details';
            } else if (error.message.toLowerCase().includes('hostunreachable')) {
                reason = 'Host Unreachable';
            }

            return {
                ban: `Couldn't check ban:`,
                banReason: `Proxy: ${reason}`,
                username: profile.name,
                uuid: profile.id
            };
        }

        if (error.message && error.message.toLowerCase().includes('invalid profileid')) {
            return {
                ban: `Couldn't check ban:`,
                banReason: "Invalid UUID, couldn't logon to Hypixel. Maybe the name on this SSID just changed?",
                username: profile.name,
                uuid: profile.id
            };
        }

        if (error.message && error.message.toLowerCase().includes('forbiddenoperationexception')) {
            return {
                ban: `Couldn't check ban:`,
                banReason: "Invalid SSID!",
                username: profile.name,
                uuid: profile.id
            };
        }
        
        if (error.message === 'Timeout') {
            return {
                ban: `Couldn't check ban:`,
                banReason: 'timeout',
                username: profile.name,
                uuid: profile.id
            };
        }

        return {
            ban: `Couldn't check ban:`,
            banReason: "error",
            username: profile.name,
            uuid: profile.id
        };
    }
}

module.exports = { bancheck };