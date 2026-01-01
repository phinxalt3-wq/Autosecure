const axios = require('axios');

const RESET_PASSWORD_URL = "https://account.live.com/ResetPassword.aspx?wreply=https://login.live.com/oauth20_authorize.srf&mn=";

function extractServerData(html) {
  if (!html) return null;
  const match = html.match(/var\s+ServerData\s*=\s*(\{.*?\})(?:;|\s)/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.error("[fetchServerContext] Failed to parse ServerData:", error.message);
    return null;
  }
}

function extractTelemetryContext(html, fallback = null) {
  if (fallback) return fallback;
  if (!html) return null;
  const m = html.match(/"telemetryContext"\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

module.exports = async function fetchServerContext(email) {
  try {
    const url = `${RESET_PASSWORD_URL}${encodeURIComponent(email)}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
      },
      timeout: 10000,
      validateStatus: () => true
    });

    if (!res || !res.data) {
      console.log('[fetchServerContext] Landing request returned no body');
      return { error: 'landing' };
    }

    if (res.data.includes('reset-password-signinname_en')) {
      console.log('[fetchServerContext] Invalid email indicator detected');
      return { error: 'invalid-email' };
    }

    const serverData = extractServerData(res.data);
    if (!serverData) {
      console.log('[fetchServerContext] ServerData missing or unparsable');
      return { error: 'server-data' };
    }

    const telemetryContext = extractTelemetryContext(res.data, serverData?.telemetryContext);
    return {
      html: res.data,
      serverData,
      telemetryContext
    };
  } catch (error) {
    console.error('[fetchServerContext] Unexpected error:', error.message);
    return { error: 'exception' };
  }
}
