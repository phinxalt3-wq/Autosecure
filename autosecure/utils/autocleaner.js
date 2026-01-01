const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

/**
 * Monitors a folder and deletes newly added image files after 30 seconds.
 * @param {string} folderPath - The absolute or relative path to the folder you want to watch.
 * @param {number} [delaySeconds=30] - Delay before deletion in seconds (optional).
 */
function startFolderMonitor(folderPath, delaySeconds = 30) {
    const absolutePath = path.resolve(folderPath);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

    console.log(`[Monitor] Watching folder: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
    }

    const watcher = chokidar.watch(absolutePath, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('add', (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!validExtensions.includes(ext)) return;

        const fileName = path.basename(filePath);
        console.log(`[Monitor] New image detected: ${fileName}`);

        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`[image] Failed`, err.message);
                }
            });
        }, delaySeconds * 1000);
    });
}

// Export the function
module.exports = { startFolderMonitor };
