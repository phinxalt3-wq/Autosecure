/**
 * User-Agent Rotator
 * Rotates between realistic browser User-Agents to avoid detection as automated bot
 */

const USER_AGENTS = [
    // Chrome variants
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    
    // Firefox variants
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0',
    
    // Edge variants
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
];

let lastUsedIndex = -1;

/**
 * Get a random User-Agent from the pool
 * Tries to avoid using the same one twice in a row
 * @returns {string} A realistic browser User-Agent
 */
function getRandomUserAgent() {
    let index;
    do {
        index = Math.floor(Math.random() * USER_AGENTS.length);
    } while (index === lastUsedIndex && USER_AGENTS.length > 1);
    
    lastUsedIndex = index;
    return USER_AGENTS[index];
}

module.exports = {
    getRandomUserAgent,
    USER_AGENTS
};
