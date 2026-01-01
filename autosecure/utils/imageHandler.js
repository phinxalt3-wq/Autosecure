const { makeCard } = require('./drawhit.js');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const https = require('https');
const crypto = require('crypto');

async function generateAndSendImage(acc, interaction) {
    try {
        // Only generate image if account has Minecraft
        if (!acc.newName || acc.newName === "No Minecraft!") {
            console.log('[IMAGE_HANDLER] Account has no Minecraft, skipping image generation');
            return;
        }

        console.log(`[IMAGE_HANDLER] Generating image for ${acc.newName}`);
        
        // Prepare stats data for image generation
        const stats = {
            username: acc.newName,
            networth: acc.networth || "Unknown",
            bedwars: acc.bedwarsLevel || "0",
            networkLevel: acc.networkLevel || "1",
            sbLevel: acc.sbLevel || "0", 
            duelKDR: acc.duelKDR || "0",
            duelWinstreak: acc.duelWinstreak || "0",
            plusColour: acc.plusColour || "None",
            gifted: acc.gifted || "0"
        };

        // Generate image
        const outputPath = path.join(__dirname, 'temp', `${acc.newName}_stats.png`);
        
        // Create temp directory if it doesn't exist
        const tempDir = path.dirname(outputPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const buffer = await makeCard(stats, outputPath);
        
        // Create Discord attachment
        const attachment = new AttachmentBuilder(buffer, { name: `${acc.newName}_stats.png` });
        
        // Send the image
        await interaction.user.send({
            content: `🎮 **Minecraft Account Stats for ${acc.newName}**`,
            files: [attachment]
        });
        
        console.log(`[IMAGE_HANDLER] Successfully sent image for ${acc.newName}`);
        
        // Clean up temp file
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
        
    } catch (error) {
        console.error('[IMAGE_HANDLER] Error generating/sending image:', error);
    }
}

async function getSkinAttachment(username, hideUsername = false) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
        console.warn('[IMAGE_HANDLER] Invalid username provided, skipping skin attachment');
        return null;
    }

    try {
        console.log(`[IMAGE_HANDLER] Generating skin attachment for ${hideUsername ? 'HIDDEN' : username}`);
        const randomId = crypto.randomBytes(8).toString('hex');
        const filename = `${randomId}.png`;
        const tempPath = path.join(__dirname, '../temp/skins', filename);

        // Create temp directory if it doesn't exist
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Encode username for URL to handle special characters
        const encodedUsername = encodeURIComponent(username);
        const imageUrl = `https://visage.surgeplay.com/bust/${encodedUsername}.png?y=-40&quality=lossless`;
        
        await new Promise((resolve, reject) => {
            const request = https.get(imageUrl, (response) => {
                // Handle redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    request.destroy();
                    // Follow redirect
                    https.get(response.headers.location, (redirectResponse) => {
                        if (redirectResponse.statusCode !== 200) {
                            reject(new Error(`Failed to download image after redirect: ${redirectResponse.statusCode}`));
                            return;
                        }
                        const fileStream = fs.createWriteStream(tempPath);
                        redirectResponse.pipe(fileStream);
                        fileStream.on('finish', () => {
                            fileStream.close();
                            resolve();
                        });
                        fileStream.on('error', reject);
                    }).on('error', reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    // Consume response data to free up memory
                    response.resume();
                    reject(new Error(`Failed to download image: ${response.statusCode} - ${response.statusMessage || 'Unknown error'}`));
                    return;
                }

                const fileStream = fs.createWriteStream(tempPath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });

                fileStream.on('error', (err) => {
                    // Clean up file on error
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                    reject(err);
                });
            });

            request.on('error', (err) => {
                reject(new Error(`Network error downloading skin: ${err.message}`));
            });

            // Set timeout (10 seconds)
            request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout while downloading skin'));
            });
        });

        // Verify file was created and has content
        if (!fs.existsSync(tempPath)) {
            throw new Error('Skin file was not created');
        }

        const stats = fs.statSync(tempPath);
        if (stats.size === 0) {
            fs.unlinkSync(tempPath);
            throw new Error('Downloaded skin file is empty');
        }

        // Create attachment
        const attachment = new AttachmentBuilder(tempPath);
        console.log(`[IMAGE_HANDLER] Successfully created skin attachment with ID: ${randomId}`);

        // Clean up the file after 1 minute
        setTimeout(() => {
            if (fs.existsSync(tempPath)) {
                fs.unlink(tempPath, (err) => {
                    if (err) {
                        console.error('[IMAGE_HANDLER] Error deleting temp skin file:', err);
                    } else {
                        console.log(`[IMAGE_HANDLER] Cleaned up temp skin file: ${randomId}`);
                    }
                });
            }
        }, 60000);

        return attachment;
    } catch (error) {
        // Clean up temp file if it exists
        const tempPath = path.join(__dirname, '../temp/skins', `${crypto.randomBytes(8).toString('hex')}.png`);
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }

        // Log warning instead of error for expected failures (400, 404, etc.)
        if (error.message && error.message.includes('400')) {
            console.warn(`[IMAGE_HANDLER] Skin not available for ${hideUsername ? 'HIDDEN' : username} (400 Bad Request) - username may be invalid or API issue`);
        } else if (error.message && error.message.includes('404')) {
            console.warn(`[IMAGE_HANDLER] Skin not found for ${hideUsername ? 'HIDDEN' : username} (404 Not Found)`);
        } else {
            console.error(`[IMAGE_HANDLER] Error handling skin image for ${hideUsername ? 'HIDDEN' : username}:`, error.message || error);
        }
        return null;
    }
}

module.exports = { generateAndSendImage, getSkinAttachment };
