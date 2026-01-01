const axios = require('axios');

/**
 * Fetches current LTC price
 * @returns {Promise<number|string>}
 */
async function fetchLtcPrice() {
  try {
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd`);
    if (data.litecoin && data.litecoin.usd) {
      return Number(data.litecoin.usd);
    } else {
      return await fetchFallback();
    }
  } catch (e) {
    console.log(e);
    return await fetchFallback();
  }
}

async function fetchFallback() {
  try {
    const { data } = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD`);
    if (data.USD) {
      return Number(data.USD);
    } else {
      return "failed";
    }
  } catch (e) {
    console.log(e);
    return "failed";
  }
}

/**
 * Initializes invoices from database
 * Stub function for compatibility - no longer needed with simplified purchase system
 */
async function initializeInvoices() {
  console.log('Purchase system initialized (manual verification mode)');
  // No automatic invoice processing needed
}

module.exports = {
  fetchLtcPrice,
  initializeInvoices
};
