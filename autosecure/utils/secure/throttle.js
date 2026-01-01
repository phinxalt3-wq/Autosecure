/**
 * Request Throttler
 * Adds delays between sensitive operations to avoid triggering Microsoft's rate limiting / suspicious activity detection
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add a random jitter (±20%) to a base delay
 * @param {number} baseMs - Base delay in milliseconds
 * @returns {number} Jittered delay
 */
function jitterDelay(baseMs) {
    const jitter = baseMs * 0.2; // ±20%
    return baseMs + (Math.random() - 0.5) * 2 * jitter;
}

/**
 * Throttle function - waits before executing
 * Used to add delays between sensitive operations
 * @param {string} operation - Name of operation (for logging)
 * @param {number} delayMs - Base delay in milliseconds
 * @param {boolean} useJitter - Whether to add random jitter (default true)
 * @returns {Promise<void>}
 */
async function throttle(operation, delayMs = 1000, useJitter = true) {
    const actualDelay = useJitter ? jitterDelay(delayMs) : delayMs;
    if (actualDelay > 0) {
        console.log(`[THROTTLE] Waiting ${Math.round(actualDelay)}ms before ${operation}...`);
        await sleep(actualDelay);
    }
}

/**
 * Recommended delays for different operations
 * These are conservative to avoid triggering Microsoft's bot detection
 */
const DELAY_PRESETS = {
    BETWEEN_COOKIE_FETCHES: 800,     // Between AMRP/AMC fetches
    BETWEEN_LOGIN_ATTEMPTS: 2000,    // Between login retry attempts
    BEFORE_XBOX_LOGIN: 1500,         // Before Xbox Live roundtrip
    BEFORE_MINECRAFT: 1500,          // Before Minecraft profile fetch
    BEFORE_ACCOUNT_CHANGES: 2500,    // Before account modifications (add alias, change email, etc)
    BETWEEN_PARALLEL_SAFETY: 500,    // Small delay in parallel operations to stagger requests
    RECOVERY_CODE_VERIFY: 1000,      // Between recovery code verification attempts
};

module.exports = {
    sleep,
    jitterDelay,
    throttle,
    DELAY_PRESETS
};
