const express = require('express');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const router = express.Router();
const skinsCache = new Map();

// Ensure skins directory exists
const skinsDir = path.join(__dirname, '..', 'assets', 'skins');
if (!fs.existsSync(skinsDir)) {
    fs.mkdirSync(skinsDir, { recursive: true });
}

async function getSkinBuffer(username) {
    try {
        const response = await axios({
            url: `https://visage.surgeplay.com/bust/${username}.png?y=-40&quality=lossless`,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching skin:', error);
        return null;
    }
}

router.get('/skin/:token', async (req, res) => {
    const { token } = req.params;
    
    // Check if we have this token in our cache
    const skinPath = skinsCache.get(token);
    if (!skinPath) {
        return res.status(404).send('Skin not found');
    }

    // Send the skin file
    res.sendFile(skinPath);
});

async function getHiddenSkinUrl(username, baseUrl = 'http://localhost:3000') {
    try {
        // Generate random token
        const token = crypto.randomBytes(16).toString('hex');
        
        // Download and save skin
        const skinBuffer = await getSkinBuffer(username);
        if (!skinBuffer) {
            return null;
        }

        // Save with random name
        const skinPath = path.join(skinsDir, `${token}.png`);
        await fs.promises.writeFile(skinPath, skinBuffer);

        // Store in cache
        skinsCache.set(token, skinPath);

        // Clean old files after 1 hour
        setTimeout(() => {
            skinsCache.delete(token);
            fs.unlink(skinPath, () => {});
        }, 3600000); // 1 hour

        // Return the URL
        return `${baseUrl}/skins/skin/${token}`;
    } catch (error) {
        console.error('Error processing skin:', error);
        return null;
    }
}

module.exports = { router, getHiddenSkinUrl };