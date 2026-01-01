const axios = require('axios');
const config = require("../../../config.json");
const { autosecurelogs } = require('../embeds/autosecurelogs');

const REFRESH_ENDPOINT = config.vpsip2 ? `http://${config.vpsip2}:8080/refreshkey` : null;
const FALLBACK_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

async function ensureSlot(queryParams, slotId) {
  const existing = await queryParams(`SELECT * FROM apikey WHERE id = ?`, [slotId]);
  if (!existing || existing.length === 0) {
    await queryParams(
      `INSERT INTO apikey (id, apikey, status, time) VALUES (?, ?, ?, ?)`,
      [slotId, null, 1, null]
    );
  } else if (existing[0].status !== 1) {
    await queryParams(
      `UPDATE apikey SET status = 1 WHERE id = ?`,
      [slotId],
      "run"
    );
  }
}

async function persistKey(queryParams, slotId, apiKey, expirationTime) {
  await queryParams(
    `INSERT OR REPLACE INTO apikey (id, apikey, status, time) VALUES (?, ?, 0, ?)`,
    [slotId, apiKey, expirationTime]
  );
}

async function triggerRemoteRefresh(mode) {
  if (!REFRESH_ENDPOINT) {
    throw new Error("vpsip2 is not configured in config.json");
  }
  if (!config.authkey) {
    throw new Error("authkey is missing in config.json");
  }

  const payload = { mode };
  const headers = { key: config.authkey };

  const response = await axios.post(REFRESH_ENDPOINT, payload, {
    headers,
    timeout: 60_000
  });

  return response?.data || null;
}

async function getnewkey(queryParams, mode = 'temporary') {
  if (config.novps === true || config.novps === "true") {
    throw new Error("Automatic refresh disabled (novps=true). Configure a lifetime key via /admin config.");
  }

  const slotId = mode === 'lifetime' ? 2 : 1;
  await ensureSlot(queryParams, slotId);

  await autosecurelogs(null, mode === 'lifetime' ? 'refreshkey_lifetime' : 'refreshkey');

  const remoteResponse = await triggerRemoteRefresh(mode).catch((err) => {
    throw new Error(`Remote refresh endpoint error: ${err.message}`);
  });

  if (remoteResponse?.key) {
    const expiration = remoteResponse.expiration
      ? Number(remoteResponse.expiration)
      : Date.now() + FALLBACK_EXPIRY;

    await persistKey(queryParams, slotId, remoteResponse.key, expiration);

    return {
      apiKey: remoteResponse.key,
      expirationTime: expiration,
      immediate: true
    };
  }

  // Remote worker will call handleSubmitKey after it finishes.
  return {
    apiKey: null,
    expirationTime: null,
    immediate: false
  };
}

module.exports = {
  getnewkey
};